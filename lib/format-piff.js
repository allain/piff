const Lazy = require('lazy.js')
const Visitor = require('../lib/Visitor')
const { parse } = require('../piff-parser.js')

module.exports = format

function indent(n) {
  return Array(n + 1).join('  ')
}

const includesNewLine = arr => Lazy(arr).flatten().indexOf('\n') !== -1
const width = arr =>
  Lazy(arr)
    .flatten()
    .join('')
    .split('\n')
    .reduce((width, line) => Math.max(width, line.length), 0)

const needsMultiline = arr => includesNewLine(arr) || width(arr) > 60

const namesVisitor = tree => {
  const output = []
  const visitor = new Visitor({
    pre: {
      '*': n => {
        output.push('in: ' + n.type)
      }
    },
    post: {
      '*': n => {
        output.push('out: ' + n.type)
      }
    }
  })
  visitor.visitTree(tree)
  return output.join('\n')
}

function mapWithPrev(f, prev = Array(1)) {
  return t => {
    let mapping = f(t, prev)
    if (mapping) {
      prev.unshift(t)
      prev.pop()
    }
    return mapping
  }
}

function format(piffCode) {
  let currentIndent = 0
  try {
    const parseTree = parse(piffCode)
    // console.log('parsed', parseTree)

    const formatters = {
      AssignmentExpression: ({ left, operator, right }) => [
        f(left),
        ' ',
        operator,
        ' ',
        f(right)
      ],
      BlockStatement: ({ body }) =>
        body.map(s => f(s)).filter(x => x !== null).map(s => [s, '\n']),
      BinaryExpression: ({ parens, left, operator, right }) => [
        parens ? '(' : '',
        f(left),
        ' ',
        operator,
        ' ',
        f(right),
        parens ? ')' : ''
      ],
      BreakStatement: ({ levels }) =>
        (levels ? ['break', ' ', levels] : 'break'),
      CallExpression: n => {
        return [f(n.callee), '(', commaList(n.arguments), ')']
      },
      CatchClause: ({ param, paramClass, body }) => [
        'catch',
        ' ',
        '(',
        paramClass ? [f(paramClass), ' '] : '',
        f(param),
        ')',
        ' ',
        '{',
        f(body),
        '}'
      ],
      ClassConstDeclaration: ({ name, value }) => [
        name,
        ' ',
        '=',
        ' ',
        f(value)
      ],
      ClassDeclaration: n => [
        '\n',
        'class',
        ' ',
        f(n.id),
        ' ',
        n.extends ? ['extends', ' ', f(n.extends), ' '] : '',
        '{',
        f(n.body),
        '}',
        '\n'
      ],
      ClassElements: ({ elements }) => elements.map(e => [f(e), '\n']),
      ClassName: ({ name }) => name,
      ConditionalExpression: ({ test, consequent, alternate }) => [
        f(test),
        ' ',
        '?',
        ' ',
        f(consequent),
        ' ',
        ':',
        ' ',
        f(alternate)
      ],
      ContinueStatement: ({ levels }) =>
        (levels ? ['continue', ' ', levels] : 'continue'),
      DoWhileStatement: ({ test, body }) => [
        'do',
        ' ',
        '{',
        f(body),
        '}',
        ' ',
        'while',
        ' ',
        '(',
        f(test),
        ')'
      ],
      EmptyStatement: () => '\n',
      ExpressionStatement: ({ expression }) => f(expression),
      FunctionDeclaration: ({ params, body, id }) => [
        '\n',
        'fn',
        ' ',
        f(id),
        '(',
        commaList(params),
        ')',
        ' ',
        '{',
        f(body),
        '}'
      ],
      FormalParameter: ({ id }) => f(id),
      ForEachStatement: ({ collection, key, value, body }) => [
        'foreach',
        ' ',
        '(',
        f(collection),
        ' ',
        'as',
        ' ',
        key ? [f(key), ' ', '=>', ' '] : null,
        f(value),
        ')',
        ' ',
        '{',
        f(body),
        '}'
      ],
      FormalParameter: ({ id }) => f(id),
      ForStatement: ({ init, test, update, body }) => [
        'for',
        ' ',
        '(',
        f(init),
        ';',
        ' ',
        f(test),
        ';',
        ' ',
        f(update),
        ')',
        ' ',
        '{',
        f(body),
        '}'
      ],
      FunctionExpression: ({ params, body }) => [
        'fn',
        ' ',
        '(',
        commaList(params),
        ')',
        ' ',
        body.type === 'BlockStatement' || body.type === 'BlockExpression'
          ? ['{', f(body), '}']
          : body.type === 'ExpressionStatement' ? f(body) : body.type + '?'
      ],
      Identifier: ({ name }) => name,
      IfStatement: ({ test, consequent, alternate }) => [
        'if',
        ' ',
        '(',
        f(test),
        ')',
        ' ',
        consequent.type === 'BlockStatement' ||
          consequent.type === 'BlockExpression'
          ? ['{', f(consequent), '}']
          : consequent.type === 'ExpressionStatement'
            ? f(consequent)
            : consequent.type + '?',

        alternate
          ? [
            ' ',
            'else',
            ' ',
            alternate.type !== 'IfStatement'
              ? ['{', f(alternate), '}']
              : f(alternate)
          ]
          : null
      ],
      InterfaceDeclaration: n => [
        'interface',
        ' ',
        f(n.id),
        ' ',
        n.extends ? ['extends', ' ', f(n.extends)] : null,
        '{',
        f(n.body),
        '}'
      ],
      InterfaceElements: ({ elements }) => elements.map(e => [f(e), '\n']),
      InterfaceMethodDeclaration: ({ id, params }) => [
        f(id),
        '(',
        commaList(params),
        ')'
      ],
      Literal: ({ value }) =>
        (typeof value === 'string' ? '"' + value + '"' : '' + value),
      LogicalExpression: ({ left, operator, right }) => [
        f(left),
        ' ',
        operator,
        ' ',
        f(right)
      ],
      MemberExpression: n => {
        const {
          object,
          property,
          method,
          compose,
          // arguments,
          computed,
          statik,
          array
        } = n
        return [
          f(object),
          array ? '[' : '.',
          f(property),
          array ? ']' : '',
          n.arguments ? ['(', commaList(n.arguments), ')'] : ''
        ]
      },
      MethodDeclaration: ({ abstract, visibility, id, params, body }) => [
        '\n',
        [abstract ? ['abstract', ' '] : ''],
        [visibility !== 'public' ? [visibility, ' '] : ''],
        f(id),
        '(',
        commaList(params),
        ')',
        ' ',
        '{',
        f(body),
        '}'
      ],
      MultiLineComment: ({ comment }) => comment,
      NamespaceDeclaration: ({ id }) => ['namespace', ' ', f(id)],
      NamespaceName: ({ name }) => name,
      NewExpression: n => [
        'new',
        ' ',
        f(n.callee),
        '(',
        n.arguments.map(a => [f(a), ',', ' ']),
        ')'
      ],
      ObjectExpression: ({ properties }) => ['[', commaList(properties), ']'],
      Program: ({ body }) => body.map(p => [f(p), '\n']),
      PropertyDeclaration: ({ id, value, visibility, statik }) => [
        visibility && visibility !== 'public' ? [visibility, ' '] : '',
        f(id),
        value ? [' ', '=', ' ', f(value)] : ''
      ],
      Property: ({ key, value }) => {
        if (!key) return f(value)
        const fKey = f(key)
        return [
          (fKey.match(/^"[a-z0-9_]+"$/) ? JSON.parse(fKey) : fKey) + ':',
          ' ',
          f(value)
        ]
      },
      ReturnStatement: ({ argument }) => [
        'return',
        argument ? [' ', f(argument)] : ''
      ],
      SingleLineComment: ({ comment }) => comment,
      StringExpression: ({ parts }) =>
        [
          '"',
          Lazy(parts)
            .map(p => (p.type === 'Literal' ? p.value : ['{', f(p), '}']))
            .flatten()
            .toArray()
            .join(''),
          '"'
        ].join(''),
      SwitchCase: ({ test, consequent }) => [
        test ? ['case', ' ', f(test)] : 'default',
        ':',
        consequent.length
          ? [' ', '{', consequent.map(c => [f(c), '\n']), '}', '\n']
          : '\n'
      ],
      SwitchStatement: ({ discriminant, cases }) => [
        'switch',
        ' ',
        '(',
        f(discriminant),
        ')',
        ' ',
        '{',
        cases.map(f),
        '}'
      ],
      ThrowStatement: ({ argument }) => ['throw', ' ', f(argument)],
      TryStatement: ({ block, handlers, finalizer }) => [
        'try',
        ' ',
        '{',
        f(block),
        '}',
        handlers.map(f),
        finalizer ? [' ', 'finally', ' ', '{', f(finalizer), '}'] : ''
      ],
      UnaryExpression: ({ prefix, argument, operator }) => [
        prefix ? operator : null,
        f(argument),
        prefix ? null : operator
      ],
      UpdateExpression: ({ prefix, operator, argument }) => [
        prefix ? operator : null,
        f(argument),
        prefix ? null : operator
      ],
      UseDeclaration: ({ id }) => ['use', ' ', f(id)],
      Variable: ({ name }) => name,
      WhileStatement: ({ test, body }) => [
        'while',
        ' ',
        '(',
        f(test),
        ')',
        ' ',
        '{',
        f(body),
        '}'
      ]
    }

    function f(n) {
      if (!n) return ''
      if (formatters[n.type]) {
        return formatters[n.type](n)
      }

      console.error('unformatted node: ', n)
    }

    function commaList(arr) {
      let fList = arr.map(item => [f(item), ',', ' '])
      return needsMultiline(fList)
        ? ['\n', fList.map(item => [item[0], ',', '\n'])]
        : fList
    }

    function removeRemovableTokens() {
      return mapWithPrev((t, prev) => {
        if (t === ';' && [';', '{'].includes(prev[0])) return false
        if (t === ' ' && prev[0] === ' ') return false

        return t
      })
    }

    const formatted = f(parseTree)
    return (
      Lazy(formatted)
        .flatten()
        .compact()
        .filter(removeRemovableTokens())
        // Insert white space breaks where they must be
        .map(
          mapWithPrev((t, prev) => {
            switch (t) {
              case '{':
                return [prev[0] === ')' ? ' ' : null, '{', '\n']
              case '}':
                return ['\n', '}']
              case 'catch':
                return [prev[0] === '}' ? ' ' : '\n', t, ' ']
              case 'fn':
              case 'if':
              case ',':
                return [t, ' ']
              default:
                return t
            }
          })
        )
        .flatten()
        .compact()
        .filter(removeRemovableTokens())
        .map(
          mapWithPrev((t, prev) => {
            if (t === '}') {
              return [indent(--currentIndent), t]
            } else if (t === '{') {
              currentIndent++
              return t
            } else if (t === '\n' && (prev[0] === '[' || prev[0] === '(')) {
              ++currentIndent
              return t
            } else if ((t === ']' || t === ')') && prev[0] === '\n') {
              return [indent(--currentIndent), t]
            } else if (prev[0] === '\n') {
              return [indent(currentIndent), t]
            } else {
              return t
            }
          })
        )
        .flatten()
        .toArray()
        .join('')
        .replace(/(;|\s)+$/g, '')
        .trim()
        .replace(/\n\s+\n/g, '\n\n')
        .replace(/\n\n\}/g, '\n}')
        .replace(/,[ ]*\)/g, ')') // trailing commas
        .replace(/,[ ]*\]/g, ']') // trailing commas
        .replace(/\n\n+([ \t]*\})/g, '\n$1')
        .replace(/\{\s+\}/g, '{}')
        .replace(/,[ \t]+\n/g, ',\n')
        .replace(/,\n([ \t]*)(\]|\))/g, '\n$1$2')
        .replace(/{\n\s*\n/g, '{\n') + '\n'
    )
  } catch (err) {
    console.log(err)
    return piffCode
  }
}
