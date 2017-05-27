const Visitor = require('../Visitor.js')

class StringConcatVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        BinaryExpression: markConcat
      },
      post: {
        BinaryExpression: markConcat
      }
    })

    function markConcat (n) {
      if (n.operator === '+') {
        if (n.left.type === 'Literal' && typeof n.left.value === 'string') {
          n.concat = true
        } else if (
          n.right.type === 'Literal' &&
          typeof n.right.value === 'string'
        ) {
          n.concat = true
        } else if (n.left.concat) {
          n.concat = true
        } else if (n.right.concat) {
          n.concat = true
        }
      }
    }
  }
}

module.exports = StringConcatVisitor
