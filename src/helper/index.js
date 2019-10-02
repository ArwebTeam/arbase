'use strict'

const strFnc = {
  validator: (v) => v
}

function stringifyEntry (entry) {
  let keys = []

  for (const key in entry) { // eslint-disable-line guard-for-in
    keys.push(`${JSON.stringify(key)}:${(strFnc[key] || JSON.stringify)(entry[key])}`)
  }

  let out = ['{', keys.join(','), '}']

  return out.join('')
}

module.exports = {
  stringifyEntry
}
