const Lazy = require('lazy.js')

const { parse } = require('../piff-parser.js')

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
      BlockStatement: ({ body }) => {
        const clippedBody = [].concat(body)

        while (clippedBody.length && clippedBody[0].type === 'EmptyStatement') {
          clippedBody.shift()
        }

        while (
          clippedBody.length &&
          clippedBody[clippedBody.length - 1].type === 'EmptyStatement'
        ) {
          clippedBody.pop()
        }

        return clippedBody.map(s => f(s)).filter(x => x !== null).join('\n')
      },
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
      CatchClause: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      ClassConstDeclaration: ({ name, value }) => `${name} = ${f(value)}`,
      ClassDeclaration: n => {
        const fBody = f(n.body)
        return (
          `class ${f(n.id)} ${n.extends ? `extends ${f(n.extends)} ` : ''}{${fBody ? indent(fBody) : ''}}` +
          ''
        ) // JSON.stringify(n)
      },
      ClassElements: ({ elements }) =>
        (elements.length ? '\n' + elements.map(f).join('\n') + '\n' : ''),
      ClassName: ({ name }) => name,
      ConditionalExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      ContinueStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      DoWhileStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
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
      ForEachStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      FormalParameter: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      ForStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      FunctionExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      Identifier: ({ name }) => name,
      IfStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      InterfaceDeclaration: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      InterfaceElements: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      InterfaceMethodDeclaration: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      LabeledStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      Literal: ({ value }) => JSON.stringify(value),
      LogicalExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
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
      MethodDeclaration: ({ abstract, visibility, id, params, body }) =>
        [
          `${abstract ? 'abstract ' : ''}`,
          `${visibility !== 'public' ? '${visibility} ' : ''}`,
          f(id),
          '(' + params.map(f).join(', ') + ') ',
          '{\n' + indent(f(body)) + '}'
        ].join(''),
      MultiLineComment: ({ comment }) => comment,
      NamespaceDeclaration: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      NamespaceName: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      NewExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      ObjectExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      Program: ({ body }) => {
        return body.map(f).join('\n').replace(/\n\n+/g, '\n\n').trim() + '\n'
      },
      PropertyDeclaration: ({ id, value, visibility, statik }) =>
        (visibility && visibility !== 'public' ? `${visibility} ` : '') +
        f(id) +
        (value ? ` = ${f(value)}` : ''),
      Property: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      ReturnStatement: ({ argument }) =>
        `return${argument ? ` ${f(argument)}` : ''}`,
      SingleLineComment: ({ comment }) => comment,
      StringExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      SwitchCase: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      SwitchStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      ThrowStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      TryStatement: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      UpdateExpression: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
      UseDeclaration: n => {
        throw new Error('TODO: ' + JSON.stringify(n, null, 2))
      },
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
