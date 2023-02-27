#!/usr/bin/env node

'use strict'

// Package requirements
const chalk = require('chalk')
const fs    = require('fs')
const u     = require('./utils')

// Color definitions
const TARGET    = chalk.cyan
const SECTION   = chalk.yellow
const VARIABLE  = chalk.green
const VALUE     = chalk.red

// Makefile recognition regexes
const targetRegex       = /^([a-zA-Z0-9%_\/%-]+):/
const sectionRegex      = /^##\s*@section\s*(.+)$/
const descriptionRegex  = /^##\s*(.*)$/
const paramRegex        = /@param\s+([a-zA-Z_]+)\s*=\s*([^\s]+)?\s*(.*$)?/

// Acquire the list of makefiles to process from the envvar MAKEFILES
const makefilelist = process.env.MAKEFILES
if (!makefilelist || !makefilelist.length) {
  console.log('No makefile(s) to process!')
  process.exit(1)
}

// Emit standard usage output
const t = TARGET('TARGET')
const o = `${VARIABLE('OPTION')}=${VALUE('VALUE')}`
console.log(`Usage: make [${t} [${t} ...]] [${o} [${o} ...]]`)
console.log(SECTION('General targets:'))
console.log(`    ${TARGET('help')}`)
console.log(`        Show available make targets.`)

// Process each makefile
for (const makefile of makefilelist.split(/\s|\n/)) {
  if (!makefile || !makefile.length) continue

  const lines = fs.readFileSync(makefile, { encoding: 'utf8' })
    .split(/\r|\n/)

  var description = ''
  var params      = ''
  var params_doc  = ''
  var mg

  lines.map((line, index) => {
    // handle sections
    if (mg = line.match(sectionRegex)) {
      var sectionName = mg[1]
      console.log(`\n${SECTION(sectionName)}:`)
      return
    }

    // handle target descriptions:
    // - Lines beginning with ## immediately before the target
    if (mg = line.match(targetRegex)) {
      // don't provide description, it's a private target and
      // so is not shown
      if (!(description && description.length)) return

      var targetName = mg[1]
      console.log(`\n    ${TARGET(targetName)}${params}`)
      console.log(description)
      if (params) {
        console.log(`\n        Params:`)
        console.log(params_doc)
      }

      description = ''
      params = ''
      params_doc = ''
      return
    }

    // handle params
    if (mg = line.match(paramRegex)) {
      params += ` ${VARIABLE(mg[1])}=${VALUE(mg[2])}`
      params_doc += `\n        ${VARIABLE(mg[1])}=${VALUE(mg[2])}\t${mg[3]}`
      return
    }

    // handle descriptions
    if (mg = line.match(descriptionRegex)) {
      if (description.length) description += `\n`
      description += `        ${mg[1]}`
    }
  })
}
