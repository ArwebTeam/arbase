'use strict'

const x = require('base-x')
const b = x('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-')

module.exports = {
  compileBaseSchemaValidator: () => {
    return `Joi.string().regex(/[a-zA-Z0-9_-]{43}/)`
  },

  protobufSchemaType: 'bytes',
  decode: (val) => b.encode(val),
  encode: (val) => b.decode(val),

  resolve: async (main, obj, value) => {
    const res = await main.arweave.fetch(value)
    return {
      path: value,
      res
    }
  }
}
