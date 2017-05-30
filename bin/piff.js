#!/bin/env node
const transpile = require('..')
const argv = require('minimist')(process.argv, {
  boolean: ['w', 'watch', 'r', 'recursive']
})
argv._.splice(0, 2)

const watch = require('glob-watcher')
const glob = require('glob')
const fs = require('fs-extra')
const USAGE = fs.readFileSync(__dirname + '/usage.txt', 'utf-8')
const getStdin = require('get-stdin')

const checkIsDirectory = path =>
  fs.stat(path).then(stat => {
    if (!stat.isDirectory()) {
      throw new Error('ERROR not a directory: ' + path)
    }
    return path
  })

const checkIsFile = path =>
  fs.stat(path).then(stat => {
    if (!stat.isFile()) {
      throw new Error('ERROR not a file: ' + path)
    }
    return path
  })

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

const bail = msg => Promise.reject(new Error(msg))

const echo = msg => {
  console.log(msg)
  return msg
}

const ts = () => new Date().toISOString().substr(0, 16).replace('T', ' ')

const fileModified = path =>
  fs.stat(path).then(stats => stats.mtime.getTime(), err => 0)

function run () {
  if (argv.h || argv.help) return Promise.resolve(USAGE)

  const recursive = !!(argv.r || argv.recursive)
  const watching = !!(argv.w || argv.watch)

  const srcDirPath = (argv._[0] || '').replace(/\/$/, '')

  const updateFile = (srcFilePath, forced) => {
    const outputFilePath = srcFilePath.replace(/[.]piff$/, '.php')
    const stats = forced
      ? Promise.resolve([1, 0])
      : Promise.all([fileModified(srcFilePath), fileModified(outputFilePath)])

    return stats.then(([srcTime, outTime]) => {
      if (srcTime <= outTime) {
        console.log(ts() + ' skipping ' + srcFilePath)
        return
      }

      return compileFile(srcFilePath)
        .then(phpCode => fs.writeFile(outputFilePath, phpCode))
        .then(() => {
          console.log(ts() + ' updated', outputFilePath)
        })
        .catch(err => {
          console.error(ts() + ' ERROR ' + err)
        })
    })
  }

  if (recursive && watching) {
    return checkIsDirectory(srcDirPath).then(srcDirPath => {
      // remove last slash on directory
      const watcher = watch([srcDirPath + '/**/*.piff'], {
        ignoreInitial: false,
        delay: 500
      })

      watcher.on('change', srcFilePath => {
        if (srcFilepath.match(/[.]piff$/)) {
          // Need to delay to work around a timing issue with how vscode does its saves.
          // It appears that it truncates the file, then appends to it.
          setTimeout(() => updateFile(srcFilePath), 50)
        }
      })

      watcher.on('add', srcFilePath => {
        if (srcFilePath.match(/[.]piff$/)) {
          updateFile(srcFilePath)
        }
      })

      return ts() + ' watching ' + srcDirPath
    })
  } else if (recursive) {
    // Compile all app files in the src directory
    return checkIsDirectory(srcDirPath).then(srcDirPath => {
      return new Promise((resolve, reject) => {
        glob(srcDirPath + '/**/*.piff', (err, srcFiles) => {
          Promise.all(srcFiles.map(f => updateFile(f, true))).then(
            results => resolve(ts() + ' ' + results.length + ' files compiled'),
            reject
          )
        })
      })
    })
  } else {
    // compiling a single file
    const srcFilePath = argv._[0]
    if (process.stdin.isTTY && !srcFilePath) {
      return bail('ERROR: no piff file given\n\n' + USAGE)
    }

    const outputFilePath = argv.o || argv.output
    if (!process.stdout.isTTY && outputFilePath) {
      return bail('ERROR: output file given when piping to stdout')
    }

    const emitCode = phpCode =>
      (outputFilePath
        ? fs.writeFile(outputFilePath, phpCode)
        : console.log(phpCode))

    return (process.stdin.isTTY
      ? checkIsFile(srcFilePath).then(compileFile)
      : compileStdin()).then(emitCode)
  }
}

run().then(
  msg => {
    if (msg) console.log(msg)
  },
  err => {
    console.error(err.message)
    process.exit(1)
  }
)
