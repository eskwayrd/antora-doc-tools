#!/usr/bin/env node

'use strict'

// Changes the past tense to present tense in any "redirect" files that
// exist in the build folder.

const chalk = require('chalk')
const fs    = require('fs')
const path  = require('path')
const u     = require('./utils')
const walk  = require('walk-sync')

const playbook = u.getPlaybook()
if (!playbook) {
  u.log(chalk.red(`No playbook values!`))
  process.exit(1)
}

const buildDir = playbook.output.dir || 'build'
if (!fs.existsSync(buildDir)) {
  u.log(chalk.red(`Cannot open build dir ${buildDir}!`))
  process.exit(1)
}

const walkConfig = {
  directories: false,
  globs: [
    '**/*.html',
  ],
}

walk(buildDir, walkConfig).map((fileRel) => {
  const filePath = path.join(buildDir, fileRel)
  var page = fs.readFileSync(filePath, { encoding: 'utf8' })
  if (
    page.match(/<title>Redirect Notice<\/title>/)
    && page.match(/<h1>Redirect Notice<\/h1>/)
    && page.match(/The page you requested has been relocated/)
  ) {
    page.replace('Redirect Notice', 'Redirect notice')
    page.replace('requested has been relocated', 'requested has relocated')

    fs.writeFileSync(
      filePath,
      Buffer.from(page),
      { encoding: 'utf8', flag: 'w' }
    )
  }
})
