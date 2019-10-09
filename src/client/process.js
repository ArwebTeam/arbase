'use strict'

/* eslint-disable guard-for-in */

const Joi = require('@hapi/joi')

async function decodeAndValidate (entry, data, half) {
  const decoded = entry.message.decode(data)

  const validator = half ? {} : entry.validator

  for (const key in decoded) {
    const attr = entry.attribute[key]

    if (attr.decode) {
      decoded[key] = await attr.decode(decoded[key])
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

async function validateAndEncode (entry, data, half) {
  const validator = half ? {} : entry.validator

  for (const key in data) {
    const attr = entry.attribute[key]

    if (attr.encode) {
      data[key] = await attr.encode(data[key])
    }

    if (half) {
      validator[key] = attr.validator
    }
  }

  const {error, value} = (half ? Joi.object(validator) : validator).validate(data)

  if (error) {
    throw error
  }

  return entry.message.encode(value)
}

function decodeTxData (tx) {
  return Buffer.from(tx.get('data', {decode: true}))
}

function encodeTxData (data) {
  return new Uint8Array(data)
}

module.exports = {
  decodeAndValidate,
  validateAndEncode,
  decodeTxData,
  encodeTxData
}
