<?php
// piff: generated from ./test/samples/functions.piff Sat May 27 2017 19:23:40 GMT-0400 (EDT)
function hello() {
  print("Hello, World!");
}

hello();
function ten() {
  return 10;
}

function add($a, $b) {
  return $a + $b;
}

$hello2 = function () {
  print("Hello, World!");
};
$hello2();
print(ten());
$add2 = function ($a, $b) {
  return $a + $b;
};
print($add2(1, 2));
$x1 = 10;
$test = function () use($x1) {
  return $x1;
};
$test2 = function ($x1) {
  return $x1;
};
print($test2(20));
$test3 = function () {
  $x = 10;
  print($x);
};
$test3();
$hi = function () {
  print("hi");
};
$hi();
$x4 = 10;
$y4 = 20;
$test4 = function () use($x4, $y4) {
  $z = function () use($x4) {
    return $x4;
  };
  return $y4 + $z();
};
?>
