<?php
// piff: generated from ./test/samples/expressions.piff Sat May 27 2017 19:23:40 GMT-0400 (EDT)
function println($msg) {
  print($msg . "\n");
}

println("1 + 2 === " . (1 + 2));
println("1 + (2 * 3) === " . (1 + (2 * 3)));
println("(1 + 2) * 3 === " . ((1 + 2) * 3));
println("1 || 2 === " . (1 ?: 2));
println("false && true === " . ((false && true) ? "true" : "false"));
println("1" . "2" . "3");
println(true && true);
?>
