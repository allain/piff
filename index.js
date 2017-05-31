const { parse } = require('./piff-parser.js')

const format = require('./lib/format.js')

const PropertyLiteralVisitor = require('./lib/visitors/PropertyLiteralVisitor.js')
const ParentCallVisitor = require('./lib/visitors/ParentCallVisitor.js')
const StringConcatVisitor = require('./lib/visitors/StringConcatVisitor.js')
const NeedsVisitor = require('./lib/visitors/NeedsVisitor.js')
const ScopeVisitor = require('./lib/visitors/ScopeVisitor.js')
const PHPGeneratorVisitor = require('./lib/visitors/PHPGeneratorVisitor.js')
const FieldRefVisitor = require('./lib/visitors/FieldRefVisitor.js')
const ComposeVisitor = require('./lib/visitors/ComposeVisitor.js')

module.exports = transpile

const push = (arr, item) => {
  arr.push(item)
  return arr
}

const flatten = (arr, result = []) => {
  if (Array.isArray(arr)) {
    arr.map(item => flatten(item, result))
    return result
  } else {
    return push(result, arr)
  }
}

function transpile (piff) {
  let parseTree = parse(piff)

  let visitors = [
    new ComposeVisitor(),
    new FieldRefVisitor(),
    new PropertyLiteralVisitor(),
    new StringConcatVisitor(),
    new NeedsVisitor(),
    new ScopeVisitor(),
    new ParentCallVisitor(),
    new PHPGeneratorVisitor()
  ]

  visitors.forEach(v => v.visitTree(parseTree))

  return format(parseTree.php)
}
