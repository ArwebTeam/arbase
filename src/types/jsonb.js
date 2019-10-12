'use strict'

module.exports = {
  compileBaseSchemaValidator: () => {
    return `Joi.any()`
  },

  protobufSchemaType: 'string',
  decode: (val) => JSON.parse(val),
  encode: (val) => JSON.stringify(val)
}
