#!/usr/bin/env node

// Post-installation steps for the doc tools

'use strict'

const axios   = require('axios')
const chalk   = require('chalk')
const fs      = require('fs')
const gc      = require('gently-copy')
const path    = require('path')
const tmp     = require('tmp')
const hasbin  = require('hasbin')
const u       = require('./utils')

u.DEBUG_PREFIX = 'postInstall'

// process arguments
var argv = require('minimist')(process.argv.slice(2))
if ('v' in argv) u.DEBUG = true
u.DEBUG = true

const cwd = process.env.INIT_CWD
  ? process.env.INIT_CWD
  : process.cwd()
u.debug(`cwd: ${cwd}`)

const arch = process.arch
const platform = process.platform

const htmltestVersion = '0.17.0'
const valeVersion = '2.25.2'

const targetFolder = 'bin'

// Returns the release-specific platform string based on platform
const mapPlatform = (map = {}) => {
  if (!(platform in map)) return null
  return map[platform]
}

// Returns the release-specific arch string based on arch
const mapArch = (map = {}) => {
  if (!(arch in map)) return null
  return map[arch]
}

const ls = (dir) => {
  //passsing directoryPath and callback function
  fs.readdir(dir, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log(file);
    })
  })
}

// copy adt to project root
const setupADT = () => {
  var linked = false

  const adtPath = path.join(cwd, 'adt')
  const nmPath = path.join('node_modules', 'antora-doc-tools')
  u.debug(`adtPath: ${adtPath}`)
  u.debug(`scriptPath:`, __dirname)
  const vPath = path.join(__dirname, 'vale')
  if (fs.existsSync(vPath)) {
    console.log(`${vPath} exists!`)
  }
  else {
    console.log(`${vPath} MISSING!`)
  }

  if (fs.existsSync(adtPath)) {
    const stats = fs.lstatSync(adtPath)
    if (stats.isSymbolicLink()) {
      linked = true
      u.debug(`${adtPath} already exists... skip link`)
    }
    else {
      // probably a local copy
      linked = true
      u.log(`${adtPath} is a folder, which might contain local modifications... skip link`)
    }
  }
  else {
    u.debug(`Symlinking ADT assets...`)
    fs.symlinkSync(
      path.join(nmPath, 'adt'),
      adtPath
    )
    fs.symlinkSync(
      path.join(nmPath, 'Makefile'),
      path.join(cwd, 'Makefile')
    )
    // const toCopy = ['./adt', './Makefile']
    // u.debug(`Copying ADT assets ${toCopy}`)
    // gc(toCopy, cwd, { overwrite: true })
    linked = true
  }

  // create the dictionary folder if it does not exist
  u.debug(`Checking for existence of the dictionaries folder...`)
  const dictDir = path.join(cwd, 'dictionaries')
  if (!fs.existsSync(dictDir)) {
    // Prior to vale 2.24.5, symlinks in Vale's dictPath could not be
    // symlinks, so copying the dictionary folder was required.
    // u.debug(`Creating ${dictDir}`)
    // const toCopy = ['./adt/dictionaries']
    // gc(toCopy, cwd)

    fs.mkdirSync(dictDir)
  }

  u.debug(`Handling the large English dictionary...`)
  const antDicts = path.join(nmPath, 'dictionaries')
  const enUS = 'en_US-large'
  const dictEnPath = path.join(dictDir, `${enUS}.dic`)
  if (!fs.existsSync(dictEnPath)) {
    u.debug('Symlinking the large English dictionary files...')
    fs.symlinkSync(
      path.join(antDicts, `${enUS}.dic`),
      dictEnPath
    )
    fs.symlinkSync(
      path.join(antDicts, `${enUS}.aff`),
      path.join(dictDir, `${enUS}.aff`)
    )
  }

  u.debug(`Handling the Antora dictionary...`)
  const antDic = 'antora'
  const dictAntPath = path.join(dictDir, `${antDic}.dic`)
  if (!fs.existsSync(dictAntPath)) {
    u.debug('Symlinking the Antora dictionary files...')
    fs.symlinkSync(
      path.join(antDicts, `${antDic}.dic`),
      dictAntPath
    )
    fs.symlinkSync(
      path.join(antDicts, `${antDic}.aff`),
      path.join(dictDir, `${antDic}.aff`)
    )
  }

  u.debug(`Handling the local dictionary...`)
  const locDic = 'local'
  const dictLocPath = path.join(dictDir, `${locDic}.dic`)
  if (!fs.existsSync(dictEnPath)) {
    u.debug('Symlinking the local dictionary files...')
    fs.symlinkSync(
      path.join(antDicts, `${locDic}.dic`),
      dictLocPath
    )
    // Editing affix files is pretty rare, so just re-use the Antora
    // affixes for the local dictionary.
    fs.symlinkSync(
      path.join(antDicts, `${locDic}.aff`),
      path.join(dictDir, `${locDic}.aff`)
    )
  }

  //  // create the local dictionary if it does not exist
  //  const localDict = path.join(dictDir, 'local.dic')
  //  const localDictAff = path.join(dictDir, 'local.aff')
  //  if (!fs.existsSync(localDict)) {
  //    u.debug(`Creating ${localDict}`)
  //    let fh = fs.openSync(localDict, 'a')
  //    fs.closeSync(fh)
  //    fh = fs.openSync(localDictAff, 'a')
  //    fs.closeSync(fh)
  //  }

  console.log('-='.repeat(30))
  ls(cwd)
  console.log('=-'.repeat(30))

  const valeDir = path.join(cwd, 'Vale')
  if (!fs.existsSync(valeDir)) {
    fs.mkdirSync(valeDir)
  }

  const valeConfig = path.join(valeDir, '.vale.ini')
  if (!fs.existsSync(valeConfig)) {
    u.debug(`Copying Vale configuration`)
    fs.copyFileSync(
      path.join(nmPath, 'vale', 'vale.ini'),
      path.join(cwd, 'Vale', '.vale.ini')
    )
  }

  const htmltestConfig = path.join(cwd, 'htmltest.yml')
  if (!fs.existsSync(htmltestConfig)) {
    u.debug(`Copying htmltest configuration`)
    const toCopy = ['./adt/htmltest.yml']
    gc(toCopy, cwd)
  }

  if (linked) {
    u.log(chalk.green('OK'))
  }
}

const getRelease = async (user, repo, version, platform, arch, ext, targetDir) => {
  if (ext !== 'tar.gz' && ext !== 'zip') {
    console.log(`Don't know how to handle a .${ext} file!`)
    return
  }

  const url = `https://github.com/${user}/${repo}/releases/download/v${version}/${repo}_${version}_${platform}_${arch}.${ext}`
  const tempdir = tmp.dirSync({ unsafeCleanup: true })
  const filename = path.basename(url)
  const archive = path.join(tempdir.name, filename)

  console.log(`Downloading ${user}/${repo}...`)
  const res = await axios.get(url, { responseType: 'arraybuffer' })
    .then((res) => res)
    .catch((err) => console.log(`Error:`, err))
  fs.writeFileSync(archive, res.data)

  console.log(`Decompressing ${repo}...`)
  const env = { MYCWD: tempdir.name }
  if (ext === 'tar.gz') {
    const command = `tar zxf ${archive}`
    u.debug(command)
    var [ output, errors, kill, stat ] = u.run(command, env, 2)
    if (errors.length) {
      console.log(`'${command}' failed:`, errors)
      return
    }
  }
  else {
    const command = `unzip ${archive}`
    u.debug(command)
    var [ output, errors, kill, stat ] = u.run(command, env, 2)
    if (errors.length) {
      console.log(`'${command}' failed:`, errors)
      return
    }
  }

  console.log(`Rename into place...`)
  const source = path.join(tempdir.name, repo)
  const dest = path.join(targetDir, repo)

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir)
  }
  fs.copyFileSync(source, dest)

  tempdir.removeCallback()
  console.log(`Done ${repo}.`)
}

const htmltest = async () => {
  // htmltest does not release Windows versions
  const p = mapPlatform({
    'darwin': 'macos',
    'linux': 'linux',
    'openbsd': 'openbsd',
  })

  const a = mapArch({
    'x64': 'amd64',
    'arm64': 'arm64',
  })

  if (!p || !a) {
    console.log(`No htmltest release available for $${platform}/${arch}.`)
    return
  }

  getRelease('wjdp', 'htmltest', htmltestVersion, p, a, 'tar.gz', targetFolder)
}

const vale = async () => {
  const p = mapPlatform({
    'darwin': 'macOS',
    'linux': 'Linux',
    'win32': 'Windows'
  })

  const a = mapArch({
    'x64': '64-bit',
    'arm64': 'arm64',
  })

  if (!p || !a) {
    console.log(`No vale release available for ${platform}/${arch}.`)
    return
  }

  const ext = p === 'Windows' ? 'zip' : 'tar.gz'
  getRelease('errata-ai', 'vale', valeVersion, p, a, ext, targetFolder)
}

setupADT()
htmltest()
vale()
