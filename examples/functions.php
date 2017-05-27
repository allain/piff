<?php

$x = 10;
$y = 12;
$test = (function () use($x, $y) {
  $z = (function () use($y) {
    return $y;
  });

  return $x + $z();
});

print(test());
?>
