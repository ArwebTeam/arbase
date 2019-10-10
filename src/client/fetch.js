'use strict'

const arlang = require('arlang')
const $arql = arlang.short('sym')
const Boom = require('@hapi/boom')

const { decodeAndValidate, decodeAndValidateList, ListEventType, decodeTxData } = require('./process')

const queue = require('../queue')()

/*

"$topicId" && "posts" && "$postId" && "replies" && <anything> && ( "#" || null)
 path0         path1      path2        path3       path4           path5

even is an id, uneven is a property name or "#" for "edits" (oplog)

*/

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

  switch (data.type) {
    case ListEventType.APPEND: {
      idMap[data.target] = data.push(data.target)
      break
    }
    case ListEventType.DELETE: {
      delete data[idMap[data.target]]
      break
    }
    default: {
      throw new TypeError(data.op)
    }
  }
}

module.exports = (arweave) => {
  async function fetchTransaction (id) {
    return decodeTxData(await arweave.transactions.get(id))
  }

  const f = {
    list: async (entry, listEntry, id, parse) => {
      let data = []
      let idMap = {}

      const {data: txs, live} = await arweave.arql($arql('& (= block $1) (= child $2)', id, String(listEntry.id)))

      // TODO: better queuing
      queue.init(id, 3, 50)

      const txLog = txs.reverse().map(() => queue(id, async () =>
        decodeAndValidateList(await fetchTransaction(id))))

      for (let i = txLog.length; i > -1; i--) {
        const tx = await txLog[i]
        if (tx) {
          data = joinListOplog(data, idMap, tx)
        }
      }

      if (!parse) {
        return {data: data.filter(Boolean), live}
      }

      const { offset, limit } = parse

      // TODO: use id as cursor
      const total = data.filter(Boolean).length
      const range = data.filter(Boolean).reverse().slice(offset, offset + limit)

      return {
        data: range,
        total,
        live
      }
    },
    entry: async function fetchEntry (entry, id) {
      let obj

      try {
        obj = await decodeAndValidate(entry, await fetchTransaction(id))
      } catch (err) {
        if (err.type === 'TX_NOT_FOUND') {
          throw Boom.notFound('Block base transaction not found')
        }

        if (err.type === 'TX_INVALID') {
          throw Boom.notFound('Supplied block base transaction ID invalid')
        }

        if (err.type === 'TX_PENDING') {
          throw Boom.notFound('Transaction is still pending (TODO fetch from arswarm)')
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
          const data = await fetchTransaction(tx)
          obj = joinOplog(obj, await decodeAndValidate(entry, data, true))
        }
      }

      return {data: obj, live}
    }
  }

  return f
}
