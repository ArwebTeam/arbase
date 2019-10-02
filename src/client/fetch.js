'use strict'

const arlang = require('arlang')
const $arql = arlang.short('sym')

const queue = require('../queue')()

/*

"$topicId" && "posts" && "$postId" && "replies" && <anything> && ( "#" || null)
 path0         path1      path2        path3       path4           path5

even is an id, uneven is a property name or "#" for "edits" (oplog)

*/

// TODO: generate joi schema from entry attributes data

function fetchTransaction (id) {
  // TODO: get json
}

function validateEntry (entry, {data, tags}, isInitial) {
  // TODO: return false if invalid

  return {data, tags}
}

function joinOplog (state, delta) {
  for (const key in delta) { // eslint-disable-line guard-for-in
    state[key] = delta[key]
  }

  return state
}

async function fetchEntry (arweave, entry, id) {
  const create = await arweave.arql($arql('= id $1', id))

  const initial = validateEntry(entry, await fetchTransaction(create), true)
  let data = initial.data

  const txs = await arweave.arql($arql('& (= block $1) (= child "#")', id))

  queue.init(id, 3, 50)

  const txLog = txs.reverse().map(() => queue(id, async () => {
    const fetched = await fetchTransaction(id)
    return validateEntry(entry, fetched, false)
  }))

  for (let i = txLog.length; i > -1; i--) {
    const tx = await txLog[i]
    if (tx) {
      data = joinOplog(data, tx)
    }
  }

  return data
}

function validateListEntry (entry, listEntry, {data, tags}) {
  // TODO: return false if invalid

  return {data, tags}
}

function joinListOplog (data, idMap, tx) {
  // TODO: add

  /*

  op is either append or delete
  target is a blockId

  */

  switch (data.op) {
    case 'append': {
      idMap[data.target] = data.push(data.target)
      break
    }
    case 'delete': {
      delete data[idMap[data.target]]
      break
    }
    default: {
      throw new TypeError(data.op)
    }
  }
}

async function fetchList (arweave, entry, listEntry, id, list) {
  let data = []
  let idMap = {}

  const txs = await arweave.arql($arql('& (= block $1) (= child $2)', id, list))

  queue.init(id, 3, 50)

  const txLog = txs.reverse().map(() => queue(id, async () => {
    const fetched = await fetchTransaction(id)
    return validateListEntry(entry, listEntry, fetched)
  }))

  for (let i = txLog.length; i > -1; i--) {
    const tx = await txLog[i]
    if (tx) {
      data = joinListOplog(data, idMap, tx)
    }
  }

  return data.filter(Boolean)
}

module.exports = {
  fetchList,
  fetchEntry
}
