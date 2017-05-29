const test = require('tape')

const transpile = require('..')

test('functions - simple named function', t => {
  let php = transpile('fn add(a, b) { return a + b }')
  t.equal(php, 'function add($a,$b){return $a+$b;}')
  t.end()
})

test('functions - simple anonymous function', t => {
  let php = transpile('add = fn (a, b) { return a + b }')
  t.equal(php, '$add=function($a,$b){return $a+$b;}')
  t.end()
})

test('functions - anonymous functions can infer used variables', t => {
  let php = transpile('b = 1; x = fn (a) { return a + b }')
  t.equal(php, '$b=1;$x=function($a)use($b){return $a+$b;}')
  t.end()
})

test('functions - used inferences can be deeply nested', t => {
  let php = transpile('b = 1; x = fn () { return fn() { return b }}')
  t.equal(
    php,
    '$b=1;$x=function()use($b){return function()use($b){return $b;};}'
  )
  t.end()
})

test('arrays - simple array', t => {
  let php = transpile("[1,'2',3]")
  t.equal(php, '[1,"2",3]')
  t.end()
})

test('arrays - key may be naked', t => {
  let php = transpile("[a:1,'b':2]")
  t.equal(php, '["a"=>1,"b"=>2]')
  t.end()
})

test('arrays - mixed is possible', t => {
  let php = transpile('[1,b:2]')
  t.equal(php, '[1,"b"=>2]')
  t.end()
})

test('arrays - nesting is possible', t => {
  let php = transpile('[a:[b:[c:1]]]')
  t.equal(php, '["a"=>["b"=>["c"=>1]]]')
  t.end()
})

test('class - simple works', t => {
  let php = transpile('class A {}')
  t.equal(php, 'class A{}')
  t.end()
})

test('class - methods can be declared', t => {
  let php = transpile('class A { a() {} }')
  t.equal(php, 'class A{public function a(){}}')
  t.end()
})

test('class - static methods can be declared', t => {
  let php = transpile('class A { static a() {} }')
  t.equal(php, 'class A{public static function a(){}}')
  t.end()
})

test('class - properties can be declared', t => {
  let php = transpile('class A { x=1; private y=2; protected x=3 };')
  t.equal(php, 'class A{public $x=1;private $y=2;protected $x=3;}')
  t.end()
})

test('class - static properties can be declared', t => {
  let php = transpile(
    'class A { static x=1; private static y=2; protected static x=3 }'
  )
  t.equal(
    php,
    'class A{public static $x=1;private static $y=2;protected static $x=3;}'
  )
  t.end()
})

test('class - constants can be declared', t => {
  let php = transpile('class A { B = 10}')
  t.equal(php, 'class A{const B=10;}')
  t.end()
})

test('class - extends is supported', t => {
  let php = transpile('class A { t() {}} class B extends A {}')
  t.equal(php, 'class A{public function t(){}};class B extends A{}')
  t.end()
})

test('class - calling override can be done using parent in method', t => {
  let php = transpile('class A { t() {}} class B extends A { t() { parent() }}')
  t.equal(
    php,
    'class A{public function t(){}};class B extends A{public function t(){parent::t();}}'
  )
  t.end()
})

test('class - calling override can be done using parent in constructor', t => {
  let php = transpile('class A { } class B extends A { B() { parent() }}')
  t.equal(
    php,
    'class A{};class B extends A{public function B(){parent::__construct();}}'
  )
  t.end()
})

test('class - substitutes @ for this', t => {
  let php = transpile('class A { A() { print(@) } }')
  t.equal(php, 'class A{public function A(){print($this);}}')
  t.end()
})

test('class - substitutes @@prop for self::$prop', t => {
  t.equal(
    transpile('class A { A() { print(@@t) } }'),
    'class A{public function A(){print(self::$t);}}'
  )
  t.end()
})

test('TODO class - substitutes @@prop() for self::prop()', t => {
  t.equal(
    transpile('class A { A() { @@t() } }'),
    'class A{public function A(){self::t();}}'
  )
  t.end()
})

test('class - @prop used as prop expands', t => {
  let php = transpile('class A { A() { print(@t) } }')
  t.equal(php, 'class A{public function A(){print($this->t);}}')
  t.end()
})

test('class - @method used as function call expands', t => {
  let php = transpile('class A { A() { @t() } }')
  t.equal(php, 'class A{public function A(){$this->t();}}')
  t.end()
})

test('class - @prop used in nested functions use $that->prop', t => {
  t.equal(
    transpile('class A { A() { f = fn() { print(@t) } } }'),
    'class A{public function A(){$that=$this;$f=function()use($that){print($that->t);};}}'
  )
  t.end()
})

test('strings - concat with many types and an string uses string concat', t => {
  let php = transpile('1 + "2" + 3')
  t.equal(php, '1."2".3')
  t.end()
})

test('strings - concat with strings does not affect parens', t => {
  let php = transpile('"1" + (2 + 3)')
  t.equal(php, '"1".(2+3)')
  t.end()
})
