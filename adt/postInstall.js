#!/usr/bin/env node

// Post-installation steps for the doc tools

'use strict'

const chalk   = require('chalk')
const fs      = require('fs')
const gc      = require('gently-copy')
const path    = require('path')
const u       = require('./utils')
const hasbin  = require('hasbin')

u.DEBUG_PREFIX = 'postInstall'

// process arguments
var argv = require('minimist')(process.argv.slice(2))
if ('v' in argv) u.DEBUG = true

const cwd = process.env.INIT_CWD
  ? process.env.INIT_CWD
  : process.cwd()
u.debug(`cwd: ${cwd}`)

const hasDocker = hasbin.sync('docker')
const htmltestImage = 'wjdp/htmltest'
const valeImage = 'jdkato/vale'

// Install dependencies provided by Docker images
const docker = () => {
  if (!hasDocker) {
    u.log(chalk.yellow('No Docker found, skipping htmltest installation.'))
    return
  }

  u.log(chalk.bold('Installing dependencies from Docker images...'))

  var command = `make docker`
  var [ output, errors, kill, stat ] = u.run(command, {}, 0)
  var installed = false
  if (errors && errors.length) {
    if (errors.match('Yay!')) {
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
  u.debug(`Checking for existence of the dictionaries folder...`)
  const dictDir = path.join(cwd, 'dictionaries')
  if (!fs.existsSync(dictDir)) {
    // Prior to vale 2.24.5, symlinks in Vale's dictPath could not be
    // symlinks, so copying the dictionary folder was required.
    // u.debug(`Creating ${dictDir}`)
    // const toCopy = ['./adt/dictionaries']
    // gc(toCopy, cwd)

    fs.mkdirSync(dictDir)
  }

  u.debug(`Handling the large English dictionary...`)
  const enUS = 'en_US-large'
  const dictEnPath = path.join(dictDir, `${enUS}.dic`)
  if (!fs.existsSync(dictEnPath)) {
    u.debug('Symlinking the large English dictionary files...')
    fs.symlinkSync(
      `node_modules/antora-doc-tools/dictionaries/${enUS}.dic`,
      dictEnPath
    )
    fs.symlinkSync(
      `node_modules/antora-doc-tools/dictionaries/${enUS}.aff`,
      path.join(dictDir, `${enUS}.aff`)
    )
  }

  u.debug(`Handling the Antora dictionary...`)
  const antDic = 'antora'
  const dictAntPath = path.join(dictDir, `${antDic}.dic`)
  if (!fs.existsSync(dictAntPath)) {
    u.debug('Symlinking the Antora dictionary files...')
    fs.symlinkSync(
      `node_modules/antora-doc-tools/dictionaries/${antDic}.dic`,
      dictAntPath
    )
    fs.symlinkSync(
      `node_modules/antora-doc-tools/dictionaries/${antDic}.aff`,
      path.join(dictDir, `${antDic}.aff`)
    )
  }

  u.debug(`Handling the local dictionary...`)
  const locDic = 'local'
  const dictLocPath = path.join(dictDir, `${locDic}.dic`)
  if (!fs.existsSync(dictEnPath)) {
    u.debug('Symlinking the local dictionary files...')
    fs.symlinkSync(
      `node_modules/locora-doc-tools/dictionaries/${locDic}.dic`,
      dictLocPath
    )
    // Editing affix files is pretty rare, so just re-use the Antora
    // affixes for the local dictionary.
    fs.symlinkSync(
      `node_modules/locora-doc-tools/dictionaries/${antDic}.aff`,
      path.join(dictDir, `${locDic}.aff`)
    )
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

  const valeDir = path.join(cwd, 'Vale')
  if (!fs.existsSync(valeDir)) {
    fs.mkdirSync(valeDir)
  }

  const valeConfig = path.join(valeDir, '.vale.ini')
  if (!fs.existSync(valeConfig)) {
    u.debug(`Copying Vale configuration`)
    const toCopy = ['./adt/vale/vale.ini']
    gc(toCopy, valeDir)
    fs.renameSync(
      path.join(valeDir, 'vale.ini'),
      path.join(valeDir, '.vale.ini')
    )
  }

  const htmltestConfig = path.join(cwd, 'htmltest.yml')
  if (!fs.existSync(htmltestConfig)) {
    u.debug(`Copying htmltest configuration`)
    const toCopy = ['./adt/htmltest.yml']
    gc(toCopy, cwd)
  }

  if (linked) {
    u.log(chalk.green('OK'))
  }
}

promote()
docker()
