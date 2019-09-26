'use strict'

function compiler (tree, current, ...parents) {
  if (!current) {
    const {'@main': main} = tree
    current = tree[main]
  }

  let out = []

  console.log(current)

  for (const entry in tree) {
    if (!entry.startsWith('@')) {
      out.push(compileSchema())
    }
  }
}

module.exports = compiler
