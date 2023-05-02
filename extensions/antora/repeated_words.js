// An Antora extension that checks for repeated words in Asciidoc
// content.

'use strict'

const extensionName = 'repeated_words-extension'
const chalk = require('chalk')
const path  = require('path')
const u     = require('../../utils')

const validRepeats = {
  had:      true,
  that:     true,
  can:      true,
  blah:     true,
  beep:     true,
  sapiens:  true,
  tse:      true,
  mau:      true,
}

const longMacroRE   = /(audio|footnote|https?|icon|link|mailto|menu|pass|video|xref):[^\[]+\[([^\]]*)\]/
const shortMacroRE  = /(btn|kbd|pass):\[([^\]]*)\]/
const imageRE = /image:[^\[]+\["([^"]*)".*(\]|$)/

const problems = {}

const check = (contents, repeats = validRepeats) => {
  u.debug('Check repeated_words')
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
    u.debug(u.myTypeOf(line))
    // skip blank lines
    if (!line) return

    u.debug(`not a blank line`)

    // avoid checking for repeats inside source blocks
    if (!inSource && line.match(/\[(source|shell|verbatim)[^\]]*/)) {
      inSource = true
      return
    }

    if (inSource) {
      if (mg = line.match(/^(-|=)+$/)) {
        if (delimiter.length > 0 && delimiter == mg[1]) {
          // end of source block reached
          delimiter = ''
          inSource = false
          return
        }

        if (delimiter == '') {
          // initial delimiter found
          delimiter = mg[1]
          return
        }
      }

      // handle non-delimited blocks
      if (delimiter === '' && line.match(/^\s*$/)) {
        inSource = false
        return
      }

      // just skip source block content
      return
    }

    // Remove Asciidoc macros
    const origLine = line
    line = line.replace(imageRE, "$1")
    line = line.replace(longMacroRE, "$2")
    line = line.replace(shortMacroRE, "$1")
    u.debug('After macro removal', line)

    u.debug(`splitting into words`)
    // try to find repeats
    const words = line.split(' ')
    if (!words || !words.length) return

    u.debug(`has ${words.length} words`)
    var previous = ''
    var mg
    for (var i = 0; i < words.length; i++) {
      const word = words[i]

      u.debug(`checking word ${word}`)

      if (
        previous &&
        previous.toLowerCase() === word.toLowerCase() &&
        !skip(word, repeats)
      ) {
        // word has been repeated
        results.push({
          line: index + 1,
          offset: i,
          repeated: word,
          source: origLine,
        })
      }

      previous = word
    }

    // check whether the last word of the current line repeats as the
    // first word of the next line

    u.debug(`starting next line check`)
    if (index < lines.length - 1) {
      const word1 = words[words.length - 1]
      const word2 = lines[index + 1].split(/ /)[0]
      if (
        word1.toLowerCase() === word2.toLowerCase() &&
        !skip(word2, repeats)
      ) {
        u.debug('Repeat found on second line!')
        // word has been repeated on the next line
        results.push({
          line: index + 2,
          offset: 0,
          repeated: word2,
          source: lines[index + 1]
        })
      }
    }
  })

  u.debug('Check complete, returning:', results)
  u.debug('')
  return results
}

// Should this word be ignored?
const skip = (word, repeats) => {
  // If it is a known valid repeat, skip.
  if (word.toLowerCase() in repeats) return true

  // Is it an initialism?
  const first = word.charAt(0)
  if (first === first.toUpperCase()) {
    // Skip, for example, "D. D."
    if (word.length === 2 && word.charAt(1) === '.') return true

    // Skip simple, capitalized words. Think "Duran Duran"
    const tail = word.slice(1)
    if (tail === tail.toLowerCase()) return true
  }

  var mg
  if (mg = word.match(/^\|\s*(.*)$/)) {
    u.debug('Possibly in table cell')
    // skip empty table cells
    if (mg[1].length === 0) {
      u.debug('Nothing after cell marker')
      return true
    }
    // skip cells with only one word
    if (!mg[1].match(/\s/)) {
      u.debug('Only one word after cell marker')
      return true
    }
  }

  return false
}

const report = () => {
  var topics = 0
  const issues = Object.keys(problems)
  issues.sort().map((file) => {
    topics++
    const issues = problems[file]
    u.log(chalk.magenta(file))
    issues.map((issue) => {
      var line = issue.source
      const word = issue.repeated
      const RE = new RegExp(
        '^((\\b[^\\b]+?\\s+){'
        + (issue.offset)
        + '})([^\\s]+)(.*)$'
      )
      var mg
      if (mg = line.match(RE)) {
        // u.log(mg)
        line = mg[1] + chalk.bold.yellow(mg[3]) + mg[4]
      }
      u.log(`${issue.line}: ${line}`)
    })
  })

  if (issues.length) {
    console.log(`\n${chalk.bold(issues.length)} repeated word issue${u.s(issues)} in ${topics} file${u.s(topics)} found!`)
  }
}

function register ({
  config: {
    repeats = validRepeats,
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
    const files = contentCatalog.getFiles()
    files.map((file, index) => {
      if (file.src.extname !== '.adoc' || file.synthetic) return

      if (!file.src.origin.worktree && !remote) return

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

      const results = check(file.contents.toString(), repeats)
      if (results.length) problems[pagePath] = results
    })

    if (Object.keys(problems).length) {
      u.log(chalk.red('Repeated word issues found:'))
      report()
    }
    else {
      u.log(`Repeated words? ${chalk.bold.green('None found')}`)
    }
  })

  this.on('documentsConverted', ({ playbook, contentCatalog }) => {
    if (Object.keys(problems).length) {
      u.log(chalk.bold('Problems reported, stopping build!'))
      this.stop(1)
    }
  })
}

module.exports = { register, check }
