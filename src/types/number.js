'use strict'

module.exports = {
  compileBaseSchemaValidator: () => {
    return `Joi.number()` // TODO: min max?
  },

  protobufSchemaType: 'int64'
}
