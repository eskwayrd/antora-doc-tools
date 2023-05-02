// An Antora extension that checks for the existence of Antora Assembler
// assets in the content catalog, and sets an attribute in the playbook
// that page templates in the UI should see when forming links to
// Assembler assets.

'use strict'

const extensionName = 'detect_assembler-extension'
const chalk = require('chalk')
const path  = require('path')
const u     = require('../../utils')


function register ({
  config: {
    debug = false,
    ...unknownOptions
  }
}) {
  const logger = this.getLogger(extensionName)

  if (Object.keys(unknownOptions).length) {
    const keys = Object.keys(unknownOptions)
    throw new Error(
      `Unrecognized option${keys.length !== 1 ? 's' : ''}` +
      ` specified for ${extensionName}: ${keys.join(', ')}`
    )
  }

  // During contentClassified, check all of the pages one by one
  this.on('playbookBuilt', ({ playbook }) => {
    u.DEBUG = debug
    u.DEBUG_PREFIX = 'DAE'

    const newPlaybook = JSON.parse(JSON.stringify(playbook))
    let assemblerEnabled = false
    // try to determine if Assembler is configured and enabled
    newPlaybook.antora?.extensions?.map((ext) => {
      u.debug(`Scanning extension:`, ext)
      if ((ext.require || '') === '@antora/pdf-extension') {
        assemblerEnabled = true
        if (ext.enabled === false) assemblerEnabled = false
      }
    })
    u.debug(`Assembler enabled? ${assemblerEnabled}`)

    // when Assembler is enabled, set an attribute to indicate such.
    if (assemblerEnabled) {
      // Build out the required structure to set an attribute, if needed
      if (!('asciidoc' in newPlaybook)) {
        newPlaybook.asciidoc = {}
      }
      if (!('attributes' in newPlaybook.asciidoc)) {
        newPlaybook.asciidoc.attributes = {}
      }

      // Set the attribute
      newPlaybook.asciidoc.attributes.assemblerEnabled = 'yes'

      // Update the playbook
      this.updateVariables({ playbook: newPlaybook })
    }
    u.debug(newPlaybook)
  })
}

module.exports = { register }
