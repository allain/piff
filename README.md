# piff
A language that compiles down to PHP.

**Warning:** piff is a work in progress. Its syntax might change until version 1.0

## Why?

PHP has warts; It's also the foundation of many Legacy Systems (including one I have to maintain). This tool is my attempt to maintain my sanity in this light.

It has had a good number of language features bolted on over the years (Closures, OO, Traits, Namespaces, etc...) but, because of its syntax, it's hard to appreciate them.

For example, when defining a closure you must explicitly declare all variables is uses, even if it's obvious from the code what the programmer had in mind.

I'm aware that there are tools for compiling JavaScript to PHP, but I didn't want to make promises about the conceptual model that are not true. **PHP is not just an Uglier JavaScript**.

## Why the idiotic name?

If you sound out PHP, it kinda sounds like Piff. In the same way that piff kinda feels like PHP.

## Features / Opinions

1. Semicolons are optional
1. Use clauses are automatically inferred
1. Functions can be composed using a special pipe syntax 
1. Defining classes is less verbose
1. Defining arrays is less verbose
1. Formatting shoudl be part of the language (like in go) 

## A Quick Piff example that demonstrates some of its benefits

```c
// Calling Overriden methods with parent
class A {
  say(m) {
    print(m)
  }
}

class B extends A {
  say(m) {
    parent(m + '!')
  }
}

// @a expands to $this->a
class A {
  prefix = 'Hello: '
  say(m) { print(@prefix + m) }
}

// @@field expands to self::$field, @@m() expands to self::m()
class B {
  static prefix = 'Hello: '
  static say(m) { print(@@prefix + m) }
}

// named functions
fn add(a, b) { return a + b }

// Anonymous functions (with expression as block)
mult = fn (a, b) a * b

// Automatically figures out "use" clause
ticks = []
tick = fn() { ticks[] = mktime() }

// function composition alternate syntax
a() |> b(_) |> c(_) // is the same as: c(b(a()))
```

## Installation

```bash
npm install -g piff
```

## Usage

### Progammatic usage
```js
const piff = require('piff')
let php = piff.transpile("fn add(a, b) { return a + b }\n echo(add(1,2))")
console.log(php) // <?php echo("hello" . "\n")?>

console.log(piff.format("fn add(a,b){return a+b}")
// outputs a nicely formatted version of the piff code
```

### Command line usage
```bash
# compile ./file.piff to ./file.php
piff ./file.piff

# compile all piff files in a directory (even if compilation doesn't appear to be needed)
piff path/to/dir/ --force

# watch a directory and compile any .piff file that needs it
piff path/to/dir --watch

# or with shorter params
piff path/to/dir -w

# Plays nice with stdin/out too
echo "print('hello')" | piff | php
```
