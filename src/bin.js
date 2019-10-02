#!/usr/bin/env node

'use strict'

const generate = require('.')
generate(process.argv[2], process.argv[3])
  .then(out => {
    console.log(out)
  })
  .catch(err => {
    console.error(err.stack)
    process.exit(2)
  })
