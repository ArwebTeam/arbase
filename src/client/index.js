'use strict'

module.exports = (arweave, entries) => {
  return {
    read: require('./fetch')(arweave, entries),
    write: require('./update')(arweave, entries)
  }
}
