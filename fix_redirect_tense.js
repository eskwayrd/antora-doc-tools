#!/usr/bin/env node

'use strict'

// Changes the past tense to present tense in any "redirect" files that
// exist in the build folder.

const chalk = require('chalk')
const fs    = require('fs')
const path  = require('path')
const u     = require('./utils')
const walk  = require('walk-sync')

u.DEBUG = true

const playbook = u.getPlaybook()
if (!playbook) {
  u.log(chalk.red(`No playbook values!`))
  process.exit(1)
}
u.debug(`Playbook:`, playbook)

const buildDir = playbook.output.dir || 'build'
u.debug(`buildDir: ${buildDir}`)
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

u.debug(`Walking ${buildDir}...`)
walk(buildDir, walkConfig).map((fileRel) => {
  const filePath = path.join(buildDir, fileRel)
  u.debug(`Considering ${filePath}...`)
  var page = fs.readFileSync(filePath, { encoding: 'utf8' })
  if (
    page.match(/<title>Redirect Notice<\/title>/)
    && page.match(/<h1>Redirect Notice<\/h1>/)
    && page.match(/The page you requested has been relocated/)
  ) {
    u.debug(`It is a redirect page!`)
    page = page.replace(/Redirect Notice/g, 'Redirect notice')
    page = page.replace(/requested has been relocated/, 'requested has relocated')

    u.debug(`Writing updating file: ${page}`)
    fs.writeFileSync(
      filePath,
      Buffer.from(page),
      { encoding: 'utf8', flag: 'w' }
    )
  }
})
