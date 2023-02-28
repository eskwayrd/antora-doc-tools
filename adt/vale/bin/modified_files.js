#!/usr/bin/env node
// vale for modified files
// - determines which files in the docs repo are modified (including
// staged)
// - maps those files to built HTML files
// - invokes vale to run on each file

const chalk   = require('chalk')
const fs      = require('fs')
const path    = require('path')
const u       = require('../../utils')
const walk    = require('walk-sync')
const YAML    = require('yaml')

var config = {
  debug: false,
  walk: {
    directories: false,
    globs: [ "**/*.adoc" ],
    ignore: [ "node_modules" ]
  }
}

const cwd = process.env.INIT_CWD
  ? process.env.INIT_CWD
  : process.cwd()

var argv = require('minimist')(process.argv.slice(2))
if ('v' in argv) u.DEBUG = config.debug = true

const valeBinPath = path.join('adt', 'bin', 'vale')
const docsPath = path.join(cwd, 'docs')

const replaceExtension = (file) => {
  u.debug(`Replacing extension for '${file}'`)
  return path.format({ ...path.parse(file), base: '', ext: '.html' })
}

// Determine where the build path is
const buildPath = u.getBuildPath()
if (!fs.existsSync(buildPath)) {
  console.log(`The build path '${buildPath}' does not exist, exiting.`)
  process.exit(1)
}

// fetch the list of modified files, including staged, from Git
const gitFiles = u.modifiedFiles()
u.debug('Modified files:', gitFiles)

// analyzePath breaks down an Antora path into its components
const versions = {}
const analyzePath = (adocPath) => {
  u.debug(`Analyzing ${adocPath}`)
  var parts = adocPath.split(path.sep)
  const component = parts[1]
  const module = parts[3] === 'root' ? '' : parts[3]
  const family = parts[4]
  const page = parts.slice(5).join(path.sep)

  var version = 'current'
  if (component in versions) {
    version = versions[component]
  }
  else {
    const componentFile = path.join(docsPath, component, 'antora.yml')
    const componentDescriptor = fs.readFileSync(
      componentFile,
      { encoding: 'utf8' },
    )
    version = YAML.parse(componentDescriptor).version
  }

  u.debug(`c: ${component}, m: ${module}, v: ${version}, f: ${family}, p: ${page}`)
  return {
    component: component,
    module: module,
    version: version,
    family: family,
    page: page
  }
}

// Converts a result from analyzePath into an HTML path
const makeHTMLpath = (analysis) => {
  return path.join(
    path.basename(buildPath),
    analysis.component,
    analysis.version,
    analysis.module === 'ROOT' ? '' : analysis.module,
    replaceExtension(analysis.page)
  )
}

// determine the paths to the corresponding HTML files
var HTMLfiles = []
for (const modified of gitFiles) {
  const adoc = analyzePath(modified)
  if (adoc.family === 'pages' || adoc.family === 'nav.adoc') {
    var HTMLpath = makeHTMLpath(adoc)
    u.debug(`Converted adoc '${modified}' to '${HTMLpath}'`)
    HTMLfiles.push(HTMLpath)
  }
  else if (adoc.family === 'partials') {
    // modified partials might be used in a number of pages
    // we don't need to check them all, just one will do
    u.debug(`Searching for use of partial '${modified}'...`)
    const includeRE = new RegExp('include:[^\\[]+' + adoc.page + '\\[')
    var adocs = walk(docsPath, config.walk).sort()
    for (const adoc of adocs) {
      var adocFile = path.join(docsPath, adoc)
      u.debug(`Scanning '${adocFile}'...`)
      var lines = fs.readFileSync(adocFile, { encoding: 'utf8' })
        .split(/\r?\n/)
      lines.pop()
      var found = false
      for (const line of lines) {
        if (line.match(includeRE)) {
          u.debug(`Found a match for ${includeRE}!`)
          var relatedAdoc = analyzePath(
            path.relative(path.join(docsPath, '..'), adocFile)
          )
          var HTMLpath = makeHTMLpath(relatedAdoc)
          HTMLfiles.push(HTMLpath)
          found = true
          break;
        }
      }
      if (found) break
    }
  }
  else {
    console.log(`Family ${adoc.family} unsupported!`)
    process.exit(1)
  }
}

HTMLfiles = [...new Set(HTMLfiles)].sort()

u.debug('HTMLfiles:', HTMLfiles)

// Now run vale on each file
u.debug('Starting vale execution(s)...')
var found = false
for (HTMLfile of HTMLfiles) {
  u.debug(`Running vale on ${HTMLfile}`)
  const command = `${valeBinPath} --config adt/vale/vale.ini ${HTMLfile}`
  u.debug('Command:', command)
  var [ output, errors, kill, stat ] = u.run(command, {}, 1)
  if (kill) {
    console.log(`Running vale terminated!`)
    process.exit(1)
  }

  if (stat > 0) {
    console.log(output)
    found = true
  }
}

if (found) {
  process.exit(1)
}
