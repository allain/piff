const Lazy = require('lazy.js')

const { parse } = require('../piff-parser.js')

const FormatVisitor = require('./visitors/FormatVisitor.js')

module.exports = format

function indent (code) {
  return (
    code
      .replace(/[\r\n]+$/, '')
      .split(/[\r\n]+/g)
      .map(l => '  ' + l)
      .join('\n') + '\n'
  )
}

function format (piffCode) {
  const parseTree = parse(piffCode)

  const formatters = {
    Program: ({ body }) => body.map(f).join('\n'),
    ExpressionStatement: ({ expression }) => f(expression) + '\n',
    AssignmentExpression: ({ left, operator, right }) =>
      f(left) + ' ' + operator + ' ' + f(right),
    CallExpression: n =>
      f(n.callee) + '(' + n.arguments.map(f).join(', ') + ')',
    Literal: ({ value }) => JSON.stringify(value),
    Variable: ({ name }) => name,
    Identifier: ({ name }) => name,
    FunctionDeclaration: ({ params, body, id }) =>
      'fn ' +
      f(id) +
      '(' +
      params.map(f).join(', ') +
      ') {\n' +
      indent(f(body)) +
      '}\n',
    FunctionExpression: ({ params, body }) =>
      'fn (' + params.map(f).join(', ') + ') {\n' + indent(f(body)) + '}',
    FormalParameter: ({id}) => f(id),
    BlockStatement: ({ body }) => {
      return body.map(f).join('\n')
    },
    BinaryExpression: ({ parens, left, operator, right }) =>
      (parens ? '(' : '') +
      f(left) +
      ' ' +
      operator +
      ' ' +
      f(right) +
      (parens ? ')' : ''),
    MemberExpression: n => {
      // console.log(n)
      const {
        object,
        property,
        method,
        compose,
        /* arguments, / */ computed,
        statik,
        array
      } = n

      return f(object) + (array ? '[' : '') + f(property) + (array?']':'')
    }
  }

  function f (n) {
    if (!n) return ''
    if (formatters[n.type]) return formatters[n.type](n)

    console.error('unformatted node: ', n)
  }

  return f(parseTree)
}
