/* eslint no-console: [2, {allow: ["warn"]}] */

const Visitor = require('../Visitor.js')

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

let generators = {
  Literal: n => JSON.stringify(n.value),

  Identifier: n => {
    if (n.name === 'that') {
      return '$that'
    } else if (n.name === 'this') {
      return '$this'
    } else if (n.scope.indexOf(n.name) === -1) {
      return n.name
    } else {
      return '$' + n.name
    }
  },

  BlockStatement: n => ['{', inject(n.body.map(s => s.php), ';'), ';', '}'],

  Program: n => {
    return inject(
      n.body.map(c => [c.php, c.type !== 'ClassDeclaration' ? ';' : null]),
      ';'
    )
  },

  ExpressionStatement: n => n.expression.php,

  BinaryExpression: n => {
    return [
      n.parens ? '(' : '',
      n.left.php,
      n.operator === '+' && n.concat ? '.' : n.operator,
      n.right.php,
      n.parens ? ')' : ''
    ]
  },

  AssignmentExpression: n => {
    return [n.left.php, n.operator, n.right.php]
  },

  ReturnStatement: n => ['return ', n.argument.php],

  CallExpression: n => {
    return [
      n.callee.php === 'parent'
        ? 'parent::' + n.parentMethodName
        : n.callee.php,
      '(',
      inject((n.arguments || []).map(a => a.php), ','),
      ')'
    ]
  },

  EmptyStatement: () => {},

  FunctionDeclaration: n => {
    return [
      'function ',
      n.id.php,
      '(',
      inject(n.params.map(p => p.php), ','),
      ')',
      n.body.php
    ]
  },

  FunctionExpression: n => {
    return [
      'function',
      '(',
      inject(n.params.map(p => p.php), ','),
      ')',
      n.used.length
        ? ['use', '(', inject(n.used.map(v => '$' + v), ','), ')']
        : null,
      n.expression ? ['{', 'return', ' ', n.body.php, ';', '}'] : n.body.php
    ]
  },

  IfStatement: n => {
    return [
      'if',
      '(',
      n.test.php,
      ')',
      n.consequent.php,
      n.alternate ? ['else', n.alternate.php] : null
    ]
  },

  ObjectExpression: n => {
    return ['[', inject(n.properties.map(p => p.php), ','), ']']
  },

  LogicalExpression: n => {
    return [
      n.params ? '(' : null,
      n.left.php,
      n.operator === '||' ? '?:' : n.operator,
      n.right.php,
      n.params ? ')' : null
    ]
  },

  WhileStatement: n => {
    return ['while', '(', n.test.php, ')', n.body.php]
  },

  DoWhileStatement: n => {
    return ['do', n.body.php, 'while', '(', n.test.php, ')']
  },

  ForStatement: n => {
    return [
      'for',
      '(',
      n.init.php,
      ';',
      n.test.php,
      ';',
      n.update.php,
      ')',
      n.body.php
    ]
  },

  ForEachStatement: n => {
    return [
      'foreach',
      '(',
      n.collection.php,
      ' as ',
      n.value.php,
      ')',
      n.body.php
    ]
  },

  UpdateExpression: n => [n.argument.php, n.operator],

  SequenceExpression: n => inject((n.expressions || []).map(el => el.php), ','),

  ConditionalExpression: n => {
    return ['(', n.test.php, '?', n.consequent.php, ':', n.alternate.php, ')']
  },

  Property: n => (n.key ? [n.key.php, '=>', n.value.php] : n.value.php),

  ClassDeclaration: n => [
    'class',
    ' ',
    n.id.php,
    n.extends ? [' ', 'extends', ' ', n.extends.php] : null,
    n.implements ? [' ', 'implements', ' ', n.implements.php] : '',
    ' ',
    '{',
    n.body.php,
    '}'
  ],

  ClassElements: n =>
    n.elements.map(e => [
      e.php,
      ['ClassConstDeclaration', 'PropertyDeclaration'].includes(e.type)
        ? ';'
        : ''
    ]),

  MethodDeclaration: n => {
    return [
      n.visibility || 'public',
      n.statik ? [' ', 'static', ' '] : null,
      ' ',
      'function',
      ' ',
      n.id.php,
      '(',
      inject(n.params.map(p => p.php), ','),
      ')',
      n.body.php
    ]
  },

  ClassConstDeclaration: n => ['const ', n.name, '=', n.value.php],

  PropertyDeclaration: n => [
    n.visibility || 'public',
    ' ',
    n.statik ? 'static ' : '',
    n.id.php,
    '=',
    n.value.php
  ],

  NewExpression: n => [
    'new ',
    n.callee.php,
    '(',
    inject(n.arguments.map(p => p.php), ','),
    ')'
  ],

  MemberExpression: n => {
    if (n.array) {
      return [n.object.php, '[', n.property ? n.property.php : '', ']']
    }

    if (n.statik) {
      if (n.method) {
        return [
          n.object.php,
          '::',
          n.property.php,
          '(',
          inject((n.arguments || []).map(a => a.php), ','),
          ')'
        ]
      }

      if (n.property.php.match(/^[A-Z]/)) {
        // Constant
        return [n.object.php, '::', n.property.php]
      }

      return [n.object.php, '::', '$', n.property.php]
    }

    return [
      n.object.php,
      n.statik ? '::' : '->',
      n.property.php,
      n.method ? ['(', inject(n.arguments.map(a => a.php), ','), ')'] : ''
    ]
  },

  AppendExpression: () => '',

  UnaryExpression: n => [n.operator, n.argument.php],

  FormalParameter: n => [n.id.php, n.def ? ['=', n.def.php] : []]
}
let missing = {}

class PHPGeneratorVisitor extends Visitor {
  constructor () {
    super({
      post: {
        '*': n => {
          let generator = generators[n.type]
          if (generator) {
            n.php = generator(n)
          } else {
            if (!missing[n.type]) {
              missing[n.type] = true
              console.warn('Unrecognized node type:', n.type)
            }
            n.php = JSON.stringify(n)
          }
        }
      }
    })
  }
}

module.exports = PHPGeneratorVisitor
