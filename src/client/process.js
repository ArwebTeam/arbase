'use strict'

/* eslint-disable guard-for-in */

const Joi = require('@hapi/joi')

const x = require('base-x')
const b = x('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-')

const protons = require('protons')
const { ListEvent, ListEventType } = protons(`

enum ListEventType {
  APPEND = 1;
  DELETE = 2;
}

message ListEvent {
  ListEventType type = 1;
  bytes blockId = 2;
}

`)

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

const listValidator = Joi.object({
  type: Joi.number().integer().required(),
  blockId: Joi.string().regex(/[a-zA-Z0-9_-]{43}/).required()
})

async function decodeAndValidateList (data) {
  const decoded = ListEvent.decode(data)

  decoded.blockId = b.encode(decoded.blockId)

  const {error, value} = listValidator.validate(data)

  if (error) {
    throw error
  }

  return value
}

async function validateAndEncodeList (data) {
  const {error, value} = listValidator.validate(data)

  value.blockId = b.decode(value.blockId)

  if (error) {
    throw error
  }

  return ListEvent.encode(value)
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

  decodeAndValidateList,
  validateAndEncodeList,
  ListEventType,

  decodeTxData,
  encodeTxData,

  b
}
