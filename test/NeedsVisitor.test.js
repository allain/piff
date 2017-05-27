const test = require('tape')
const { parse } = require('../piff-parser.js')
const Visitor = require('../lib/Visitor.js')

const NV = require('../lib/visitors/NeedsVisitor.js')

const postLogger = new Visitor({
  post: {
    '*': n => {
      console.log(n)
    }
  }
})

test('NeedsVisitor - works for empty code', t => {
  let v = new NV()

  let tree = parse('')

  v.visitTree(tree)

  t.deepEqual(tree.needs, [], 'sets needs on Program')

  t.end()
})

test('NeedsVisitor - treats function calls to undefined vars as undefined needed', t => {
  let v = new NV()

  let tree = parse('print("Hello")')

  v.visitTree(tree)

  t.deepEqual(
    tree.needs,
    { print: false },
    'sets need for global function call'
  )

  t.end()
})

test('NeedsVisitor - assignments are recorded as needs being met', t => {
  let v = new NV()

  let tree = parse('x = 10')

  v.visitTree(tree)

  t.deepEqual(tree.needs, { x: true }, 'sets need x to be met')

  t.end()
})

test('NeedsVisitor - function arguments satisfy needs', t => {
  let v = new NV()

  let tree = parse('fn test(x) { print (x)}')

  v.visitTree(tree)

  t.deepEqual(tree.needs, { test: false, print: false }, 'x is not needed')

  t.end()
})

test('NeedsVisitor - function arguments on anonymous function satisfy needs', t => {
  let v = new NV()

  let tree = parse('test = fn (x) { print (x)}')

  v.visitTree(tree)

  t.deepEqual(tree.needs, { test: true, print: false }, 'x is not needed')

  t.end()
})
