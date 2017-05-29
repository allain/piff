const { parse } = require('./piff-parser.js')

const Visitor = require('./lib/Visitor.js')

const PropertyLiteralVisitor = require('./lib/visitors/PropertyLiteralVisitor.js')
const ParentCallVisitor = require('./lib/visitors/ParentCallVisitor.js')
const StringConcatVisitor = require('./lib/visitors/StringConcatVisitor.js')
const NeedsVisitor = require('./lib/visitors/NeedsVisitor.js')
const ScopeVisitor = require('./lib/visitors/ScopeVisitor.js')
const PHPGeneratorVisitor = require('./lib/visitors/PHPGeneratorVisitor.js')
const FieldRefVisitor = require('./lib/visitors/FieldRefVisitor.js')

module.exports = transpile

function transpile (piff) {
  let parseTree
  try {
    parseTree = parse(piff)
  } catch (e) {
    console.log(e)
    return null
  }

  let visitors = [
    new FieldRefVisitor(),
    new PropertyLiteralVisitor(),
    new StringConcatVisitor(),
    new NeedsVisitor(),
    new ScopeVisitor(),
    new ParentCallVisitor(),
    new PHPGeneratorVisitor(),
    new Visitor({
      pre: {
        '*': n => {
          // console.log(n)
        }
      }
    })
  ]

  visitors.forEach(v => v.visitTree(parseTree))

  let php = parseTree.php
  // .replace(/;;+/g, ';')
  // .replace(/;\n;\n/, ';\n')
  // .replace(/;\)/g, ')')
  // .replace(/;,/g, ',')
  // .replace(/;]/g, ']')
  // .replace(/; ./g, '.')
  // .replace(/;->/g, '->')
  // .replace(/;::/g, '::')
  // .replace(/\}(\s)?(\n\s*)\}/, '}$2}') // remove line after last method declaration and end of class spec`

  // return autoIndent(php).replace(/\n\n\n+/g, '\n\n').replace(/\{\s+\}/g, '{}')
  return php
}

function addIndent (line, indents) {
  return line.trim() ? Array(indents + 1).join('  ') + line.trim() : ''
}

function autoIndent (php) {
  let indent = 0
  return php
    .split('\n')
    .map(l => {
      if (l.match(/^\s*}.*{\s*$/)) {
        return addIndent(l, indent - 1)
      } else if (l.match(/{\s*$/)) {
        return addIndent(l, indent++)
      } else if (l.match(/}(\s*;)?\s*$/)) {
        return addIndent(l, --indent)
      } else if (l.match(/^\s*}/)) {
        return addIndent(l, --indent)
      } else {
        return addIndent(l, indent)
      }
    })
    .join('\n')
}
