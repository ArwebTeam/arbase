'use strict'

module.exports = {
  compileBaseSchemaValidator: () => {
    return `Joi.string()` // TODO: add something about format so it's a valid blockId
  }
}
