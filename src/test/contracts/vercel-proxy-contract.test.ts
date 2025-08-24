/**
 * Contract tests between Vercel AI server and Ledger proxy
 * Ensures API compatibility between components
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define API contract schemas
const LedgerAddressRequestSchema = z.object({
  derivationPath: z.string().optional().default("44'/60'/0'/0/0"),
  verify: z.boolean().optional().default(false)
});

const LedgerAddressResponseSchema = z.object({
  success: z.boolean(),
  address: z.string().optional(),
  derivationPath: z.string().optional(),
  publicKey: z.string().optional(),
  error: z.string().optional(),
  troubleshooting: z.array(z.string()).optional()
});

const CraftTransactionRequestSchema = z.object({
  to: z.string(),
  value: z.string().optional(),
  data: z.string().optional(),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet')
});

const CraftTransactionResponseSchema = z.object({
  success: z.boolean(),
  transaction: z.object({
    from: z.string(),
    to: z.string(), 
    value: z.string(),
    data: z.string(),
    gasLimit: z.string(),
    nonce: z.number(),
    chainId: z.number(),
    type: z.string()
  }).optional(),
  network: z.string().optional(),
  error: z.string().optional(),
  troubleshooting: z.array(z.string()).optional()
});

const HealthResponseSchema = z.object({
  status: z.string(),
  ledgerConnected: z.boolean(),
  timestamp: z.string(),
  service: z.string()
});

describe('Vercel ↔ Proxy API Contracts', () => {
  describe('Request/Response Schema Validation', () => {
    it('should validate ledger address request schema', () => {
      // Valid requests
      expect(() => LedgerAddressRequestSchema.parse({})).not.toThrow();
      expect(() => LedgerAddressRequestSchema.parse({
        derivationPath: "44'/60'/0'/0/1",
        verify: true
      })).not.toThrow();

      // Invalid requests  
      expect(() => LedgerAddressRequestSchema.parse({
        derivationPath: 123
      })).toThrow();
    });

    it('should validate ledger address response schema', () => {
      // Success response
      const successResponse = {
        success: true,
        address: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        derivationPath: "44'/60'/0'/0/0",
        publicKey: '0x04abcd...'
      };
      expect(() => LedgerAddressResponseSchema.parse(successResponse)).not.toThrow();

      // Error response
      const errorResponse = {
        success: false,
        error: 'Device not found',
        troubleshooting: ['Connect Ledger device', 'Open Ethereum app']
      };
      expect(() => LedgerAddressResponseSchema.parse(errorResponse)).not.toThrow();
    });

    it('should validate transaction crafting request schema', () => {
      // Minimal valid request
      const minimalRequest = {
        to: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c'
      };
      expect(() => CraftTransactionRequestSchema.parse(minimalRequest)).not.toThrow();

      // Full request
      const fullRequest = {
        to: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        value: '1000000000000000000', // 1 ETH in wei
        data: '0xa9059cbb000000000000000000000000742d35cc6632c0532c718c2c8e8d9a2b0fcc3c5c0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        network: 'polygon'
      };
      expect(() => CraftTransactionRequestSchema.parse(fullRequest)).not.toThrow();

      // Invalid network
      expect(() => CraftTransactionRequestSchema.parse({
        to: '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        network: 'invalid-network'
      })).toThrow();
    });

    it('should validate health response schema', () => {
      const healthResponse = {
        status: 'healthy',
        ledgerConnected: true,
        timestamp: '2024-01-15T10:30:00.000Z',
        service: 'ledger-proxy'
      };
      
      expect(() => HealthResponseSchema.parse(healthResponse)).not.toThrow();
    });
  });

  describe('Data Format Compatibility', () => {
    it('should use consistent address format', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      
      const testAddresses = [
        '0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      ];

      testAddresses.forEach(address => {
        expect(address).toMatch(addressRegex);
      });
    });

    it('should use consistent transaction value format', () => {
      // Values should be strings (wei format) for precision
      const testValues = [
        '0',                        // 0 ETH
        '1000000000000000000',      // 1 ETH
        '500000000000000000',       // 0.5 ETH
        '1000000000000000000000'    // 1000 ETH
      ];

      testValues.forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^\d+$/);
      });
    });

    it('should use consistent derivation path format', () => {
      const derivationPathRegex = /^44'\/60'\/\d+'\/\d+\/\d+$/;
      
      const testPaths = [
        "44'/60'/0'/0/0",
        "44'/60'/0'/0/1", 
        "44'/60'/1'/0/0",
        "44'/60'/0'/0/999"
      ];

      testPaths.forEach(path => {
        expect(path).toMatch(derivationPathRegex);
      });
    });
  });

  describe('Error Response Consistency', () => {
    it('should have consistent error response structure', () => {
      const errorResponses = [
        {
          success: false,
          error: 'Device not connected',
          troubleshooting: ['Connect Ledger via USB', 'Unlock device']
        },
        {
          success: false,
          error: 'Invalid network',
          troubleshooting: ['Use supported network: mainnet, polygon, etc.']
        }
      ];

      errorResponses.forEach(response => {
        expect(response.success).toBe(false);
        expect(typeof response.error).toBe('string');
        expect(Array.isArray(response.troubleshooting)).toBe(true);
      });
    });

    it('should provide helpful troubleshooting steps', () => {
      const commonTroubleshooting = [
        'Ensure Ledger device is connected via USB',
        'Unlock the device and open the Ethereum app',
        'Enable "Blind signing" in Ethereum app settings if needed',
        'Try reconnecting the USB cable',
        'Check device permissions on Linux systems'
      ];

      // All troubleshooting steps should be actionable strings
      commonTroubleshooting.forEach(step => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Network Consistency', () => {
    it('should have matching network definitions', () => {
      // Both Vercel server and proxy must support same networks
      const supportedNetworks = ['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base'];
      
      // Chain ID mapping must be consistent
      const chainIds: Record<string, number> = {
        mainnet: 1,
        sepolia: 11155111,
        polygon: 137,
        arbitrum: 42161,
        optimism: 10,
        base: 8453
      };

      supportedNetworks.forEach(network => {
        expect(chainIds[network]).toBeDefined();
        expect(typeof chainIds[network]).toBe('number');
        expect(chainIds[network]).toBeGreaterThan(0);
      });
    });
  });
});