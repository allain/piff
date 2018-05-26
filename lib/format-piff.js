const Lazy = require('lazy.js')

const { parse } = require('../piff-parser.js')

const FormatVisitor = require('./visitors/FormatVisitor.js')

module.exports = format

function indent (code) {
  return (
    code
      .replace(/[\r\n]+$/, '') // split last whitespace off
      .split(/\n/g)
      .map(l => (l ? '  ' + l : ''))
      .join('\n') + '\n'
  )
}

function format (piffCode) {
  try {
    const parseTree = parse(piffCode)
    const formatters = {
      AssignmentExpression: ({ left, operator, right }) =>
        f(left) + ' ' + operator + ' ' + f(right),
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
      CallExpression: n =>
        f(n.callee) + '(' + n.arguments.map(f).join(', ') + ')',
      CatchClause: () => null,
      ClassConstDeclaration: () => null,
      ClassDeclaration: () => null,
      ClassElements: () => null,
      ClassName: () => null,
      ConditionalExpression: () => null,
      ContinueStatement: () => null,
      DoWhileStatement: () => null,
      EmptyStatement: () => '',
      ExpressionStatement: ({ expression }) => f(expression).trim(),
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
      ForEachStatement: () => null,
      FormalParameter: () => null,
      ForStatement: () => null,
      FunctionExpression: () => null,
      Identifier: ({ name }) => name,
      IfStatement: () => null,
      InterfaceDeclaration: () => null,
      InterfaceElements: () => null,
      InterfaceMethodDeclaration: () => null,
      LabeledStatement: () => null,
      Literal: ({ value }) => JSON.stringify(value),
      LogicalExpression: () => null,
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
      MethodDeclaration: () => null,
      MultiLineComment: () => null,
      NamespaceDeclaration: () => null,
      NamespaceName: () => null,
      NewExpression: () => null,
      ObjectExpression: () => null,
      Program: ({ body }) => {
        return body.map(f).join('\n').replace(/\n\n+/g, '\n\n').trim() + '\n'
      },
      PropertyDeclaration: () => null,
      Property: () => null,
      ReturnStatement: () => null,
      SequenceExpression: () => null,
      SingleLineComment: ({ comment }) => comment,
      StringExpression: () => null,
      SwitchCase: () => null,
      SwitchStatement: () => null,
      ThrowStatement: () => null,
      TryStatement: () => null,
      UpdateExpression: () => null,
      UseDeclaration: () => null,
      Variable: ({ name }) => name,
      WhileStatement: () => null
    }

    function f (n) {
      if (!n) return ''
      if (formatters[n.type]) {
        return formatters[n.type](n)
      }

      console.error('unformatted node: ', n)
    }

    return f(parseTree)
  } catch (err) {
    console.log(err)
    return piffCode
  }
}
