const rawTranspile = require('..').transpile
const { SyntaxError } = require('../piff-parser.js')

// only test the file without white space in it
const transpile = piff =>
  rawTranspile(piff)
    .replace(/\n\s*/g, '\n')
    .replace(/;\n+/g, ';')
    .replace(/\{\n/g, '{')
    .replace(/\}\n\}/g, '}}')

test('variables - property access does not turn into variables', () => {
  expect(transpile('a = null; a.b = 1')).toBe('$a = null;$a->b = 1')
})

test('variables - arguments may not be anything other than a variable', () => {
  expect(transpile('a(b)')).toBe('a($b)')
})

test('superglobals - are caught', () => {
  expect(transpile('var_dump(_GET)')).toBe('var_dump($_GET)')
  expect(transpile('var_dump(_POST)')).toBe('var_dump($_POST)')
  expect(transpile('var_dump(_REQUEST)')).toBe('var_dump($_REQUEST)')
})

test('constants - are untouched', () => {
  expect(transpile('__DIR__')).toBe('__DIR__')
  expect(transpile('__FILE__')).toBe('__FILE__')
  expect(transpile('t(CONSTANT)')).toBe('t(CONSTANT)')
})

test('functions - simple named function', () => {
  expect(transpile('fn add(a, b) { return a + b }')).toBe(
    'function add($a, $b) {return $a + $b;}'
  )
})

test('functions - single statement bodies supported', () => {
  expect(transpile('fn add(a, b) a + b')).toBe(
    'function add($a, $b) {return $a + $b;}'
  )
  expect(transpile('fn add(a, b) a + b')).toBe(
    'function add($a, $b) {return $a + $b;}'
  )
})

test('functions - named function with default param value', () => {
  expect(transpile('fn x(a=1) {}')).toBe('function x($a = 1) {}')
})

test('functions - named function with type specified for param value', () => {
  expect(transpile('fn x(array a) {}')).toBe('function x(array $a) {}')
})

test('functions - simple anonymous function', () => {
  expect(transpile('add = fn(a, b) { return a + b }')).toBe(
    '$add = function ($a, $b) {return $a + $b;}'
  )
})

test('functions - anonymous function with default param value', () => {
  expect(transpile('x = fn(a=1) {}')).toBe('$x = function ($a = 1) {}')
})

test('functions - anonymous functions can infer used variables', () => {
  expect(transpile('b = 1; x = fn(a) { return a + b}')).toBe(
    '$b = 1;$x = function ($a) use ($b) {return $a + $b;}'
  )
})

test('functions - used inferences can be deeply nested', () => {
  expect(transpile('b = 1; x = fn() { return fn() { return b }}')).toBe(
    '$b = 1;$x = function () use ($b) {return function () use ($b) {return $b;};}'
  )
})

test('arrays - simple array', () => {
  expect(transpile("[1,'2',3]")).toBe("[1, '2', 3]")
})

test('arrays - key may be naked', () => {
  expect(transpile("[a:1,'b':2]")).toBe('["a" => 1, \'b\' => 2]')
})

test('arrays - mixed is possible', () => {
  expect(transpile('[1,b:2]')).toBe('[1, "b" => 2]')
})

test('arrays - nesting is possible', () => {
  expect(transpile('[a:[b:[c:1]]]')).toBe('["a" => ["b" => ["c" => 1]]]')
})

test('interface - simple interface can be declared', () => {
  expect(transpile('interface I {a()}')).toBe(
    'interface I {public function a();}'
  )
})

test('interface - interface can have constants defined', () => {
  expect(transpile('interface I {A=1;a()}')).toBe(
    'interface I {const A = 1;public function a();}'
  )
})

test('class - simple works', () => {
  expect(transpile('class A {}')).toBe('class A {}')
})

test('class - name can contain underscore', () => {
  expect(transpile('class A_B {}')).toBe('class A_B {}')
})

test('class - names can be namespaced', () => {
  expect(transpile('new a\\B()')).toBe('new a\\B()')
})

test('class - can be declared abstract', () => {
  expect(transpile('abstract class A {}')).toBe('abstract class A {}')
})

test('class - methods can be declared', () => {
  expect(transpile('class A { a() {} }')).toBe(
    'class A {public function a() {}}'
  )
})

test('class - abstract methods can be declared', () => {
  expect(transpile('class A { abstract a() }')).toBe(
    'class A {public abstract function a();}'
  )
})

test('class - methods with argument types can be declared', () => {
  expect(transpile('class A { a(B b) {} }')).toBe(
    'class A {public function a(B $b) {}}'
  )
})

test('class - static methods can be declared', () => {
  expect(transpile('class A { static a() {} }')).toBe(
    'class A {public static function a() {}}'
  )
})

test('class - properties can be declared', () => {
  expect(transpile('class A { w; x=1; private y=2; protected z=3 };')).toBe(
    'class A {public $w;public $x = 1;private $y = 2;protected $z = 3;}'
  )
})

test('class - super short property definitions is supported', () => {
  expect(transpile('class A { w; y }')).toBe('class A {public $w;public $y;}')
  expect(transpile('class A { w\ny }')).toBe('class A {public $w;public $y;}')
})

test('class - static properties can be declared', () => {
  expect(
    transpile(
      'class A { static x=1; private static y=2; protected static x=3 }'
    )
  ).toBe(
    'class A {public static $x = 1;private static $y = 2;protected static $x = 3;}'
  )
})

test('class - constants can be declared', () => {
  expect(transpile('class A { B = 10 }')).toBe('class A {const B = 10;}')
  expect(transpile('class A { B_JK = 10 }')).toBe('class A {const B_JK = 10;}')
  expect(transpile('class A { B_JK = 10 }')).toBe('class A {const B_JK = 10;}')
})

test('class - referencing constants inside a class works', () => {
  expect(transpile('class A { B = 1; t() { a(@@B) }}')).toBe(
    'class A {const B = 1;public function t() {a(self::B);}}'
  )
})

test('class - referencing constants outside a class works', () => {
  expect(transpile('class A { B = 1;};a(A::B)')).toBe(
    'class A {const B = 1;};a(A::B)'
  )
})

test('class - extends is supported', () => {
  expect(transpile('class A { t() {}}; class B extends A {}')).toBe(
    'class A {public function t() {}};class B extends A {}'
  )
})

test('class - calling override can be done using parent in method', () => {
  expect(
    transpile('class A { t() {}}; class B extends A { t() { parent() }}')
  ).toBe(
    'class A {public function t() {}};class B extends A {public function t() {parent::t();}}'
  )
})

test('class - calling override can be done using parent in constructor', () => {
  expect(transpile('class A { }; class B extends A { B() { parent() }}')).toBe(
    'class A {};class B extends A {public function B() {parent::__construct();}}'
  )
})

test('class - substitutes @ for this', () => {
  expect(transpile('class A { A() { print(@) } }')).toBe(
    'class A {public function A() {print($this);}}'
  )
})

test('class - substitutes @@prop for self::$prop', () => {
  expect(transpile('class A { A() { print(@@t) } }')).toBe(
    'class A {public function A() {print(self::$t);}}'
  )
})

test('class - substitutes @@prop() for self::prop()', () => {
  expect(transpile('class A { A() { @@t() } }')).toBe(
    'class A {public function A() {self::t();}}'
  )
})

test('class - substitutes @@prop() used as expression as self::prop()', () => {
  expect(transpile('class A { A() { p(@@t()) } }')).toBe(
    'class A {public function A() {p(self::t());}}'
  )
})

test('class - @prop used as prop expands', () => {
  expect(transpile('class A { A() { print(@t) } }')).toBe(
    'class A {public function A() {print($this->t);}}'
  )
})

test('class - @method used as function call expands', () => {
  expect(transpile('class A { A() { @t() } }')).toBe(
    'class A {public function A() {$this->t();}}'
  )
})

test('class - @prop used in nested functions use $that->prop', () => {
  expect(transpile('class A { A() { f = fn () { print(@t) } } }')).toBe(
    'class A {public function A() {$that = $this;$f = function () use ($that) {print($that->t);};}}'
  )
})

test('strings - concat with many types and an string uses string concat', () => {
  expect(transpile('1 + "2" + 3')).toBe('1 . "2" . 3')
})

test('strings - concat with strings does not affect parens', () => {
  expect(transpile('"1" + (2 + 3)')).toBe('"1" . (2 + 3)')
})

test('strings - strings with {expr} embeds get expanded to concats', () => {
  expect(transpile('"{a} {1 + 2}"')).toBe('$a . " " . (1 + 2)')
  expect(transpile('"{a}"')).toBe('$a')
  expect(transpile('"{++a}"')).toBe('++$a')
  expect(transpile('"/tmp/{scrapeName}.json"')).toBe(
    '"/tmp/" . $scrapeName . ".json"'
  )
})

test('strings - strings with {INVALID expression} fails', () => {
  expect(() => transpile('"{test->b}"')).toThrow()
})

test('strings - string expression used as single argument to function should not be wrapped with parens', () => {
  expect(transpile('a("b{c}d")')).toBe('a("b" . $c . "d")')
})

test('strings - single quote strings are taken literally', () => {
  expect(transpile("'a{b}c'")).toBe("'a{b}c'")
  expect(transpile("'\\''")).toBe("'\\''")
})

test('strings - single quote strings pass escaped strings through', () => {
  expect(transpile("t('\\n\\s\\t\\r')")).toBe("t('\\n\\s\\t\\r')")
})

test('strings - invalid expressions throw exceptions', () => {
  expect(() => {
    transpile('"{test->b}"') // -> is invalid in piff
  }).toThrow()
})

test('compose - supports using pipe operator "|>"', () => {
  expect(transpile('a |> b(_)')).toBe('b($a)')
  expect(transpile('a |> b(_) |> c(_) |> d(_)')).toBe('d(c(b($a)))')
})

test('compose - fails when no _ placeholder is given to stream into', () => {
  expect(() => {
    transpile('a |> b')
  }).toThrow()
})

test('compose - fails when multiple placeholders is given to stream into', () => {
  expect(() => {
    transpile('a |> b(_, _)')
  }).toThrow()
})

test('foreach - handles only values case', () => {
  expect(transpile('foreach([] as v) { print(v);}')).toBe(
    'foreach ([] as $v) {print($v);}'
  )
})

test('foreach - handles key and values case', () => {
  expect(transpile('foreach([] as k => v) { print(k, v);}')).toBe(
    'foreach ([] as $k => $v) {print($k, $v);}'
  )
})
test('trycatch - handle try catch case', () => {
  expect(rawTranspile('try {a() } catch(E e) { b() }')).toBe(
    'try {\n  a();\n} catch (E $e) {\n  b();\n}'
  )
})

test('trycatch - handle try finally case', () => {
  expect(rawTranspile('try {a() } finally { b() }')).toBe(
    'try {\n  a();\n} finally {\n  b();\n}'
  )
})

test('using $ at start of identifier is allowed', () => {
  expect(transpile('$a=1')).toBe('$a = 1', 'simple assignment works')
  expect(transpile('$f = fn() {}; $f()')).toBe('$f = function () {};$f()')
  expect(transpile('a=1;a.$b()')).toBe('$a = 1;$a->$b()')
  expect(transpile('$b="a";a=1;f=fn() { return a.$b()}')).toBe(
    '$b = "a";$a = 1;$f = function () use ($a, $b) {return $a->$b();}'
  )
})

test('support standard PHP static access', () => {
  expect(transpile('A::b()')).toBe('A::b()')
  // expect(transpile('A::$b')).toBe('A::$b')
  expect(transpile('A::B')).toBe('A::B')
})

test('switch statement is supported', () => {
  expect(
    rawTranspile(
      'switch (a) { case "b": case "c": t(); break; default: s(); break; }'
    )
  ).toBe(
    'switch ($a) {\n  case "b":\n  case "c":\n  t();\n  break;\n  default:\n  s();\n  break;\n}'
  )
})

test('variables - static variables are supported', () => {
  expect(transpile('fn t() { static count=1 }')).toBe(
    'function t() {static $count = 1;}'
  )
})

test('array type on param gets treated properly', () => {
  expect(transpile('fn a(array arr) {}')).toBe('function a(array $arr) {}')
})

test('referencing constants is possible on classes', () => {
  expect(transpile('println(A::TEST)')).toBe('println(A::TEST)')
})

test('function params may be complex expressions', () => {
  expect(transpile('fn a(b = A::TEST) {}')).toBe('function a($b = A::TEST) {}')
  expect(
    transpile('class A {a(b, c= null, d = APIBuilder::MAX_API_VERSION) {}}')
  ).toBe(
    'class A {public function a($b, $c = null, $d = APIBuilder::MAX_API_VERSION) {}}'
  )
})

test('class names may contain numbers', () => {
  expect(transpile('print(S3::A)')).toBe('print(S3::A)')
})

test('namespace can be declared', () => {
  expect(transpile('namespace a\\b')).toBe('namespace a\\b')
})

test('namespace can be lowercase', () => {
  expect(transpile('namespace a')).toBe('namespace a')
})

test('use clause support', () => {
  expect(transpile('use GraphQL\\Type\\Definition\\ObjectType;')).toBe(
    'use GraphQL\\Type\\Definition\\ObjectType'
  )
})

test('include is supported', () => {
  expect(transpile('include("a.php")')).toBe('include("a.php")')
})

test('MUTE uses PHP mute', () => {
  expect(transpile('MUTE(t())')).toBe('@(t())')
})

test('parent references expand properly', () => {
  expect(transpile('class A { t() { parent::a() }}')).toBe(
    'class A {public function t() {parent::a();}}'
  )
})

test('array - literals can have expressions as keys', () => {
  expect(transpile('[1 * 2 * 3: 4]')).toBe('[1 * 2 * 3 => 4]')
})

test('keywords are allowed as properties', () => {
  expect(rawTranspile('t(a.protected)')).toBe('t($a->protected)')
})

test('comment - single line comment works', () =>
  expect(transpile('// a')).toBe('// a'))

test('comment - multi-line comment works', () =>
  expect(rawTranspile('/* a\n  b\n   c*/')).toBe('/* a\n  b\n   c*/'))
