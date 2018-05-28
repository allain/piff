const { parse } = require('../../piff-parser.js')
const Visitor = require('../Visitor.js')

const NV = require('./NeedsVisitor.js')
const SV = require('./ScopeVisitor.js')

const postLogger = new Visitor({
  post: {
    '*': n => {
      console.log(n)
    }
  }
})

test('ScopeVisitor - works for empty code', () => {
  let nv = new NV()
  let v = new SV()

  let tree = parse('')

  nv.visitTree(tree)
  v.visitTree(tree)

  expect(tree.scope).toEqual([])
})

test('ScopeVisitor - works for function', () => {
  let nv = new NV()
  let v = new SV()

  let tree = parse('fn test() { }')

  nv.visitTree(tree)
  v.visitTree(tree)

  expect(tree.scope).toEqual([])
})

test('ScopeVisitor - sets uses property on anonymous functions', done => {
  let nv = new NV()
  let v = new SV()

  let tree = parse(`x = 10; test= fn(){z=20\nprint(x)} `)

  nv.visitTree(tree)
  v.visitTree(tree)

  new Visitor({
    post: {
      FunctionExpression: n => {
        expect(n.used).toEqual(['x'])
        done()
      }
    }
  }).visitTree(tree)
})
