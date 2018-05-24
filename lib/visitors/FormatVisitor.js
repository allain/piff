const Visitor = require('../Visitor.js')

/**
 * changes array key literals to support strings instead of identifies
 * [a: 1, 'b': 2] => ['a': 1, 'b': 2]
 */
class FormatVisitor extends Visitor {
  constructor () {
    super({
      pre: {
        Variable:  ({name}) => this.emit(name),
        Literal:  ({value}) => this.emit(value),
        '*': n => console.log(n)
      }
    })

    this.indent = 0
    this.tokens = []
  }

  get formatted() {
      return this.tokens.join('')
  }

  indent() {
    this.indent ++
  }
  outdent() {
    this.indent ++
  }

  emit(token) {
    this.tokens.push(token)
  }
}

module.exports = FormatVisitor 

