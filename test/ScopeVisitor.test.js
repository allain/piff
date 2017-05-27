const test = require('tape')
const { parse } = require('../piff-parser.js')
const Visitor = require('../lib/Visitor.js')

const NV = require('../lib/visitors/NeedsVisitor.js')
const SV = require('../lib/visitors/ScopeVisitor.js')

const postLogger = new Visitor({
  post: {
    '*': n => {
      console.log(n)
    }
  }
})

test('ScopeVisitor - works for empty code', t => {
  let nv = new NV()
  let v = new SV()

  let tree = parse('')

  nv.visitTree(tree)
  v.visitTree(tree)

  t.deepEqual(tree.scope, [], 'sets scope to empty on Program')

  t.end()
})

test('ScopeVisitor - works for function', t => {
  let nv = new NV()
  let v = new SV()

  let tree = parse('fn test() { }')

  nv.visitTree(tree)
  v.visitTree(tree)

  t.deepEqual(tree.scope, [], 'defines test in the program scope')

  t.end()
})

test('ScopeVisitor - sets uses property on anonymous functions', t => {
  let nv = new NV()
  let v = new SV()

  let tree = parse(
    `x = 10
     test = fn () {
       z = 20
       y = fn() {
         print(x)
         print(z)
       }
     }
     `
  )

  nv.visitTree(tree)
  v.visitTree(tree)

  new Visitor({
    post: {
      FunctionExpression: n => {
        // console.log(n)
      }
    }
  }).visitTree(tree)

  t.end()
})
