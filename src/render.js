'use strict'

const mainTable = {
  entry: (val) => strNoTable(val, (entry) => str(entry, entryTable))
}

const entryTable = {
  validator: (v) => v
}

function str (data, table) {
  let keys = []

  for (const key in data) { // eslint-disable-line guard-for-in
    keys.push(`${JSON.stringify(key)}:${(table[key] || JSON.stringify)(data[key])}`)
  }

  let out = ['{', keys.join(','), '}']

  return out.join('')
}

function strNoTable (data, every) {
  let keys = []

  for (const key in data) { // eslint-disable-line guard-for-in
    keys.push(`${JSON.stringify(key)}:${every(data[key])}`)
  }

  let out = ['{', keys.join(','), '}']

  return out.join('')
}

const fs = require('fs')
const template = String(fs.readFileSync(require.resolve('./renderTemplate.js')))

module.exports = (data) => {
  const out = str(mainTable, mainTable)
  template.replace("'$DATA'", out)
}
