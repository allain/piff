<?php
// piff: generated from ./test/samples/strings.piff Sat May 27 2017 19:23:41 GMT-0400 (EDT)
assert(0 . "1" . 2 . true === "012true", "concat with string always does so");
assert("sum " . (1 + 2) === "sum 3", "concat an expression respects the expressions type");
?>
