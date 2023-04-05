#!/usr/bin/env node

'use strict'

// Downloads an Antora playbook-specified UI bundle, as specified in the
// Asciidoc attributes with `ui_bundle_repo`, using the GitHub CLI.
//
// Requires that your GitHub CLI session has already been authenticated
// with `gh auth login`.

const chalk = require('chalk')
const fs    = require('fs')
const u     = require('./utils')

const playbook = u.getPlaybook()
if (!playbook) {
  u.log(chalk.red(`No playbook values!`))
  process.exit(1)
}

var repo = ""

if (playbook.asciidoc?.attributes?.ui_bundle_repo) {
  repo = playbook.asciidoc.attributes.ui_bundle_repo
}

if (!repo && !repo.length) {
  u.log(chalk.red('No UI bundle repo defined!'))
  u.log('Make to specify the desired UI bundle repo URL in')
  u.log('the Antora playbook file, at: asiidoc.attributes.ui_bundle_repo')
  process.exit(1)
}

// If there is an existing bundle, and it is "new", don't download.
const uiBundleUrl = playbook.ui?.bundle?.url || ''
if (uiBundleUrl && fs.existsSync(uiBundleUrl)) {
  const stat = fs.statSync(uiBundleUrl)

  const command = `gh release view latest --repo ${repo} --json 'publishedAt'`
  var [ output, errors, kill, stats ] = u.run(command, {}, 0)
  if (errors && errors.length) {
    u.log(`Error(s):`, errors)
    process.exit(1)
  }
  const result = JSON.parse(output)
  const pubAt = new Date(result.publishedAt)

  // const threshold = Date.now() - (3600 * 1000) // 1 hour
  // if (stat.mtime.valueOf() > threshold) {
  if (pubAt.getTime() < stat.mtime.valueOf()) {
    u.log('Bundle already up-to-date, skipping download.')
    process.exit(0)
  }
}


if (process.stdout.isTTY) {
  process.stdout.write(`Downloading UI from ${chalk.bold(repo)}: `)
}
else {
  chalk.level = 0
}

const timer = u.startTimer()
const command = `gh release download latest --clobber --repo ${repo}`
var [ output, errors, kill, stat ] = u.run(command, {}, 0)
const elapsed = u.elapsedTimer(timer)
if (errors && errors.length) {
  u.log(`Error(s):`, errors)
  process.exit(1)
}
else {
  u.log(chalk.green(`Done! (${elapsed})`))
}
