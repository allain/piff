const Visitor = require('../lib/Visitor')

const indent = n => n ? Array(n + 1).join('  ') : ''

module.exports = tree => {
  const output = []
  let currentIndent = 0
  const visitor = new Visitor({
    pre: {
      '*': n => {
        output.push(indent(currentIndent++) + n.type)
      }
    },
    post: {
      '*': n => {
        currentIndent --
      }
    }
  })
  visitor.visitTree(tree)
  return output
}
