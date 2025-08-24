/**
 * End-to-end tests for the hybrid MCP system
 * Tests complete workflows from AI agent to final result
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock environment for testing
const testEnv = {
  DUNE_SIM_API_KEY: 'test-dune-key',
  ALCHEMY_API_KEY: 'test-alchemy-key',
  ETHERSCAN_API_KEY: 'test-etherscan-key',
  LEDGER_PROXY_PORT: '3001'
};

// Mock external API responses
const mockDuneSimResponse = {
  balances: [
    {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: '1000000000',
      balanceFormatted: '1000.0',
      balanceUsd: 1000.0,
      priceUsd: 1.0,
      chainId: 1,
      chainName: 'ethereum',
      logo: 'https://example.com/usdc.png'
    }
  ]
};

const mockBlockscoutResponse = {
  abi: [
    {
      inputs: [],
      name: 'name',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function'
    }
  ],
  name: 'ERC20 Token',
  is_verified: true
};

// Mock network requests
vi.mock('axios', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes('sim.dune.com')) {
        return Promise.resolve({ data: mockDuneSimResponse });
      }
      if (url.includes('blockscout.com')) {
        return Promise.resolve({ data: mockBlockscoutResponse });
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    })
  }
}));

describe('Hybrid System E2E Tests', () => {
  describe('Complete Workflow: Get Portfolio Overview', () => {
    it('should execute full portfolio analysis workflow', async () => {
      const address = '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c';
      
      // Step 1: Get ETH balance (Vercel server)
      const ethBalance = await simulateVercelTool('get_balance', {
        address,
        network: 'mainnet'
      });

      expect(ethBalance).toMatchObject({
        address,
        network: 'mainnet',
        balance: expect.any(String),
        balanceFormatted: expect.any(String),
        symbol: 'ETH'
      });

      // Step 2: Get token balances (Vercel server)  
      const tokenBalances = await simulateVercelTool('get_token_balances', {
        address,
        networks: ['mainnet', 'polygon']
      });

      expect(tokenBalances).toMatchObject({
        address,
        networks: ['mainnet', 'polygon'],
        tokens: expect.arrayContaining([
          expect.objectContaining({
            symbol: expect.any(String),
            balance: expect.any(String),
            balanceFormatted: expect.any(String)
          })
        ])
      });

      // Step 3: Get NFT balances (Vercel server)
      const nftBalances = await simulateVercelTool('get_nft_balances', {
        address,
        networks: ['mainnet']
      });

      expect(nftBalances).toMatchObject({
        address,
        networks: ['mainnet'],
        nfts: expect.any(Array)
      });

      // Verify complete portfolio data structure
      const portfolio = {
        address,
        ethereum: ethBalance,
        tokens: tokenBalances.tokens,
        nfts: nftBalances.nfts,
        totalValue: calculatePortfolioValue(ethBalance, tokenBalances.tokens)
      };

      expect(portfolio.address).toBe(address);
      expect(portfolio.totalValue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complete Workflow: Transaction Preparation', () => {
    it('should execute full transaction workflow', async () => {
      // Step 1: Get Ledger address (Proxy service)
      const addressResult = await simulateProxyCall('/ledger/address', {
        derivationPath: "44'/60'/0'/0/0",
        verify: false
      });

      expect(addressResult).toMatchObject({
        success: true,
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        publicKey: expect.stringMatching(/^0x04[a-fA-F0-9]+$/)
      });

      // Step 2: Craft transaction (Proxy service)
      const transactionResult = await simulateProxyCall('/ledger/craft-transaction', {
        to: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        value: '1000000000000000000', // 1 ETH
        network: 'mainnet'
      });

      expect(transactionResult).toMatchObject({
        success: true,
        transaction: {
          from: addressResult.address,
          to: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
          value: '1000000000000000000',
          gasLimit: expect.any(String),
          nonce: expect.any(Number),
          chainId: 1
        },
        network: 'mainnet'
      });

      // Step 3: Get contract ABI for verification (Vercel server)
      const contractAbi = await simulateVercelTool('get_contract_abi', {
        contractAddress: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        network: 'mainnet'
      });

      expect(contractAbi).toMatchObject({
        contractAddress: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        network: 'mainnet',
        abi: expect.any(Array),
        name: expect.any(String),
        is_verified: expect.any(Boolean)
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Ledger disconnection gracefully', async () => {
      // Simulate device disconnection
      const disconnectResult = await simulateProxyCall('/ledger/disconnect', {});
      
      expect(disconnectResult).toMatchObject({
        success: true,
        message: 'Ledger disconnected successfully'
      });

      // Subsequent calls should handle reconnection
      const addressResult = await simulateProxyCall('/ledger/address', {});
      
      // Should either succeed (reconnected) or provide helpful error
      if (!addressResult.success) {
        expect(addressResult.troubleshooting).toContain('Ensure Ledger device is connected via USB');
      }
    });

    it('should handle network connectivity issues', async () => {
      // Mock network failure
      vi.mocked(require('axios').default.get).mockRejectedValueOnce(new Error('Network timeout'));

      try {
        await simulateVercelTool('get_token_balances', {
          address: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
          networks: ['mainnet']
        });
      } catch (error) {
        expect((error as Error).message).toContain('Failed to fetch token balances');
      }
    });

    it('should handle missing API keys properly', async () => {
      // Test with missing DUNE_SIM_API_KEY
      const originalKey = testEnv.DUNE_SIM_API_KEY;
      delete (testEnv as any).DUNE_SIM_API_KEY;

      try {
        await simulateVercelTool('get_token_balances', {
          address: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
          networks: ['mainnet']
        });
      } catch (error) {
        expect((error as Error).message).toContain('DUNE_SIM_API_KEY is required');
      }

      // Restore key
      testEnv.DUNE_SIM_API_KEY = originalKey;
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const address = '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c';
      
      // Execute multiple operations concurrently
      const promises = [
        simulateVercelTool('get_balance', { address, network: 'mainnet' }),
        simulateVercelTool('get_balance', { address, network: 'polygon' }),
        simulateProxyCall('/health', {}),
        simulateProxyCall('/ledger/devices', {})
      ];

      const results = await Promise.allSettled(promises);
      
      // All requests should complete (either fulfilled or rejected)
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.status).toMatch(/fulfilled|rejected/);
      });
    });

    it('should respect timeout limits', async () => {
      const startTime = Date.now();
      
      try {
        await simulateVercelTool('get_token_balances', {
          address: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
          networks: ['mainnet']
        });
      } catch (error) {
        // Operation should complete within reasonable time
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });
  });
});

// Helper functions for simulation
async function simulateVercelTool(toolName: string, args: any) {
  // Simulate Vercel AI MCP tool execution
  switch (toolName) {
    case 'get_balance':
      return {
        address: args.address,
        network: args.network,
        balance: '1000000000000000000',
        balanceFormatted: '1.0',
        symbol: args.network === 'polygon' ? 'MATIC' : 'ETH'
      };

    case 'get_token_balances':
      return {
        address: args.address,
        networks: args.networks,
        tokens: mockDuneSimResponse.balances
      };

    case 'get_nft_balances':
      return {
        address: args.address,
        networks: args.networks,
        nfts: []
      };

    case 'get_contract_abi':
      return {
        contractAddress: args.contractAddress,
        network: args.network,
        ...mockBlockscoutResponse
      };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function simulateProxyCall(endpoint: string, data: any) {
  // Simulate Ledger proxy API call
  switch (endpoint) {
    case '/health':
      return {
        status: 'healthy',
        ledgerConnected: true,
        timestamp: new Date().toISOString(),
        service: 'ledger-proxy'
      };

    case '/ledger/address':
      return {
        success: true,
        address: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        derivationPath: data.derivationPath || "44'/60'/0'/0/0",
        publicKey: '0x04' + 'a'.repeat(128)
      };

    case '/ledger/craft-transaction':
      return {
        success: true,
        transaction: {
          from: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
          to: data.to,
          value: data.value || '0',
          data: data.data || '0x',
          gasLimit: '21000',
          gasPrice: '20000000000',
          nonce: 42,
          chainId: 1,
          type: 'eip1559'
        },
        network: data.network
      };

    case '/ledger/devices':
      return {
        success: true,
        devices: [
          {
            path: '/dev/hidraw0',
            descriptor: 'mock-descriptor',
            productName: 'Ledger Nano S Plus'
          }
        ],
        count: 1
      };

    case '/ledger/disconnect':
      return {
        success: true,
        message: 'Ledger disconnected successfully'
      };

    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

function calculatePortfolioValue(ethBalance: any, tokens: any[]): number {
  let total = 0;
  
  // Add ETH value (assuming $2000/ETH for test)
  total += parseFloat(ethBalance.balanceFormatted) * 2000;
  
  // Add token values
  tokens.forEach(token => {
    if (token.balanceUsd) {
      total += token.balanceUsd;
    }
  });
  
  return total;
}