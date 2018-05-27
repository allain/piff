const { parse } = require('./piff-parser')

const formatPHP = require('./lib/format-php')
const toPHP = require('./lib/to-php')
const format = require('./lib/format-piff')

const PropertyLiteralVisitor = require('./lib/visitors/PropertyLiteralVisitor.js')
const ParentCallVisitor = require('./lib/visitors/ParentCallVisitor.js')
const StringConcatVisitor = require('./lib/visitors/StringConcatVisitor.js')
const NeedsVisitor = require('./lib/visitors/NeedsVisitor.js')
const ScopeVisitor = require('./lib/visitors/ScopeVisitor.js')
const FieldRefVisitor = require('./lib/visitors/FieldRefVisitor.js')
const ComposeVisitor = require('./lib/visitors/ComposeVisitor.js')

function transpile (piff) {
  let parseTree = parse(piff)

  let visitors = [
    new ComposeVisitor(),
    new FieldRefVisitor(),
    new PropertyLiteralVisitor(),
    new StringConcatVisitor(),
    new NeedsVisitor(),
    new ScopeVisitor(),
    new ParentCallVisitor()
  ]

  visitors.forEach(v => v.visitTree(parseTree))
  return formatPHP(toPHP(parseTree))
}

module.exports = {
  transpile,
  format
}
