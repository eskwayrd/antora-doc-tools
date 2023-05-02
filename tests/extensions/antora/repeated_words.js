const { register, check } = require('../../../extensions/antora/repeated_words')
const test = require('ava')

test('newlines', t => {
  // Without newline
  t.deepEqual(check('All is good.'), [])

  // With newline.
  t.deepEqual(check('All is good.\n'), [])
})

test('simple repeat', t => {
  t.deepEqual(
    check('All is is good.\n', {}),
    [{ line: 1, offset: 2, repeated: 'is', source: 'All is is good.' }]
  )
})

test('valid repeat', t => {
  // Should not complain about 'that that', by default
  t.deepEqual(check('All that that is good.\n'), [])

  // Should complain about 'that that' when no valid repeats are defined
  t.deepEqual(
    check('All that that is good.\n', {}),
    [{
      line: 1,
      offset: 2,
      repeated: 'that',
      source: 'All that that is good.',
    }]
  )
})

test('second line repeat', t => {
  t.deepEqual(
    check('All that\nthat is good.\n', {}),
    [{ line: 2, offset: 0, repeated: 'that', source: 'that is good.' }]
  )
})

test('repeat in xref', t => {
  t.deepEqual(
    check('xref:page.adoc[A a page]', {}),
    [{ line: 1, offset: 1, repeated: 'a', source: 'xref:page.adoc[A a page]' }]
  )
})
