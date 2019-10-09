'use strict'

const fs = require('fs')
const Joi = require('@hapi/joi')

// TODO: add type to validate acl-references and possibly parse during validation

const aclSchema = Joi.object({
  initial: Joi.array().items(Joi.string()).default([]),
  fixed: Joi.array().items(Joi.string()).default([]),
  append: Joi.array().items(Joi.string()).default([]),
  delete: Joi.array().items(Joi.string()).default([])
})

const attributeSchema = Joi.object({ // TODO: make 2 validators, one for list one for normal attr
  id: Joi.number().integer().required(),
  type: Joi.string().required(),
  maxSize: Joi.number().integer(),
  notNull: Joi.boolean().default(false),
  modify: Joi.array().items(Joi.string()).default([]),
  append: Joi.array().items(Joi.string()).default([]),
  delete: Joi.array().items(Joi.string()).default([])
})

const entrySchema = Joi.object({
  acl: Joi.object().pattern(/./, aclSchema),
  attributes: Joi.object().pattern(/./, attributeSchema)
})

const schema = Joi.object({
  '@main': Joi.string().required(),
  '@imports': Joi.object().pattern(/./, Joi.string()).default({}) // TODO: validate path schema
}).pattern(/./, entrySchema)

const loadType = { // TODO: "steal" from parcel?
  fs: async (path) => {
    return JSON.parse(String(fs.readFileSync(path))) // todo: rel path?
  },
  node: async (path) => {
    return require(path)
  }
}

async function loadTreeRecursivly (srcStr) {
  const [type, path] = srcStr.split(':')

  let contents = await loadType[type](path) // TODO: validation of type, read error catch

  const {value, error} = schema.validate(contents)

  if (error) {
    throw error
  }

  contents = value

  for (const _import in contents['@imports']) { // eslint-disable-line guard-for-in
    contents['@imports'][_import] = await loadTreeRecursivly(contents['@imports'][_import])
  }

  return contents
}

module.exports = loadTreeRecursivly
