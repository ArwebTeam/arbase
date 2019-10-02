'use strict'

module.exports = {
  compileBaseSchemaValidator: () => {
    return `Joi.string()` // TODO: add something about format so it's a valid blockId
  },
  resolve: async (main, value) => {
    const res = await main.arweave.fetch(value)
    return {
      path: value,
      res
    }
  }
}
