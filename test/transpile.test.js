const test = require('tape')

const transpile = require('..')
const glob = require('glob')
const fs = require('fs')
const path = require('path')

let files = glob.sync(__dirname + '/samples/**.piff')

files.forEach(filePath => {
  test('piff transpilation - ' + path.basename(filePath), t => {
    let piffCode = fs.readFileSync(filePath, 'utf-8')
    let expectedPiffCode = fs
      .readFileSync(filePath.replace(/[.]piff$/, '.piff.php'), 'utf-8')
      .replace(/\n\/\/ piff: .*\n/g, '\n')
    let phpCode = '<?php\n' + transpile(piffCode) + '\n?>\n'
    t.equal(phpCode, expectedPiffCode)
    t.end()
  })
})
