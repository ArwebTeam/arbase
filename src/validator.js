'use strict'

const {parse: parseAcl} = require('./acl')

const aclFields = ['fixed', 'initial', 'append', 'delete']

const nativeTypes = require('./types')

function validator (tree, current, ...parents) {
  if (!current) {
    const {'@main': main} = tree

    current = tree[main]
  }

  if (current.tree) {
    return // already validated
  }

  current.tree = tree

  function validateAcl (parsedAcl, subType) {
    // TODO: use parents here to validate acl
    // subType is only set for list item delete
  }

  for (const list in current.acl) { // eslint-disable-line guard-for-in
    const acl = current.acl[list]

    aclFields.forEach(field => {
      acl[field] = acl[field].map(parseAcl)
      acl[field].forEach(validateAcl)
    })
  }

  for (const attrId in current.attributes) { // eslint-disable-line guard-for-in
    const attr = current.attributes[attrId]

    let match

    switch (true) {
      case Boolean((match = attr.type.match(/^([a-z0-9]+)\[\]$/i))): { // list
        let type = match[1]
        let subType

        if ((subType = nativeTypes[type])) {
          attr.isNativeType = true
          // we have a native type, all clear
        } else {
          subType = tree[type]

          if (!subType) {
            throw new TypeError('Invalid or missing type ' + type)
          }
        }

        attr.isList = true
        attr.typeName = type
        attr.typeNs = null
        attr.typeObj = subType
        attr.typeTree = tree

        attr.modify = attr.modify.map(parseAcl)
        attr.modify.forEach(validateAcl)

        if (tree[type]) {
          validator(tree, subType, current, ...parents)
        }

        break
      }

      case Boolean((match = attr.type.match(/^([a-z0-9]+)$/i))): { // type
        let type = match[1]
        let subType

        if ((subType = nativeTypes[type])) {
          attr.isNativeType = true
          // we have a native type, all clear
        } else {
          subType = tree[type]

          if (!subType) {
            throw new TypeError('Invalid or missing type ' + type)
          }
        }

        attr.isList = false
        attr.typeName = type
        attr.typeNs = null
        attr.typeObj = subType
        attr.typeTree = tree

        attr.append = attr.append.map(parseAcl)
        attr.append.forEach(validateAcl)

        attr.delete = attr.delete.map(parseAcl)
        attr.delete.forEach((acl) => validateAcl(acl, subType))

        if (tree[type]) {
          validator(tree, subType, current, ...parents)
        }

        break
      }

      // TODO: add recursive ns madness?

      case Boolean((match = attr.type.match(/^([a-z0-9+]):([a-z0-9]+)$/i))): { // ns type
        let ns = match[1]
        let type = match[2]

        let subNs = tree['@imports'][ns]

        if (!subNs) {
          throw new Error('Undefined namespace: ' + ns)
        }

        let subType = subNs[type]

        if (!subType) {
          throw new Error(`Invalid sub-type ${type} for namespace ${ns}`)
        }

        attr.isList = false
        attr.typeName = type
        attr.typeNs = ns
        attr.typeObj = subType
        attr.typeTree = subNs

        attr.modify = attr.modify.map(parseAcl)
        attr.modify.forEach(validateAcl)

        validator(subNs, subType, current, ...parents)

        break
      }

      case Boolean((match = attr.type.match(/^([a-z0-9]+):([a-z0-9]+)\[\]$/i))): { // ns list
        let ns = match[1]
        let type = match[2]

        let subNs = tree['@imports'][ns]

        if (!subNs) {
          throw new Error('Undefined namespace: ' + ns)
        }

        let subType = subNs[type]

        if (!subType) {
          throw new Error(`Invalid sub-type ${type} for namespace ${ns}`)
        }

        attr.isList = true
        attr.typeName = type
        attr.typeNs = ns
        attr.typeObj = subType
        attr.typeTree = subNs

        attr.append = attr.append.map(parseAcl)
        attr.append.forEach(validateAcl)

        attr.delete = attr.delete.map(parseAcl)
        attr.delete.forEach((acl) => validateAcl(acl, subType))

        validator(subNs, subType, current, ...parents)

        break
      }

      default: {
        throw new TypeError('Invalid type ' + attr.type)
      }
    }
  }
}

module.exports = validator
