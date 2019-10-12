'use strict'

const crypto = require('crypto')
const getRandomID = () => crypto.randomBytes(16).toString('hex')

const { validateAndEncode, encodeTxData } = require('./process')

async function createTx (data, arweave) {
  return arweave.createTransaction({
    data: encodeTxData(data)
  }, arweave.jwk)
}

// TODO: do some verification before creating the TX

async function entryCreate (arweave, entry, tags, val) {
  const tx = await createTx(await validateAndEncode(entry, val), arweave)
  const rid = getRandomID()

  for (const tag in tags) { // eslint-disable-line guard-for-in
    tx.addTag(tag, tags[tag])
  }

  tx.addTag('i', rid)
  tx.addTag('a', 'c')

  return tx
}

async function entryModify (arweave, entry, rid, tags, diff) {
  const tx = await createTx(await validateAndEncode(entry, diff, true), arweave)

  for (const tag in tags) { // eslint-disable-line guard-for-in
    tx.addTag(tag, tags[tag])
  }

  tx.addTag('i', rid)
  tx.addTag('a', 'e')

  return tx
}

async function entryDelete (arweave, entry, rid, tags) {
  const tx = await createTx(Buffer.from(''), arweave)

  for (const tag in tags) { // eslint-disable-line guard-for-in
    tx.addTag(tag, tags[tag])
  }

  tx.addTag('i', rid)
  tx.addTag('a', 'd')

  return tx
}

module.exports = (arweave, entries) => {
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
