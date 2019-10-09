'use strict'

/* eslint-disable guard-for-in */

const Joi = require('@hapi/joi')

async function decodeAndValidate (entry, data, half) {
  const decoded = entry.message.decode(data)

  const validator = half ? {} : entry.validator

  for (const key in decoded) {
    const attr = entry.attribute[key]

    if (attr.decode) {
      decoded[key] = await attr.decode()
    }

    if (half) {
      validator[key] = attr.validator
    }
  }

  const {error, value} = (half ? Joi.object(validator) : validator).validate(decoded)

  if (error) {
    throw error
  }

  return value
}

module.exports = {
  decodeAndValidate
}
