'use strict'

module.exports = {
  parse: (str) => {
    let i = 0

    let curBlock = 'type'

    let out = {}

    let depth = 0

    function unexpectedCharacter (expected) {
      throw new SyntaxError(`Unexpected character ${str[i]} at ${i}, expected ${expected}`)
    }

    while (str.length > i) {
      let cur = str[i]

      switch (curBlock) {
        case 'type': {
          switch (true) {
            case cur === '#': {
              curBlock = 'prev'
              break
            }
            case cur === '$': {
              curBlock = 'next'
              break
            }
            default: {
              unexpectedCharacter('$ or #')
            }
          }

          break
        }
        case 'prev': {
          if (cur === '#') {
            depth++
            i++
          } else if (cur === '.' || cur === '~') {
            out.mode = 'prev'
            out.depth = depth

            curBlock = 'access'
          } else {
            unexpectedCharacter('#, . or ~')
          }

          break
        }
        case 'next': {
          if (cur === '#') {
            depth++
            i++
          } else if (cur === '.' || cur === '~') {
            out.mode = 'next'
            out.depth = depth

            curBlock = 'access'
          } else {
            unexpectedCharacter('#, . or ~')
          }

          break
        }
        case 'access': {
          if (cur === '.') {
            out.type = 'property'
            out.name = ''
            i++

            curBlock = 'name'
          } else if (cur === '~') {
            out.type = 'acl'
            out.name = ''
            i++

            curBlock = 'name'
          } else {
            unexpectedCharacter('. or ~')
          }

          break
        }
        case 'name': {
          if (cur.match(/^[a-z0-9]$/i)) {
            out.name += cur
            i++
          } else {
            unexpectedCharacter('a letter or number')
          }

          break
        }
        default: {
          throw new TypeError(curBlock)
        }
      }
    }
  },
  stringify: (out) => {
    const modeMap = {prev: '#', next: '$'}
    const accessMap = {acl: '~', property: '.'}

    // TODO: validate

    return modeMap[out.mode].repeat(out.depth) + accessMap[out.type] + out.name
  }
}
