const { register, check } = require('../../../extensions/antora/ventilated_prose')
const test = require('ava')

test('Single good sentence', t => {
  t.deepEqual(check('All is good.'), [])

  // With newline.
  t.deepEqual(check('All is good.\n'), [])
})

test('Single bad sentence', t => {
  t.deepEqual(
    check('All is\ngood.\n'),
    [
      { line: 1, source: 'All is', cause: 'end' },
      { line: 2, source: 'good.', cause: 'start' },
    ]
  )
})

test('Vim modeline', t => {
  t.deepEqual(check('// vim: tw=0 ai et ts=2 sw=2'), [])
})

test('URL', t => {
  t.deepEqual(check('Visit java.com for details.'), [])
})

test('Document with headings', t => {
  t.deepEqual(
    check(`// vim: tw=0 ai et ts=2 sw=2
= Document

Lorem ipsum.

== Subsection

More lorem ipsum.`),
    []
  )

  t.deepEqual(check('== xref:person/index.adoc[Summary]'), [])
})

test('Block title', t => {
  t.deepEqual(
    check(`.Block title
A valid sentence.`),
    []
  )
})

test('List items', t => {
  t.deepEqual(
    check(`. Numbered.
. List.`),
    []
  )

  t.deepEqual(
    check(`. xref:a.adoc[].`),
    []
  )

  t.deepEqual(
    check(`* Bulleted.
* List.`),
    []
  )

  t.deepEqual(
    check(`- Bulleted.
- List.`),
    []
  )

  t.deepEqual(
    check(`* xref:dashboard/saved_searches.adoc[] - Review, run or edit your saved searches.`),
    []
  )
})

test('List continuation', t => {
  t.deepEqual(check('+'), [])
})

test('Macros', t => {
  t.deepEqual(
    check('image::tools/print-test.png[dashboard]'),
    []
  )

  t.deepEqual(
    check('NOTE: If you would like to change how parameters are being matched, see xref:./controls.adoc[].'),
    []
  )

  t.deepEqual(
    check('Click btn:[`Do I have Java?`].'),
    []
  )
})


test('In-page xref', t => {
  t.deepEqual(check('<<opt-in-example,See example.>>'), [])
  t.deepEqual(check('See <<network>>.'), [])
})

