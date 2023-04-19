// An Antora extension that checks for a wide variety of style problems
// in Asciidoc content

' use strict'

const extensionName = 'style_checks-extension'
const chalk = require('chalk')
const path  = require('path')
const u     = require('../../utils')

const warning = chalk.yellow
const error   = chalk.red

const problems = {}

var config  = {
    testWords: {
      accomplish:     'Simplify',
      additional:     'Simplify',
      additionally:   'Simplify',
      alter:          'Simplify',
      alternatively:  'Simplify',
      appear:         'Simplify',
      appears:        'Simplify',
      approximately:  'Simplify',
      assist:         'Simplify',
      attempt:        'Simplify',
      automatically:  'Simplify',
      begin:          'Simplify',
      beneath:        'Simplify',
      breakthrough:   'Simplify',
      complicated:    'Simplify',
      concerning:     'Simplify',
      consult:        'Simplify',
      contain:        'Simplify',
      contains:       'Simplify',
      containing:     'Simplify',
      demonstrate:    'Simplify',
      determine:      'Simplify',
      difficult:      'Simplify',
      entire:         'Simplify',
      having:         'Simplify',
      highlights:     'Simplify',
      however:        'Simplify',
      illustrates:    'Simplify',
      immediately:    'Simplify',
      innovative:     'Simplify',
      locate:         'Simplify',
      major:          'Simplify',
      modification:   'Simplify',
      modify:         'Simplify',
      modifies:       'Simplify',
      necessary:      'Simplify',
      obtain:         'Simplify',
      operate:        'Simplify',
      perform:        'Simplify',
      pertains:       'Simplify',
      portion:        'Simplify',
      portions:       'Simplify',
      primary:        'Simplify',
      principle:      'Simplify',
      provide:        'Simplify',
      // receive:        'Simplify',
      remainder:      'Simplify',
      robust:         'Simplify',
      upon:           'Simplify',
      whenever:       'Simplify',
      within:         'Simplify',
      'e.g':          'Language',
      'i.e':          'Language',
      comprise:       'Language',
      comprised:      'Language',
      colour:         'Language',
      centre:         'Language',
      dialogue:       'Language',
      fibre:          'Language',
      whilst:         'Language',
      via:            'Language',
      hoc:            'Language',
      etc:            'Language',
      et:             'Language',
      ergo:           'Language',
      facti:          'Language',
      versa:          'Language',
      viz:            'Language',
      vs:             'Language',
      'it\'s':        'Spelling',
      lifecycle:      'Spelling',
      realtime:       'Spelling',
      'higher-level': 'Mechanic',

      actually:       'Needless',
      any:            'Needless',
      always:         'Needless',
      both:           'Needless',
      certain:        'Needless',
      completely:     'Needless',
      definitely:     'Needless',
      either:         'Needless',
      particular:     'Needless',
      really:         'Needless',
      respective:     'Needless',
      respectively:   'Needless',
      specific:       'Needless',
      specified:      'Needless',
      specifically:   'Needless',
      please:         'Needless',
      basically:      'Needless',
      simply:         'Needless',
      essentially:    'Needless',
      very:           'Needless',
      just:           'Needless',
      quite:          'Needless',
      totally:        'Needless',
      been:           'Tense',
      will:           'Tense',
      was:            'Tense',
      well:           'Phrase',
      to:             'Phrase',
      of:             'Phrase',
      on:             'Phrase',
      so:             'Phrase',
      instance:       'Phrase',
      line:           'Phrase',
      number:         'Phrase',
      means:          'Phrase',
      'event':        'Phrase',
      present:        'Phrase',
      point:          'Phrase',
      respect:        'Phrase',
      recommended:    'Phrase',
      sure:           'Phrase',
      than:           'Phrase',
      the:            'Phrase',
      you:            'Phrase',
      course:         'Phrase',
      describes:      'Phrase',
      ui:             'Phrase',
      up:             'Phrase',
      out:            'Phrase',
      time:           'Phrase',
      unable:         'Phrase',
    },

    testWordExceptions: {
      'specific': {
        after: ['non-agency'],
      },
      primary: {
        before: ['nns', 'his', 'server', 'servers', 'host', 'ms-his']
      },
      appear: {
      }
    },

    phraseWords: {
      click:        'right',
      course:       'of',
      describes:    'document',
      'event':        'the',
      instance:     'for',
      line:         'command',
      manager:      'the',
      means:        'by',
      number:       'a',
      of:           'result',
      on:           'click',
      out:          'check',
      point:        'this',
      present:      'at',
      recommended:  'that',
      respect:      'with',
      so:           'and',
      sure:         'be',
      than:         'different',
      the:          'place',
      time:         'real',
      to:           'order',
      ui:           'JTI',
      unable:       'is',
      up:           'shows',
      well:         'as',
      you:          'lets',
    },

    possessiveExceptions: {
      "driver's": true,
    },

    acronyms: {
      API:    'Application Programmer Interface',
      APIs:   'Application Programmer Interfaces',
      CPU:    'Central Processing Unit',
      CSV:    'Comma-seperated Variable',
      DNS:    'Domain Name Server',
      GUI:    'Graphic User Interface',
      HTTP:   'Hypertext Transfer Protocol',
      HTTPS:  'Hypertext Transfer Protocol Secure',
      ISP:    'Internet Service Provider',
      NTP:    'Network Time Protocol',
      PDF:    'Putrid Document Format',
      SDK:    'Software Development Kit',
      TCP:    'Transmission Control Protocol',
      UDP:    'User Datagram Protocol',
      URI:    'Universal Resource Identifier',
      URL:    'Universal Resource Locator',
    },

    testWordsRationale: {
      accomplish:    'Replace with "do".',
      additional:    'Replace with "more", "another", or "extra".',
      additionally:  'Replace with "also".',
      alter:         'Replace with "change".',
      alternatively: 'Replace with "or".',
      appear:        'Replace with "look" or "show".',
      appears:       'Replace with "looks" or "shows".',
      approximately: 'Replace with "about".',
      assist:        'Replace with "help".',
      attempt:       'Replace with "try".',
      automatically: 'Delete when intent is clear.',
      begin:         'Replace with "start".',
      beneath:       'Replace with "under".',
      breakthrough:  'Replace with "new".',
      complicated:   'Replace with "complex".',
      concerning:    'Replace with "about".',
      consult:       'Replace with "see".',
      contain:       'Replace with "have".',
      contains:      'Replace with "has".',
      containing:    'Replace with "with".',
      demonstrate:   'Replace with "show".',
      determine:     'Replace with "see" or "decide".',
      difficult:     'Replace with "hard".',
      entire:        'Replace with "whole".',
      having:        'Replace with "with".',
      highlights:    'Replace with "shows" or "covers".',
      however:       'Replace with ""but".',
      illustrates:   'Replace with ""shows".',
      immediately:   'Replace with "now" or "omit".',
      innovative:    'Replace with "new".',
      locate:        'Replace with "find".',
      major:         'Replace with "main" or "huge".',
      modification:  'Replace with "change".',
      modify:        'Replace with "change".',
      modifies:      'Replace with "changes".',
      necessary:     'Replace with "needed" or "required".',
      obtain:        'Replace with "get".',
      operate:       'Replace with "work".',
      perform:       'Replace with "do".',
      pertains:      'Replace with "applies".',
      portion:       'Replace with "part".',
      portions:      'Replace with "parts".',
      primary:       'Replace with "main".',
      principle:     'Replace with "main".',
      provide:       'Replace with "give" and do not use in place of "enter" for entering data.',
      receive:       'Replace with "get".',
      remainder:     'Replace with "rest".',
      robust:        'Replace with "strong".',
      upon:          'Replace with "on".',
      whenever:      'Replace with "when".',
      within:        'Replace with "in".',
      via:           'Via implies geographic context. Avoid using via as a synonym for "by," "through," or "using".',
      cancelled:     'Replace with "canceled".',
      cancelling:    'Replace with "canceling".',
      since:         'Use "since" when referring to time. Do not use since to mean because.',
      which:         '"Which" is descriptive, but not essential to the meaning to the sentence; enclosed in commas.',
      whether:       '"Whether" should always be used as part of the phrase "whether or not".',
      that:          '"That" introduces a clause essential to the meaning of the sentence, defining the preceding text.',
      while:         'Use to refer to something occurring in time. Avoid as a synonym for although.',
      although:      'Use although to show contrast; the same as "even though".',
      'e.g':         'Replace with "for example".',
      'i.e':         'Replace with "that is".',
      allow:         'Use "allow" only to refer to features, such as security, that permit or deny some action. To describe user capabilities that a feature or product makes easy or possible, use "you can". Permissions are "granted," not "allowed."',
      allows:        'Use "allows" only to refer to features, such as security, that permit or deny some action. To describe user capabilities that a feature or product makes easy or possible, use "you can". Permissions are "granted," not "allowed.',
      affect:        '"Affect" as a verb  means to have an influence on. Effect as a noun means the result or outcome.',
      effect:        '"Affect" as a verb  means to have an influence on. Effect as a noun means the result or outcome.',
      afterwards:    'Replace with "afterward".',
      backwards:     'Replace with "backward".',
      alphabetic:    'Replace with "alphabetical".',
      after:         'Use after to emphasize that completion is necessary before proceeding. Do not use "once" to mean after',
      check:         'Use "select" or "clear" when referring to a checkbox.',
      close:         'Do not use for exit a program or end a connection.',
      done:          'Use "when you are finish" instead of "when you are done."',
      select:        'Use "choose" when a decision needs to be made.',
      when:          'When combines the idea of after with the immediacy of the following action. Do not use "once" to mean when.',
      assure:        'Use insure to mean "to provide insurance," use ensure to mean "to make sure" or "to guarantee," use assure to mean "to state positively" or "to make confident."',
      ensure:        'Use insure to mean "to provide insurance," use ensure to mean "to make sure" or "to guarantee," use assure to mean "to state positively" or "to make confident."',
      insure:        'Use insure to mean "to provide insurance," use ensure to mean "to make sure" or "to guarantee," use assure to mean "to state positively" or "to make confident."',
      install:       'Use "Install" as a verb. Use "installation" as a noun.',
      finalize:      'Use "Install" as a verb. Use "installation" as a noun.',
      installation:  'Do not use for "finish" or "complete."',
      among:         'Among  refers to three or more things. Use "between" to refer to two things , regardless of the total number of items',
      between:       'Among  refers to three or more things. Use "between" to refer to two things , regardless of the total number of items',
      etc:           'Use this abbreviation for "and others" sparingly.',
      farther:       'Farther refers to physical distances, "further" refers to additional degree, quality, or time.',
      further:       'Farther refers to physical distances, "further" refers to additional degree, quality, or time.',
      greater:       'Use "later" when referring to program version.',
      illegal:       'Use "invalid" or "not valid."',
      sample:        'Sample is a graphic representation, not an exact representation',
      thus:          'Often used to restate a definition or point that was not clearly defined in the previous text.',
      therefore:     'Often used to restate a definition or point that was not clearly defined in the previous text.',
      less:          'Use less to refer to a mass amount, value, or degree. Use "fewer" to refer to a countable number of items.',
      fewer:         'Use less to refer to a mass amount, value, or degree. Use "fewer" to refer to a countable number of items.',
      only:          'Place immediately preceding or following the word or phrase it modifies, not just before the verb.',
      onto:          'Use "on to" to log on, use "onto" for "on top of."',
      so:            'When so introduces a clause of purpose or result, change it to "so that".',
      then:          'Then is not a coordinate conjunction and thus cannot correctly join two independent clauses. Avoid using then in an "if/then" construct.',
      initiate:      'Do not use to mean start a program; use "start", instead.',
      comprise:      'Avoid. Comprised of is always incorrect. Use "include" and "contain".',
      comprised:     'Avoid. Comprised of is always incorrect. Use "include" and "contain".',
      leverage:      'Do not use as a verb to mean "take advantage of". Use "take advantage of", "capitalize on", or "use".',
      regarding:     'Replace with "about".',
      towards:       'Replace with "toward".',
      utilize:       'Use only to mean "to find a practical use for," not as a synonym for "use".',

      as:            'Do not use as a synonym for "because" or "while" in subordinate clauses.',
      abort:         'Generally, avoid. Use "end," "exit," or "stop", instead.',
      above:         'For "earlier," use "previous," preceding," or "earlier."  For "above section," use hyperlink.',
      below:         'Use "later," instead.  For "section below," use hyperlink.',
      access:        'Do not use for "start," "create," or "open." Use a more specific verb or phrase.',
      accessible:    'Reserve for things that people can easily use.',
      activate:      'Do not use for "open," "start," or "switch to."',
      active:        'Use active or "open", not "current", to refer to open artifacts. Use current to refer to an artifact that does not change in the context of the discussion.',
      current:       'Use active or "open", not "current", to refer to open artifacts. Use current to refer to an artifact that does not change in the context of the discussion.',
      'and/or':       'Avoid. Choose either "and" or "or", or rewrite the sentence.',
      argument:      'An argument typically is a value or expression containing data or code that is used with an operator or passed to a function. A parameter is a value given to a variable and treated as a constant until the operation is completed. Parameters are often used to customize a program for a particular purpose.',
      parameter:     'An argument typically is a value or expression containing data or code that is used with an operator or passed to a function. A parameter is a value given to a variable and treated as a constant until the operation is completed. Parameters are often used to customize a program for a particular purpose.',
      desire:        'Replace with "want".',
      desired:       'Replace with "wanted". Better yet, do not use past tense.',
      enable:        'Use "you can" to refer to making something possible for the user. It is OK to call a feature or function enabled.',
      enabled:       'Use "you can" to refer to making something possible for the user. It is OK to call a feature or function enabled.',
      enables:       'Use "you can" to refer to making something possible for the user. It is OK to call a feature or function enabled.',
      given:         'Do not use to mean "specified", "particular", or "fixed".',
      initiate:      'Do not use to mean start a program; use "start" instead.',
      its:           'Its is the possessive form; it\'s is the contraction meaning "it is."',
      normal:         'Implies "in a normal manner," which may not be possible for everyone. Replace with "usually", "ordinarily", "generally", or a similar term.',
      net:            'Use "network."',
      normally:       'Implies "in a normal manner," which may not be possible for everyone. Replace with "usually", "ordinarily", "generally", or a similar term.',
      once:           'To avoid ambiguity, do not use as a synonym for "after" or "when".',
      prompt:         'Do not use as a synonym for message.',
      purge:          'Use "delete," "clear," or "remove" instead.',
      quit:           'Use "exit" or "close" instead.',
      remove:         'Do not use "remove" to mean "delete."',
      type:           'Do not use in place of "enter" when entering data.',
      we:             'In general, do not use, except in the phrase "we recommend".',
      wish:           'Replace with "want". Ex.: change "may wish" to "might want."',
      can:            'Use "can" to express probability. Use may to express permission. Use might to express possibility.',
      may:            'Use may to express permission. Generally, replace with "might" or "can."',
      might:          'Use "can" to express probability. Use may to express permission. Use might to express possibility.',

      should:         'Avoid. If the action is mandatory, use "must."',
      set:            'Avoid. Be specific about the action.',
      specify:        'Avoid. Be specific about the action.',
      must:           'If the action is mandatory, use "must."',
      dialog:         'Use "dialog box," not "dialog."',
      new:            'Do not use with "create"; create means new.',

      colour:         'Use "color."',
      centre:         'Use "center."',
      dialogue:       'Use "dialog box".',
      fibre:          'Use "fiber."',
      whilst:         'Use "while."',
      hoc:            'Instead of "ad hoc," use more specific description',
      et:             'Instead of "et al," use "others."',
      versa:          'Instead of "vice versa ," use "and the reverse," or similar.',
      vs:             'Instead of "vs.," use "versus."',

      is:             'You might be using passive voice. Re-write for active voice.',

      'it\'s':        '"it is."  Use "Its" for possessive."',
      lifecycle:      '"Life cycle" as a noun. "Life-cycle" as an adjective."',
      realtime:       '"Real time" as a noun. "Real-time" as an adjective."',

      'higher-level': 'Mechanics; omit hyphen.',

      actually:      'Omit unnecessary word.',
      always:        'Omit unnecessary word.',
      any:           'Omit unnecessary word.',
      both:          'Omit unnecessary word.',
      certain:       'Omit unnecessary word.',
      completely:    'Omit unnecessary word.',
      definitely:    'Omit unnecessary word.',
      either:        'Omit unnecessary word.',
      follow:        'Omit when used as "follow these steps."',
      following:     'Omit when used as "do the following."',
      particular:    'Omit unnecessary word.',
      really:        'Omit unnecessary word.',
      respective:    'Omit unnecessary word.',
      respectively:  'Omit unnecessary word.',
      specific:      'Omit unnecessary word.',
      specified:     'Omit unnecessary word.',
      specifically:  'Omit unnecessary word.',
      please:        'Omit; does not add technical value.',
      basically:     'Omit unnecessary word.',
      simply:        'Omit unnecessary word.',
      essentially:   'Omit unnecessary word.',
      very:          'Omit unnecessary word.',
      each:          'Omit unnecessary word.',
      just:          'Omit unnecessary word.',
      quite:         'Omit unnecessary word.',
      totally:       'Omit unnecessary word.',

      been:          'Use present tense; "is/are" instead of "have been."',
      will:          'Use present tense.',
      was:           'Use present tense.',

  //phrases
      well:          'Use "and" instead of "as well as."',
      to:            'Use "to" instead of "in order to," "for" instead of "in order for," "about" instead of "with regard to" or "with respect to," "can" instead of "is able to," "called" instead of "referred to," "can" instead of "capability to," "must" instead of "need to," ""to" instead of "need to" or "want to"',
      of:            'result of',
      on:            'click on',
      click:         'right click; hyphenate: "right-click."',
      so:            'and so on',
      instance:      'Use "for example" instead of "for instance."',
      line:          'Hyphenate "command-line."',
      manager:       'Use "Manager," capitalized, not "the manager."',
      number:        'Use "amount" to refer to things that can be measured. Use "number" to refer to things that can be counted as individual units.',
      variety:       'A variety of; use one.',
      means:         'by means of',
      event:         'in the event of',
      present:       'at present',
      point:         'at this point; replace with "now"',
      respect:       'with respect to',
      recommended:   'it is recommended that; use recommends',
      sure:          'be sure; use "make sure"',
      the:           'place the; replace "place" with "put"',
      than:          'different than',
      you:           'lets you',
      course:        'of course',
      describes:     '"this document describes ..."; Omit.',
      ui:            'TBD',
      up:            'Use "appears" instead of "shows up."',
      out:           'Use "see" instead of "check out."',
      time:          '"Real time" as a noun. "Real-time" as an adjective."',
      unable:        'Use "cannot" instead of "is unable to."',
    },

    hyphenChecks: {
      anti:   'should generally not be hyphenated',
      auto:   'should generally not be hyphenated',
      bi:     'should generally not be hyphenated',
      multi:  'should generally not be hyphenated',
      co:     'should generally not be hyphenated',
      // non:    'should generally not be hyphenated',
      pre:    'should generally not be hyphenated',
      re:     'should generally not be hyphenated',
      sub:    'should generally not be hyphenated',
      un:     'should generally not be hyphenated',
    },

    hyphenExceptions: {
      'non-collectible':  'financials',
      'non-agency':       'specific',
    }
}

if (!String.prototype.strip) {
  String.prototype.strip = function (string) {
    var escaped = string.replace(/([.*+\-?^=!:${}()|\[\]\/\\])/g, "\\$1")
    return this.replace(RegExp("^[" + escaped + "]+|[" + escaped + "]+$", "gm"), '')
  }
}

const normalize = (word = '') => {
  return word.strip('*_()<>.,:|[]-#=!?/').toLowerCase()
}

// scan the lines in a file, but we just return the output
const check = (contents) => {
  u.debug('Check for style problems')

  var results   = []
  var counter   = 0
  var inSource  = false
  var delimiter = ''
  var mg
  var prevWord  = ''

  u.debug('Starting line processing...')
  const lines = contents.split(/\r?\n/)
  if (lines.length > 1) lines.pop()

  lines.map((line, index) => {
    counter++

    u.debug(`${counter}: ${line}`)

    // identify source blocks
    if (!inSource && (line.match(/\[(source|shell|verbatim)[^\]]*\]/))) {
      u.debug(`in source`)
      inSource = true
      return
    }

    // process source blocks
    if (inSource) {
      u.debug(`handling source block`)

      // handle Asciidoctor block delimiter
      if (mg = line.match(/^(-|=)+$/)) {
        u.debug(`matched a source delimiter`)
        if (delimiter.length > 0 && delimiter == mg[1]) {
          u.debug(`source ends`)
          delimiter = ''
          inSource = false
          return
        }

        if (delimiter == '') {
          u.debug(`no delimiter, so set to ${mg[1]}`)
          delimiter = mg[1]
          return
        }
      }

      // handle non-delimited blocks
      if (delimiter === '' && line.match(/^\s*$/)) {
        inSource = false
        return
      }

      // skip source block content
      return
    }

    if (line.match(/\/\/ vim:/)) {
      u.debug(`Skipping Vim modeline...`)
      return
    }

    // perform checks
    u.debug('Splitting words...')
    var words = line.split(/\s+/)
    var result = {
      line: counter,
      text: line,
      errors: [],
      warnings: [],
    }
    u.debug(words)

    // remove inline monospace runs, since they often reflect UI
    // elements that have wording that cannot be changed.
    var zWords = words.join(' ')
    zWords = zWords.replace(/`[^`]+`/, '') // `
    words = zWords.split(/\s+/)

    var w
    var nextWord = ''

    for (w = 0; w < words.length; w++) {
      const candidate = words[w]
      if (!candidate || candidate.length === 0) continue
      var word = normalize(candidate)
      if (w < words.length) {
        nextWord = normalize(words[w + 1])
      }
      const formatted = chalk.bold(word.toUpperCase())
      if (config.testWords.hasOwnProperty(word)) {
        const ruleType = config.testWords[word]
        u.debug(`ruleType: ${ruleType}, prev: ${prevWord}`)

        var acceptable = false
        if (config.testWordExceptions.hasOwnProperty(word)) {
          u.debug(`Have exception for ${word}`)
          const exception = config.testWordExceptions[word]
          const before = exception?.before ?? []
          u.debug(`${word} okay before:`, before)
          const after = exception?.after ?? []
          u.debug(`${word} okay after:`, after)
          u.debug(`prevWord=${prevWord}, nextWord=${nextWord}`)
          if (prevWord && after.includes(prevWord) ||
            nextWord && before.includes(nextWord)
          ) {
            u.debug(`Word deemed acceptable`)
            acceptable = true
          }

          if (word === 'appear') {
            u.debug('word=appear, zWords:', zWords)
            if (zWords.match(/failures? to appear/i)) {
              u.debug('Line contains "failure to appear", acceptable.')
              acceptable = true
            }
          }
        }

        if (!acceptable && !ruleType.startsWith('Phrase')) {
          u.debug('Non-phrase error')
          result.errors.push(
            `${error(ruleType)} ${formatted}: ${config.testWordsRationale[word]}`
          )
        }
        else {
          if (config.phraseWords.hasOwnProperty(word)) {
            if (!acceptable && prevWord === config.phraseWords[word]) {
              result.errors.push(
                `${error(ruleType)} ${prevWord}: ${formatted} ${config.testWordsRationale[word]}`
              )
            }
          }
        }
      }
      else {
        // other kinds of errors
        var [hyphenated, following] = word.split('-')
        if (word.match(/-/) && config.hyphenChecks.hasOwnProperty(hyphenated)) {
          if (config.hyphenExceptions.hasOwnProperty(word)) {
          }
          else {
            result.errors.push(
              `${error('Hyphenation')} ${formatted}: ${config.hyphenChecks[hyphenated]}`
            )
          }
        }

        if (word.endsWith(';')) {
          result.errors.push(
            `${error('Mechanics')} ${formatted}: Do not use semicolon; split into two sentences.`
          )
        }

        if (
          word.match(/(^[^`']+'(?!t))|'s$/) && //`
          !(word in config.possessiveExceptions)
        ) {
          result.warnings.push(
            `${warning('Mechanics')} ${formatted}: Do not use possessives, as in JTI's; Contractions are acceptable.`
          )
        }

        // if (word.includes('&')) {
        //   result.errors.push(
        //     `${warning('Mechanics')} ${formatted}: Do not use "&" unless referring to a literal.`
        //   )
        // }
      }
      prevWord = word
    }

    if (result.warnings.length > 0 || result.errors.length > 0) {
      results.push(result)
    }
  })

  return results
}

// determine whether there are reportable problems
const reportProblems = () => {
  var emit = false
  if (Object.keys(problems).length > 0) {
    Object.keys(problems).map((file) => {
      problems[file].map((entry) => {
        if (entry.errors.length > 0) {
          emit = true
        }
      })
    })
  }
  return emit
}

// provide a report for any results found
const report = () => {
  var errors = 0
  var warnings = 0
  var topics = 0
  Object.keys(problems).sort().map((file) => {
    topics++
    var output = chalk.magenta(file) + `\n`
    var hasErrors = false
    problems[file].map((entry) => {
      output += `${chalk.cyan(entry.line)}: ${entry.text}\n`
      var spaces = " ".repeat(2 + entry.line.toString().length)
      if (entry.errors.length > 0) hasErrors = true
      entry.errors.map((error) => {
        output += `${spaces}- ${error}\n`
        errors++
      })
      entry.warnings.map((error) => {
        output += `${spaces}- ${error}\n`
        warnings++
      })
    })
    if (hasErrors && output.length) u.log(output.trim())
  })
  if (errors || warnings) {
    var message = ''
    if (errors) {
      message += chalk.bold(errors) + ' error' + u.s(errors)
    }
    if (errors && warnings) {
      message += ' and '
    }
    if (warnings) {
      message += chalk.bold(warnings) + ' warning' + u.s(warnings)
    }

    console.log(`\n${message} in ${topics} file${u.s(topics)} found during style checks!`)
  }
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
    u.DEBUG_PREFIX = 'SCE'
    const files = contentCatalog.getFiles()
    u.debug(files)
    files.map((file, index) => {
      if (file.src.extname !== '.adoc' || file.synthetic) return

      if (!file.src.origin.worktree && !remote) return

      const pagePath = path.join(
        file.src.origin.worktree || process.env.INIT_CWD || process.cwd(),
        file.src.origin.startPath || '',
        file.src.path
      )
      const reportPath = path.relative(file.src.origin.worktree, pagePath)
      u.debug(`pagePath: ${chalk.magenta(pagePath)}`)
      u.debug(`worktree: ${file.src.origin.worktree}`)
      u.debug(`startPath: ${file.src.origin.startPath}`)
      u.debug(`reportPath: ${reportPath}`)

      const results = check(file.contents.toString())
      if (results.length) problems[reportPath] = results
    })

    if (reportProblems()) {
      u.log(chalk.red('Style problems found:'))
      report()
    }
    else {
      u.log(`Style problems? ${chalk.bold.green('None found')}`)
    }
  })

  this.on('documentsConverted', ({ playbook, contentCatalog }) => {
    if (reportProblems()) {
      u.log(chalk.bold('Problems reported, stopping build!'))
      this.stop(1)
    }
  })
}

module.exports = { register, check }
