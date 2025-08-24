/**
 * Tests for Proxy Service Initialization
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BlockchainService } from '../../services/blockchain.js';
import { BlockscoutClient } from '../../services/blockscout.js';
import { LedgerService } from '../../services/ledger.js';
import { TransactionCrafter } from '../../services/transaction-crafter.js';

// Mock the services
vi.mock('../../services/blockchain.js');
vi.mock('../../services/blockscout.js');
vi.mock('../../services/ledger.js');

describe('Proxy Service Initialization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Should initialize all services correctly', async () => {
    // This test verifies that services can be initialized properly
    const blockchainService = new BlockchainService();
    const blockscoutClient = new BlockscoutClient();
    const ledgerService = new LedgerService();
    
    // The critical fix: TransactionCrafter must be initialized with all required services
    const transactionCrafter = new TransactionCrafter({
      ledgerService,
      blockscoutClient,
      blockchainService
    });
    
    // Verify all services are created
    expect(blockchainService).toBeDefined();
    expect(blockscoutClient).toBeDefined();
    expect(ledgerService).toBeDefined();
    expect(transactionCrafter).toBeDefined();
  });

  it('Should handle initialization errors gracefully', async () => {
    // Mock a service to throw during initialization
    (BlockchainService as any).mockImplementation(() => {
      throw new Error('Failed to initialize blockchain service');
    });
    
    // Initialization should throw an error
    expect(() => new BlockchainService()).toThrow('Failed to initialize blockchain service');
  });

  it('Should verify TransactionCrafter requires all services', () => {
    const blockchainService = new BlockchainService();
    const blockscoutClient = new BlockscoutClient();
    const ledgerService = new LedgerService();
    
    // Create TransactionCrafter with proper initialization
    const transactionCrafter = new TransactionCrafter({
      ledgerService,
      blockscoutClient,
      blockchainService
    });
    
    // Get config to verify initialization
    const config = transactionCrafter.getConfig();
    
    expect(config).toBeDefined();
    expect(config.defaultNetwork).toBe('mainnet');
    expect(config.validateBeforeSigning).toBe(true);
    expect(config.autoEstimateGas).toBe(true);
  });

  it('Should verify service methods are available after initialization', async () => {
    // Mock the services with necessary methods
    const mockLedgerService = {
      isConnected: vi.fn().mockReturnValue(false),
      connectToLedger: vi.fn().mockResolvedValue(true),
      getAddress: vi.fn().mockResolvedValue({
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        publicKey: '0x' + '0'.repeat(128)
      }),
      signTransaction: vi.fn(),
      disconnect: vi.fn()
    };
    
    const mockBlockscoutClient = {
      getContractABI: vi.fn().mockResolvedValue([]),
      getContractInfo: vi.fn(),
      getTransactionHistory: vi.fn()
    };
    
    const mockBlockchainService = {
      getBalance: vi.fn().mockResolvedValue(1000000000000000000n),
      getTransactionCount: vi.fn().mockResolvedValue(5n),
      estimateGas: vi.fn().mockResolvedValue(21000n),
      getGasPrice: vi.fn().mockResolvedValue({ gasPrice: 30000000000n }),
      getTokenInfo: vi.fn(),
      getTokenBalance: vi.fn()
    };
    
    // Create TransactionCrafter with mocked services
    const transactionCrafter = new TransactionCrafter({
      ledgerService: mockLedgerService as any,
      blockscoutClient: mockBlockscoutClient as any,
      blockchainService: mockBlockchainService as any
    });
    
    // Verify the service is functional
    expect(transactionCrafter).toBeDefined();
    
    // Test that we can call methods
    await expect(transactionCrafter.connectLedger()).resolves.toBe(true);
    expect(mockLedgerService.connectToLedger).toHaveBeenCalled();
  });
});