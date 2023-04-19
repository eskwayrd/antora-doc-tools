// An Antora extension that checks for sentences in Asciidoc markup
// that are not formatted as ventilated prose.

'use strict'

const extensionName = 'ventilated_prose-extension'
const chalk = require('chalk')
const path  = require('path')
const u     = require('../../utils')

const longMacroRE   = /(audio|footnote|https?|icon|link|mailto|menu|pass|video|xref):[^\[]+\[([^\]]*)\]/
const shortMacroRE  = /(btn|kbd|pass):\[([^\]]*)\]/
const imageRE = /image:[^\[]+\["?([^\]"]*)"?.*?(\]|$)/

// u.DEBUG = true

const problems = {}
let topics = 0
let errors = 0

const check = (contents) => {
  if (!contents || !contents.length) return

  var results = []
  var inSource = false
  var delimiter = ''
  var mg

  u.debug('Starting line processing...')
  const lines = contents.split(/\r?\n/)
  if (lines.length > 1) lines.pop()

  lines.map((line, index) => {
    u.debug(`Line ${index + 1}: -=-${line}=-=`)
    // skip blank lines
    if (!line) return

    u.debug(`not a blank line`)

    // avoid checking inside source blocks
    if (!inSource && line.match(/\[(source|shell|verbatim)[^\]]*/)) {
      u.debug('start "source" block')
      inSource = true
      return
    }

    if (inSource) {
      if (mg = line.match(/^(-|=)+$/)) {
        if (delimiter.length > 0 && delimiter == mg[1]) {
          u.debug('end of source block')
          delimiter = ''
          inSource = false
          return
        }

        if (delimiter == '') {
          u.debug('initial delimiter found')
          delimiter = mg[1]
          return
        }
      }

      // handle non-delimited blocks
      if (delimiter === '' && line.match(/^\s*$/)) {
        u.debug('non-delimited block')
        inSource = false
        return
      }

      // just skip source block content
      u.debug('skipping source block content')
      return
    }

    // skip headings
    if (line.match(/^=+ ([0-9{]|[A-Z]|[a-z][A-Z]).+$/)) {
      u.debug('Is heading, skipping...')
      return
    }

    // skip comments
    if (line.match(/^\/\//)) {
      u.debug('Is comment, skipping...')
      return
    }

    // skip block title
    if (line.match(/\.[A-Z].*$/)) {
      u.debug('Is block title, skipping...')
      return
    }

    // skip block type
    if (line.match(/^\[/)) {
      u.debug('Is block type, skipping...')
      return
    }

    // skip attribute definitions
    if (line.match(/^:[^:]+:/)) {
      u.debug(`Is attribute definition, skipping...`)
      return
    }

    // skip list continuations
    if (line.match(/^\+\s*$/)) {
      u.debug('Is list continuation, skipping...')
      return
    }

    // skip table delimiters
    if (line.match(/^[|!]===+\s*$/)) {
      u.debug('Is table delimiter, skipping...')
      return
    }

    // skip other block delimiters
    if (line.match(/^====+\s*$/)) {
      u.debug('Is block delimiter, skipping...')
      return
    }

    // skip table cells
    if (line.match(/^(\d+\+)?[|!](\s+|$)/)) {
      u.debug('Is table cell, skipping...')
      return
    }

    // skip list items containing only xrefs
    if (line.match(/^([.*-]+\s*)(audio|footnote|https?|icon|link|mailto|menu|pass|video|xref):[^\[]+\[([^\]]*)\]$/)) {
      u.debug('Is list item containing xref, skipping...')
      return
    }

    // skip list items containing only {empty}
    if (line.match(/^[.*-]+\s*\{empty\}$/)) {
      u.debug('Is list item with {empty}, skipping...')
      return
    }

    const origLine = line

    // Remove leading list markers
    line = line.replace(/^([.*-]+\s*)?/, "")

    // Remove trailing manual linebreak
    line = line.replace(/ \+$/, "")

    // Remove local path markers
    line = line.replace(/\.\//, "/")

    // Remove in-page xref syntax
    line = line.replace(/<<[^,>]+>>/, "x") // without custom title
    line = line.replace(/<<[^,]+,([^>]+)>>/, "$1") // with custom title

    // Remove Asciidoc macros

    line = line.replace(imageRE, "")
    line = line.replace(longMacroRE, (...found) => { return found[2] || "Title" })
    line = line.replace(shortMacroRE, "")

    u.debug('After removals:', line)

    // Skip blank lines
    if (line.match(/^\s*$/)) {
      u.debug('Removals resulted in blank line, skipping...')
      return
    }

    let lStart = false
    let lEnd = false
    let lMid = false

    if (!line.match(/\s*([0-9{\\*_`]|[A-Z]|[a-z][A-Z]).+$/)) { //`
      u.debug(`Sentence start error!`)
      lStart = true
    }

    if (!line.match(/[.?!:`)]$/)) { //`
      u.debug(`Sentence end error!`)
      lEnd = true
    }

    // Note that we have to avoid ellipsis mid-line, for the time being
    if (line.match(/(?!\.\.)[.?!] ./)) {
      u.debug(`Mid-sentence punctuation error!`)
      lMid = true
    }

    if (lStart || lEnd || lMid) {
      results.push({
        line: index + 1,
        source: origLine,
        cause: {
          start: lStart,
          end: lEnd,
          mid: lMid,
        }
      })
    }
    else {
      u.debug('No issues found!')
    }
  })

  u.debug('Check complete, returning:', results)
  u.debug('')
  return results
}

const report = () => {
  Object.keys(problems).sort().map((file) => {
    const issues = problems[file]
    u.log(chalk.magenta(file))
    issues.map((issue) => {
      var line = issue.source
      if (issue.cause.start) {
        line = line.replace(/^([^\s]+)/, (...found) => chalk.yellow(found[1]))
      }
      if (issue.cause.end) {
        line = line.replace(/([^\s]+)$/, (...found) => chalk.yellow(found[1]))
      }
      if (issue.cause.mid) {
        line = line.replace(/([^.:?!\s]+[.:?!]\s+[^.:?!\s]+)/, (...found) => chalk.yellow(found[1]))
      }
      u.log(`${issue.line}: ${line}`)
    })
  })

  u.log(chalk.bold(`${errors} ventilated prose problem${u.s(errors)} in ${topics} file${u.s(topics)} reported, stopping build!`))
}

function register ({
  config: {
    debug = false,
    remote = true,
    ...unknownOptions
  }
}) {
  const logger = this.getLogger(extensionName)

  if (Object.keys(unknownOptions).length) {
    const keys = Object.keys(unknownOptions)
    throw new Error(
      `Unrecognized option${u.s(keys.length)}` +
      ` specified for ${extensionName}: ${keys.join(', ')}`
    )
  }

  // During contentClassified, check all of the pages one by one
  this.on('contentClassified', ({ playbook, contentCatalog }) => {
    u.DEBUG = debug
    u.DEBUG_PREFIX = 'RWE'
    u.debug('Check ventilated prose')
    const files = contentCatalog.getFiles()
    files.map((file, index) => {
      if (file.src.extname !== '.adoc' || file.synthetic) return

      if (!file.src.origin.worktree && !remote) return

      if (file.src.basename === 'nav.adoc') return

      u.debug(`worktree: ${file.src.origin.worktree}`)
      u.debug(`startPath: ${file.src.origin.startPath}`)
      u.debug(`path: ${file.src.path}`)
      const pagePath = path.join(
        file.src.origin.worktree || process.env.INIT_CWD || process.cwd(),
        file.src.origin.startPath || '',
        file.src.path
      )
      u.debug(`pagePath: ${chalk.magenta(pagePath)}`)
      const reportPath = path.relative(file.src.origin.worktree, pagePath)
      u.debug(`reportPath: ${chalk.magenta(reportPath)}`)

      const results = check(file.contents.toString())
      if (results.length) {
        problems[reportPath] = results
        topics++
        errors += results.length
      }
    })

    if (errors) {
      u.log(chalk.red('Prose ventilation problems found:'))
      report()
    }
    else {
      u.log(`Ventilated prose? ${chalk.bold.green('Looks good!')}`)
    }
  })

  this.on('documentsConverted', ({ playbook, contentCatalog }) => {
    if (errors) {
      u.log(chalk.bold('Problems reported, stopping build!'))
      this.stop(1)
    }
  })
}

module.exports = { register, check }
