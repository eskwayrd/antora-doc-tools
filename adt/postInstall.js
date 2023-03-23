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
  var command = `vale/bin/install.sh 2.23.0`
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
  var copied = false

  const adtPath = path.join(cwd, 'adt')
  if (fs.existsSync(adtPath)) {
    copied = true
    u.debug(`${adtPath} already exists... skip copy`)
  }
  else {
    const toCopy = ['./adt', './Makefile']
    gc(toCopy, cwd, { overwrite: true })
    copied = true
  }

  // create the dictionary folder if it does not exist
  const dictDir = path.join(cwd, 'dictionary')
  if (!fs.existsSync(dictDir)) {
    fs.mkdirSync(dictDir)
  }

  // create the local dictionary if it does not exist
  const localDict = path.join(dictDir, 'local.dic')
  const localDictAff = path.join(dictDir, 'local.aff')
  if (!fs.existsSync(localDict)) {
    let fh = fs.openSync(localDict, 'a')
    fh.closeSync()
    fh = fs.openSync(localDictAff, 'a')
    fh.closeSync()
  }

  // update ADT local dictionary symlinks
  const ldsl = path.join(adtPath, 'dictionary', 'local.dic')
  const ldasl = path.join(adtPath, 'dictionary', 'local.aff')
  fs.rmSync(ldsl, { force: true })
  fs.rmSync(ldasl, { force: true })
  fs.symlinkSync(localDict, ldsl)
  fs.symlinkSync(localDictAff, ldasl)

  if (copied) {
    u.log(chalk.green('OK'))
  }
}

promote()
vale()
htmltest()
