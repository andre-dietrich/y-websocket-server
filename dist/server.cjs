#!/usr/bin/env node
'use strict';

var WebSocket = require('ws');
var http = require('http');
var number = require('lib0/number');
var utils = require('./utils.cjs');
var os = require('os');
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

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  underscore: '\x1b[4m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgGreen: '\x1b[42m'};

// Helper functions for colored output
const info = (text) => `${colors.cyan}${text}${colors.reset}`;
const success = (text) => `${colors.green}${text}${colors.reset}`;
const warning = (text) => `${colors.yellow}${text}${colors.reset}`;
const error = (text) => `${colors.red}${text}${colors.reset}`;
const header = (text) =>
  `${colors.bright}${colors.magenta}${text}${colors.reset}`;
const highlight = (text) =>
  `${colors.bgGreen}${colors.black}${colors.bright}${text}${colors.reset}`;
const url = (text) =>
  `${colors.underscore}${colors.green}${text}${colors.reset}`;

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

// New function to get local network information
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];

    if (!networkInterface) continue
    for (const iface of networkInterface) {
      // Skip internal and non-IPv4 addresses
      if (!iface.internal && iface.family === 'IPv4') {
        addresses.push({
          interface: interfaceName,
          address: iface.address,
          netmask: iface.netmask,
        });
      }
    }
  }

  return addresses
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
  console.log(`${info('Upgrade request received:')} ${url(request.url)}`);

  try {
    wss.handleUpgrade(
      request,
      socket,
      head,
      /** @param {any} ws */ (ws) => {
        console.log(`${success('WebSocket connection established')}`);
        wss.emit('connection', ws, request);
      }
    );
  } catch (e) {
    console.error(`${error('WebSocket upgrade error:')} ${e}`);
    socket.destroy();
  }
});

server.listen(port, host, () => {
  console.log(`\n${header('=== Y-WebSocket Server ===')}`);
  console.log(`${info('Server running at:')} ${success(`${host}:${port}`)}`);
  console.log(
    `${info('Environment:')} ${success(process.env.NODE_ENV || 'development')}`
  );

  // Add detailed network information
  console.log(`\n${header('Local Network Information:')}`);
  const networkInfo = getNetworkInfo();

  if (networkInfo.length === 0) {
    console.log(warning('  No network interfaces detected'));
  } else {
    networkInfo.forEach((info, index) => {
      console.log(
        `\n  ${header(`Interface ${index + 1}:`)} ${success(info.interface)}`
      );
      console.log(`  ${header('IP Address:')} ${success(info.address)}`);
      console.log(
        `  ${header('WebSocket URL:')} ${url(`ws://${info.address}:${port}`)}`
      );
      console.log(
        `  ${header('Secure WebSocket URL:')} ${url(
          `wss://${info.address}:${port}`
        )}`
      );
    });
  }

  console.log(
    `\n${header('To access from this machine:')} ${highlight(
      ` ws://localhost:${port} `
    )}`
  );
  console.log(`${header('==============================')}\n`);
});

// Add error handlers
server.on('error', (err) => {
  console.error(`${error('Server error:')} ${err}`);
});

wss.on('error', (err) => {
  console.error(`${error('WebSocket server error:')} ${err}`);
});
//# sourceMappingURL=server.cjs.map
