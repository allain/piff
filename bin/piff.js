#!/bin/env node
/* eslint no-console: [0] */

const IGNORED_DIRS = /node_modules/

const Lazy = require('lazy.js')
const watch = require('glob-watcher')
const glob = require('glob')
const fs = require('fs-extra')
const flatten = require('flatten')
const USAGE = fs.readFileSync(__dirname + '/usage.txt', 'utf-8')
const getStdin = require('get-stdin')
const argv = require('minimist')(process.argv, {
  boolean: ['w', 'watch', 'f', 'force']
})
argv._.splice(0, 2)

const transpile = require('..')

const bail = msg => {
  console.error(msg)
  process.exit(1)
}

const helping = !!(argv.h || argv.help)
if (helping) {
  console.log(USAGE)
  process.exit(0)
}

const hasPatterns = argv._.length
const watching = !!(argv.w || argv.watch)
const forced = !!(argv.f || argv.force)

if (process.stdin.isTTY && !hasPatterns) {
  bail('ERROR: no patterns given\n\n' + USAGE)
} else if (!process.stdin.isTTY && hasPatterns) {
  bail('ERROR: patterns given when reading from stdin\n\n' + USAGE)
} else if (!process.stdin.isTTY && watching) {
  bail('ERROR: cannot watch stdin\n\n' + USAGE)
}

const compileFile = path =>
  fs
    .readFile(path, 'utf-8')
    .then(src => {
      if (!src) throw new Error('src is empty')
      return src
    })
    .then(transpile)
    .then(php => `<?php\n${php}\n?>`)

const compileStdin = () =>
  getStdin().then(transpile).then(php => `<?php\n${php}?>`)

const ts = () => new Date().toISOString().substr(0, 16).replace('T', ' ')

const fileModified = path =>
  fs.stat(path).then(stats => stats.mtime.getTime(), () => 0)

const needsCompile = forced
  ? () => Promise.resolve(true)
  : (srcFilePath, outFilePath) =>
      Promise.all([fileModified(srcFilePath), fileModified(outFilePath)]).then(
        ([srcTime, outTime]) => srcTime > outTime
      )

const updateFile = srcFilePath => {
  const outFilePath = srcFilePath.replace(/[.]piff$/, '.php')
  return needsCompile(srcFilePath, outFilePath).then(needed => {
    if (!needed) {
      console.log(ts(), 'skipped', srcFilePath)
      return
    }

    return compileFile(srcFilePath)
      .then(phpCode => fs.writeFile(outFilePath, phpCode))
      .then(() => {
        console.log(ts(), 'updated', outFilePath)
      })
      .catch(err => {
        complainAboutSyntax(srcFilePath, err)
      })
  })
}

const complainAboutSyntax = (srcFilePath, err) => {
  return fs.readFile(srcFilePath, 'utf-8').then(code => {
    let lineNumber = err.location.start.line
    let columnNumber = err.location.start.column

    let line = Lazy(code).split('\n').skip(lineNumber - 1).first()
    console.error('Syntax Error', srcFilePath, 'line', lineNumber)
    console.error(line)
    console.error(Array(columnNumber).join(' ') + '^')
    console.error()
  })
}

function run () {
  if (!process.stdin.isTTY) return compileStdin().then(console.log)

  return Promise.all(
    argv._.map(pattern =>
      fs
        .stat(pattern)
        .then(
          stat =>
            (stat.isDirectory()
              ? pattern.replace(/\/$/, '') + '/**/*.piff'
              : pattern)
        )
    )
  ).then(
    srcPatterns =>
      (watching ? watchPatterns(srcPatterns) : compilePatterns(srcPatterns))
  )
}

function watchPatterns (patterns) {
  const watcher = watch(patterns, {
    ignoreInitial: false,
    delay: 50,
    ignored: IGNORED_DIRS
  })

  watcher.on('change', srcFilePath => {
    if (srcFilePath.match(/[.]piff$/)) {
      // Need to delay to work around a timing issue with how vscode does its saves.
      // It appears that it truncates the file, then appends to it.
      setTimeout(() => updateFile(srcFilePath, true), 50)
    }
  })

  watcher.on('add', srcFilePath => {
    if (srcFilePath.match(/[.]piff$/)) {
      updateFile(srcFilePath)
    }
  })

  console.log(ts() + ' watching ' + patterns.join(' '))
}

function compilePatterns (patterns) {
  // Compile all app files in the src directory
  return Promise.all(
    patterns.map(pattern => {
      return new Promise(resolve => {
        glob(pattern, (err, srcFiles) => {
          Promise.all(srcFiles.map(f => updateFile(f))).then(
            () => resolve(srcFiles),
            err => {
              console.error(err)
              resolve()
            }
          )
        })
      })
    })
  ).then(compiles => {
    console.log(ts() + ' ' + flatten(compiles).length + ' files compiled')
  })
}

Promise.resolve().then(run).then(
  msg => {
    if (msg) console.log(msg)
  },
  err => {
    console.error(err.message)
    process.exit(1)
  }
)
