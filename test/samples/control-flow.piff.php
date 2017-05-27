<?php
// piff: generated from ./test/samples/control-flow.piff Sat May 27 2017 19:23:39 GMT-0400 (EDT)
function println($msg) {
  print($msg . "\n");
}

$x = true;
if (true) println("simple");
if (true) {
  println("simple with braces");
}
if (false) assert(false, "should not reach"); else println("else");
if (false) {
  assert(false, "should not reach");
} else {
  println("else with braces");
}
if (false) {
  ;
} else if (false) {
  ;
} else {
  println("else on long chain");
}
println((false ? "failed" : "ternary true"));
$count = 0;

while ($count++ < 3){
  println("while iteration " . $count);
}

$count = 0;

do {
  println("do while iteration " . $count);
} while ($count++ < 3);

for ($x = 1;$x <= 3;$x++) {
  println("for loop " . $x);
}

foreach ([1, 2, 3] as $val){
  println("foreach " . $val);
}
;
?>
