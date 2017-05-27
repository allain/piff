const Visitor = require('../Visitor.js')

// Augments the nodes to track what things they reference. It's used when figuring out if

class NeedsVisitor extends Visitor {
  constructor () {
    super({
      post: {
        // This is a reference
        Identifier: n => {
          n.needs = { [n.name]: false }
        },

        '*': n => {
          // copy all children needs to parent
          n.needs = Object.keys(n).reduce((needs, prop) => {
            let val = n[prop]
            if (Array.isArray(val)) {
              val
                .filter(c => c.type)
                .forEach(val => this.copyAllNeeds(val.needs, needs))
            } else if (val && val.needs) {
              this.copyAllNeeds(val.needs, needs)
            }
            return needs
          }, {})
        },

        AssignmentExpression: n => {
          n.needs = {}
          this.satisfyAllNeeds(n.left.needs, n.needs)
          this.copyAllNeeds(n.right.needs, n.needs)
        },

        FunctionDeclaration: n => {
          let merged = {}
          n.params.forEach(p => this.satisfyAllNeeds(p.needs, merged))
          this.copyAllNeeds(n.body.needs, merged)

          n.needs = {}
          this.copyAllNeeds(n.id.needs, n.needs)
          this.copyUnmetNeeds(merged, n.needs)
        },

        MethodDeclaration: n => {
          let merged = {}
          n.params.forEach(p => this.satisfyAllNeeds(p.needs, merged))
          this.copyAllNeeds(n.body.needs, merged)

          n.needs = {}
          this.copyAllNeeds(n.id.needs, n.needs)
          this.copyUnmetNeeds(merged, n.needs)
        },

        ClassDeclaration: n => {
          n.needs = {}
        },

        PropertyDeclaration: n => {
          n.needs = {}
          this.satisfyAllNeeds(n.id.needs, n.needs)
        },

        FunctionExpression: n => {
          let merged = {}
          n.params.forEach(p => this.satisfyAllNeeds(p.needs, merged))

          this.copyAllNeeds(n.body.needs, merged)

          n.needs = {}
          this.copyUnmetNeeds(merged, n.needs)
        },

        ForEachStatement: n => {
          let merged = {}
          this.satisfyAllNeeds(n.value.needs, merged)
          this.copyAllNeeds(n.body.needs, merged)

          n.needs = {}
          this.copyAllNeeds(merged, n.needs)
        }
      }
    })
  }

  satisfyAllNeeds (src, dst) {
    Object.keys(src).forEach(prop => {
      dst[prop] = true
    })
  }

  copyAllNeeds (src, dst) {
    Object.keys(src).forEach(prop => {
      dst[prop] = dst[prop] || !!src[prop]
    })
  }

  copyUnmetNeeds (src, dst) {
    Object.keys(src).forEach(prop => {
      if (!src[prop]) {
        dst[prop] = false
      }
    })
  }
}

module.exports = NeedsVisitor
