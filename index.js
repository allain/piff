const { parse } = require('./piff-parser')

const transpile = require('./lib/transpile')
const format = require('./lib/format-piff')

module.exports = {
  transpile,
  format
}
