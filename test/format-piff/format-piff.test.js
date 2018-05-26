const format = require('../../lib/format-piff.js')
const fs = require('fs-extra')
const path = require('path')

describe('format-piff', () => {
  const files = fs.readdirSync(__dirname)

  const inputs = files.filter(f => f.match(/[.]input[.]piff$/))
  inputs.forEach(input =>
    test(input.replace(/[.]input[.]piff$/, ''), () => {
      const inPath = path.resolve(__dirname, input)
      const outPath = inPath.replace(/[.]input[.]/g, '.output.')

      const before = fs.readFileSync(inPath, 'utf-8')
      const after = format(before)

      if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, after, 'utf-8')
      }

      const expectedAfter = fs.readFileSync(
        path.resolve(__dirname, input.replace(/[.]input[.]/g, '.output.')),
        'utf-8'
      )
      expect(after).toEqual(expectedAfter)
    })
  )
})
