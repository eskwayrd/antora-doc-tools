#!/usr/bin/env node

// Sets up ADT for use in a project.

'use strict'

const chalk   = require('chalk')
const fs      = require('fs')
const path    = require('path')
const tmp     = require('tmp')
const hasbin  = require('hasbin')
const u       = require('./utils')

u.DEBUG_PREFIX = 'ADT setup'
const OK = chalk.green('OK!')
const NOTE = chalk.yellow

// process arguments
var argv = require('minimist')(process.argv.slice(2))
if ('v' in argv) u.DEBUG = true
u.DEBUG = true

const cwd = process.cwd()
u.debug(`cwd: ${cwd}`)

const adtPath = path.join(cwd, 'adt')
u.debug(`adtPath: ${adtPath}`)
u.debug(`scriptPath:`, __dirname)

const copyADTFile = (src, dest) => {
  const srcPath = path.join(adtPath, src)
  const destPath = path.join(cwd, dest)
  if (fs.existsSync(destPath)) {
    return false
  }
  else {
    fs.copyFileSync(srcPath, destPath)
    return true
  }
}

// copy adt to project root
const setupADT = async () => {
  console.log(chalk.cyan('Setting up Antora Doc Tools...'))

  u.print(`Establishing Makefile...`)
  const mfStatus = copyADTFile('Makefile.example', 'Makefile')
  console.log(mfStatus ? OK : NOTE(`NOTICE:
A Makefile already exists. Compare the adt/Makefile.example with the
current Makefile to see which targets you need.
`))

  // create the dictionary folder if it does not exist
  u.print(`Dictionaries: `)
  const dictDir = path.join(cwd, 'dictionaries')
  if (!fs.existsSync(dictDir)) {
    fs.mkdirSync(dictDir)
  }

  const adtDicts = path.join(adtPath, 'dictionaries')
  const enUS = 'en_US-large'
  const dictEnPath = path.join(dictDir, `${enUS}.dic`)

  const notes = []
  const enDicFile = path.join('dictionaries', 'en_US-large.dic')
  const enDicStatus = copyADTFile(enDicFile, enDicFile)
  if (!enDicStatus) notes.push(`An en_US-large.dic file already exists.`)

  const enAffFile = path.join('dictionaries', 'en_US-large.aff')
  const enAffStatus = copyADTFile(enAffFile, enAffFile)
  if (!enAffStatus) notes.push(`An en_US-large.aff file already exists.`)

  const antDicFile = path.join('dictionaries', 'antora.dic')
  const antDicStatus = copyADTFile(antDicFile, antDicFile)
  if (!antDicStatus) notes.push(`An antora.dic file already exists.`)

  const antAffFile = path.join('dictionaries', 'antora.dic')
  const antAffStatus = copyADTFile(antAffFile, antAffFile)
  if (!antAffStatus) notes.push(`An antora.aff file already exists.`)

  const localDicFile = path.join('dictionaries', 'local.dic')
  const localDicStatus = copyADTFile(localDicFile, localDicFile)
  if (!localDicStatus) notes.push(`An local.dic file already exists.`)

  const localAffFile = path.join('dictionaries', 'local.dic')
  const localAffStatus = copyADTFile(localAffFile, localAffFile)
  if (!localAffStatus) notes.push(`An local.aff file already exists.`)

  console.log(notes.length ? NOTE(`NOTICE:\n` + notes.join(`\n`)) : OK)

  u.print(`Vale: `)
  const valeDir = path.join(cwd, 'vale')
  if (fs.existsSync(valeDir)) {
    console.log(`NOTICE:
A vale directory already exists. Compare the adt/vale.ini for style packages
that may need to be included/defined.
`)
  }
  else {
    fs.mkdirSync(valeDir)

    const valeStatus = copyADTFile('vale.ini', path.join('vale', 'vale.ini'))
    console.log(OK)
  }

  u.print('htmltest: ')
  const htStatus = copyADTFile('htmltest.yml', 'htmltest.yml')
  console.log(OK)

  // TODO
  // antora-playbook.yml
  // antora-assembler.yml
  // ruby
  // asciidoctor pdf
}

setupADT()
