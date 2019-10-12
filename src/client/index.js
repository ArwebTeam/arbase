'use strict'

module.exports = (arweave, e) => {
  return {
    read: require('./fetch')(arweave, e),
    write: require('./update')(arweave, e)
  }
}
