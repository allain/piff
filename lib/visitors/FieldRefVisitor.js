const Visitor = require('../Visitor.js')

/**
 * Handles short hande refs:
 * @prop => $this->prop
 * $f = fn() { @prop } => $that->prop and $that=$this at top of method
 * @@prop => self::$prop
 */
class FieldRefVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        FunctionExpression: n => {
          this.scopes.push(n)
        },

        Identifier: n => {
          let _this = this.scopes.length ? 'that' : 'this'
          if (n.name === '@') {
            n.name = _this
            if (_this === 'that') {
              this.usedThat = true
            }
          } else if (n.name === '@@') {
            n.name = 'self'
          } else if (n.name.indexOf('@@') === 0) {
            // Handles @@prop references/ @@method() is handled in the parser
            Object.assign(n, {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'self'
              },
              property: { type: 'Identifier', name: n.name.substr(2) },
              statik: true,
              computed: false
            })
            if (_this === 'that') {
              this.usedThat = true
            }
            delete n.name
          } else if (n.name.indexOf('@') === 0) {
            Object.assign(n, {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: _this
              },
              property: { type: 'Identifier', name: n.name.substr(1) },
              computed: false
            })
            if (_this === 'that') {
              this.usedThat = true
            }
            delete n.name
          }
        },

        MethodDeclaration: n => {
          this.usedThat = false
        }
      },
      post: {
        FunctionExpression: n => {
          this.scopes.pop()
        },

        MethodDeclaration: n => {
          if (!this.usedThat) return

          // Add $that = $this; to the beginning of the method block
          n.body.body.unshift({
            type: 'AssignmentExpression',
            operator: '=',
            left: {
              type: 'Identifier',
              name: 'that'
            },
            right: {
              type: 'Identifier',
              name: 'this'
            }
          })
        }
      }
    })

    this.scopes = []
    this.usedThat = false
  }
}

module.exports = FieldRefVisitor
