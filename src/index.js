'use strict'

const loader = require('./loader')
const validator = require('./validator')
const compiler = require('./compiler')

module.exports = async (src, process) => {
  const contents = await loader(src)
  const processor = require(process + '/' + require(process + '/package.json').compile)
  validator(contents)
  const compiled = compiler({}, contents)
  const processed = processor(compiled, require('./helper'))
  return processed
}
