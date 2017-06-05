const test = require('tape')

const rawTranspile = require('..')
const { SyntaxError } = require('../piff-parser.js')

// only test the file without white space in it
const transpile = piff =>
  rawTranspile(piff)
    .replace(/\n\s*/g, '\n')
    .replace(/;\n+/g, ';')
    .replace(/\{\n/g, '{')
    .replace(/\}\n\}/g, '}}')

test('variables - property access does not turn into variables', t => {
  t.equal(transpile('a = null; a.b = 1'), '$a = null;$a->b = 1')
  t.end()
})

test('variables - arguments may not be anything other than a variable', t => {
  t.equal(transpile('a(b)'), 'a($b)')
  t.end()
})

test('superglobals - are caught', t => {
  t.equal(transpile('var_dump(_GET)'), 'var_dump($_GET)')
  t.equal(transpile('var_dump(_POST)'), 'var_dump($_POST)')
  t.equal(transpile('var_dump(_REQUEST)'), 'var_dump($_REQUEST)')
  t.end()
})

test('constants - are untouched', t => {
  t.equal(transpile('__DIR__'), '__DIR__')
  t.equal(transpile('__FILE__'), '__FILE__')
  t.equal(transpile('t(CONSTANT)'), 't(CONSTANT)')
  t.end()
})

test('functions - simple named function', t => {
  let php = transpile('fn add(a, b) { return a + b }')
  t.equal(php, 'function add($a, $b) {return $a + $b;}')
  t.end()
})

test('functions - named function with default param value', t => {
  let php = transpile('fn x(a=1) {}')
  t.equal(php, 'function x($a = 1) {}')
  t.end()
})

test('functions - named function with type specified for param value', t => {
  let php = transpile('fn x(array a) {}')
  t.equal(php, 'function x(array $a) {}')
  t.end()
})

test('functions - simple anonymous function', t => {
  let php = transpile('add = fn(a, b) { return a + b }')
  t.equal(php, '$add = function ($a, $b) {return $a + $b;}')
  t.end()
})

test('functions - anonymous function with default param value', t => {
  let php = transpile('x = fn(a=1) {}')
  t.equal(php, '$x = function ($a = 1) {}')
  t.end()
})

test('functions - anonymous functions can infer used variables', t => {
  let php = transpile('b = 1; x = fn(a) { return a + b}')
  t.equal(php, '$b = 1;$x = function ($a) use ($b) {return $a + $b;}')
  t.end()
})

test('functions - used inferences can be deeply nested', t => {
  let php = transpile('b = 1; x = fn() { return fn() { return b }}')
  t.equal(
    php,
    '$b = 1;$x = function () use ($b) {return function () use ($b) {return $b;};}'
  )
  t.end()
})

test('arrays - simple array', t => {
  let php = transpile("[1,'2',3]")
  t.equal(php, "[1, '2', 3]")
  t.end()
})

test('arrays - key may be naked', t => {
  let php = transpile("[a:1,'b':2]")
  t.equal(php, '["a" => 1, \'b\' => 2]')
  t.end()
})

test('arrays - mixed is possible', t => {
  let php = transpile('[1,b:2]')
  t.equal(php, '[1, "b" => 2]')
  t.end()
})

test('arrays - nesting is possible', t => {
  let php = transpile('[a:[b:[c:1]]]')
  t.equal(php, '["a" => ["b" => ["c" => 1]]]')
  t.end()
})

test('interface - simple interface can be declared', t => {
  try {
    t.equal(
      transpile('interface I {a()}'),
      'interface I {public function a();}'
    )
  } catch (e) {
    console.log(e)
  }

  t.end()
})

test('interface - interface can have constants defined', t => {
  t.equal(
    transpile('interface I {A=1;a()}'),
    'interface I {const A = 1;public function a();}'
  )
  t.end()
})

test('class - simple works', t => {
  let php = transpile('class A {}')
  t.equal(php, 'class A {}')
  t.end()
})

test('class - names can be namespaced', t => {
  //t.equal(transpile('new \\A\\B()'), 'new \\A\\B()')
  t.equal(transpile('new a\\B()'), 'new a\\B()')
  t.end()
})

test('class - can be declared abstract', t => {
  let php = transpile('abstract class A {}')
  t.equal(php, 'abstract class A {}')
  t.end()
})

test('class - methods can be declared', t => {
  let php = transpile('class A { a() {} }')
  t.equal(php, 'class A {public function a() {}}')
  t.end()
})

test('class - abstract methods can be declared', t => {
  let php = transpile('class A { abstract a() }')
  t.equal(php, 'class A {public abstract function a();}')
  t.end()
})

test('class - methods with argument types can be declared', t => {
  let php = transpile('class A { a(B b) {} }')
  t.equal(php, 'class A {public function a(B $b) {}}')
  t.end()
})

test('class - static methods can be declared', t => {
  let php = transpile('class A { static a() {} }')
  t.equal(php, 'class A {public static function a() {}}')
  t.end()
})

test('class - properties can be declared', t => {
  let php = transpile('class A { x=1; private y=2; protected x=3 };')
  t.equal(php, 'class A {public $x = 1;private $y = 2;protected $x = 3;}')
  t.end()
})

test('class - properties can be declared', t => {
  try {
    t.equal(
      transpile('class A { w; x=1; private y=2; protected z=3 };'),
      'class A {public $w;public $x = 1;private $y = 2;protected $z = 3;}'
    )
    t.end()
  } catch (e) {
    t.fail(e.location)
  }
})

test('class - super short property definitions is supported', t => {
  t.equal(transpile('class A { w; y }'), 'class A {public $w;public $y;}')
  t.equal(transpile('class A { w\ny }'), 'class A {public $w;public $y;}')
  t.end()
})

test('class - static properties can be declared', t => {
  let php = transpile(
    'class A { static x=1; private static y=2; protected static x=3 }'
  )
  t.equal(
    php,
    'class A {public static $x = 1;private static $y = 2;protected static $x = 3;}'
  )
  t.end()
})

test('class - constants can be declared', t => {
  let php = transpile('class A { B = 10 }')
  t.equal(php, 'class A {const B = 10;}')

  t.equal(transpile('class A { B_JK = 10 }'), 'class A {const B_JK = 10;}')

  t.equal(transpile('class A { B_JK = 10 }'), 'class A {const B_JK = 10;}')
  t.end()
})

test('class - referencing constants inside a class works', t => {
  t.equal(
    transpile('class A { B = 1; t() { a(@@B) }}'),
    'class A {const B = 1;public function t() {a(self::B);}}'
  )
  t.end()
})

test('class - referencing constants outside a class works', t => {
  t.equal(
    transpile('class A { B = 1;};a(A::B)'),
    'class A {const B = 1;};a(A::B)'
  )
  t.end()
})

test('class - extends is supported', t => {
  let php = transpile('class A { t() {}} class B extends A {}')
  t.equal(php, 'class A {public function t() {}};class B extends A {}')
  t.end()
})

test('class - calling override can be done using parent in method', t => {
  let php = transpile('class A { t() {}} class B extends A { t() { parent() }}')
  t.equal(
    php,
    'class A {public function t() {}};class B extends A {public function t() {parent::t();}}'
  )
  t.end()
})

test('class - calling override can be done using parent in constructor', t => {
  let php = transpile('class A { } class B extends A { B() { parent() }}')
  t.equal(
    php,
    'class A {};class B extends A {public function B() {parent::__construct();}}'
  )
  t.end()
})

test('class - substitutes @ for this', t => {
  let php = transpile('class A { A() { print(@) } }')
  t.equal(php, 'class A {public function A() {print($this);}}')
  t.end()
})

test('class - substitutes @@prop for self::$prop', t => {
  t.equal(
    transpile('class A { A() { print(@@t) } }'),
    'class A {public function A() {print(self::$t);}}'
  )
  t.end()
})

test('class - substitutes @@prop() for self::prop()', t => {
  t.equal(
    transpile('class A { A() { @@t() } }'),
    'class A {public function A() {self::t();}}'
  )
  t.end()
})

test('class - substitutes @@prop() used as expression as self::prop()', t => {
  t.equal(
    transpile('class A { A() { p(@@t()) } }'),
    'class A {public function A() {p(self::t());}}'
  )
  t.end()
})

test('class - @prop used as prop expands', t => {
  let php = transpile('class A { A() { print(@t) } }')
  t.equal(php, 'class A {public function A() {print($this->t);}}')
  t.end()
})

test('class - @method used as function call expands', t => {
  let php = transpile('class A { A() { @t() } }')
  t.equal(php, 'class A {public function A() {$this->t();}}')
  t.end()
})

test('class - @prop used in nested functions use $that->prop', t => {
  t.equal(
    transpile('class A { A() { f = fn () { print(@t) } } }'),
    'class A {public function A() {$that = $this;$f = function () use ($that) {print($that->t);};}}'
  )
  t.end()
})

test('strings - concat with many types and an string uses string concat', t => {
  let php = transpile('1 + "2" + 3')
  t.equal(php, '1 . "2" . 3')
  t.end()
})

test('strings - concat with strings does not affect parens', t => {
  let php = transpile('"1" + (2 + 3)')
  t.equal(php, '"1" . (2 + 3)')
  t.end()
})

test('strings - strings with {expr} embeds get expanded to concats', t => {
  t.equal(transpile('"{a} {1 + 2}"'), '$a . " " . (1 + 2)')
  t.equal(transpile('"{a}"'), '$a')
  t.equal(transpile('"{++a}"'), '++$a')
  t.equal(
    transpile('"/tmp/{scrapeName}.json"'),
    '"/tmp/" . $scrapeName . ".json"'
  )
  t.end()
})

test('strings - strings with {INVALID expression} fails', t => {
  try {
    t.equal(transpile('"{test->b}"')) // -> is invalid in piff
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof SyntaxError)
    t.end()
  }
})

test('strings - string expression used as single argument to function should not be wrapped with parens', t => {
  t.equal(transpile('a("b{c}d")'), 'a("b" . $c . "d")')
  t.end()
})

test('strings - single quote strings are taken literally', t => {
  t.equal(transpile("'a{b}c'"), "'a{b}c'")
  t.equal(transpile("'\\''"), "'\\''")
  t.end()
})

test('strings - single quote strings pass escaped strings through', t => {
  try {
    t.equal(transpile("t('\\n\\s\\t\\r')"), "t('\\n\\s\\t\\r')")
  } catch (e) {
    console.log(e)
  }
  t.end()
})

test('strings - invalid expressions throw exceptions', t => {
  try {
    t.equal(transpile('"{test->b}"')) // -> is invalid in piff
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof SyntaxError)
    t.end()
  }
})

test('compose - supports using pipe operator "|>"', t => {
  t.equal(transpile('a |> b(_)'), 'b($a)')
  t.equal(transpile('a |> b(_) |> c(_) |> d(_)'), 'd(c(b($a)))')
  t.end()
})

test('compose - fails when no _ placeholder is given to stream into', t => {
  try {
    transpile('a |> b')
    t.fail('should have been a syntax error')
  } catch (e) {
    t.ok(e instanceof SyntaxError)
  }
  t.end()
})

test('compose - fails when multiple placeholders is given to stream into', t => {
  try {
    transpile('a |> b(_, _)')
    t.fail('should have been a syntax error')
  } catch (e) {
    t.ok(e instanceof SyntaxError)
  }
  t.end()
})

test('foreach - handles only values case', t => {
  t.equal(
    transpile('foreach([] as v) { print(v);}'),
    'foreach ([] as $v) {print($v);}'
  )
  t.end()
})

test('foreach - handles key and values case', t => {
  t.equal(
    transpile('foreach([] as k => v) { print(k, v);}'),
    'foreach ([] as $k => $v) {print($k, $v);}'
  )
  t.end()
})

test('trycatch - handle try catch case', t => {
  t.equal(
    rawTranspile('try {a() } catch(E e) { b() }'),
    'try {\n  a();\n} catch (E $e) {\n  b();\n}'
  )
  t.end()
})

test('trycatch - handle try finally case', t => {
  t.equal(
    rawTranspile('try {a() } finally { b() }'),
    'try {\n  a();\n} finally {\n  b();\n}'
  )
  t.end()
})

test('using $ at start of identifier is allowed', t => {
  t.equal(transpile('$a=1'), '$a = 1', 'simple assignment works')
  t.equal(
    transpile('$f = fn() {}; $f()'),
    '$f = function () {};$f()',
    'function assignment works'
  )
  t.equal(
    transpile('a=1;a.$b()'),
    '$a = 1;$a->$b()',
    'works when used to dynamically specify a method'
  )
  t.equal(
    transpile('$b="a";a=1;f=fn() { return a.$b()}'),
    '$b = "a";$a = 1;$f = function () use ($a, $b) {return $a->$b();}'
  )
  t.end()
})

test('support standard PHP static access', t => {
  // t.equal(transpile('A::b()'), 'A::b()')
  // t.equal(transpile('A::$b'), 'A::$b')
  t.equal(transpile('A::B'), 'A::B')
  t.end()
})

test('switch statement is supported', t => {
  t.equal(
    rawTranspile(
      'switch (a) { case "b": case "c": t(); break; default: s(); break; }'
    ),
    'switch ($a) {\n  case "b":\n  case "c":\n  t();\n  break;\n  default:\n  s();\n  break;\n}'
  )
  t.end()
})

test('variables - static variables are supported', t => {
  t.equal(
    transpile('fn t() { static count=1 }'),
    'function t() {static $count = 1;}'
  )
  t.end()
})

test('array type on param gets treated properly', t => {
  t.equal(transpile('fn a(array arr) {}'), 'function a(array $arr) {}')

  t.end()
})

test('referencing constants is possible on classes', t => {
  t.equal(transpile('println(A::TEST)'), 'println(A::TEST)')
  t.end()
})

test('function params may be complex expressions', t => {
  t.equal(transpile('fn a(b = A::TEST) {}'), 'function a($b = A::TEST) {}')
  t.equal(
    transpile('class A {a(b, c= null, d = APIBuilder::MAX_API_VERSION) {}}'),
    'class A {public function a($b, $c = null, $d = APIBuilder::MAX_API_VERSION) {}}'
  )
  t.end()
})

test('class names may contain numbers', t => {
  t.equal(transpile('print(S3::A)'), 'print(S3::A)')
  t.end()
})

test('namespace can be declared', t => {
  t.equal(transpile('namespace a\\b'), 'namespace a\\b')
  t.end()
})

test('namespace can be lowercase', t => {
  t.equal(transpile('namespace a'), 'namespace a')
  t.end()
})

test('use clause support', t => {
  t.equal(transpile('use GraphQL\\Type\\Definition\\ObjectType;'), 'use GraphQL\\Type\\Definition\\ObjectType')
  t.end()
})

test('include is supported', t => {
  t.equal(transpile('include("a.php")'), 'include("a.php")')
  t.end();
});

test('MUTE uses PHP mute', t => {
  t.equal(transpile('MUTE(t())'), '@(t())')
  t.end();
});
