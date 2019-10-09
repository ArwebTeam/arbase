'use strict'

const protons = require('protons') // TODO: use pre-compiled protobufjs
const Joi = require('@hapi/joi')

const connector = require('arbase/src/connector')

const data = '$DATA'

connector(data)

let baseMessage = ''

// TODO: use pre-compiled protobufjs

data.entries.forEach(entry => {
  baseMessage += entry.message
})

data.messages = protons(baseMessage)

data.entries.forEach(entry => {
  entry.message = data.messages[entry.fullNameSafe]
})

signoff
