#!/usr/bin/env node

'use strict'

// This program reads an Antora playbook and attempts to location the
// specified key, expressed as a string containing a dot notation path
// into the playbook data structure. If the key exists, its value is
// returned, otherwise empty string.

const chalk = require('chalk')
const u     = require('./utils')

const argv = require('minimist')(process.argv.slice(2))
const pbPath = argv._.shift()
if (!pbPath && pbPath.length) {
  u.log(chalk.red('No path provided to search within playbook!'))
  process.exit(1)
}

if (process.stdout.isTTY) {
  process.stdout.write(`Looking up ${chalk.bold(pbPath)}: `)
}
else {
  chalk.level = 0
}

const playbook = u.getPlaybook()
if (!playbook) {
  u.log(`No playbook values!`)
  process.exit(1)
}

const getField = (pb, path) => {
  return path.split('.').reduce(
    (r, k, index) => { return r?.[k] },
    pb
  )
}

var value = getField(playbook, pbPath)
if (!value && typeof value === 'undefined') value = ""
console.log(chalk.green(value))
