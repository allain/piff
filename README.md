# piff
A language that compiles down to PHP.

** piff is a work in progress, until 1.0 it's syntax might change **

## Why?
PHP has warts, but it's also the foundation of many Legacy Systems (including one I have to maintain). This tool is my attempt to maintain my sanity in this light.

It has had a good number of language features bolted on over the years (Closures, OO, Traits, Namespaces, etc...) but, because of its syntax, it's hard to appreciate them.

For example, when defining a closure you must explicitly declare all variables is uses, even if it's obvious from the code what the programmer had in mind.

I'm aware that there are tools for compiling JavaScript to PHP, but I didn't want to make promises about the conceptual model that are not true. **PHP is not just an Uglier JavaScript**.

## Why the idiotic name?

If you sound out PHP it kinda sounds like Piff. In the same way that piff kinda feels like PHP.

## Features

1. Semicolons are optional
2. Use clauses are automatically inferred
3. Defining classes is less verbose
4. Defining arrays is less verbose
5. ...

## A Quick Piff example that demonstrates some of its benefits

```
// Calling Overriden methods with parent
class A { say(m) { print(m) } }
class B { say(m) { parent(m + '!') } }

// Shorthand for $this->a => @a
class A {
  prefix = 'Hello: '
  say(m) { print(@prefix + m) }
}

// named functions
fn add(a, b) { return a + b }

// Anonymous functions
mult = fn a(a, b) { return a * b }

// Automatically figures out "use" clause
ticks = []
tick = fn() { ticks[] = mktime() }
```

## Installation

```bash
npm install -g piff
```

## Usage

To Compile to PHP
```bash
piff path/to/file.piff > output.php
```

To Run Directly
```bash
piff path/to/file.piff | php
```
