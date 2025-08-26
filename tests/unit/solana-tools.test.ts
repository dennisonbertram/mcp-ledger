/**
 * Unit tests for SolanaToolHandlers
 */

import { SolanaToolHandlers } from '../../src/handlers/solana-tools.js';
import { LedgerService } from '../../src/services/ledger.js';
import { SolanaBlockchainService } from '../../src/services/solana-blockchain.js';
import { SolanaTransactionCrafter } from '../../src/services/solana-transaction-crafter.js';
import type { 
  GetSolanaAddressParams,
  GetSolanaBalanceParams,
  GetSplTokenBalancesParams,
  SendSolParams,
  SendSplTokenParams
} from '../../src/types/index.js';

// Mock dependencies
jest.mock('../../src/services/ledger.js');
jest.mock('../../src/services/solana-blockchain.js');
jest.mock('../../src/services/solana-transaction-crafter.js');

const MockedLedgerService = LedgerService as jest.MockedClass<typeof LedgerService>;
const MockedSolanaBlockchainService = SolanaBlockchainService as jest.MockedClass<typeof SolanaBlockchainService>;
const MockedSolanaTransactionCrafter = SolanaTransactionCrafter as jest.MockedClass<typeof SolanaTransactionCrafter>;

describe('SolanaToolHandlers', () => {
  let handlers: SolanaToolHandlers;
  let mockLedgerService: jest.Mocked<LedgerService>;
  let mockBlockchainService: jest.Mocked<SolanaBlockchainService>;
  let mockTransactionCrafter: jest.Mocked<SolanaTransactionCrafter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLedgerService = {
      getSolanaAddress: jest.fn(),
      signSolanaTransaction: jest.fn(),
    } as any;

    mockBlockchainService = {
      getBalance: jest.fn(),
      getTokenBalances: jest.fn(),
      sendTransaction: jest.fn(),
      confirmTransaction: jest.fn(),
      getNetworkConfig: jest.fn(),
    } as any;

    mockTransactionCrafter = {
      craftSolTransfer: jest.fn(),
      craftSplTokenTransfer: jest.fn(),
    } as any;

    MockedLedgerService.mockImplementation(() => mockLedgerService);
    MockedSolanaBlockchainService.mockImplementation(() => mockBlockchainService);
    MockedSolanaTransactionCrafter.mockImplementation(() => mockTransactionCrafter);

    handlers = new SolanaToolHandlers(
      mockLedgerService,
      mockBlockchainService,
      mockTransactionCrafter
    );
  });

  describe('getSolanaAddress', () => {
    it('should get Solana address successfully', async () => {
      const mockAddressInfo = {
        address: 'mock-address',
        publicKey: 'mock-public-key',
        derivationPath: "44'/501'/0'/0'"
      };
      mockLedgerService.getSolanaAddress.mockResolvedValue(mockAddressInfo);

      const params: GetSolanaAddressParams = {
        network: 'solana-mainnet'
      };

      const result = await handlers.getSolanaAddress(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.address).toBe('mock-address');
        expect(result.publicKey).toBe('mock-public-key');
        expect(result.network).toBe('solana-mainnet');
      }
      expect(mockLedgerService.getSolanaAddress).toHaveBeenCalledWith("44'/501'/0'/0'", false);
    });

    it('should handle errors gracefully', async () => {
      mockLedgerService.getSolanaAddress.mockRejectedValue(new Error('Ledger error'));

      const params: GetSolanaAddressParams = {
        network: 'solana-mainnet'
      };

      const result = await handlers.getSolanaAddress(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Ledger error');
      }
    });

    it('should use custom derivation path when provided', async () => {
      const customPath = "44'/501'/1'/0'";
      const mockAddressInfo = {
        address: 'mock-address',
        publicKey: 'mock-public-key',
        derivationPath: customPath
      };
      mockLedgerService.getSolanaAddress.mockResolvedValue(mockAddressInfo);

      const params: GetSolanaAddressParams = {
        derivationPath: customPath,
        display: true,
        network: 'solana-devnet'
      };

      await handlers.getSolanaAddress(params);

      expect(mockLedgerService.getSolanaAddress).toHaveBeenCalledWith(customPath, true);
    });
  });

  describe('getSolanaBalance', () => {
    it('should get SOL balance successfully', async () => {
      const mockBalance = {
        lamports: BigInt('1000000000'),
        sol: 1
      };
      mockBlockchainService.getBalance.mockResolvedValue(mockBalance);

      const params: GetSolanaBalanceParams = {
        address: '11111111111111111111111111111112',
        network: 'solana-mainnet'
      };

      const result = await handlers.getSolanaBalance(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.balance.lamports).toBe('1000000000');
        expect(result.balance.sol).toBe(1);
        expect(result.address).toBe(params.address);
        expect(result.network).toBe('solana-mainnet');
      }
    });

    it('should handle invalid address', async () => {
      const params: GetSolanaBalanceParams = {
        address: 'invalid-address',
        network: 'solana-mainnet'
      };

      const result = await handlers.getSolanaBalance(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid Solana address');
      }
    });
  });

  describe('getSplTokenBalances', () => {
    it('should get SPL token balances successfully', async () => {
      const mockTokenBalances = [
        {
          mint: 'mint1',
          amount: BigInt('1000000'),
          decimals: 6,
          uiAmount: 1,
          tokenAccount: 'token-account-1',
          tokenInfo: {
            symbol: 'TOKEN1',
            name: 'Test Token 1'
          }
        },
        {
          mint: 'mint2',
          amount: BigInt('2000000'),
          decimals: 6,
          uiAmount: 2,
          tokenAccount: 'token-account-2',
          tokenInfo: {
            symbol: 'TOKEN2',
            name: 'Test Token 2'
          }
        }
      ];
      mockBlockchainService.getTokenBalances.mockResolvedValue(mockTokenBalances);

      const params: GetSplTokenBalancesParams = {
        address: '11111111111111111111111111111112',
        network: 'solana-mainnet'
      };

      const result = await handlers.getSplTokenBalances(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.balances).toHaveLength(2);
        expect(result.balances[0]).toMatchObject({
          mint: 'mint1',
          amount: '1000000',
          decimals: 6,
          symbol: 'TOKEN1'
        });
      }
    });

    it('should filter by mint addresses when provided', async () => {
      const mockTokenBalances = [
        {
          mint: 'mint1',
          amount: BigInt('1000000'),
          decimals: 6,
          uiAmount: 1,
          tokenAccount: 'token-account-1',
          tokenInfo: { symbol: 'TOKEN1', name: 'Test Token 1' }
        },
        {
          mint: 'mint2',
          amount: BigInt('2000000'),
          decimals: 6,
          uiAmount: 2,
          tokenAccount: 'token-account-2',
          tokenInfo: { symbol: 'TOKEN2', name: 'Test Token 2' }
        }
      ];
      mockBlockchainService.getTokenBalances.mockResolvedValue(mockTokenBalances);

      const params: GetSplTokenBalancesParams = {
        address: '11111111111111111111111111111112',
        mintAddresses: ['mint1'],
        network: 'solana-mainnet'
      };

      const result = await handlers.getSplTokenBalances(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.balances).toHaveLength(1);
        expect(result.balances[0].mint).toBe('mint1');
      }
    });
  });

  describe('sendSol', () => {
    it('should send SOL successfully', async () => {
      const mockAddressInfo = {
        address: 'sender-address',
        publicKey: 'sender-public-key',
        derivationPath: "44'/501'/0'/0'"
      };
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.from('mock-transaction')),
        addSignature: jest.fn()
      };
      const mockSignature = { signature: Buffer.from('mock-signature') };
      const mockTxSignature = 'transaction-signature';
      const mockConfirmation = {
        confirmationStatus: 'confirmed',
        slot: 123456
      };
      const mockNetworkConfig = {
        blockExplorer: 'https://explorer.solana.com'
      };

      mockLedgerService.getSolanaAddress.mockResolvedValue(mockAddressInfo);
      mockTransactionCrafter.craftSolTransfer.mockResolvedValue(mockTransaction as any);
      mockLedgerService.signSolanaTransaction.mockResolvedValue(mockSignature);
      mockBlockchainService.sendTransaction.mockResolvedValue(mockTxSignature);
      mockBlockchainService.confirmTransaction.mockResolvedValue(mockConfirmation);
      mockBlockchainService.getNetworkConfig.mockReturnValue(mockNetworkConfig);

      const params: SendSolParams = {
        toAddress: 'recipient-address',
        amount: '1',
        network: 'solana-mainnet'
      };

      const result = await handlers.sendSol(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.signature).toBe(mockTxSignature);
        expect(result.confirmationStatus).toBe('confirmed');
        expect(result.explorerUrl).toContain(mockTxSignature);
      }
    });

    it('should handle transaction errors', async () => {
      const mockAddressInfo = {
        address: 'sender-address',
        publicKey: 'sender-public-key',
        derivationPath: "44'/501'/0'/0'"
      };
      mockLedgerService.getSolanaAddress.mockResolvedValue(mockAddressInfo);
      mockTransactionCrafter.craftSolTransfer.mockRejectedValue(new Error('Transaction error'));

      const params: SendSolParams = {
        toAddress: 'recipient-address',
        amount: '1',
        network: 'solana-mainnet'
      };

      const result = await handlers.sendSol(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Transaction error');
      }
    });
  });

  describe('sendSplToken', () => {
    it('should send SPL token successfully', async () => {
      const mockAddressInfo = {
        address: 'sender-address',
        publicKey: 'sender-public-key',
        derivationPath: "44'/501'/0'/0'"
      };
      const mockTokenBalances = [
        {
          mint: 'mint-address',
          amount: BigInt('10000000'),
          decimals: 6,
          uiAmount: 10,
          tokenAccount: 'token-account',
          tokenInfo: { symbol: 'TOKEN', name: 'Test Token' }
        }
      ];
      const mockTransaction = {
        serialize: jest.fn().mockReturnValue(Buffer.from('mock-transaction')),
        addSignature: jest.fn()
      };
      const mockSignature = { signature: Buffer.from('mock-signature') };
      const mockTxSignature = 'transaction-signature';
      const mockConfirmation = {
        confirmationStatus: 'confirmed',
        slot: 123456
      };
      const mockNetworkConfig = {
        blockExplorer: 'https://explorer.solana.com'
      };

      mockLedgerService.getSolanaAddress.mockResolvedValue(mockAddressInfo);
      mockBlockchainService.getTokenBalances.mockResolvedValue(mockTokenBalances);
      mockTransactionCrafter.craftSplTokenTransfer.mockResolvedValue(mockTransaction as any);
      mockLedgerService.signSolanaTransaction.mockResolvedValue(mockSignature);
      mockBlockchainService.sendTransaction.mockResolvedValue(mockTxSignature);
      mockBlockchainService.confirmTransaction.mockResolvedValue(mockConfirmation);
      mockBlockchainService.getNetworkConfig.mockReturnValue(mockNetworkConfig);

      const params: SendSplTokenParams = {
        toAddress: 'recipient-address',
        mintAddress: 'mint-address',
        amount: '1',
        network: 'solana-mainnet'
      };

      const result = await handlers.sendSplToken(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.signature).toBe(mockTxSignature);
        expect(result.confirmationStatus).toBe('confirmed');
      }
    });

    it('should handle token not found error', async () => {
      const mockAddressInfo = {
        address: 'sender-address',
        publicKey: 'sender-public-key',
        derivationPath: "44'/501'/0'/0'"
      };
      const mockTokenBalances: any[] = []; // No tokens

      mockLedgerService.getSolanaAddress.mockResolvedValue(mockAddressInfo);
      mockBlockchainService.getTokenBalances.mockResolvedValue(mockTokenBalances);

      const params: SendSplTokenParams = {
        toAddress: 'recipient-address',
        mintAddress: 'mint-address',
        amount: '1',
        network: 'solana-mainnet'
      };

      const result = await handlers.sendSplToken(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Token not found in sender wallet');
      }
    });
  });

  describe('analyzeSolanaFees', () => {
    it('should analyze fees successfully', async () => {
      const result = await handlers.analyzeSolanaFees({
        network: 'solana-mainnet'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.analysis.currentBaseFee).toBe(5000);
        expect(result.analysis.priorityFeeRecommendations).toHaveProperty('low');
        expect(result.analysis.priorityFeeRecommendations).toHaveProperty('medium');
        expect(result.analysis.priorityFeeRecommendations).toHaveProperty('high');
        expect(result.analysis.networkCongestion).toMatch(/^(low|medium|high)$/);
      }
    });
  });

  describe('validateSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      // Mock bs58 decode to return 32-byte buffer for valid addresses
      jest.doMock('bs58', () => ({
        decode: jest.fn().mockReturnValue(Buffer.alloc(32))
      }));

      const isValid = (handlers as any).validateSolanaAddress('11111111111111111111111111111112');
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid Solana addresses', () => {
      // Mock bs58 decode to throw error for invalid addresses
      jest.doMock('bs58', () => ({
        decode: jest.fn().mockImplementation(() => {
          throw new Error('Invalid base58');
        })
      }));

      const isValid = (handlers as any).validateSolanaAddress('invalid-address');
      
      expect(isValid).toBe(false);
    });
  });
});