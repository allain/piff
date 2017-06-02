const Visitor = require('../Visitor.js')

const { SyntaxError } = require('../../piff-parser.js')

/**
 * changes all compose structures into function calls
 *
 * a => b(_) becomes b(a)
 * a => b(_) => c(_) becomes c(b(a))
 *
 * a => b throws SyntaxError
 * a() => b(_, _) throws SyntaxError
 */
class ComposeVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        MemberExpression: n => {
          if (n.compose) {
            this.compositions.push(n)
          }
        }
      },

      post: {
        MemberExpression: n => {
          if (n.compose) {
            let composition = this.compositions.pop()
            if (!composition.consumed) {
              throw new SyntaxError('pipe passed but not consumed')
            }

            replaceNode(n, n.property)
          }
        },

        Variable: n => {
          if (n.name === '_') {
            let composition = this.compositions[this.compositions.length - 1]
            if (composition.consumed) {
              throw new SyntaxError('pipe already consumed')
            }

            composition.consumed = true
            // replace this with the last composition
            replaceNode(n, composition.object)
          }
        }
      }
    })

    this.compositions = []
  }
}

function replaceNode (n, replacement) {
  Object.keys(n).forEach(key => {
    delete n[key]
  })

  Object.keys(replacement).forEach(key => {
    n[key] = replacement[key]
  })
  return n
}

module.exports = ComposeVisitor
