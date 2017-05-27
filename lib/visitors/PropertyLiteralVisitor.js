const Visitor = require('../Visitor.js')

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
