/* eslint no-console: [2, {allow: ["warn"]}] */

const inject = (arr, injection, removeTrailing = true) => {
  let result = arr.reduce((result, item) => {
    result.push(item)
    result.push(injection)
    return result
  }, [])

  if (result.length && removeTrailing) {
    result.pop() // remove last injection
  }

  return result
}

const SUPER_GLOBALS = [
  '_SERVER',
  '_REQUEST',
  '_POST',
  '_GET',
  '_FILES',
  '_ENV',
  '_COOKIE',
  '_SESSION'
]

let generators = {
  Literal: n => {
    return typeof n.value === 'string'
      ? (n.quote || '"') + n.value + (n.quote || '"')
      : JSON.stringify(n.value)
  },

  StringExpression: n => {
    return inject(
      n.parts.map(
        p => (p.type === 'BinaryExpression' ? ['(', php(p), ')'] : php(p))
      ),
      [' ', '.', ' ']
    )
  },

  Variable: n => {
    let name = n.name
    if (name[0] === '$') return name
    if (name === 'parent') return 'parent'

    if (SUPER_GLOBALS.includes(name)) return '$' + name

    if (/^[A-Z_][A-Z0-9_]*$/.test(name)) return name

    return '$' + name
  },

  ContinueStatement: n => {
    return 'continue'
  },

  Identifier: n => {
    return n.name === 'MUTE' ? '@' : n.name
  },

  BlockStatement: n => ['{', inject(n.body.map(php), ';'), ';', '}'],

  Program: n => {
    return inject(
      n.body.map(c => [
        php(c),
        ['ClassDeclaration', 'InterfaceDeclaration'].includes(c.type)
          ? null
          : ';'
      ]),
      ';'
    )
  },

  ClassName: n => {
    return n.name
  },

  ExpressionStatement: n => php(n.expression),

  BinaryExpression: n => {
    return [
      n.parens ? '(' : '',
      php(n.left),
      ' ',
      n.operator === '+' && n.concat ? '.' : n.operator,
      ' ',
      php(n.right),
      n.parens ? ')' : ''
    ]
  },

  AssignmentExpression: n => {
    return [
      n.statik ? ['static', ' '] : null,
      php(n.left),
      n.operator,
      php(n.right)
    ]
  },

  ReturnStatement: n => ['return ', php(n.argument)],

  CallExpression: n => {
    return [
      php(n.callee) === 'parent'
        ? 'parent::' + n.parentMethodName
        : php(n.callee),
      '(',
      inject((n.arguments || []).map(php), ','),
      ')'
    ]
  },

  EmptyStatement: () => {},

  FunctionDeclaration: n => {
    const body = n.body.type == 'BlockStatement'
      ? php(n.body)
      : n.body.type === 'ExpressionStatement'
          ? ['{', 'return', ' ', php(n.body), ';}']
          : n.body.type + '?'

    return [
      'function ',
      php(n.id),
      '(',
      inject(n.params.map(php), ','),
      ')',
      ' ',
      body
    ]
  },

  FunctionExpression: n => {
    return [
      'function',
      '(',
      inject(n.params.map(php), ','),
      ')',
      n.used.length
        ? ['use', '(', inject(n.used.map(v => '$' + v), ','), ')']
        : null,
      n.expression ? ['{', 'return', ' ', php(n.body), ';', '}'] : php(n.body)
    ]
  },

  IfStatement: n => {
    return [
      'if',
      '(',
      php(n.test),
      ')',
      php(n.consequent),
      n.alternate ? ['else', php(n.alternate)] : null
    ]
  },

  ObjectExpression: n => {
    return ['[', inject(n.properties.map(php), ','), ']']
  },

  LogicalExpression: n => {
    return [
      n.params ? '(' : null,
      php(n.left),
      n.operator === '||' ? '?:' : n.operator,
      php(n.right),
      n.params ? ')' : null
    ]
  },

  MultiLineComment: ({comment}) => comment,

  WhileStatement: n => {
    return ['while', '(', php(n.test), ')', php(n.body)]
  },

  DoWhileStatement: n => {
    return ['do', php(n.body), 'while', '(', php(n.test), ')']
  },

  ForStatement: n => {
    return [
      'for',
      '(',
      php(n.init),
      ';',
      php(n.test),
      ';',
      php(n.update),
      ')',
      php(n.body)
    ]
  },

  ForEachStatement: n => {
    return [
      'foreach',
      ' ',
      '(',
      php(n.collection),
      ' ',
      'as',
      ' ',
      n.key ? [php(n.key), ' ', '=>', ' '] : null,
      php(n.value),
      ')',
      php(n.body)
    ]
  },

  UpdateExpression: n =>
    (n.prefix ? [n.operator, php(n.argument)] : [php(n.argument), n.operator]),

  SequenceExpression: n => inject((n.expressions || []).map(php), ','),

  SingleLineComment: ({comment}) => comment,

  TryStatement: n => {
    return [
      'try',
      ' ',
      php(n.block),
      n.handlers.map(handler => php(handler)),
      n.finalizer ? [' ', 'finally', ' ', php(n.finalizer)] : null
    ]
  },

  CatchClause: n => {
    return [
      'catch',
      '(',
      php(n.paramClass),
      ' ',
      php(n.param),
      ')',
      php(n.body)
    ]
  },

  ConditionalExpression: n => {
    return [
      '(',
      php(n.test),
      '?',
      php(n.consequent),
      ':',
      php(n.alternate),
      ')'
    ]
  },

  Property: n => (n.key ? [php(n.key), '=>', php(n.value)] : php(n.value)),

  ClassDeclaration: n => [
    n.abstract ? ['abstract', ' '] : null,
    'class',
    ' ',
    php(n.id),
    n.extends ? [' ', 'extends', ' ', php(n.extends)] : null,
    n.implements ? [' ', 'implements', ' ', php(n.implements)] : '',
    ' ',
    '{',
    php(n.body),
    '}'
  ],

  InterfaceDeclaration: n => [
    'interface',
    ' ',
    php(n.id),
    n.extends ? [' ', 'extends', ' ', php(n.extends)] : null,
    ' ',
    '{',
    php(n.body),
    '}'
  ],

  ClassElements: n =>
    n.elements.map(e => [
      php(e),
      ['ClassConstDeclaration', 'PropertyDeclaration'].includes(e.type)
        ? ';'
        : ''
    ]),

  InterfaceElements: n =>
    n.elements.map(e => [
      php(e),
      ['ClassConstDeclaration'].includes(e.type) ? ';' : ''
    ]),

  MethodDeclaration: n => {
    return [
      n.visibility || 'public',
      n.abstract ? [' ', 'abstract', ' '] : null,
      n.statik ? [' ', 'static', ' '] : null,
      ' ',
      'function',
      ' ',
      php(n.id),
      '(',
      inject(n.params.map(php), ','),
      ')',
      php(n.body),
      n.abstract ? ';' : null
    ]
  },

  InterfaceMethodDeclaration: n => {
    return [
      'public',
      ' ',
      'function',
      ' ',
      php(n.id),
      '(',
      inject(n.params.map(php), ','),
      ')',
      ';'
    ]
  },

  ClassConstDeclaration: n => [
    n.visibility,
    ' ',
    'const ',
    n.name,
    '=',
    php(n.value)
  ],

  PropertyDeclaration: n => [
    n.visibility || 'public',
    ' ',
    n.statik ? 'static ' : '',
    php(n.id),
    n.value ? ['=', php(n.value)] : null
  ],

  NewExpression: n => [
    'new ',
    php(n.callee),
    '(',
    inject(n.arguments.map(php), ','),
    ')'
  ],

  MemberExpression: n => {
    if (n.array) {
      return [php(n.object), '[', php(n.property), ']']
    }

    if (n.statik) {
      if (n.method) {
        return [
          php(n.object),
          '::',
          php(n.property),
          '(',
          inject((n.arguments || []).map(php), ','),
          ')'
        ]
      }

      if (php(n.property).match(/^[A-Z]/)) {
        // Constant
        return [php(n.object), '::', php(n.property)]
      }

      return [php(n.object), '::', '$', php(n.property)]
    }

    return [
      php(n.object),
      n.statik ? '::' : '->',
      php(n.property),
      n.method ? ['(', inject(n.arguments.map(php), ','), ')'] : ''
    ]
  },

  AppendExpression: () => '',

  UnaryExpression: n => [n.operator, php(n.argument)],

  FormalParameter: n => [
    n.kind ? [php(n.kind), ' '] : null,
    php(n.id),
    n.def ? ['=', php(n.def)] : []
  ],

  ThrowStatement: n => {
    return ['throw', ' ', php(n.argument), ';']
  },

  SwitchStatement: n => {
    return [
      'switch',
      ' ',
      '(',
      php(n.discriminant),
      ')',
      '{',
      n.cases.map(php),
      '}'
    ]
  },

  SwitchCase: n => {
    return [
      n.test ? ['case', ' ', php(n.test), ':'] : ['default', ':'],
      n.consequent && n.consequent.length
        ? [inject(n.consequent.map(php), ';'), ';']
        : null
    ]
  },

  BreakStatement: n => {
    return ['break', ';']
  },

  NamespaceDeclaration: n => {
    return ['namespace', ' ', php(n.id), ';']
  },

  NamespaceName: n => {
    return n.name
  },

  UseDeclaration: n => {
    return ['use', ' ', php(n.id)]
  },

  WhiteSpace: n => {
    return []
  }
}

let missing = {}
function php (n) {
  if (!n) return null

  let generator = generators[n.type]
  if (generator) return generator(n)

  if (!missing[n.type]) {
    missing[n.type] = true
    console.warn('Unrecognized node type:', n)
  }

  return JSON.stringify(n)
}

module.exports = php
