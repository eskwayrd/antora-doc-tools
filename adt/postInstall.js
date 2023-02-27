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
  const destPath = path.join(cwd, 'adt', 'bin')
  var command = `curl https://htmltest.wjdp.uk | bash -s -- -b ${destPath}`
  var [ output, errors, kill, stat ] = u.run(command, {}, 0)
  var installed = false
  if (errors && errors.length) {
    if (errors.match(/htmltest info installed/)) {
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
  var command = `adt/vale/bin/install_vale.sh 2.23.0`
  const env = { MYCWD: path.join(cwd, 'adt') }
  var [ output, errors, kill, stat ] = u.run(command, env 0)
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

  if (fs.existsSync(path.join(cwd, 'adt'))) {
    copied = true
    u.debug(`${cwd}/adt already exists... skip copy`)
  }
  else {
    const toCopy = ['./adt', './Makefile']
    gc(toCopy, cwd)
    copied = true
  }

  if (copied) {
    u.log(chalk.green('OK'))
  }
}

promote()
vale()
htmltest()
