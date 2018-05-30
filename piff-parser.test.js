const fs = require('fs-extra')
const path = require('path')
const Visitor = require('./lib/Visitor')
const parser = require('./piff-parser.js')

const typeTree = require('./lib/tree-type-helper')

describe('parser', () => {
  it.skip('recognizes EmptyStatements', () =>
    expect(typeTree(parser.parse('\n\n'))).toEqual([
      'Program',
      '  EmptyStatement',
      '  EmptyStatement'
    ])
  )

  it('recognizes EmptyStatements between classes', () =>
    expect(typeTree(parser.parse('class A{}\n\nclass B{}'))).toEqual([
      'Program',
      '  ClassDeclaration',
      '    ClassName',
      '    ClassElements',
      '  EmptyStatement',
      '  ClassDeclaration',
      '    ClassName',
      '    ClassElements'
    ]))

  it.skip('handles real world', () => {
    const parsed = parser.parse(
      fs.readFileSync(
        path.join(__dirname, 'fixtures', '01-realworld.piff'),
        'utf-8'
      )
    )
    expect(typeTree(parsed)).toEqual([])
  })
})
