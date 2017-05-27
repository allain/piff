class Visitor {
  constructor (config) {
    let { pre, post } = config
    pre = pre || {}
    post = post || {}

    this.pre = (n, ctx) => {
      let handler = pre[n.type] || pre['*']
      if (handler) return handler(n, ctx)
    }

    this.post = (n, ctx) => {
      let handler = post[n.type] || post['*']
      if (handler) return handler(n, ctx)
    }

    this.visitTree = this.visitTree.bind(this)
  }

  visitTree (node, ctx) {
    if (!node || !node.type) return

    let visitChildren = this.pre(node, ctx) !== false

    if (visitChildren) {
      Object.keys(node).forEach(prop => {
        let val = node[prop]
        if (Array.isArray(val)) {
          val.forEach(n => this.visitTree(n, ctx))
        } else if (typeof val === 'object') {
          this.visitTree(val, ctx)
        }
      })
    }
    this.post(node, ctx)
  }

  pre () {}
  post () {}
}

module.exports = Visitor
