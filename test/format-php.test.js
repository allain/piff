const format = require('../lib/format-php.js')

test('format - semicolons', () => {
  expect(format([';', ';', ';'])).toBe('')
  expect(format(['{', ';', '}'])).toBe('{\n}')
  expect(format(['{', 'test', '()', ';', '}'])).toBe('{\n  test();\n}')
})

/*test('format - class indents properly', t => {
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
*/
