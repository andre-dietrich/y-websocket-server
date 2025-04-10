#!/usr/bin/env node

import WebSocket from 'ws'
import http from 'http'
import * as number from 'lib0/number'
import { setupWSConnection } from './utils.js'

const wss = new WebSocket.Server({ noServer: true })
const host = process.env.HOST || '0.0.0.0'
const port = number.parseInt(process.env.PORT || '1234')

console.warn(`host: ${host}`)
console.warn(`port: ${port}`)

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

wss.on('connection', setupWSConnection)

server.on('upgrade', (request, socket, head) => {
  console.log(`Upgrade request received: ${request.url}`)

  try {
    wss.handleUpgrade(
      request,
      socket,
      head,
      /** @param {any} ws */ (ws) => {
        console.log('WebSocket connection established')
        wss.emit('connection', ws, request)
      }
    )
  } catch (error) {
    console.error('WebSocket upgrade error:', error)
    socket.destroy()
  }
})

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
  console.log(
    `WebSocket server started, environment: ${
      process.env.NODE_ENV || 'development'
    }`
  )
})

// Add error handlers
server.on('error', (err) => {
  console.error('Server error:', err)
})

wss.on('error', (err) => {
  console.error('WebSocket server error:', err)
})
