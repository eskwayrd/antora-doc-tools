#!/usr/bin/env node

// Post-installation steps for the doc tools

'use strict'

const chalk = require('chalk')
const fs    = require('fs')
const gc    = require('gently-copy')
const path  = require('path')
const u     = require('./utils')

u.DEBUG_PREFIX = 'postInstall'

// process arguments
var argv = require('minimist')(process.argv.slice(2))
if ('v' in argv) u.DEBUG = true

const cwd = process.env.INIT_CWD
  ? process.env.INIT_CWD
  : process.cwd()
u.debug(`cwd: ${cwd}`)

// Install html-test
const htmltest = () => {
  u.log(chalk.bold('Installing htmltest...'))
  var command = `htmltest/bin/install.sh 0.17.0`
  const env = { MYCWD: path.join(cwd, 'adt') }
  var [ output, errors, kill, stat ] = u.run(command, env, 0)
  var installed = false
  if (errors && errors.length) {
    if (errors.match(/htmltest info installing htmltest/)) {
      installed = true
    }
    else {
      u.log(chalk.red('Failed to install'))
      u.debug('output:')
      u.debug('-=-=-=-', output, '=-=-=-=')
      u.debug('errors:')
      u.debug('-=-=-=-', errors, '=-=-=-=')
    }
  }

  if (installed) {
    u.log(chalk.green('OK'))
  }
}

const vale = () => {
  u.log(chalk.bold('Installing vale...'))
  var command = `vale/bin/install.sh 2.24.0`
  const env = { MYCWD: path.join(cwd, 'adt') }
  var [ output, errors, kill, stat ] = u.run(command, env, 0)
  var installed = false
  if (errors && errors.length) {
    if (errors.match(/vale info installing vale/)) {
      installed = true
    }
    else {
      u.log(chalk.red('Failed to install'))
      u.debug('output:')
      u.debug('-=-=-=-', output, '=-=-=-=')
      u.debug('errors:')
      u.debug('-=-=-=-', errors, '=-=-=-=')
    }
  }

  if (installed) {
    u.log(chalk.green('OK'))
  }
}

// copy adt to project root
const promote = () => {
  var linked = false

  const adtPath = path.join(cwd, 'adt')
  u.debug(`adtPath: ${adtPath}`)

  if (fs.existsSync(adtPath)) {
    const stats = fs.lstatSync(adtPath)
    if (stats.isSymbolicLink()) {
      linked = true
      u.debug(`${adtPath} already exists... skip link`)
    }
    else {
      // probably a local copy
      linked = true
      u.log(`${adtPath} is a folder, which might contain local modifications... skip link`)
    }
  }
  else {
    u.debug(`Symlinking ADT assets...`)
    fs.symlinkSync(
      'node_modules/antora-doc-tools/adt',
      adtPath
    )
    fs.symlinkSync(
      'node_modules/antora-doc-tools/Makefile',
      path.join(cwd, 'Makefile')
    )
    // const toCopy = ['./adt', './Makefile']
    // u.debug(`Copying ADT assets ${toCopy}`)
    // gc(toCopy, cwd, { overwrite: true })
    linked = true
  }

  // create the dictionary folder if it does not exist
  const dictDir = path.join(cwd, 'dictionaries')
  if (!fs.existsSync(dictDir)) {
    u.debug(`Creating ${dictDir}`)
    const toCopy = ['./adt/dictionaries']
    gc(toCopy, cwd)
  }

  //  // create the local dictionary if it does not exist
  //  const localDict = path.join(dictDir, 'local.dic')
  //  const localDictAff = path.join(dictDir, 'local.aff')
  //  if (!fs.existsSync(localDict)) {
  //    u.debug(`Creating ${localDict}`)
  //    let fh = fs.openSync(localDict, 'a')
  //    fs.closeSync(fh)
  //    fh = fs.openSync(localDictAff, 'a')
  //    fs.closeSync(fh)
  //  }

  //  // update ADT local dictionary symlinks
  //  const ldsl = path.join(adtPath, 'dictionaries', 'local.dic')
  //  const ldasl = path.join(adtPath, 'dictionaries', 'local.aff')
  //  u.debug(`Updating symlinks for ${ldsl} and ${ldasl}`)
  //  fs.rmSync(ldsl, { force: true })
  //  fs.rmSync(ldasl, { force: true })
  //  fs.symlinkSync(localDict, ldsl)
  //  fs.symlinkSync(localDictAff, ldasl)

  if (linked) {
    u.log(chalk.green('OK'))
  }
}

promote()
vale()
htmltest()
