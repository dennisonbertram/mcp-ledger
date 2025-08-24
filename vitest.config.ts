import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'node',
    
    // Global setup and teardown
    globalSetup: './src/test/setup/global.ts',
    
    // Test file patterns
    include: [
      'src/test/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/vercel/**',
      'src/proxy/**'
    ],

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'dist/**',
        '**/*.d.ts',
        'src/vercel/**',
        'src/proxy/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },

    // Test categorization
    testNamePattern: process.env.TEST_PATTERN,
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      DUNE_SIM_API_KEY: 'test-dune-key',
      ALCHEMY_API_KEY: 'test-alchemy-key',
      ETHERSCAN_API_KEY: 'test-etherscan-key'
    },

    // Reporters
    reporters: ['default', 'json'],
    
    // Parallel execution
    threads: true,
    maxThreads: 4,

    // Retry configuration
    retry: 1,

    // Mock configuration
    clearMocks: true,
    restoreMocks: true
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  },

  // Define test suites
  define: {
    __TEST_SUITES__: {
      unit: 'src/test/unit/**/*.test.ts',
      integration: 'src/test/integration/**/*.test.ts',
      contracts: 'src/test/contracts/**/*.test.ts',
      e2e: 'src/test/e2e/**/*.test.ts',
      hardware: 'src/test/hardware/**/*.test.ts'
    }
  }
});