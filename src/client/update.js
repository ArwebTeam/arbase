'use strict'

const crypto = require('crypto')
// TODO: use hex id, store binary
const getRandomID = () => crypto.randomBytes(16).toString('hex')

const { validateAndEncode, encodeTxData } = require('./process')

async function createTx (data, arweave, rid) {
  const tx = await arweave.createTransaction({
    data: encodeTxData(data)
  }, arweave.jwk)

  tx.addTag('i', rid)
  tx.rid = rid

  return tx
}

// TODO: do some verification before creating the TX

async function entryCreate (arweave, entry, tags, val) {
  const tx = await createTx(await validateAndEncode(entry, val), arweave, getRandomID())

  for (const tag in tags) { // eslint-disable-line guard-for-in
    tx.addTag(tag, tags[tag])
  }

  tx.addTag('a', 'c')

  return tx
}

async function entryModify (arweave, entry, rid, tags, diff) {
  const tx = await createTx(await validateAndEncode(entry, diff, true), arweave, rid)

  for (const tag in tags) { // eslint-disable-line guard-for-in
    tx.addTag(tag, tags[tag])
  }

  tx.addTag('a', 'e')

  return tx
}

async function entryDelete (arweave, entry, rid, tags) {
  const tx = await createTx(Buffer.from(''), arweave, rid) // TODO: add contents

  for (const tag in tags) { // eslint-disable-line guard-for-in
    tx.addTag(tag, tags[tag])
  }

  tx.addTag('a', 'd')

  return tx
}

module.exports = (arweave, e) => {
  const out = {
    entryCreate,
    entryModify,
    entryDelete
  }

  for (const fnc in out) { // eslint-disable-line guard-for-in
    const o = out[fnc]
    out[fnc] = (...a) => o(arweave, ...a)
  }

  return out
}
