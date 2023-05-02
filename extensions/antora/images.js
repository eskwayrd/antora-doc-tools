// An Antora extension that checks images:
// It detects unused and missing images.
// It detects when specified image sizes do not match image dimensions.

'use strict'

const extensionName = 'images-extension'
const chalk = require('chalk')
const path  = require('path')
const u     = require('../../utils')
const sizeOf  = require('image-size')

const imageExtensions = [
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
]
const images = {}
const problems = {}
var unreferenced = false

const check = (contents, docFile = '') => {
  u.debug('Check images')
  if (!contents || !contents.length) return

  // Compute where "local" images for this Asciidoc file should live.
  var moduleDir = path.dirname(docFile)
  while (!moduleDir.match(/(pages|partials)$/)) {
    moduleDir = path.dirname(moduleDir)
  }
  moduleDir = path.dirname(moduleDir)
  var imagesDir = path.join(moduleDir, 'images')

  // Define check variables.
  var results = []
  var mg = []
  var width = 0
  var height = 0
  var filename = ''
  var attributes = ''

  u.debug('Starting line processing...')
  const lines = contents.split(/\r?\n/)
  if (lines.length > 1) lines.pop()

  lines.map((line, index) => {
    u.debug(`Line ${index + 1}: -=-${line}=-=`)
    // Skip blank lines.
    if (!line) return

    // Skip non-image lines.
    if (!line.match(/(image::?([^\[]+)|!\[[^\]]*)/)) return

    // Identify image macros.
    if (mg = line.match(/image::?([^\[]+)\[(.*)/)) {
      filename = mg[1]
      attributes = mg[2]

      // Capture multi-line image macros.
      var contender = attributes
      var offset = 1
      while (!contender.match(/]/)) {
        if (index + offset >= lines.length) break;
        contender = lines[index + offset++]
        attributes += " " + contender
      }

      // Trim off trailing content.
      attributes = attributes.replace(/].*$/, '')

      // Avoid split problems by removing quoted text.
      attributes = attributes.replace(/"(.*?)"/, '"-"')

      // Separate attributes.
      attributes = attributes.split(/\s*,\s*/)

      width = height = "na"
      if (attributes.length > 2) {
        width = parseInt(attributes[1], 10)
        height = parseInt(attributes[2], 10)
      }
    }

    if (filename.match(/^(ht|f)tps?:\/\//)) {
      u.debug("Skipping external link...")
      return
    }

    u.debug(`Found image: ${filename}, ${width} x ${height}`)

    // compute the referenced image's path
    var imgPath = path.join(imagesDir, filename);
    if (filename.substr(0, 1) === '/') {
      console.log('Caught a / reference!')
      // imgPath = path.relative(docPath, path.resolve(path.join(docPath, filename)))
      process.exit(1)
    }

    if (mg = filename.match(/^([^:]+):(.+)/)) {
      imgPath = path.join(moduleDir, '..', mg[1], 'images', mg[2])
      u.debug('custom module img path=', imgPath)
    }
    u.debug(`imgPath: ${imgPath}`)

    // check the reference
    if (imgPath in images) {
      u.debug(`Exists in doc tree! ${imgPath}`)
      images[imgPath] = true

      // Don't check specified sizing for SVG images, as we often have
      // to specify a size that differs from the 'natural' size.
      if (path.extname(imgPath) !== '.svg') {
        // If we have a height, check that the specified size matches
        // the actual (or Retina resolution) size.
        if (width > 0 || height > 0) {
          var dimensions = sizeOf(imgPath);
          var aw = dimensions.width
          var ah = dimensions.height
          // handle Retina resolution images (2x) by guessing the
          // intention (it would be better to detect image dpi)
          if (Math.ceil(aw / width) > 1 || Math.ceil(ah / height) > 1) {
            aw = Math.ceil(aw / 2)
            ah = Math.ceil(ah / 2)
          }
          var diffh = aw - width
          var diffv = ah - height
          u.debug(`w:${width}, h:${height}, aw:${dimensions.width}/${aw}, ah:${dimensions.height}/${ah}, dx:${diffh}, dy:${diffv}`)
          var wrong = false
          if (diffh !== 0) wrong = true
          if (diffv !== 0) wrong = true
          if (wrong) {
            results.push({
              line:     index + 1,
              file:     filename,
              sw:       width,
              sh:       height,
              aw:       aw,
              ah:       ah,
              missing:  false
            })
          }
        }
      }
    }
    else {
      u.debug(`Cannot find image in doc tree: --${imgPath}==`)
      results.push({
        line:     index + 1,
        file:     filename,
        missing:  true
      })
    }
  })

  u.debug('Check complete, returning:', results)
  u.debug('')
  return results
}

const report = () => {
  var topics = 0
  const issues = Object.keys(problems)
  issues.sort().map((file) => {
    topics++
    const issues = problems[file]
    var output = chalk.magenta(file) + `\n`
    issues.map((issue) => {
      output += `${chalk.cyan(issue.line)}: ${issue.file} - `
      output += (issue.missing)
        ? `${chalk.bold('missing')}\n`
        : `${chalk.bold('size')} set=${chalk.red(issue.sw + 'x' + issue.sh)}, img=${chalk.green(issue.aw + 'x' + issue.ah)}\n`
      console.log(output)
    })
  })

  if (unreferenced) {
    console.log(chalk.red(`Images not specified in doc source:`))
    Object.keys(images).map((imgFile) => {
      if (!images[imgFile]) {
        console.log(chalk.blue(imgFile))
      }
    })
  }

  if (issues.length || unreferenced) {
    console.log(`
${chalk.bold(issues.length)} image issue${u.s(issues)} in ${topics} file${u.s(topics)} found!`)
  }
  console.log("Check for case mismatches and path typos.")
  console.log("Remove any unreferenced images.")
  console.log("Provide images that are referenced, or remove references.")
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
    u.DEBUG_PREFIX = 'ICE'

    // Scan content catalog for image files.
    const files = contentCatalog.getFiles()
    files.map((file, index) => {
      u.debug(`ISF: ${file.src.path}`)
      // Skip synthetic files, non-images, and if desired remote images.
      if (file.synthetic) {
        u.debug(`Skip synthetic file.`)
        return
      }
      if (!imageExtensions.includes(file.src.extname)) {
        u.debug(`'${file.src.extname}' is not an image extension, skipping...`)
        return
      }
      if (!file.src.origin.worktree && !remote) {
        u.debug(`Skipping "remote" file...`)
        return
      }

      u.debug(`worktree: ${file.src.origin.worktree}`)
      u.debug(`startPath: ${file.src.origin.startPath}`)
      u.debug(`path: ${file.src.path}`)
      const imagePath = path.join(
        file.src.origin.worktree || process.env.INIT_CWD || process.cwd(),
        file.src.origin.startPath || '',
        file.src.path
      )
      u.debug(`imagePath: ${chalk.magenta(imagePath)}`)
      const reportPath = path.relative(file.src.origin.worktree, imagePath)
      u.debug(`reportPath: ${chalk.magenta(reportPath)}`)

      // Indicate presence of image
      images[reportPath] = false
    })
    u.debug(`Found images:`, images)

    // Scan Asciidoc files for image usage
    files.map((file, index) => {
      // Skip non-adoc and synthetic files, and if desired remote Asciidoc.
      if (file.src.extname !== '.adoc' || file.synthetic) return
      if (!file.src.origin.worktree && !remote) return

      // Skip "hidden" files whose filenames begin with underscore.
      const filename = path.basename(file.src.path)
      if (filename.substr(0, 1) === '_') return

      // Skip non-content files, such as nav.adoc
      if (!file.src.path.match(/\/(pages|partials)\//)) return

      u.debug(`worktree: ${file.src.origin.worktree}`)
      u.debug(`startPath: ${file.src.origin.startPath}`)
      u.debug(`path: ${file.src.path}`)
      const pagePath = path.join(
          file.src.origin.worktree || process.env.INIT_CWD || process.cwd(),
          file.src.origin.startPath || '',
          file.src.path
      )
      u.debug(`imagePath: ${chalk.magenta(pagePath)}`)
      const reportPath = path.relative(file.src.origin.worktree, pagePath)
      u.debug(`reportPath: ${chalk.magenta(reportPath)}`)

      const results = check(file.contents.toString(), reportPath)
      if (results.length) problems[pagePath] = results
    })

    Object.keys(images).map((imgFile) => {
      if (images[imgFile] === false) unreferenced = true
    })

    if (Object.keys(problems).length || unreferenced) {
      u.log(chalk.red('Image issues found:'))
      report()
    }
    else {
      u.log(`Images? ${chalk.bold.green('OK!')}`)
    }
  })

  this.on('documentsConverted', ({ playbook, contentCatalog }) => {
    if (Object.keys(problems).length || unreferenced) {
      u.log(chalk.bold('Problems reported, stopping build!'))
      this.stop(1)
    }
  })
}

module.exports = { register, check }