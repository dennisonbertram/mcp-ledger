/**
 * Unit tests for SolanaTransactionCrafter
 */

import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SolanaTransactionCrafter } from '../../src/services/solana-transaction-crafter.js';
import { SolanaBlockchainService } from '../../src/services/solana-blockchain.js';
import { LedgerService } from '../../src/services/ledger.js';
import type { SolanaNetwork } from '../../src/types/blockchain.js';

// Mock dependencies
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');
jest.mock('../../src/services/solana-blockchain.js');
jest.mock('../../src/services/ledger.js');

const MockedTransaction = Transaction as jest.MockedClass<typeof Transaction>;
const MockedSystemProgram = SystemProgram as jest.MockedClass<typeof SystemProgram>;
const MockedPublicKey = PublicKey as jest.MockedClass<typeof PublicKey>;
const MockedSolanaBlockchainService = SolanaBlockchainService as jest.MockedClass<typeof SolanaBlockchainService>;
const MockedLedgerService = LedgerService as jest.MockedClass<typeof LedgerService>;

describe('SolanaTransactionCrafter', () => {
  let crafter: SolanaTransactionCrafter;
  let mockBlockchainService: jest.Mocked<SolanaBlockchainService>;
  let mockLedgerService: jest.Mocked<LedgerService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock blockchain service
    mockBlockchainService = {
      getConnection: jest.fn(),
      getLatestBlockhash: jest.fn(),
      getAssociatedTokenAccount: jest.fn(),
    } as any;

    // Mock ledger service
    mockLedgerService = {} as any;

    MockedSolanaBlockchainService.mockImplementation(() => mockBlockchainService);
    MockedLedgerService.mockImplementation(() => mockLedgerService);

    crafter = new SolanaTransactionCrafter(
      mockBlockchainService,
      mockLedgerService,
      { defaultNetwork: 'solana-mainnet' }
    );
  });

  describe('craftSolTransfer', () => {
    it('should create a valid SOL transfer transaction', async () => {
      const mockTransaction = {
        add: jest.fn().mockReturnThis(),
        recentBlockhash: undefined,
        feePayer: undefined
      };
      const mockInstruction = { keys: [], programId: SystemProgram.programId };
      const mockBlockhash = { blockhash: 'mock-blockhash', lastValidBlockHeight: 12345 };

      MockedTransaction.mockImplementation(() => mockTransaction as any);
      MockedPublicKey.mockImplementation((key: string) => ({ toBase58: () => key }) as any);
      MockedSystemProgram.transfer.mockReturnValue(mockInstruction as any);
      mockBlockchainService.getLatestBlockhash.mockResolvedValue(mockBlockhash);

      const params = {
        fromAddress: 'sender-address',
        toAddress: 'recipient-address',
        amount: BigInt('1000000000'), // 1 SOL
        network: 'solana-mainnet' as SolanaNetwork
      };

      const result = await crafter.craftSolTransfer(params);

      expect(MockedTransaction).toHaveBeenCalled();
      expect(MockedSystemProgram.transfer).toHaveBeenCalledWith({
        fromPubkey: expect.any(Object),
        toPubkey: expect.any(Object),
        lamports: expect.any(Number)
      });
      expect(mockTransaction.add).toHaveBeenCalledWith(mockInstruction);
      expect(mockTransaction.recentBlockhash).toBe('mock-blockhash');
      expect(result).toBe(mockTransaction);
    });

    it('should handle memo parameter correctly', async () => {
      const mockTransaction = {
        add: jest.fn().mockReturnThis(),
        recentBlockhash: undefined,
        feePayer: undefined
      };
      const mockTransferInstruction = { keys: [], programId: SystemProgram.programId };
      const mockMemoInstruction = { keys: [], programId: 'memo-program' };
      const mockBlockhash = { blockhash: 'mock-blockhash', lastValidBlockHeight: 12345 };

      MockedTransaction.mockImplementation(() => mockTransaction as any);
      MockedPublicKey.mockImplementation((key: string) => ({ toBase58: () => key }) as any);
      MockedSystemProgram.transfer.mockReturnValue(mockTransferInstruction as any);
      mockBlockchainService.getLatestBlockhash.mockResolvedValue(mockBlockhash);

      // Mock memo program creation
      jest.spyOn(crafter as any, 'createMemoInstruction').mockReturnValue(mockMemoInstruction);

      const params = {
        fromAddress: 'sender-address',
        toAddress: 'recipient-address',
        amount: BigInt('1000000000'),
        network: 'solana-mainnet' as SolanaNetwork,
        memo: 'Test memo'
      };

      await crafter.craftSolTransfer(params);

      expect(mockTransaction.add).toHaveBeenCalledTimes(2); // Transfer + memo
      expect((crafter as any).createMemoInstruction).toHaveBeenCalledWith('Test memo');
    });

    it('should throw error for invalid amount', async () => {
      const params = {
        fromAddress: 'sender-address',
        toAddress: 'recipient-address',
        amount: BigInt('-1'), // Invalid negative amount
        network: 'solana-mainnet' as SolanaNetwork
      };

      await expect(crafter.craftSolTransfer(params)).rejects.toThrow('Invalid transfer amount');
    });
  });

  describe('craftSplTokenTransfer', () => {
    it('should create a valid SPL token transfer transaction', async () => {
      const mockTransaction = {
        add: jest.fn().mockReturnThis(),
        recentBlockhash: undefined,
        feePayer: undefined
      };
      const mockInstruction = { keys: [], programId: TOKEN_PROGRAM_ID };
      const mockBlockhash = { blockhash: 'mock-blockhash', lastValidBlockHeight: 12345 };

      MockedTransaction.mockImplementation(() => mockTransaction as any);
      MockedPublicKey.mockImplementation((key: string) => ({ toBase58: () => key }) as any);
      (createTransferInstruction as jest.Mock).mockReturnValue(mockInstruction);
      mockBlockchainService.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockBlockchainService.getAssociatedTokenAccount.mockResolvedValue({
        address: 'source-token-account',
        exists: true
      });
      mockBlockchainService.getAssociatedTokenAccount.mockResolvedValue({
        address: 'dest-token-account',
        exists: true
      });

      const params = {
        fromAddress: 'sender-address',
        toAddress: 'recipient-address',
        mintAddress: 'mint-address',
        amount: BigInt('1000000'),
        decimals: 6,
        network: 'solana-mainnet' as SolanaNetwork
      };

      const result = await crafter.craftSplTokenTransfer(params);

      expect(createTransferInstruction).toHaveBeenCalled();
      expect(mockTransaction.add).toHaveBeenCalled();
      expect(result).toBe(mockTransaction);
    });

    it('should create recipient account when it does not exist', async () => {
      const mockTransaction = {
        add: jest.fn().mockReturnThis(),
        recentBlockhash: undefined,
        feePayer: undefined
      };
      const mockTransferInstruction = { keys: [], programId: TOKEN_PROGRAM_ID };
      const mockCreateAccountInstruction = { keys: [], programId: 'create-account-program' };
      const mockBlockhash = { blockhash: 'mock-blockhash', lastValidBlockHeight: 12345 };

      MockedTransaction.mockImplementation(() => mockTransaction as any);
      MockedPublicKey.mockImplementation((key: string) => ({ toBase58: () => key }) as any);
      (createTransferInstruction as jest.Mock).mockReturnValue(mockTransferInstruction);
      mockBlockchainService.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      
      // Source account exists, destination does not
      mockBlockchainService.getAssociatedTokenAccount
        .mockResolvedValueOnce({ address: 'source-token-account', exists: true })
        .mockResolvedValueOnce({ address: 'dest-token-account', exists: false });

      jest.spyOn(crafter as any, 'createAssociatedTokenAccountInstruction')
        .mockReturnValue(mockCreateAccountInstruction);

      const params = {
        fromAddress: 'sender-address',
        toAddress: 'recipient-address',
        mintAddress: 'mint-address',
        amount: BigInt('1000000'),
        decimals: 6,
        network: 'solana-mainnet' as SolanaNetwork,
        createRecipientAccount: true
      };

      await crafter.craftSplTokenTransfer(params);

      expect(mockTransaction.add).toHaveBeenCalledTimes(2); // Create account + transfer
    });

    it('should throw error when source token account does not exist', async () => {
      MockedPublicKey.mockImplementation((key: string) => ({ toBase58: () => key }) as any);
      mockBlockchainService.getAssociatedTokenAccount.mockResolvedValue({
        address: 'source-token-account',
        exists: false
      });

      const params = {
        fromAddress: 'sender-address',
        toAddress: 'recipient-address',
        mintAddress: 'mint-address',
        amount: BigInt('1000000'),
        decimals: 6,
        network: 'solana-mainnet' as SolanaNetwork
      };

      await expect(crafter.craftSplTokenTransfer(params)).rejects.toThrow(
        'Source token account does not exist'
      );
    });
  });

  describe('craftSplTokenApproval', () => {
    it('should create a valid token approval transaction', async () => {
      const mockTransaction = {
        add: jest.fn().mockReturnThis(),
        recentBlockhash: undefined,
        feePayer: undefined
      };
      const mockInstruction = { keys: [], programId: TOKEN_PROGRAM_ID };
      const mockBlockhash = { blockhash: 'mock-blockhash', lastValidBlockHeight: 12345 };

      MockedTransaction.mockImplementation(() => mockTransaction as any);
      MockedPublicKey.mockImplementation((key: string) => ({ toBase58: () => key }) as any);
      mockBlockchainService.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockBlockchainService.getAssociatedTokenAccount.mockResolvedValue({
        address: 'source-token-account',
        exists: true
      });

      jest.spyOn(crafter as any, 'createApproveInstruction').mockReturnValue(mockInstruction);

      const params = {
        ownerAddress: 'owner-address',
        delegateAddress: 'delegate-address',
        mintAddress: 'mint-address',
        amount: BigInt('1000000'),
        network: 'solana-mainnet' as SolanaNetwork
      };

      const result = await crafter.craftSplTokenApproval(params);

      expect(mockTransaction.add).toHaveBeenCalledWith(mockInstruction);
      expect(result).toBe(mockTransaction);
    });
  });

  describe('estimateTransactionFee', () => {
    it('should return estimated fee correctly', async () => {
      const mockConnection = {
        getFeeForMessage: jest.fn().mockResolvedValue({ value: 5000 })
      };
      mockBlockchainService.getConnection.mockReturnValue(mockConnection as any);

      const mockTransaction = {
        compileMessage: jest.fn().mockReturnValue('compiled-message')
      };

      const fee = await crafter.estimateTransactionFee(mockTransaction as any, 'solana-mainnet');

      expect(fee).toBe(5000);
      expect(mockConnection.getFeeForMessage).toHaveBeenCalled();
    });

    it('should return default fee when estimation fails', async () => {
      const mockConnection = {
        getFeeForMessage: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      mockBlockchainService.getConnection.mockReturnValue(mockConnection as any);

      const mockTransaction = {
        compileMessage: jest.fn().mockReturnValue('compiled-message')
      };

      const fee = await crafter.estimateTransactionFee(mockTransaction as any, 'solana-mainnet');

      expect(fee).toBe(5000); // Default fee
    });
  });

  describe('validateTransactionSize', () => {
    it('should return true for valid transaction size', () => {
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.alloc(800)) // 800 bytes
      };

      const isValid = crafter.validateTransactionSize(mockTransaction as any);

      expect(isValid).toBe(true);
    });

    it('should return false for oversized transaction', () => {
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.alloc(1500)) // 1500 bytes (too large)
      };

      const isValid = crafter.validateTransactionSize(mockTransaction as any);

      expect(isValid).toBe(false);
    });
  });
});