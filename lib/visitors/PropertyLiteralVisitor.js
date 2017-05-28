const Visitor = require('../Visitor.js')

/**
 * changes array key literals to support strings instead of identifies
 * [a: 1, 'b': 2] => ['a': 1, 'b': 2]
 */
class PropertyLiteralVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        Property: n => {
          if (n.key && n.key.type === 'Identifier') {
            n.key = {
              type: 'Literal',
              value: n.key.name
            }
          }
        }
      }
    })
  }
}

module.exports = PropertyLiteralVisitor
