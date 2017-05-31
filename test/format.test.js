const test = require('tape')
const format = require('../lib/format.js')

test('format - semicolons', t => {
  t.equal(format([';', ';', ';']), '')
  t.equal(format(['{', ';', '}']), '{\n}')
  t.equal(format(['{', 'test', '()', ';', '}']), '{\n  test();\n}')
  t.end()
})

test('format - class indents properly', t => {
  t.equal(
    format([
      'class',
      ' ',
      'A',
      ' ',
      '{',
      'test',
      '()',
      ' ',
      '{',
      'test',
      '()',
      ';',
      '}',
      '}'
    ]),
    'class A {\n  test() {\n    test();\n  }\n}'
  )
  t.end()
})
