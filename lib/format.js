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
          switch (t) {
            case ';':
            case ':':
              return [t, '\n']
            case '{':
              //  return ['{', '\n']
              return [prev[0] === ')' ? ' ' : null, '{', '\n']
            case '}':
              return ['\n', '}']
            case 'catch':
              return [prev[0] === '}' ? ' ' : '\n', t, ' ']
            case 'function':
            case 'if':
            case ',':
              return [t, ' ']
            case 'public':
            case 'private':
            case 'protected':
              return ['\n', t]
            default:
              return ['use', '=', '+', '-', '*', '/', '=>'].includes(t)
                ? [' ', t, ' ']
                : t
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
