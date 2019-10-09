'use strict'

const loader = require('./loader')
const validator = require('./validator')
const compiler = require('./compiler')
const render = require('./render')

module.exports = async (src, process) => {
  const contents = await loader(src)
  validator(contents)
  const compiled = compiler({}, contents)
  const rendered = render(compiled)
  return rendered
}
