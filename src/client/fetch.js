'use strict'

const arlang = require('arlang')
const $arql = arlang.short('sym')
const Boom = require('@hapi/boom')

const {decodeAndValidate} = require('./process')

const queue = require('../queue')()

/*

"$topicId" && "posts" && "$postId" && "replies" && <anything> && ( "#" || null)
 path0         path1      path2        path3       path4           path5

even is an id, uneven is a property name or "#" for "edits" (oplog)

*/

function fetchTransaction (arweave, id) {
  return arweave.transactions.get(id)
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

module.exports = (arweave) => {
  return {
    list: async (entry, listEntry, id, list) => {
      let data = []
      let idMap = {}

      const {data: txs, live} = await arweave.arql($arql('& (= block $1) (= child $2)', id, list))

      // TODO: better queuing
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

      return {data: data.filter(Boolean), live}
    },
    entry: async function fetchEntry (arweave, entry, id) {
      let obj

      try {
        obj = decodeAndValidate(entry, (await fetchTransaction(arweave, id)).data)
      } catch (err) {
        if (err.type === 'TX_NOT_FOUND') {
          throw Boom.notFound('Block base transaction not found')
        }

        if (err.type === 'TX_INVALID') {
          throw Boom.notFound('Supplied block base transaction ID invalid')
        }

        throw err
      }

      const {data: txs, live} = await arweave.arql($arql('& (= block $1) (= child "#")', id))

      queue.init(id, 3, 50)

      const txLog = txs.reverse().map(() => queue(id, async () => {
        const fetched = await fetchTransaction(id)
        return validateEntry(entry, fetched, false)
      }))

      for (let i = txLog.length; i > -1; i--) {
        const tx = await txLog[i]
        if (tx) {
          const {data} = await fetchTransaction(tx)
          obj = joinOplog(obj, decodeAndValidate(entry, data, true))
        }
      }

      return {data: obj, live}
    }
  }
}
