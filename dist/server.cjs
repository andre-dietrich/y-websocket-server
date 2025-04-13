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

// Display help information
function showHelp() {
  console.log('Y-WebSocket Server - A WebSocket server for Yjs');
  console.log('\nUsage:');
  console.log('  node server.js [options]');
  console.log('\nOptions:');
  console.log(
    '  --port, --port=NUMBER       Port to listen on (default: 1234 or $PORT env)'
  );
  console.log(
    '  --host, --host=STRING       Host to bind to (default: 0.0.0.0 or $HOST env)'
  );
  console.log('  --help, -h                  Show this help message');
  console.log('\nEnvironment Variables:');
  console.log('  PORT                        Alternative to --port');
  console.log('  HOST                        Alternative to --host');
  console.log(
    '  NODE_ENV                    Environment (development/production)'
  );
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--port' && i + 1 < args.length) {
      result.port = args[++i];
    } else if (arg === '--host' && i + 1 < args.length) {
      result.host = args[++i];
    } else if (arg.startsWith('--port=')) {
      result.port = arg.substring('--port='.length);
    } else if (arg.startsWith('--host=')) {
      result.host = arg.substring('--host='.length);
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }

  return result
}

const args = parseArgs();

// Show help and exit if --help or -h was provided
if (args.help) {
  showHelp();
  process.exit(0);
}

const wss = new WebSocket.Server({ noServer: true });

// Priority: command line args > environment variables > defaults
const host = args.host || process.env.HOST || '0.0.0.0';
const port = number__namespace.parseInt(String(args.port || process.env.PORT || '1234'));

console.warn(`host: ${host}`);
console.warn(`port: ${port}`);

// Add CORS headers for browser support
const server = http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return
  }

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
