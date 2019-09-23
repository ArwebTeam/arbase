'use strict'

const {parse: parseAcl} = require('./acl')

const aclFields = ['fixed', 'initial', 'append', 'remove']

const nativeTypes = ['file', 'string', 'number']

function validator (tree, current, ...parents) {
  if (!current) {
    const {'@main': main} = tree

    current = tree[main]
  }

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

        if (nativeTypes.indexOf(type) !== -1) {
          // we have a native type, all clear
        } else {
          let subType = current[type]

          if (!subType) {
            throw new TypeError('Invalid or missing type ' + type)
          }

          validator(tree, subType, current, ...parents)
        }

        attr.modify = attr.modify.map(parseAcl)
        attr.modify.forEach(validateAcl)

        break
      }

      case Boolean((match = attr.type.match(/^([a-z0-9]+)$/i))): { // type
        let type = match[1]
        let subType

        if (nativeTypes.indexOf(type) !== -1) {
          // we have a native type, all clear
        } else {
          subType = current[type]

          if (!subType) {
            throw new TypeError('Invalid or missing type ' + type)
          }

          validator(tree, subType, current, ...parents)
        }

        attr.append = attr.append.map(parseAcl)
        attr.append.forEach(validateAcl)

        attr.delete = attr.delete.map(parseAcl)
        attr.delete.forEach((acl) => validateAcl(acl, subType))

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

        validator(subNs, subType, current, ...parents)

        attr.modify = attr.modify.map(parseAcl)
        attr.modify.forEach(validateAcl)

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

        validator(subNs, subType, current, ...parents)

        attr.append = attr.append.map(parseAcl)
        attr.append.forEach(validateAcl)

        attr.delete = attr.delete.map(parseAcl)
        attr.delete.forEach((acl) => validateAcl(acl, subType))

        break
      }

      default: {
        throw new TypeError('Invalid type ' + attr.type)
      }
    }
  }
}

module.exports = validator
