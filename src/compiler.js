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

function compileBaseSchemaMessage (name, attrs) {
  let out = [`message ${name} {`]

  for (const attrId in attrs) { // eslint-disable-line guard-for-in
    const attr = attrs[attrId]

    if (!attr.isList) {
      out.push(`${attr.typeObj.protobufSchemaType} ${attrId} = ${attr.id};`)
    }
  }
}

function compiler (config, tree, current, ...parents) {
  if (!current) {
    const {'@main': main} = tree
    current = tree[main]
  }

  let out = []
  let outMap = {}

  function compileSchema (tree, entry, name, ns) {
    const validator = compileBaseSchemaValidator(entry)
    const message = compileBaseSchemaMessage(name, entry.attributes)

    const attribute = {}
    let attributes = []

    for (const id in entry.attributes) { // eslint-disable-line guard-for-in
      const attr = entry.attributes[id]

      const obj = {
        name: id,
        type: {
          name: attr.typeName,
          ns: attr.typeNs,
          native: attr.isNativeType
        },
        isList: attr.isList,
        /* perm: {
          append: attr.append,
          delete: attr.delete,
          modify: attr.modify
        }, */
        val: {
          maxSize: attr.maxSize,
          notNull: attr.notNull
        }
      }

      attribute[id] = attributes.push(obj) - 1
    }

    const obj = {
      name,
      ns,
      validator,
      message,
      attribute,
      attributes
    }

    if (!outMap[ns]) { outMap[ns] = {} }
    outMap[ns][name] = out.push(obj) - 1
  }

  for (const entry in tree) { // TODO: better recursion
    if (!entry.startsWith('@')) {
      compileSchema(tree, tree[entry], entry, null)
    }
  }

  return {
    entry: out,
    entries: outMap
  }
}

module.exports = compiler
