'use strict'

const loader = require('./loader')
const validator = require('./validator')
const compiler = require('./compiler')

module.exports = async (src) => {
  const contents = await loader(src)
  validator(contents)
  return compiler(contents)
}
