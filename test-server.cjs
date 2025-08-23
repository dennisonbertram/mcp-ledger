#!/usr/bin/env node

const { spawn } = require('child_process');

// Start the MCP server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Test messages to send
const testMessages = [
  // 1. Initialize the MCP connection
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: {
          listChanged: true
        },
        sampling: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },
  
  // 2. List available tools
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  },
  
  // 3. Test get_balance tool
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_balance",
      arguments: {
        address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        network: "mainnet"
      }
    }
  },

  // 4. Test get_contract_abi tool  
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "get_contract_abi",
      arguments: {
        address: "0xA0b86a33E6842d1e87ea5b7dE5bf3b7Cdb74dA9B",
        network: "mainnet"
      }
    }
  }
];

let messageIndex = 0;

// Handle server responses
server.stdout.on('data', (data) => {
  const response = data.toString();
  console.log(`Response ${messageIndex}: ${response}`);
  
  // Send next message after receiving response
  if (messageIndex < testMessages.length) {
    setTimeout(() => {
      const message = testMessages[messageIndex];
      console.log(`\nSending message ${messageIndex + 1}:`, JSON.stringify(message, null, 2));
      server.stdin.write(JSON.stringify(message) + '\n');
      messageIndex++;
    }, 1000);
  } else {
    // All tests done, close server
    setTimeout(() => {
      console.log('\nAll tests completed, shutting down server...');
      server.kill('SIGTERM');
    }, 2000);
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Start testing by sending the first message
console.log('Starting MCP server test...\n');
setTimeout(() => {
  const message = testMessages[messageIndex];
  console.log(`Sending message ${messageIndex + 1}:`, JSON.stringify(message, null, 2));
  server.stdin.write(JSON.stringify(message) + '\n');
  messageIndex++;
}, 1000);