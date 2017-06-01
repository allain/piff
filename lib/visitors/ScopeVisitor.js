const Visitor = require('../Visitor.js')

// Augments the nodes to track what things they reference. It's used when figuring out if

const unique = arr => [...new Set(arr)]

class ScopeVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        '*': n => {
          n.scope = this.push(n.needs)
        },

        FunctionExpression: n => {
          let newScope = {}
          let params = []
          n.params.map(p => {
            newScope[Object.keys(p.needs)] = true
            params.push(Object.keys(p.needs))
          })

          n.scope = this.push(Object.assign(newScope, n.needs))

          n.used = Object.keys(n.needs).filter(need => {
            return (
              n.scope.indexOf(need) !== -1 ||
              params.indexOf(need) !== -1 ||
              need === 'that'
            )
          })
        },

        FunctionDeclaration: n => {
          let newScope = {}

          n.params.map(p => {
            newScope[Object.keys(p.needs)] = true
          })

          n.scope = this.push(Object.assign(newScope, n.needs))
        },

        MethodDeclaration: n => {
          let newScope = {}
          n.params.map(p => {
            newScope[Object.keys(p.needs)] = true
          })

          n.scope = this.push(Object.assign(newScope, n.needs))
        }
      },

      post: {
        '*': () => this.pop()
      }
    })

    this.scopes = [[]]
  }

  get scope () {
    return this.scopes[this.scopes.length - 1]
  }

  push (needs) {
    let newScope = unique(
      this.scope.concat(Object.keys(needs || {}).filter(n => needs[n]))
    )

    this.scopes.push(newScope)
    return newScope
  }

  pop () {
    return this.scopes.pop()
  }
}

module.exports = ScopeVisitor
