#!/usr/bin/env node

// Sets up ADT for use in a project.

'use strict'

const chalk     = require('chalk')
const fs        = require('fs')
const path      = require('path')
const u         = require('./utils')

u.DEBUG_PREFIX  = 'ADT setup'
const GOOD      = chalk.green
const NOTE      = chalk.yellow
const FAILED    = chalk.red
const ACTION    = chalk.cyan
const LABEL     = chalk.bold

// process arguments
var argv = require('minimist')(process.argv.slice(2))
if ('v' in argv) u.DEBUG = true

const cwd = process.cwd()
u.debug(`cwd: ${cwd}`)

const adtFolderName = 'adt'
const adtPath   = path.join(cwd, adtFolderName)
u.debug(`adtPath: ${adtPath}`)
u.debug(`scriptPath:`, __dirname)
const adtDicts  = path.join(adtPath, 'dictionaries')
const myDicts   = path.join(cwd, 'dictionaries')

// Array to hold reports for each setup action.
const reports = []

// Folders to create in the project folder, if they do not exist.
const foldersToCreate = [
  'dictionaries',
  'vale',
]

// Files from ADT to copy into the project folder. { src: dest }
const filesToCopy = {
  'Makefile.example':         'Makefile',
  'htmltest.yml':             'htmltest.yml',
  'antora-playbook.example':  'antora-playbook.yml',
  'antora-assembler.example': 'antora-assembler.yml',
  'Gemfile':                  'Gemfile',
}

// Specify the dictionaries to copy.
const dictsToCopy = [
  'en_US-large.dic',
  'en_US-large.aff',
  'antora.dic',
  'antora.aff',
  'local.dic',
  'local.aff',
]

// Compute and add the paths for the dictionary files that need copying.
dictsToCopy.forEach((dict) => {
  const dictPath = path.join('dictionaries', dict)
  filesToCopy[dictPath] = dictPath
})

// Add the vale config file to the files to copy.
filesToCopy[path.join('vale.ini')] = path.join('vale', 'vale.ini')


// -------------------------------------------------------------------

const copyFiles = () => {
  Object.keys(filesToCopy).forEach((src) => {
    copyADTFile(src, filesToCopy[src])
  })
}

const createFolders = () => {
  foldersToCreate.forEach((folder) => {
    const folderPath = path.join(cwd, folder)

    var exists = false
    u.debug(`Creating dir: '${folderPath}'`)
    if (fs.existsSync(folderPath)) exists = true
    else fs.mkdirSync(folderPath)

    reports.push({
      label: folder,
      action: 'create',
      result: exists ? NOTE('exists') : GOOD('copied')
    })
  })
}

const valeSync = () => {
  const [ output, errors, kill, stat ] = u.run('bin/vale --config vale/vale.ini sync', {})
  u.debug(`Vale sync output:`, output)
  reports.push({
    label: 'Vale',
    action: 'sync',
    result: errors.length ? FAILED('failed') : GOOD('synced')
  })
}

const bundleConfig = () => {
  const [ output, errors, kill, stat ] = u.run('bundle config --local path .bundle/gems', {})
  u.debug(`Bundle config output:`, output)
  reports.push({
    label: 'Bundle',
    action: 'config',
    result: errors.length ? FAILED('failed') : GOOD('configured')
  })
}

const bundleInstall = () => {
  const [ output, errors, kill, stat ] = u.run('bundle', {})
  u.debug(`Bundle install output:`, output)
  reports.push({
    label: 'Bundle',
    action: 'install',
    result: errors.length ? FAILED('failed') : GOOD('installed')
  })
}

const copyADTFile = (src, dest) => {
  const srcPath = path.join(adtPath, src)
  const destPath = path.join(cwd, dest)

  var exists = false
  u.debug(`copying ${src} to ${dest}`)
  if (fs.existsSync(destPath)) exists = true
  else fs.copyFileSync(srcPath, destPath)

  reports.push({
    label: src,
    action: 'copy',
    result: exists ? NOTE('exists') : GOOD('copied')
  })
}

// -------------------------------------------------------------------

console.log(chalk.cyan('Setting up Antora Doc Tools...'))

createFolders()
copyFiles()

// External operations.
valeSync()
bundleConfig()
bundleInstall()

var maxLabel = 0
var maxAction = 0
reports.forEach((report) => {
  var label = u.stripAnsi(report.label)
  var action = u.stripAnsi(report.action)
  if (label.length > maxLabel)   maxLabel = label.length
  if (action.length > maxAction) maxAction = action.length
})

reports.forEach((report) => {
  var label = u.stripAnsi(report.label)
  label = report.label + ' '.repeat(maxLabel - label.length)
  var action = u.stripAnsi(report.action)
  action = report.action + ' '.repeat(maxAction - action.length)
  console.log(`${ACTION(action)} ${LABEL(label)} : ${report.result}`)
})
