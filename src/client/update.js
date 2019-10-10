'use strict'

const { validateAndEncode, validateAndEncodeList, ListEventType, encodeTxData } = require('./process')

async function createTx (data, arweave) {
  return arweave.createTransaction({
    data: encodeTxData(data)
  }, arweave.jwk)
}

// TODO: do some verification before creating the TX

async function entryCreate (arweave, entry, val) {
  const tx = await createTx(await validateAndEncode(entry, val), arweave)

  return tx
}

async function entryModify (arweave, entry, id, diff) {
  const tx = await createTx(await validateAndEncode(entry, diff, true), arweave)
  tx.addTag('block', id)
  tx.addTag('child', '#')

  return tx
}

async function entryDelete (arweave, entry, id, diff) {
  const tx = await createTx(/* TODO */ '', arweave)
  tx.addTag('block', id)
  tx.addTag('child', '#')

  return tx
}

// TODO: rewrite below
async function listAppend (arweave, entry, listEntry, id, blockId) {
  const tx = await createTx(await validateAndEncode({ type: ListEventType.APPEND, blockId }), arweave)
  tx.addTag('block', id)
  tx.addTag('child', String(listEntry.id))

  return tx
}

async function listRemove (arweave, entry, listEntry, id, blockId) {
  const tx = await createTx(await validateAndEncode({ type: ListEventType.DELETE, blockId }), arweave)
  tx.addTag('block', id)
  tx.addTag('child', String(listEntry.id))

  return tx
}

module.exports = (arweave) => {
  const out = {
    entryCreate,
    entryModify,
    entryDelete,
    listAppend,
    listRemove
  }

  for (const fnc in out) { // eslint-disable-line guard-for-in
    const o = out[fnc]
    out[fnc] = (...a) => o(arweave, ...a)
  }

  return out
}
