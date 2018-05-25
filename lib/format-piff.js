const Lazy = require('lazy.js')

const { parse } = require('../piff-parser.js')

const FormatVisitor = require('./visitors/FormatVisitor.js')

module.exports = format

function indent (code) {
  return (
    code
      .replace(/[\r\n]+$/, '') // split last whitespace off
      .split(/\n/g)
      .map(l => l ? '  ' + l : '')
      .join('\n') + '\n'
  )
}

function format (piffCode) {
  const parseTree = parse(piffCode)
  const formatters = {
    Program: ({ body }) => {
      return body.map(f).join('\n').replace(/\n\n+/g, '\n\n').trim() + '\n'
    },
    ExpressionStatement: ({ expression }) => f(expression).trim() ,
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
    FormalParameter: ({ id }) => f(id),
    BlockStatement: ({ body }) =>
      body
        .map(s => {
          if (s.type === 'WhiteSpace') {
            return f(s) ? '' : null
          }
          return f(s).trim()
        })
        .filter(x => x !== null)
        .join('\n'),
    BinaryExpression: ({ parens, left, operator, right }) =>
      (parens ? '(' : '') +
      f(left) +
      ' ' +
      operator +
      ' ' +
      f(right) +
      (parens ? ')' : ''),
    MemberExpression: n => {
      const {
        object,
        property,
        method,
        compose,
        /* arguments, / */ computed,
        statik,
        array
      } = n

      return f(object) + (array ? '[' : '') + f(property) + (array ? ']' : '')
    },
    WhiteSpace: ({ value }) => {
      if (value.match(/^\/\//)) {
        // a comment
        return value.replace(/\s+$/, '')
      }

      const newLines = value.replace(/[^\n]/g, '')
      if (newLines.length > 1) return "\n"
      return null
    }
  }

  function f (n) {
    if (!n) return ''
    if (formatters[n.type]) {
      return formatters[n.type](n)
    }

    console.error('unformatted node: ', n)
  }

  return f(parseTree)
}
