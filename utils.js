// Utility functions for documentation tools

const chalk   = require('chalk')
const fs      = require('fs')
const path    = require('path')
const exec    = require('child_process').execSync
const tmp     = require('tmp')
const util    = require('util')
const Elapsed = require('elapsed-time')
const YAML    = require('yaml')

// color definitions for diffs
const diffColors = {
  'EQUAL': chalk.grey,
  'MODIFIED': chalk.yellow,
  'ADDED': chalk.green,
  'REMOVED': chalk.red,
  'DELETED': chalk.magenta,
}

// setup a global timer
var timer = null

// specify the timer output resolution
const resolution = 1

const timeNS = chalk.whiteBright('ns')
const timeUS = chalk.white('µs')
const timeMS = chalk.yellow('ms')
const timeS  = chalk.green('s')
const timeM  = chalk.magenta('m')
const timeH  = chalk.redBright('h')

// Inject a format time function into the timer class
Elapsed.prototype.formatTime = function (elapsed) {
  var e = elapsed
  if (e === 0) return '0'
  if (e < 1e3) return elapsed + timeNS
  if (e < 1e6) return (elapsed / 1e3).toFixed(resolution) + timeUS
  if (e < 1e9) return (elapsed / 1e6).toFixed(resolution) + timeMS

  e = e / 1e9

  if (e < 60) return e.toFixed(resolution) + timeS
  if (e < 3600) {
    return Math.floor(e / 60) + timeM + Math.round(e % 60) + timeS
  }

  return Math.floor(e / 3600) + timeH
    + Math.floor(Math.floor(e % 3600) / 60) + timeM
    + Math.round(Math.floor(e % 3600) % 60) + timeS
}

// --------------------------------------------------------------------
// Start the process timer
const startTimer = (global = true) => {
  const myTimer = Elapsed
    .new({ formatter: Elapsed.prototype.formatTime })
    .start()
  if (global) timer = myTimer
  return myTimer
}

// --------------------------------------------------------------------
// Get the current elapsed interval from the timer
const elapsedTimer = (myTimer) => {
  if (!myTimer) myTimer = timer
  return timer.getValue()
}

// --------------------------------------------------------------------
// Get the current raw value from the timer
const rawTimer = (myTimer) => {
  if (!myTimer) myTimer = timer
  return timer.getRawValue()
}

// --------------------------------------------------------------------
// Emit debugging output
var DEBUG = false
var DEBUG_PREFIX = 'DEBUG'
const inspectOptions = {
  showHidden: false,
  depth: null,
  maxArrayLength: null,
}

const debug = (...msgs) => {
  const d = module.exports.DEBUG
  const p = module.exports.DEBUG_PREFIX
  if (d) {
    for (let m of msgs) {
      if (typeof m !== 'string') {
        m = util.inspect(m, inspectOptions)
      }
      console.log(`${chalk.yellow(p)}: ${chalk.grey(m)}`)
    }
  }
}

// --------------------------------------------------------------------
// Emit log output with "deep" presentation for objects
const log = (...msgs) => {
  for (let m of msgs) {
    if (typeof m !== "string") {
      m = util.inspect(m, inspectOptions)
    }
    console.log(m)
  }
}

// --------------------------------------------------------------------
// Get the current elapsed interval from the timer
const exit = (state) => {
  console.log(`Terminated after ${elapsedTimer()}`)
  process.exit(state)
}

// --------------------------------------------------------------------
// Express plural/singular
const s = (num = 0) => num === 1 ? '' : 's'


// --------------------------------------------------------------------
// determines the minimum indent in source text
const minIndent = (source = '') => {
  const match = source.match(/^[ \t]*(?=\S)/gm);
  if (!match) return 0
  return match.reduce((r, a) => Math.min(r, a.length), Infinity);
}

// --------------------------------------------------------------------
// returns an array of the string's characters and their ASCII codes.
const asciiCodes = (str) => {
  return str.split('').map((c) => { return `${c} ${("   " + c.charCodeAt(0)).substr(-3)}` })
}

// --------------------------------------------------------------------
// Convert a string into its constituent ASCII codes
const showAscii = (string) => {
  for (var i = 0; i < string.length; i++) {
    console.log(`${i}: "${string.charAt(i)}" => ${string.charCodeAt(i)}`)
  }
}

// --------------------------------------------------------------------
// Compute the type of value, in a helpful way
const myTypeOf = (obj) => {
  var result = typeof obj
  if (result === 'undefined') return 'undefined'
  if (obj === null) return 'null'
  if (result === 'object' && obj.constructor === Array) return 'array'
  return result
}

// --------------------------------------------------------------------
// Determine if a value is null or not
const isNotNull = (val) => {
  if (typeof val === 'undefined') return false
  if (val === null) return false
  return true
}

// --------------------------------------------------------------------
// Compare two values to see if they are both timestamp-like, and
// whether the second is larger than the first
const compareTS = (vO, vC) => {
  const d1 = isNotNull(vO) ? vO.toString() : ''
  const d2 = isNotNull(vC) ? vC.toString() : ''
  dbg(1, `d1: ${d1}`, `d2: ${d2}`)
  // The TS values to ignore must be the right length and have
  // trailing zeros
  if (d1.match(/^\d{12,14}0000$/) && d2.match(/^\d{12,14}0000$/)) {
    debug(`Looks like a timestamp`)
    if ((d2 - d1) > 0) {
      return true
    }
  }
  return false
}

// --------------------------------------------------------------------
// Provide a string function to replace a character at a string index
String.prototype.replaceAt = function(index, replacement, l = 0) {
  var len = l > 0 ? l : replacement.length
    return this.substr(0, index)
      + replacement
      + this.substr(index + len)
}

// --------------------------------------------------------------------
// Finds the path to `antora-playbook.yml`
const findPlaybook = (folder = '.', file = 'antora-playbook.yml') => {
  const pathParts = path.normalize(folder).split(path.sep)
  var result = null

  while (pathParts.length && !result) {
    const current = pathParts.join(path.sep) + path.sep + file
    if (fs.existsSync(current)) {
      result = current
    }

    pathParts.pop()
  }

  return result
}

// --------------------------------------------------------------------
// Read `antora-playbook.yml` and return its configuration
const getPlaybook = () => {
  const pbPath = findPlaybook()
  if (!pbPath) {
    log(chalk.red('Cannot find the playbook file!'))
    process.exit(1)
  }

  const playbook = fs.readFileSync(pbPath, { encoding: 'utf8' })
  return YAML.parse(playbook)
}

// --------------------------------------------------------------------
// read the playbook, to find out where the built HTML lives
const getBuildPath = () => {
  const playbook = getPlaybook()
  const playbookBuildPath = playbook.output.dir
  const buildPath = path.resolve(
    path.dirname(playbookBuildPath),
    playbookBuildPath
  )
  return buildPath
}

// --------------------------------------------------------------------
// Run git to find out which files are modified
const modifiedFiles = () => {
  var command = `git -c core.quotepath=false diff --name-status HEAD`
  var [ output, errors, kill ] = run(command)
  if (kill) {
    console.log(`Collecting Git modified files terminated!`)
    process.exit(1)
  }

  if (errors.length) {
    console.log(`Gathering Git modified files failed:\n`)
    console.log(errors)
    process.exit(1)
  }

  // Only collect Asciidoc files
  const gitFiles = []
  output.split(/\r?\n/).map((cur, index) => {
    if (!cur || cur === '') return
    var mg
    if (mg = cur.match(/^([ABCDMRTUX\*]\d*?)\t(.+)$/)) {
      const disp = mg[1]
      if (disp === 'D') return

      var filePath = mg[2].split("\t")
      filePath = filePath[filePath.length - 1]

      if (
        filePath &&
        filePath.length &&
        path.extname(filePath) === '.adoc'
      ) {
        gitFiles.push(filePath)
      }
    }
    else {
      console.log(`Unknown git status: ${cur}`)
      process.exit(1)
    }
  })

  return gitFiles
}

// --------------------------------------------------------------------
// Run a "program" with the supplied command, returning captured output
const run = (command, localEnv = {}, ignoreStatus = 0) => {
  var output = ''

  // prepare a temp file to store command output+errors
  var stdFile = tmp.fileSync({ keep: true })
  var errFile = tmp.fileSync({ keep: true })

  // merge the current process environment with the specified env
  var env = Object.assign({}, process.env, localEnv)
  debug(`Command: "${command}"`)
  debug(`stdout file: "${stdFile.name}"`)
  debug(`stderr file: "${errFile.name}"`)
  debug(`local env:`, localEnv)

  var mycwd = 'MYCWD' in env ? env.MYCWD : process.cwd()
  debug(`mycwd: ${mycwd}`)

  var errored = false
  var errorOutput = ''
  var stat = 0
  var kill = false

  try {
    exec(command, {
      cwd: mycwd,
      stdio: [process.stdin, stdFile, errFile],
      env: env,
    })
  }
  catch (err) {
    var complain = true
    debug(`Run child had some sort of issue:`, err)

    if (err.signal === 'SIGINT' || err.status === 130) {
      debug(`Caught a CTRL-C`)
      errorOutput += 'Terminating due to CTRL-C!'
      complain = false
      kill = true
    }

    if (ignoreStatus) {
      var type = myTypeOf(ignoreStatus)
      if (type === 'array') {
        ignoreStatus.forEach((ignore) => {
          if (err.status === ignore) complain = false
        })
      }
      else if (ignoreStatus === 'ALL') complain = false
      else if (err.status === ignoreStatus) complain = false
    }

    if (complain) {
      if (err.signal) {
        debug(`Run child received signal: ${err.signal}`)
        errorOutput += `Run child received signal: ${err.signal}\n`
      }
      if (err.status > 0) {
        stat = err.status
        debug(`Run child status: ${err.status}`)
        errorOutput += `Run child status: ${err.status}\n`
      }
      errorOutput += `FAILED: Execution of '${command}' failed ` +
        util.inspect(err, { depth: null }) +
        util.inspect(env, { depth: null })
      errored = true
    }
  }

  // read in the captured output
  errorOutput += fs.readFileSync(errFile.name, 'utf8')

  var captured = fs.readFileSync(stdFile.name, 'utf8')
  if (captured.length) {
    output += captured
  }

  if (errored || complain) {
    console.log(errorOutput)
  }

  return [ output, errorOutput, kill, stat ]
}

// --------------------------------------------------------------------
// show help output
const usage = (...msgs) => {
  for (let m of msgs) {
    log(chalk.pink(m))
  }

  console.log(`
${chalk.bold('Examples')} - automation for doc examples

${chalk.bold('Usage')}

  node ci/examples/index.js [-Glmoprv] [--lint] [--manifest] [--run]
    [-c regex] [-x ext] [-a regex] [-s secret] [-e endpoint]
    [--recompose] [--writeComposed] [--writeOutput]

${chalk.bold('Options')}

  -h, --help            Display this help text.
  -l, --lint            Lint the examples.
                        Default: enabled. Disabled by: -m, -r
  -m, --manifest        Display the manifest of examples.
                        Default: enabled. Disabled by: -l, -r
  -o, --only            Only emit missing examples in manifest.
  -r, --run             Run the examples and compare their current output
                        with the saved output.
                        Default: enabled. Disabled by: -l, -m
  -c, --check regex     Specifies a regex, applied to each example's path;
                        only matching paths are processed. Default is ALL,
                        which disables regex matching and processes all
                        examples.
  -a, --after regex     Specifies a regex, applied to each example's path;
                        once a path matches, that example and all
                        examples that come after (in lexial path order)
                        are processed.
  -x, --extension ext   Specifies a regex, applied to each example's
                        extension; only paths with matching extensions
                        are processed. Default is ALL, which disables
                        regex processing and processes all extensions.
  -s, --secret secret   Specify the initial secret to use.
  -e, --endpoint URL    Specify the endpoint to use.
  -g, --graphql         Specify the GraphQL API endpoint URL to use.
  -G                    Skip processing GraphQL.
  -p, --composed        Show the composed program.
  --recompose           Strip off logic outside tagged query, to permit
                        new logic in composition to be used.
  --writeComposed       Overwrite the example with the composed program.
  --writeOutput         Overwrite the example output with current output.
  -v, --verbose         Enable debug output.

${chalk.bold('Examples')}

* Only emit the manifest          ${chalk.cyan('node ci/examples/index.js -m')}
* Only lint all examples          ${chalk.cyan('node ci/examples/index.js -l')}
* Only run all examples           ${chalk.cyan('node ci/examples/index.js -r')}
* Only run specific examples      ${chalk.cyan('node ci/examples/index.js -r -c Paginate')}
* Lint and run specific examples  ${chalk.cyan('node ci/examples/index.js -lr -c Paginate')}
`)
  process.exit(0)
}

// --------------------------------------------------------------------
// exports
module.exports = {
  asciiCodes,
  elapsedTimer,
  rawTimer,
  debug,
  DEBUG,
  DEBUG_PREFIX,
  exit,
  findPlaybook,
  getBuildPath,
  getPlaybook,
  inspect: util.inspect,
  log,
  minIndent,
  modifiedFiles,
  myTypeOf,
  run,
  s,
  startTimer,
  usage,
}
