'use strict'

const protons = require('protons') // TODO: use pre-compiled protobufjs
const Joi = require('@hapi/joi')

const connector = require('arbase/src/connector')

const data = '$DATA'

connector(data)

let baseMessage = `

enum ListEventType {
  append = 1;
  delete = 2;
}

message ListEvent {
  ListEventType type = 1;
  bytes blockId = 2;
}

`

// TODO: use pre-compiled protobufjs

data.entries.forEach(entry => {
  baseMessage += entry.message
})

data.messages = protons(baseMessage)

data.entries.forEach(entry => {
  entry.message = data.messages[entry.fullNameSafe]
})

module.exports = data
