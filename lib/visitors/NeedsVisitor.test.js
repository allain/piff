const { parse } = require('../../piff-parser.js')
const Visitor = require('../Visitor.js')

const NV = require('./NeedsVisitor.js')

const postLogger = new Visitor({
  post: {
    '*': n => {
      console.log(n)
    }
  }
})

test('NeedsVisitor - works for empty code', () => {
  let v = new NV()

  let tree = parse('')

  v.visitTree(tree)

  expect(tree.needs).toEqual({})
})

test('NeedsVisitor - treats function calls to undefined vars as undefined needed', () => {
  let v = new NV()

  let tree = parse('print("Hello")')

  v.visitTree(tree)

  expect(tree.needs).toEqual({})
})

test('NeedsVisitor - assignments are recorded as needs being met', () => {
  let v = new NV()

  let tree = parse('x = 10')

  v.visitTree(tree)

  expect(tree.needs).toEqual({ x: true })
})

test('NeedsVisitor - function arguments satisfy needs', () => {
  let v = new NV()

  let tree = parse('fn test(x) { print (x)}')

  v.visitTree(tree)

  expect(tree.needs).toEqual({})
})

test('NeedsVisitor - function arguments on anonymous function satisfy needs', () => {
  let v = new NV()

  let tree = parse('test = fn(x){ print (x) }')
  v.visitTree(tree)
  expect(tree.needs).toEqual({ test: true })
})
