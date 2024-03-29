'use strict'

const mainTable = {
  entries: (val) => strArr(val, (entry) => str(entry, entryTable))
}

const entryTable = {
  validator: (v) => v,
  attributes: (val) => strArr(val, (attribute) => str(attribute, attributeTable))
}

const attributeTable = {
  validator: (v) => v
}

const signoffTable = {
  return: 'return data',
  eval: 'data',
  cjs: 'module.exports = data'
}

function str (data, table) {
  let keys = []

  for (const key in data) { // eslint-disable-line guard-for-in
    keys.push(`${JSON.stringify(key)}:${(table[key] || JSON.stringify)(data[key])}`)
  }

  let out = ['{', keys.join(','), '}']

  return out.join('')
}

function strArr (data, every) {
  let elements = data.map((el) => `${every(el)}`)

  let out = ['[', elements.join(','), ']']

  return out.join('')
}

const fs = require('fs')
const template = String(fs.readFileSync(require.resolve('./renderTemplate.js')))

module.exports = (data, {signoff}) => {
  const out = str(data, mainTable)
  return template.replace("'$DATA'", out).replace('signoff', signoffTable[signoff || 'cjs'])
}
