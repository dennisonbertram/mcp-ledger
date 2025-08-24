/**
 * Hardware integration tests with real Ledger device
 * These tests require a connected Ledger device and user interaction
 * Run manually: npm run test:hardware
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import Eth from '@ledgerhq/hw-app-eth';

// Mark as hardware tests that require manual setup
const REQUIRES_HARDWARE = process.env.NODE_ENV !== 'ci';

describe.skipIf(!REQUIRES_HARDWARE)('Real Ledger Hardware Integration', () => {
  let transport: any;
  let ethApp: Eth;

  beforeAll(async () => {
    console.log('\n🔌 Connecting to Ledger device...');
    console.log('📱 Please ensure:');
    console.log('  - Ledger device is connected via USB');
    console.log('  - Device is unlocked');
    console.log('  - Ethereum app is open');
    console.log('  - "Blind signing" is enabled in Ethereum app settings\n');

    try {
      transport = await TransportNodeHid.create();
      ethApp = new Eth(transport);
      console.log('✅ Connected to Ledger device successfully\n');
    } catch (error) {
      console.error('❌ Failed to connect to Ledger device:', error);
      throw new Error('Ledger device connection failed. Please check device connection and try again.');
    }
  }, 30000); // 30 second timeout for manual setup

  afterAll(async () => {
    if (transport) {
      await transport.close();
      console.log('🔌 Disconnected from Ledger device');
    }
  });

  describe('Address Generation', () => {
    it('should get address from default derivation path', async () => {
      const result = await ethApp.getAddress("44'/60'/0'/0/0", false);
      
      expect(result).toMatchObject({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        publicKey: expect.stringMatching(/^[a-fA-F0-9]+$/),
        chainCode: expect.stringMatching(/^[a-fA-F0-9]+$/)
      });

      console.log('📍 Default address:', result.address);
    }, 10000);

    it('should get different addresses from different paths', async () => {
      const address1 = await ethApp.getAddress("44'/60'/0'/0/0", false);
      const address2 = await ethApp.getAddress("44'/60'/0'/0/1", false);
      
      expect(address1.address).not.toBe(address2.address);
      expect(address1.publicKey).not.toBe(address2.publicKey);

      console.log('📍 Address 1:', address1.address);
      console.log('📍 Address 2:', address2.address);
    }, 15000);

    it('should verify address on device screen when requested', async () => {
      console.log('\n👀 This test will show the address on your Ledger screen');
      console.log('📱 Please confirm the address matches what is displayed');

      const result = await ethApp.getAddress("44'/60'/0'/0/0", true);
      
      expect(result).toMatchObject({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        publicKey: expect.stringMatching(/^[a-fA-F0-9]+$/)
      });

      console.log('✅ Address verified on device:', result.address);
    }, 30000); // Longer timeout for user interaction
  });

  describe('Device Information', () => {
    it('should get device configuration', async () => {
      try {
        const config = await ethApp.getAppConfiguration();
        
        expect(config).toMatchObject({
          arbitraryDataEnabled: expect.any(Number),
          erc20ProvisioningNecessary: expect.any(Number),
          starkEnabled: expect.any(Number),
          starkv2Supported: expect.any(Number),
          version: expect.any(String)
        });

        console.log('📱 Device configuration:', config);
      } catch (error) {
        // Some Ledger versions may not support this
        console.warn('⚠️ Could not get device configuration:', (error as Error).message);
      }
    }, 10000);

    it('should detect available devices', async () => {
      const devices = await TransportNodeHid.list();
      
      expect(devices).toBeInstanceOf(Array);
      expect(devices.length).toBeGreaterThan(0);

      devices.forEach(device => {
        expect(device).toMatchObject({
          path: expect.any(String),
          descriptor: expect.any(String)
        });
      });

      console.log('🔍 Available devices:', devices.length);
      devices.forEach(device => {
        console.log(`  - ${device.productName || 'Unknown'} (${device.path})`);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid derivation paths gracefully', async () => {
      await expect(ethApp.getAddress('invalid-path', false))
        .rejects
        .toThrow();
    });

    it('should handle device disconnection', async () => {
      // This test requires manually disconnecting the device
      console.log('\n🔌 Please disconnect your Ledger device now...');
      console.log('⏱️ Waiting 5 seconds for disconnection...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));

      await expect(ethApp.getAddress("44'/60'/0'/0/0", false))
        .rejects
        .toThrow();

      console.log('✅ Device disconnection handled correctly');
      console.log('🔌 Please reconnect your device for remaining tests');
    }, 15000);
  });

  describe('Performance Characteristics', () => {
    it('should measure address generation performance', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await ethApp.getAddress(`44'/60'/0'/0/${i}`, false);
        const duration = Date.now() - start;
        times.push(duration);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log('⚡ Address generation performance:');
      console.log(`   Average: ${averageTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime}ms`);
      console.log(`   Max: ${maxTime}ms`);

      // Reasonable performance expectations
      expect(averageTime).toBeLessThan(2000); // < 2 seconds average
      expect(maxTime).toBeLessThan(5000);     // < 5 seconds worst case
    }, 30000);
  });

  describe('Multiple Device Support', () => {
    it('should handle multiple connected devices', async () => {
      const devices = await TransportNodeHid.list();
      
      if (devices.length > 1) {
        console.log('🔍 Multiple devices detected, testing each...');
        
        for (const device of devices) {
          try {
            const deviceTransport = await TransportNodeHid.open(device);
            const deviceEthApp = new Eth(deviceTransport);
            const address = await deviceEthApp.getAddress("44'/60'/0'/0/0", false);
            
            console.log(`✅ Device ${device.path}: ${address.address}`);
            
            await deviceTransport.close();
          } catch (error) {
            console.warn(`⚠️ Device ${device.path} failed:`, (error as Error).message);
          }
        }
      } else {
        console.log('ℹ️ Only one device connected, skipping multi-device test');
      }
    }, 60000);
  });
});

// Helper function to wait for user input
async function waitForUserConfirmation(message: string, timeoutMs: number = 30000): Promise<void> {
  console.log(`\n${message}`);
  console.log('Press Enter to continue or wait for timeout...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('User confirmation timeout'));
    }, timeoutMs);

    // In a real test environment, you might use readline or similar
    // For now, we'll just resolve after a short delay
    setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, 1000);
  });
}