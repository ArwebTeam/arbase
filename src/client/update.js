'use strict'

const {validateAndEncode} = require('./process')

async function createTx (data, arweave) {
  return arweave.createTransaction({
    data
  }, arweave.jwk)
}

// TODO: do some verification before creating the TX

async function entryCreate (arweave, entry, val) {
  const tx = await createTx(validateAndEncode(entry, val), arweave)

  return tx
}

async function entryModify (arweave, entry, id, diff) {
  const tx = await createTx(validateAndEncode(entry, diff, true), arweave)
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
async function listAppend (arweave, entry, id, targetList, targetId) {
  const tx = await createTx({ op: 'append', target: targetId }, arweave)
  tx.addTag('block', id)
  tx.addTag('child', targetList)

  return tx
}

async function listRemove (arweave, entry, id, targetList, targetId) {
  const tx = await createTx({ op: 'delete', target: targetId }, arweave)
  tx.addTag('block', id)
  tx.addTag('child', targetList)

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
}
