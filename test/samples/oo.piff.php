<?php
// piff: generated from ./test/samples/oo.piff Sat May 27 2017 19:23:40 GMT-0400 (EDT)
function println($msg) {
  print($msg . "\n");
}

class Root {

}

class Test2 extends Root implements Serializable {
  public function serialize($value) {
    ;
  }

  public function unserialize($value) {
    ;
  }
}

class Test extends Root {
  public $sum=0;
  public static $val=10;
  public function add10() {
    $x = function () {
      println("anonymous functions work in methods too");
    };
    $x();
    return $this->add(10);
  }

  private function priv($a, $b) {
    println("here?");
  }

  public function add($n) {
    return $this->sum += $n;
  }

  public function chained() {
    println("chained");
    return $this;
  }

  public static function blah() {
    println("static blah");
  }

  public function blah2() {
    self::blah();
  }

}

$t = new Test();
println("instanceof " . ($t instanceof Root));
$t->add(10);
$t->add(20);
$t->add10();
$t->chained()->chained();
println($t->sum);
println("static tests");
Test::blah();
$t->blah2();
println("Test::val " . Test::$val);
?>
