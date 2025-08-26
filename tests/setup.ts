/**
 * Jest test setup configuration
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test configuration
global.console = {
  ...console,
  // Suppress console logs during testing unless explicitly needed
  log: jest.fn(),
  error: console.error,
  warn: console.warn,
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock Node.js timers
jest.useFakeTimers();

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});