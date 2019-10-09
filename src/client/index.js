'use strict'

module.exports = (arweave) => {
  return {
    read: require('./fetch')(arweave),
    write: require('./update')(arweave)
  }
}
