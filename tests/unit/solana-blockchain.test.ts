/**
 * Unit tests for SolanaBlockchainService
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaBlockchainService } from '../../src/services/solana-blockchain.js';
import type { SolanaNetwork } from '../../src/types/blockchain.js';

// Mock @solana/web3.js
jest.mock('@solana/web3.js');
const MockedConnection = Connection as jest.MockedClass<typeof Connection>;
const MockedPublicKey = PublicKey as jest.MockedClass<typeof PublicKey>;

describe('SolanaBlockchainService', () => {
  let service: SolanaBlockchainService;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock connection instance
    mockConnection = {
      getBalance: jest.fn(),
      getTokenAccountsByOwner: jest.fn(),
      getAccountInfo: jest.fn(),
      sendTransaction: jest.fn(),
      confirmTransaction: jest.fn(),
      getSlot: jest.fn(),
      getLatestBlockhash: jest.fn(),
      close: jest.fn(),
    } as any;

    MockedConnection.mockImplementation(() => mockConnection);
    
    service = new SolanaBlockchainService({
      defaultNetwork: 'solana-mainnet'
    });
  });

  describe('getBalance', () => {
    it('should return SOL balance correctly', async () => {
      const testAddress = '11111111111111111111111111111112';
      const mockBalance = 1000000000; // 1 SOL in lamports
      
      MockedPublicKey.mockImplementation((address: string) => ({ toBase58: () => address }) as any);
      mockConnection.getBalance.mockResolvedValue(mockBalance);

      const result = await service.getBalance(testAddress, 'solana-mainnet');

      expect(result).toEqual({
        lamports: BigInt(mockBalance),
        sol: 1
      });
      expect(mockConnection.getBalance).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle connection errors gracefully', async () => {
      const testAddress = '11111111111111111111111111111112';
      
      MockedPublicKey.mockImplementation((address: string) => ({ toBase58: () => address }) as any);
      mockConnection.getBalance.mockRejectedValue(new Error('Connection failed'));

      await expect(service.getBalance(testAddress, 'solana-mainnet'))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('getTokenBalances', () => {
    it('should return empty array when no token accounts found', async () => {
      const testAddress = '11111111111111111111111111111112';
      
      MockedPublicKey.mockImplementation((address: string) => ({ toBase58: () => address }) as any);
      mockConnection.getTokenAccountsByOwner.mockResolvedValue({ value: [] });

      const result = await service.getTokenBalances(testAddress, 'solana-mainnet');

      expect(result).toEqual([]);
      expect(mockConnection.getTokenAccountsByOwner).toHaveBeenCalled();
    });

    it('should parse token accounts correctly', async () => {
      const testAddress = '11111111111111111111111111111112';
      const mockTokenAccount = {
        pubkey: { toBase58: () => 'token-account-address' },
        account: {
          data: {
            parsed: {
              info: {
                mint: 'mint-address',
                tokenAmount: {
                  amount: '1000000',
                  decimals: 6,
                  uiAmount: 1
                }
              }
            }
          }
        }
      };
      
      MockedPublicKey.mockImplementation((address: string) => ({ toBase58: () => address }) as any);
      mockConnection.getTokenAccountsByOwner.mockResolvedValue({
        value: [mockTokenAccount]
      } as any);

      const result = await service.getTokenBalances(testAddress, 'solana-mainnet');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        mint: 'mint-address',
        tokenAccount: 'token-account-address',
        amount: BigInt('1000000'),
        decimals: 6,
        uiAmount: 1
      });
    });
  });

  describe('sendTransaction', () => {
    it('should send transaction and return signature', async () => {
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.from('mock-transaction'))
      };
      const mockSignature = 'mock-signature';
      
      mockConnection.sendTransaction.mockResolvedValue(mockSignature);

      const result = await service.sendTransaction(mockTransaction as any, 'solana-mainnet');

      expect(result).toBe(mockSignature);
      expect(mockConnection.sendTransaction).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm transaction successfully', async () => {
      const mockSignature = 'mock-signature';
      const mockConfirmation = {
        context: { slot: 123456 },
        value: { confirmationStatus: 'confirmed' }
      };
      
      mockConnection.confirmTransaction.mockResolvedValue(mockConfirmation as any);

      const result = await service.confirmTransaction(mockSignature, 'solana-mainnet');

      expect(result.confirmationStatus).toBe('confirmed');
      expect(result.slot).toBe(123456);
    });
  });

  describe('healthCheck', () => {
    it('should return true when connection is healthy', async () => {
      mockConnection.getSlot.mockResolvedValue(123456);

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockConnection.getSlot.mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getNetworkConfig', () => {
    it('should return correct mainnet config', () => {
      const config = service.getNetworkConfig('solana-mainnet');

      expect(config).toMatchObject({
        name: 'Solana Mainnet',
        currency: 'SOL',
        blockExplorer: 'https://explorer.solana.com'
      });
    });

    it('should return correct devnet config', () => {
      const config = service.getNetworkConfig('solana-devnet');

      expect(config).toMatchObject({
        name: 'Solana Devnet',
        currency: 'SOL',
        blockExplorer: 'https://explorer.solana.com'
      });
    });
  });

  describe('close', () => {
    it('should close all connections', async () => {
      await service.close();

      // Since we have multiple networks, should call close on each connection
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear internal cache', () => {
      // This should not throw any errors
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});