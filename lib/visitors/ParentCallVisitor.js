const Visitor = require('../Visitor.js')

/**
 * changes calls to parent(a, b, c) into the correct parent::methodName(a, b, c)
 *
 * Special consideration is given to constructor
 *
 */
class ParentCallVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        MethodDeclaration: n => {
          this.methodName = n.id.name
        },

        ClassDeclaration: n => {
          this.className = n.id.name
        },

        CallExpression: n => {
          if (n.callee.name === 'parent') {
            n.parentMethodName = this.methodName === this.className
              ? '__construct'
              : this.methodName
          }
        }
      },
      post: {
        MethodDeclaration: () => {
          this.methodName = null
        },

        ClassDeclaration: () => {
          this.className = null
        }
      }
    })

    this.className = null
    this.methodName = null
  }
}

module.exports = ParentCallVisitor
