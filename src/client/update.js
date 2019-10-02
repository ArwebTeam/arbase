'use strict'

async function createTx (data, arweave) {
  return arweave.createTransaction({
    data: Buffer.from(JSON.stringify(data))
  }, arweave.jwk)
}

// TODO: do some verification before creating the TX

async function entryModify (arweave, entry, id, diff) {
  const tx = await createTx(diff)
  tx.addTag('block', id)
  tx.addTag('child', '#')

  return tx
}

async function entryDelete (arweave, entry, id, diff) {
  const tx = await createTx({$delete: true})
  tx.addTag('block', id)
  tx.addTag('child', '#')

  return tx
}

async function listAppend (arweave, entry, id, targetList, targetId) {
  const tx = await createTx({ op: 'append', target: targetId })
  tx.addTag('block', id)
  tx.addTag('child', targetList)

  return tx
}

async function listRemove (arweave, entry, id, targetList, targetId) {
  const tx = await createTx({ op: 'delete', target: targetId })
  tx.addTag('block', id)
  tx.addTag('child', targetList)

  return tx
}

module.exports = {
  entryModify,
  entryDelete,
  listAppend,
  listRemove
}
