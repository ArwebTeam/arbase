'use strict'

/* eslint-disable guard-for-in */

function listConnect (list, map) {
  for (const key in map) {
    map[key] = list[map[key]]
  }
}

function listConnectLvl2 (list, map) {
  for (const key in map) {
    for (const subKey in map[key]) {
      map[key][subKey] = list[map[key][subKey]]
    }
  }
}

module.exports = ({entries, entry}) => {
  entries.forEach(entry => {
    listConnect(entry.attributes, entry.attribute)
  })

  listConnectLvl2(entries, entry)
}
