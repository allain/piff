const Lazy = require('lazy.js')

module.exports = format

function mapWithPrev (f, prev = Array(1)) {
  return t => {
    let mapping = f(t, prev)
    if (mapping) {
      prev.unshift(t)
      prev.pop()
    }
    return mapping
  }
}

function indent (n) {
  return Array(n + 1).join('  ')
}

function format (tokens) {
  let currentIndent = 0

  function removeRemovableTokens () {
    return mapWithPrev((t, prev) => {
      if (t === ';' && [';', '{'].includes(prev[0])) return false
      if (t === '\n' && prev[0] === '\n') return false
      if (t === ' ' && prev[0] === ' ') return false

      return t
    })
  }

  return (
    Lazy(tokens)
      .flatten()
      .compact()
      .filter(removeRemovableTokens())
      // Insert white space breaks where they must be
      .map(
        mapWithPrev((t, prev) => {
          if ([';', ':'].includes(t)) {
            return [t, '\n']
          } else if (t === '{') {
            return [prev[0] === ')' ? ' ' : null, '{', '\n']
          } else if ('}'.includes(t)) {
            return ['\n', t]
          } else if (['catch'].includes(t)) {
            return [prev[0] === '}' ? ' ' : '\n', t, ' ']
          } else if (['function', ','].includes(t)) {
            return [t, ' ']
          } else if (['use', '=', '+', '-', '*', '/', '=>'].includes(t)) {
            return [' ', t, ' ']
          }

          return t
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
  )
}
