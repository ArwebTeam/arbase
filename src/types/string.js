'use strict'

module.exports = {
  compileBaseSchemaValidator: () => {
    return `Joi.string()` // TODO: max len?
  },

  protobufSchemaType: 'string'
}
