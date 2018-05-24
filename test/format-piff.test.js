const format = require('../lib/format-piff.js')
const fs = require('fs')
const path = require('path')

test('format-piff', () => {
  const input = fs.readFileSync(path.resolve(__dirname, 'format-piff.input.piff'), 'utf-8')
  const output = format(input)
  const expectedOutput = fs.readFileSync(path.resolve(__dirname, 'format-piff.output.piff'), 'utf-8')
  expect(output).toEqual(expectedOutput)
})