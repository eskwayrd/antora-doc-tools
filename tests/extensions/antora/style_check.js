const { register, check } = require('../../../extensions/antora/style_check')
const chalk               = require('chalk')
const test                = require('ava')

test('No error', t => {
  // No error.
  t.deepEqual(check('This is a test.'), [])
})

test('Phrase error', t => {
  // A "phrase" error
  t.deepEqual(
    check('Alternatively, fail.'),
    [
      {
        errors: [
          `${chalk.red('Simplify')} ${chalk.bold('ALTERNATIVELY')}: Replace with "or".`
        ],
        line: 1,
        text: 'Alternatively, fail.',
        warnings: [],
      }
    ]
  )
})

test('Sub section', t => {
  // A "phrase" error
  t.deepEqual(check('A sub section'), [])
})
