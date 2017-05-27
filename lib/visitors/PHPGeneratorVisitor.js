const Visitor = require('../Visitor.js')

let generators = {
  Literal: n => JSON.stringify(n.value),

  Identifier: n => {
    if (n.name === '@') {
      return '$this'
    } else if (n.name === '@@') {
      return 'self' // why not
    } else if (n.name[0] === '@') {
      return '$this->' + n.name.substr(1)
    } else if (n.scope.indexOf(n.name) === -1) {
      return n.name
    } else {
      return '$' + n.name
    }
  },

  BlockStatement: n => '{\n' + n.body.map(s => s.php).join(';\n') + ';\n}',

  Program: n => n.body.map(c => c.php).join('\n') + ';',

  ExpressionStatement: n => n.expression.php,

  BinaryExpression: n => {
    let php
    if (n.operator === '+' && n.concat) {
      php = n.left.php + ' . ' + n.right.php
    } else {
      php = n.left.php + ' ' + n.operator + ' ' + n.right.php
    }

    return n.parens ? '(' + php + ')' : php
  },

  AssignmentExpression: n => {
    return n.left.php + ' ' + n.operator + ' ' + n.right.php + ';'
  },

  ReturnStatement: n => 'return ' + n.argument.php + ';',

  CallExpression: n =>
    n.callee.php + '(' + n.arguments.map(a => a.php).join(', ') + ');',

  EmptyStatement: n => {},

  FunctionDeclaration: n => {
    return (
      'function ' +
      n.id.php +
      '(' +
      n.params.map(p => p.php).join(', ') +
      ') ' +
      n.body.php +
      '\n'
    )
  },

  FunctionExpression: n => {
    let useClause = n.used.length
      ? 'use(' + n.used.map(v => '$' + v).join(', ') + ') '
      : ''

    return (
      'function (' +
      n.params.map(p => p.php).join(', ') +
      ') ' +
      useClause +
      n.body.php
    )
  },

  IfStatement: n => {
    let php = 'if (' + n.test.php + ') ' + n.consequent.php
    if (n.alternate) {
      php += ' else ' + n.alternate.php
    }
    return php
  },

  ObjectExpression: n => {
    if (!n.properties.length) return '[]'

    let content = n.properties.map(p => p.php)

    return '[' + content.join(', ') + ']'
  },

  LogicalExpression: n => {
    let php = n.operator === '||'
      ? n.left.php + ' ?: ' + n.right.php
      : n.left.php + ' ' + n.operator + ' ' + n.right.php

    return n.parens ? '(' + php + ')' : php
  },

  WhileStatement: n => {
    return '\nwhile (' + n.test.php + ')' + n.body.php + '\n'
  },

  DoWhileStatement: n => {
    return '\ndo ' + n.body.php + ' while (' + n.test.php + ');\n'
  },

  ForStatement: n => {
    return (
      '\nfor (' +
      n.init.php +
      ';' +
      n.test.php +
      ';' +
      n.update.php +
      ') ' +
      n.body.php +
      '\n'
    )
  },

  ForEachStatement: n => {
    return (
      '\nforeach (' +
      n.collection.php +
      ' as ' +
      n.value.php +
      ')' +
      n.body.php +
      '\n'
    )
  },

  UpdateExpression: n => {
    return n.argument.php + n.operator
  },

  SequenceExpression: n => {
    return (n.expressions || []).map(el => el.php).join(', ')
  },

  ConditionalExpression: n => {
    return (
      '(' +
      n.test.php +
      ' ? ' +
      n.consequent.php +
      ' : ' +
      n.alternate.php +
      ')'
    )
  },

  Property: n => {
    return n.key ? n.key.php + ' => ' + n.value.php : n.value.php
  },

  ClassDeclaration: n => {
    return (
      'class ' +
      n.id.php +
      (n.extends ? ' extends ' + n.extends.php : '') +
      (n.implements ? ' implements ' + n.implements.php : '') +
      ' {' +
      n.body.php +
      '}\n'
    )
  },

  ClassElements: n => {
    return '\n' + n.elements.map(e => e.php).join('\n') + '\n'
  },

  MethodDeclaration: n => {
    return (
      (n.visibility || 'public') +
      (n.statik ? ' static' : '') +
      ' function ' +
      n.id.php +
      '(' +
      n.params.map(p => p.php).join(', ') +
      ') ' +
      n.body.php +
      '\n'
    )
  },

  PropertyDeclaration: n => {
    return (
      (n.visibility || 'public') +
      ' ' +
      (n.statik ? 'static ' : '') +
      n.id.php +
      '=' +
      n.value.php +
      ';'
    )
  },

  NewExpression: n => {
    return (
      'new ' + n.callee.php + '(' + n.arguments.map(p => p.php).join(',') + ')'
    )
  },

  MemberExpression: n =>
    (n.statik && !n.method
      ? n.object.php + '::$' + n.property.php
      : n.object.php +
          (n.statik ? '::' : '->') +
          n.property.php +
          (n.method ? '(' + n.arguments.map(a => a.php).join(',') + ')' : '')) +
    ';'
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
              console.log('Unrecognized node type:', n.type)
            }
            n.php = JSON.stringify(n)
          }
        }
      }
    })
  }
}

module.exports = PHPGeneratorVisitor
