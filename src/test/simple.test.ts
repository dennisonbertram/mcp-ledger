import { test, expect } from 'vitest';

test('basic test works', () => {
  expect(1 + 1).toBe(2);
});

test('address validation pattern', () => {
  const addressPattern = /^0x[a-fA-F0-9]{40}$/;
  
  expect('0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c').toMatch(addressPattern);
  expect('invalid-address').not.toMatch(addressPattern);
});

test('network chain id mapping', () => {
  const chainIds = {
    mainnet: 1,
    sepolia: 11155111,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453
  };

  expect(chainIds.mainnet).toBe(1);
  expect(chainIds.polygon).toBe(137);
  expect(chainIds.base).toBe(8453);
});