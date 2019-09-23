'use strict'

const fs = require('fs')
const Joi = require('@hapi/joi')

// TODO: add type to validate acl-references and possibly parse during validation

const aclSchema = Joi.object({
  initial: Joi.array().items(Joi.string()),
  fixed: Joi.array().items(Joi.string()),
  append: Joi.array().items(Joi.string()),
  delete: Joi.array().items(Joi.string())
})

const attributeSchema = Joi.object({
  type: Joi.string().required(),
  maxSize: Joi.number().integer(),
  notNull: Joi.boolean().default(false),
  modify: Joi.array().items(Joi.string())
})

const entrySchema = Joi.object({
  acl: Joi.object().pattern(/./, aclSchema),
  attributes: Joi.object().pattern(/./, attributeSchema)
})

const schema = Joi.object({
  '@main': Joi.string().required(),
  '@imports': Joi.object().pattern(/./, Joi.string()) // TODO: validate path schema
}).pattern(/./, entrySchema)

const loadType = { // TODO: "steal" from parcel?
  fs: async (path) => {
    return JSON.parse(String(fs.readFileSync(path))) // todo: rel path?
  },
  npm: async (path) => {
    return require(path)
  }
}

async function loadTreeRecursivly (srcStr) {
  const [type, path] = srcStr.split(':')

  const contents = await loadType[type](path) // TODO: validation of type, read error catch

  // TODO: Joi validate

  contents['@imports'] = contents['@imports'] || {}

  for (const _import in contents['@imports']) { // eslint-disable-line guard-for-in
    contents['@imports'][_import] = await loadTreeRecursivly(contents['@imports'][_import])
  }

  return contents
}

module.exports = loadTreeRecursivly
