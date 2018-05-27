const { format } = require('..')

const fs = require('fs-extra')
const path = require('path')

describe('format-piff', () => {
  const files = fs.readdirSync(__dirname)

  describe('comments', () => {
    it('single line comments', () =>
      expect(format('//Space Added\n//   Space Taken')).toEqual(
        '// Space Added\n// Space Taken\n'
      ))

    it('multi line comment is untouched', () =>
      expect(format('/*a\n   b\n     c*/')).toEqual('/*a\n   b\n     c*/\n'))
  })

  describe('classes', () => {
    it('makes empty classes on a sinle line', () =>
      expect(format('class A{\n\n\n}')).toEqual('class A {}\n'))

    it('leaves appropriate space', () =>
      expect(
        format(
          ['class A{x', 'y=10', 'private    z;C=10', 'a(){}', '}'].join('\n')
        )
      ).toEqual(
        [
          'class A {',
          '  x',
          '  y = 10',
          '  private z',
          '  C = 10',
          '',
          '  a() {}',
          '}',
          ''
        ].join('\n')
      ))
  })

  describe('interfaces', () => {
    it('makes empty interfaces on a single line', () =>
      expect(format('interface A{\n\n\n}')).toEqual('interface A {}\n'))

    it('leaves appropriate space', () =>
      expect(format(['interface A{C=10', 'a()', '}'].join('\n'))).toEqual(
        ['interface A {', '  C = 10', '  a()', '}', ''].join('\n')
      ))
  })

  describe('expressions', () => {
    it('adds correct spaces around operators', () =>
      expect(format(['a=b=c', 'a*=2', '1+2*(3/5)'].join('\n'))).toEqual(
        ['a = b = c', 'a *= 2', '1 + 2 * (3 / 5)', ''].join('\n')
      ))

    it('supports ternary operator', () =>
      expect(format('a?b:c?d:f')).toEqual('a ? b : c ? d : f\n'))

    it('logical expressions', () =>
      expect(format('1&&2||3&&!5')).toEqual('1 && 2 || 3 && !5\n'))
  })

  describe('functions', () => {
    it('lays out function expressions as expected', () =>
      expect(format('dbl=fn(n)n*2')).toEqual('dbl = fn (n) n * 2\n'))
    it('function expressions may contain bodies', () =>
      expect(format('dbl=fn(n){return n*2}')).toEqual(
        'dbl = fn (n) {\n  return n * 2\n}\n'
      ))
    it('named functions work', () =>
      expect(format('fn dbl(n){return n*2}')).toEqual(
        'fn dbl(n) {\n  return n * 2\n}\n'
      ))
  })

  describe('object literals', () => {
    it('removes quotes on simple keys', () =>
      expect(format('[a:1, "b": [1,2]]')).toEqual('[a: 1, b: [1, 2]]\n'))
  })

  describe('try/catch/finally/throw', () => {
    it('supports full try/catch', () =>
      expect(format('try { a() }\ncatch\n(E e)\n{ b() }')).toEqual(
        ['try {', '  a()', '} catch (E e) {', '  b()', '}', ''].join('\n')
      ))

    it('supports throw new', () =>
      expect(format('throw new E()')).toEqual('throw new E()\n'))

    it('supports throw value', () =>
      expect(format('throw e')).toEqual('throw e\n'))

    it('supports multiple catch clauses', () =>
      expect(format('try {a()} catch (E e){b()}catch(F f) {c()}')).toEqual(
        [
          'try {',
          '  a()',
          '} catch (E e) {',
          '  b()',
          '} catch (F f) {',
          '  c()',
          '}',
          ''
        ].join('\n')
      ))
    it('supports full try/catch/finally', () =>
      expect(format('try { a() }catch\n(E e){ b() }finally{c()}')).toEqual(
        [
          'try {',
          '  a()',
          '} catch (E e) {',
          '  b()',
          '} finally {',
          '  c()',
          '}',
          ''
        ].join('\n')
      ))
    it('supports full try/finally', () =>
      expect(format('try { a() }finally{c()}')).toEqual(
        ['try {', '  a()', '} finally {', '  c()', '}', ''].join('\n')
      ))
  })

  describe('loops', () => {
    it('handles do while', () =>
      expect(format('do { print() } while(true)')).toEqual(
        ['do {', '  print()', '} while (true)', ''].join('\n')
      ))

    it('handles while', () =>
      expect(format('while(true){print()}')).toEqual(
        ['while (true) {', '  print()', '}', ''].join('\n')
      ))

    it('handles continue', () => {
      expect(format('while(true){continue}')).toEqual(
        ['while (true) {', '  continue', '}', ''].join('\n')
      )
      expect(format('while(1){while(1) { continue 2 }}')).toEqual(
        ['while (1) {', '  while (1) {', '    continue 2', '  }', '}', ''].join(
          '\n'
        )
      )
    })

    it('handles break', () => {
      expect(format('while(true){break}')).toEqual(
        ['while (true) {', '  break', '}', ''].join('\n')
      )
      expect(format('while(1){while(1) { break 2 }}')).toEqual(
        ['while (1) {', '  while (1) {', '    break 2', '  }', '}', ''].join(
          '\n'
        )
      )
    })

    it('for each with index', () =>
      expect(format('foreach (arr as i => a) print("a")')).toEqual(
        ['foreach (arr as i => a) {', '  print("a")', '}', ''].join('\n')
      ))

    it('for each without index', () =>
      expect(format('foreach (arr as a) print(a)')).toEqual(
        ['foreach (arr as a) {', '  print(a)', '}', ''].join('\n')
      ))

    it('for', () =>
      expect(format('for(i=0;i<10; i++) print(i)')).toEqual(
        ['for (i = 0; i < 10; i++) {', '  print(i)', '}', ''].join('\n')
      ))
  })

  describe('if', () => {
    it('if single statement', () =>
      expect(format('if(1)print()')).toEqual('if (1) print()\n'))

    it('if with block', () =>
      expect(format('if(1) { print() }')).toEqual('if (1) {\n  print()\n}\n'))

    it('if elseif, else', () =>
      expect(format('if(1) { a() } else if (2) { b() } else { c() }')).toEqual(
        [
          'if (1) {',
          '  a()',
          '} else if (2) {',
          '  b()',
          '} else {',
          '  c()',
          '}',
          ''
        ].join('\n')
      ))
  })

  describe('switch', () => {
    it('wraps consequences with a block', () =>
      expect(
        format(
          'switch(x){case 1:\ncase 2: a(); break; case 3: break; default: break;}'
        )
      ).toEqual(
        [
          'switch (x) {',
          '  case 1:',
          '  case 2: {',
          '    a()',
          '    break',
          '  }',
          '  case 3: {',
          '    break',
          '  }',
          '  default: {',
          '    break',
          '  }',
          '}',
          ''
        ].join('\n')
      ))

    it('leaves blockes consequences untouched', () =>
      expect(
        format('switch(x){case 1:\ncase 2: {a(); break} default: break;}')
      ).toEqual(
        [
          'switch (x) {',
          '  case 1:',
          '  case 2: {',
          '    a()',
          '    break',
          '  }',
          '  default: {',
          '    break',
          '  }',
          '}',
          ''
        ].join('\n')
      ))
  })

  it('formats use statment', () =>
    expect(format('use    Hello\A\B')).toEqual('use Hello\A\B\n'))

  it('formats string expressions', () => {
    expect(format('a("hello")')).toEqual('a("hello")\n')

    expect(format('a("A{  firstName\n} B {lastName} C{1+\n2+\n3}")')).toEqual(
      'a("A{firstName} B {lastName} C{1 + 2 + 3}")\n'
    )
  })

  it('leaves strings untoucched', () =>
    expect(format('"   if(x){jklh}"')).toEqual('"   if(x){jklh}"\n'))

  it('does not double escape strings', () =>
    expect(format('p("\\n\\\\\\t")')).toEqual('p("\\n\\\\\\t")\n'))
})
