const Visitor = require('../Visitor.js')

/**
 * changes all compose structures into function calls
 *
 * a => b(_) becomes b(a)
 * a => b(_) => c(_) becomes c(b(a))
 * a() => b(_, _) becaomse b(a(),a())
 */
class ComposeVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        MemberExpression: n => {
          this.compositions.push(n)
        }
      },

      post: {
        MemberExpression: n => {
          if (n.compose) {
            this.compositions.pop()

            replaceNode(n, n.property)
          }
        },

        Identifier: n => {
          if (n.name === '_') {
            let composition = this.compositions[this.compositions.length - 1]
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
