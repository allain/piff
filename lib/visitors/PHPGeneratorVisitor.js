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

  BlockStatement: n =>
    (n.body.length ? '{' + n.body.map(s => s.php).join(';') + ';}' : '{}'),

  Program: n => {
    let parts = []
    n.body.forEach(c => {
      parts.push(c.php)
      if (c.type !== 'ClassDeclaration') {
        parts.push(';')
      }
    })
    return n.body.map(c => c.php).join(';').replace(/;$/, '')
  },

  ExpressionStatement: n => n.expression.php,

  BinaryExpression: n => {
    let php
    if (n.operator === '+' && n.concat) {
      php = n.left.php + '.' + n.right.php
    } else {
      php = n.left.php + n.operator + n.right.php
    }

    return n.parens ? '(' + php + ')' : php
  },

  AssignmentExpression: n => {
    return n.left.php + n.operator + n.right.php
  },

  ReturnStatement: n => 'return ' + n.argument.php,

  CallExpression: n => {
    let callee = n.callee.php === 'parent'
      ? 'parent::' + n.parentMethodName
      : n.callee.php
    return callee + '(' + n.arguments.map(a => a.php).join(',') + ')'
  },

  EmptyStatement: n => {},

  FunctionDeclaration: n => {
    return (
      'function ' +
      n.id.php +
      '(' +
      n.params.map(p => p.php).join(',') +
      ')' +
      n.body.php
    )
  },

  FunctionExpression: n => {
    let useClause = n.used.length
      ? 'use(' + n.used.map(v => '$' + v).join(',') + ')'
      : ''

    return (
      'function(' +
      n.params.map(p => p.php).join(',') +
      ')' +
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

    return '[' + content.join(',') + ']'
  },

  LogicalExpression: n => {
    let php = n.operator === '||'
      ? n.left.php + '?:' + n.right.php
      : n.left.php + n.operator + n.right.php

    return n.parens ? '(' + php + ')' : php
  },

  WhileStatement: n => {
    return 'while(' + n.test.php + ')' + n.body.php
  },

  DoWhileStatement: n => {
    return 'do' + n.body.php + 'while(' + n.test.php + ')'
  },

  ForStatement: n => {
    return (
      'for(' +
      n.init.php +
      ';' +
      n.test.php +
      ';' +
      n.update.php +
      ') ' +
      n.body.php
    )
  },

  ForEachStatement: n => {
    return (
      'foreach (' + n.collection.php + ' as ' + n.value.php + ')' + n.body.php
    )
  },

  UpdateExpression: n => {
    return n.argument.php + n.operator
  },

  SequenceExpression: n => {
    return (n.expressions || []).map(el => el.php).join(',')
  },

  ConditionalExpression: n => {
    return (
      '(' + n.test.php + '?' + n.consequent.php + ':' + n.alternate.php + ')'
    )
  },

  Property: n => {
    return n.key ? n.key.php + '=>' + n.value.php : n.value.php
  },

  ClassDeclaration: n => {
    return (
      'class ' +
      n.id.php +
      (n.extends ? ' extends ' + n.extends.php : '') +
      (n.implements ? ' implements ' + n.implements.php : '') +
      '{' +
      n.body.php +
      '}'
    )
  },

  ClassElements: n => {
    return n.elements
      .reduce((parts, e) => {
        parts.push(e.php)
        if (
          e.type === 'ClassConstDeclaration' ||
          e.type === 'PropertyDeclaration'
        ) {
          parts.push(';')
        }
        return parts
      }, [])
      .join('')
  },

  MethodDeclaration: n => {
    return (
      (n.visibility || 'public') +
      (n.statik ? ' static' : '') +
      ' function ' +
      n.id.php +
      '(' +
      n.params.map(p => p.php).join(',') +
      ')' +
      n.body.php
    )
  },

  ClassConstDeclaration: n => {
    return 'const ' + n.name + '=' + n.value.php
  },

  PropertyDeclaration: n => {
    return (
      (n.visibility || 'public') +
      ' ' +
      (n.statik ? 'static ' : '') +
      n.id.php +
      '=' +
      n.value.php
    )
  },

  NewExpression: n => {
    return (
      'new ' + n.callee.php + '(' + n.arguments.map(p => p.php).join(',') + ')'
    )
  },

  MemberExpression: n => {
    return n.statik && !n.method
      ? n.object.php + '::$' + n.property.php
      : n.object.php +
          (n.statik ? '::' : '->') +
          n.property.php +
          (n.method ? '(' + n.arguments.map(a => a.php).join(',') + ')' : '')
  },

  UnaryExpression: n => {
    return n.operator + n.argument.php
  }
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
