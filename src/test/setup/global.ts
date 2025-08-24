/**
 * Global test setup and configuration
 * Runs before all tests to configure environment
 */

import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DUNE_SIM_API_KEY = 'test-dune-key';
  process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
  process.env.ETHERSCAN_API_KEY = 'test-etherscan-key';
  process.env.LEDGER_PROXY_PORT = '3001';

  // Suppress console logs during tests (unless debugging)
  if (!process.env.DEBUG_TESTS) {
    const originalConsole = { ...console };
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    
    // Restore for test results
    global.console = originalConsole;
  }

  console.log('✅ Test environment ready');
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Reset environment variables
  delete process.env.DUNE_SIM_API_KEY;
  delete process.env.ALCHEMY_API_KEY;
  delete process.env.ETHERSCAN_API_KEY;
  delete process.env.LEDGER_PROXY_PORT;
  
  console.log('✅ Test cleanup complete');
});

export {};