#!/usr/bin/env node
'use strict';

var WebSocket = require('ws');
var http = require('http');
var number = require('lib0/number');
var utils = require('./utils.cjs');
require('yjs');
require('y-protocols/sync');
require('y-protocols/awareness');
require('lib0/encoding');
require('lib0/decoding');
require('lib0/map');
require('lib0/eventloop');
require('y-leveldb');
require('./callback.cjs');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var number__namespace = /*#__PURE__*/_interopNamespaceDefault(number);

const wss = new WebSocket.Server({ noServer: true });
const host = process.env.HOST || '0.0.0.0';
const port = number__namespace.parseInt(process.env.PORT || '1234');

console.warn(`host: ${host}`);
console.warn(`port: ${port}`);

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

wss.on('connection', utils.setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  console.log(`Upgrade request received: ${request.url}`);

  try {
    wss.handleUpgrade(
      request,
      socket,
      head,
      /** @param {any} ws */ (ws) => {
        console.log('WebSocket connection established');
        wss.emit('connection', ws, request);
      }
    );
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    socket.destroy();
  }
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
  console.log(
    `WebSocket server started, environment: ${
      process.env.NODE_ENV || 'development'
    }`
  );
});

// Add error handlers
server.on('error', (err) => {
  console.error('Server error:', err);
});

wss.on('error', (err) => {
  console.error('WebSocket server error:', err);
});
//# sourceMappingURL=server.cjs.map
