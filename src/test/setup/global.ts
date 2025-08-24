/**
 * Global test setup and configuration
 * Runs before all tests to configure environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DUNE_SIM_API_KEY = 'test-dune-key';
process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
process.env.ETHERSCAN_API_KEY = 'test-etherscan-key';
process.env.LEDGER_PROXY_PORT = '3001';

console.log('🧪 Test environment configured');