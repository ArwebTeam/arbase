'use strict'

function functionObjectStringify (o) { // stringifies as object with strings treated as literal code
  let a = []
  for (const key in o) { // eslint-disable-line guard-for-in
    let v = JSON.stringify(key) + ':'
    if (typeof o[key] === 'object') {
      v += functionObjectStringify(o[key])
    } else {
      v += o[key]
    }
    a.push(v)
  }
  return '{' + a.join(',') + '}'
}

function compileBaseSchemaValidator (entry) { // TODO: fix recursion
  let out = {}

  for (const attribute in entry.attributes) { // eslint-disable-line guard-for-in
    const attr = entry.attributes[attribute]

    if (!attr.isList) {
      if (attr.typeObj.compileBaseSchemaValidator) {
        out[attribute] = attr.typeObj.compileBaseSchemaValidator()

        if (attr.maxSize) {
          out[attribute] += `.length(${attr.maxSize})`
        }

        if (attr.notNull) {
          out[attribute] += '.required()'
        }
      } else {
        out[attribute] = compileBaseSchemaValidator(attr.typeObj)
      }
    }
  }

  return `Joi.object(${functionObjectStringify(out)}).required()`
}

function compiler (config, tree, current, ...parents) {
  if (!current) {
    const {'@main': main} = tree
    current = tree[main]
  }

  let out = []

  function compileSchema (tree, entry) {
    const validator = compileBaseSchemaValidator(entry)
    out.push({
      validator
    })
  }

  for (const entry in tree) {
    if (!entry.startsWith('@')) {
      out.push(compileSchema(tree, tree[entry]))
    }
  }
}

module.exports = compiler
