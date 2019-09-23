'use strict'

function compiler (tree, current, ...parents) {
  if (!current) {
    const {'@main': main} = tree
    current = tree[main]
  }

  let out = []

  for (const entry in tree) {
    if (!entry.startsWith('@')) {
      out.push(compileSchema())
    }
  }
}
