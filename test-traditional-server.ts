#!/usr/bin/env node

/**
 * Test script for the traditional MCP Ledger server
 * Tests the server's tools and capabilities without requiring hardware
 */

import { spawn } from 'child_process';
import { join } from 'path';

async function testTraditionalMCPServer() {
  console.log('🧪 Testing Traditional MCP Ledger Server\n');

  const serverPath = join(process.cwd(), 'dist', 'index.js');
  console.log(`📍 Server path: ${serverPath}\n`);

  // Create test messages
  const testMessages = [
    // Initialize the server
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    },
    // List available tools
    {
      jsonrpc: '2.0', 
      id: 2,
      method: 'tools/list'
    },
    // Test get_balance tool (should work without hardware)
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_balance',
        arguments: {
          address: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
          network: 'mainnet'
        }
      }
    },
    // Test get_contract_abi tool
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call', 
      params: {
        name: 'get_contract_abi',
        arguments: {
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          network: 'mainnet'
        }
      }
    }
  ];

  return new Promise((resolve, reject) => {
    console.log('🚀 Starting MCP server...\n');
    
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DUNE_SIM_API_KEY: 'test-key' // Provide test key
      }
    });

    let responseCount = 0;
    let buffer = '';

    server.stdout?.on('data', (data) => {
      buffer += data.toString();
      
      // Process complete JSON-RPC messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            responseCount++;
            
            console.log(`📨 Response ${responseCount}:`);
            console.log(JSON.stringify(response, null, 2));
            console.log('');
            
            // Send next message if available
            if (testMessages[responseCount]) {
              const nextMessage = JSON.stringify(testMessages[responseCount]) + '\n';
              server.stdin?.write(nextMessage);
              console.log(`📤 Sent message ${responseCount + 1}:`);
              console.log(JSON.stringify(testMessages[responseCount], null, 2));
              console.log('');
            } else {
              // All tests complete
              console.log('✅ All tests completed successfully!\n');
              server.kill();
              resolve(true);
            }
            
          } catch (error) {
            console.log(`📄 Non-JSON output: ${line}`);
          }
        }
      }
    });

    server.stderr?.on('data', (data) => {
      console.log(`❌ Server error: ${data.toString()}`);
    });

    server.on('close', (code) => {
      if (code === 0) {
        console.log('🎉 Server closed successfully');
        resolve(true);
      } else {
        console.log(`❌ Server closed with code ${code}`);
        reject(new Error(`Server failed with code ${code}`));
      }
    });

    server.on('error', (error) => {
      console.log(`❌ Failed to start server: ${error}`);
      reject(error);
    });

    // Start the conversation
    const initMessage = JSON.stringify(testMessages[0]) + '\n';
    server.stdin?.write(initMessage);
    console.log('📤 Sent initialization message:');
    console.log(JSON.stringify(testMessages[0], null, 2));
    console.log('');

    // Timeout after 30 seconds
    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout after 30 seconds'));
    }, 30000);
  });
}

// Run the test
testTraditionalMCPServer()
  .then(() => {
    console.log('🎉 Traditional MCP server test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Traditional MCP server test failed:', error);
    process.exit(1);
  });