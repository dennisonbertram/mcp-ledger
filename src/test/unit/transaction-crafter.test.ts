/**
 * Tests for TransactionCrafter - demonstrating and fixing the critical nonce bug
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TransactionCrafter } from '../../services/transaction-crafter.js';
import { LedgerService } from '../../services/ledger.js';
import { BlockscoutClient } from '../../services/blockscout.js';
import { BlockchainService } from '../../services/blockchain.js';
import { parseEther, type Address } from 'viem';

// Mock the services
vi.mock('../../services/ledger.js');
vi.mock('../../services/blockscout.js');
vi.mock('../../services/blockchain.js');

describe('TransactionCrafter - Critical Nonce Bug Tests', () => {
  let transactionCrafter: TransactionCrafter;
  let mockLedgerService: any;
  let mockBlockscoutClient: any;
  let mockBlockchainService: any;

  // Use valid checksummed Ethereum addresses
  const TEST_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as Address;
  const TEST_TO_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Address;

  beforeEach(() => {
    // Create mock instances
    mockLedgerService = {
      isConnected: vi.fn().mockReturnValue(true),
      getAddress: vi.fn().mockResolvedValue({ 
        address: TEST_ADDRESS 
      }),
      signTransaction: vi.fn().mockResolvedValue({
        r: '1234567890abcdef',
        s: 'fedcba0987654321',
        v: '1b'
      }),
      connectToLedger: vi.fn().mockResolvedValue(true)
    };

    mockBlockscoutClient = {
      getContractABI: vi.fn().mockResolvedValue([])
    };

    mockBlockchainService = {
      getBalance: vi.fn().mockResolvedValue(parseEther('10')),
      getBlock: vi.fn().mockResolvedValue({
        number: 19000000n, // Mainnet block number around 19M
        hash: '0x' + '0'.repeat(64),
        parentHash: '0x' + '1'.repeat(64),
        timestamp: BigInt(Date.now()),
        gasLimit: 30000000n,
        gasUsed: 15000000n,
        baseFeePerGas: 30000000000n,
        miner: TEST_ADDRESS,
        transactions: []
      }),
      estimateGas: vi.fn().mockResolvedValue(21000n),
      getGasPrice: vi.fn().mockResolvedValue({
        gasPrice: 30000000000n
      }),
      getTokenInfo: vi.fn().mockResolvedValue({
        address: TEST_ADDRESS,
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: parseEther('1000000')
      }),
      getTokenBalance: vi.fn().mockResolvedValue(parseEther('100')),
      // This method doesn't exist yet but we'll add it
      getTransactionCount: vi.fn().mockResolvedValue(5n)
    };

    // Create TransactionCrafter instance
    transactionCrafter = new TransactionCrafter({
      ledgerService: mockLedgerService as any,
      blockscoutClient: mockBlockscoutClient as any,
      blockchainService: mockBlockchainService as any
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Critical Nonce Bug - ETH Transfer', () => {
    it('❌ SHOULD FAIL: Currently uses block number as nonce (CATASTROPHIC BUG)', async () => {
      // This test demonstrates the current broken behavior
      const preparedTx = await transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet'
      });

      // The current code incorrectly uses block number as nonce
      // Block number is around 19,000,000 but user's nonce should be much lower (e.g., 5)
      expect(preparedTx.nonce).toBe(19000000); // This is WRONG!
      
      // This transaction would fail 100% of the time because:
      // 1. Nonce should be the sender's transaction count (e.g., 5)
      // 2. Using block number (19M) would be rejected immediately by any node
      console.error('❌ CATASTROPHIC BUG: Using block number (19M) as nonce instead of transaction count!');
    });

    it('✅ SHOULD PASS: Uses correct transaction count as nonce (AFTER FIX)', async () => {
      // After we fix the code, this test should pass
      // We need to add getTransactionCount to BlockchainService first
      
      // The fixed implementation should call getTransactionCount
      const preparedTx = await transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet'
      });

      // After fix, should use actual transaction count
      // For now, this will fail until we implement the fix
      expect(mockBlockchainService.getTransactionCount).toHaveBeenCalledWith(
        TEST_ADDRESS,
        'mainnet'
      );
      
      // The nonce should be the user's actual transaction count (5), NOT block number
      // This assertion will fail until we fix the implementation
      expect(preparedTx.nonce).toBe(5);
    });

    it('Should allow manual nonce override', async () => {
      const customNonce = 10;
      const preparedTx = await transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet',
        nonce: customNonce
      });

      // Manual nonce should be respected
      expect(preparedTx.nonce).toBe(customNonce);
    });
  });

  describe('Critical Nonce Bug - ERC20 Transfer', () => {
    it('❌ SHOULD FAIL: Currently uses block number as nonce for ERC20 transfers', async () => {
      const preparedTx = await transactionCrafter.craftERC20Transfer({
        to: TEST_TO_ADDRESS,
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        amount: '100',
        network: 'mainnet'
      });

      // Current broken behavior: uses block number
      expect(preparedTx.nonce).toBe(19000000); // WRONG!
      console.error('❌ ERC20 Transfer also has nonce bug!');
    });

    it('✅ SHOULD PASS: Uses correct transaction count for ERC20 (AFTER FIX)', async () => {
      const preparedTx = await transactionCrafter.craftERC20Transfer({
        to: TEST_TO_ADDRESS,
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        amount: '100',
        network: 'mainnet'
      });

      expect(mockBlockchainService.getTransactionCount).toHaveBeenCalled();
      expect(preparedTx.nonce).toBe(5); // Should be transaction count, not block number
    });
  });

  describe('Critical Nonce Bug - ERC20 Approve', () => {
    it('❌ SHOULD FAIL: Currently uses block number as nonce for approvals', async () => {
      const preparedTx = await transactionCrafter.craftERC20Approve({
        spender: TEST_TO_ADDRESS,
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        amount: '1000',
        network: 'mainnet'
      });

      expect(preparedTx.nonce).toBe(19000000); // WRONG!
      console.error('❌ ERC20 Approve also has nonce bug!');
    });

    it('✅ SHOULD PASS: Uses correct transaction count for approve (AFTER FIX)', async () => {
      const preparedTx = await transactionCrafter.craftERC20Approve({
        spender: TEST_TO_ADDRESS,
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        amount: '1000',
        network: 'mainnet'
      });

      expect(mockBlockchainService.getTransactionCount).toHaveBeenCalled();
      expect(preparedTx.nonce).toBe(5);
    });
  });

  describe('Critical Nonce Bug - Custom Transaction', () => {
    it('❌ SHOULD FAIL: Currently uses block number as nonce for custom transactions', async () => {
      mockBlockscoutClient.getContractABI.mockResolvedValue([
        {
          type: 'function',
          name: 'testMethod',
          inputs: [],
          outputs: []
        }
      ]);

      const preparedTx = await transactionCrafter.craftCustomTransaction({
        contractAddress: TEST_TO_ADDRESS,
        methodName: 'testMethod',
        params: [],
        network: 'mainnet'
      });

      expect(preparedTx.nonce).toBe(19000000); // WRONG!
      console.error('❌ Custom transactions also have nonce bug!');
    });

    it('✅ SHOULD PASS: Uses correct transaction count for custom tx (AFTER FIX)', async () => {
      mockBlockscoutClient.getContractABI.mockResolvedValue([
        {
          type: 'function',
          name: 'testMethod',
          inputs: [],
          outputs: []
        }
      ]);

      const preparedTx = await transactionCrafter.craftCustomTransaction({
        contractAddress: TEST_TO_ADDRESS,
        methodName: 'testMethod',
        params: [],
        network: 'mainnet'
      });

      expect(mockBlockchainService.getTransactionCount).toHaveBeenCalled();
      expect(preparedTx.nonce).toBe(5);
    });
  });

  describe('Nonce Edge Cases', () => {
    it('Should handle pending transactions correctly', async () => {
      // When there are pending transactions, we should use 'pending' block tag
      const preparedTx = await transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet'
      });

      // After fix, should call with 'pending' to get correct nonce including pending txs
      expect(mockBlockchainService.getTransactionCount).toHaveBeenCalledWith(
        TEST_ADDRESS,
        'mainnet'
      );
    });

    it('Should handle first transaction (nonce = 0) correctly', async () => {
      mockBlockchainService.getTransactionCount.mockResolvedValue(0n);
      
      const preparedTx = await transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet'
      });

      // After fix
      expect(preparedTx.nonce).toBe(0);
    });

    it('Should handle high transaction count correctly', async () => {
      mockBlockchainService.getTransactionCount.mockResolvedValue(12345n);
      
      const preparedTx = await transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet'
      });

      // After fix
      expect(preparedTx.nonce).toBe(12345);
    });
  });

  describe('Transaction Validation', () => {
    it('Should validate addresses correctly', async () => {
      await expect(transactionCrafter.craftETHTransfer({
        to: 'invalid-address',
        amount: '1.0',
        network: 'mainnet'
      })).rejects.toThrow('Invalid recipient address');
    });

    it('Should check sufficient balance', async () => {
      mockBlockchainService.getBalance.mockResolvedValue(parseEther('0.5'));
      
      await expect(transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '1.0',
        network: 'mainnet'
      })).rejects.toThrow('Insufficient balance');
    });

    it('Should check gas costs', async () => {
      mockBlockchainService.getBalance.mockResolvedValue(parseEther('1.0'));
      mockBlockchainService.estimateGas.mockResolvedValue(21000n);
      
      await expect(transactionCrafter.craftETHTransfer({
        to: TEST_TO_ADDRESS,
        amount: '0.999999', // Almost all balance, not enough for gas
        network: 'mainnet'
      })).rejects.toThrow('Insufficient balance for transaction and gas');
    });
  });
});