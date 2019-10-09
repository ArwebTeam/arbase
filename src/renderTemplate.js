'use strict'

const proto = require('protobuf')
const Joi = require('@hapi/joi')

const connector = require('arbase/src/connector')

const data = '$DATA'

connector(data)

module.exports = data
