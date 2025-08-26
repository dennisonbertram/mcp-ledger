/**
 * Mock implementations for Solana testing
 */

import type { 
  SolanaAddress,
  SolanaBalance,
  SPLTokenBalance,
  SolanaTransaction,
  SolanaNetwork,
  ConfirmationStatus
} from '../../src/types/blockchain.js';

/**
 * Mock Ledger address response
 */
export const mockSolanaAddressInfo: SolanaAddress = {
  address: '11111111111111111111111111111112',
  publicKey: 'mock-public-key-base58',
  derivationPath: "44'/501'/0'/0'"
};

/**
 * Mock SOL balance
 */
export const mockSolanaBalance: SolanaBalance = {
  lamports: BigInt('1000000000'), // 1 SOL
  sol: 1
};

/**
 * Mock SPL token balances
 */
export const mockSplTokenBalances: SPLTokenBalance[] = [
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
    amount: BigInt('1000000'), // 1 USDC (6 decimals)
    decimals: 6,
    uiAmount: 1,
    tokenAccount: 'mock-usdc-token-account',
    tokenInfo: {
      symbol: 'USDC',
      name: 'USD Coin'
    }
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT mint
    amount: BigInt('2000000'), // 2 USDT (6 decimals)
    decimals: 6,
    uiAmount: 2,
    tokenAccount: 'mock-usdt-token-account',
    tokenInfo: {
      symbol: 'USDT',
      name: 'Tether USD'
    }
  }
];

/**
 * Mock transaction
 */
export const mockSolanaTransaction: SolanaTransaction = {
  signature: 'mock-transaction-signature',
  blockTime: Date.now() / 1000,
  slot: 123456789,
  confirmations: 1,
  err: null,
  memo: null,
  transaction: {
    message: {
      accountKeys: ['11111111111111111111111111111112', 'recipient-address'],
      instructions: [
        {
          programIdIndex: 0,
          accounts: [0, 1],
          data: 'mock-instruction-data'
        }
      ],
      recentBlockhash: 'mock-recent-blockhash'
    },
    signatures: ['mock-signature']
  }
};

/**
 * Mock Solana Connection for @solana/web3.js
 */
export const createMockSolanaConnection = () => ({
  getBalance: jest.fn().mockResolvedValue(1000000000),
  getTokenAccountsByOwner: jest.fn().mockResolvedValue({
    value: [
      {
        pubkey: { toBase58: () => 'mock-usdc-token-account' },
        account: {
          data: {
            parsed: {
              info: {
                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                tokenAmount: {
                  amount: '1000000',
                  decimals: 6,
                  uiAmount: 1
                }
              }
            }
          }
        }
      }
    ]
  }),
  getAccountInfo: jest.fn().mockResolvedValue({
    data: Buffer.from('mock-account-data'),
    executable: false,
    lamports: 1000000000,
    owner: { toBase58: () => 'system-program' },
    rentEpoch: 123
  }),
  sendTransaction: jest.fn().mockResolvedValue('mock-transaction-signature'),
  confirmTransaction: jest.fn().mockResolvedValue({
    context: { slot: 123456 },
    value: { confirmationStatus: 'confirmed' as ConfirmationStatus }
  }),
  getSlot: jest.fn().mockResolvedValue(123456789),
  getLatestBlockhash: jest.fn().mockResolvedValue({
    blockhash: 'mock-blockhash',
    lastValidBlockHeight: 123456800
  }),
  getFeeForMessage: jest.fn().mockResolvedValue({ value: 5000 }),
  close: jest.fn().mockResolvedValue(undefined),
  // WebSocket methods for subscription support
  onAccountChange: jest.fn(),
  removeAccountChangeListener: jest.fn(),
  onSlotChange: jest.fn(),
  removeSlotChangeListener: jest.fn()
});

/**
 * Mock Transaction for @solana/web3.js
 */
export const createMockTransaction = () => ({
  add: jest.fn().mockReturnThis(),
  serialize: jest.fn().mockReturnValue(Buffer.from('mock-serialized-transaction')),
  compileMessage: jest.fn().mockReturnValue('mock-compiled-message'),
  addSignature: jest.fn(),
  recentBlockhash: 'mock-recent-blockhash',
  feePayer: null,
  instructions: [],
  signatures: []
});

/**
 * Mock PublicKey for @solana/web3.js
 */
export const createMockPublicKey = (address: string) => ({
  toBase58: () => address,
  toBuffer: () => Buffer.from(address, 'base64'),
  equals: jest.fn().mockReturnValue(false),
  isOnCurve: () => true
});

/**
 * Mock SystemProgram for @solana/web3.js
 */
export const mockSystemProgram = {
  programId: createMockPublicKey('11111111111111111111111111111112'),
  transfer: jest.fn().mockReturnValue({
    keys: [
      { pubkey: createMockPublicKey('sender'), isSigner: true, isWritable: true },
      { pubkey: createMockPublicKey('recipient'), isSigner: false, isWritable: true }
    ],
    programId: createMockPublicKey('11111111111111111111111111111112'),
    data: Buffer.from('mock-transfer-instruction')
  })
};

/**
 * Mock error responses
 */
export const mockSolanaErrors = {
  invalidAddress: new Error('Invalid Solana address format'),
  networkError: new Error('Failed to connect to Solana RPC'),
  insufficientBalance: new Error('Insufficient SOL balance for transaction'),
  ledgerError: new Error('Ledger device not connected'),
  transactionFailed: new Error('Transaction failed to confirm'),
  tokenAccountNotFound: new Error('Token account not found'),
  invalidMint: new Error('Invalid mint address')
};

/**
 * Mock network configurations
 */
export const mockNetworkConfigs = {
  'solana-mainnet': {
    name: 'Solana Mainnet',
    currency: 'SOL',
    blockExplorer: 'https://explorer.solana.com',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com/'
  },
  'solana-devnet': {
    name: 'Solana Devnet',
    currency: 'SOL',
    blockExplorer: 'https://explorer.solana.com',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com/'
  },
  'solana-testnet': {
    name: 'Solana Testnet',
    currency: 'SOL',
    blockExplorer: 'https://explorer.solana.com',
    rpcUrl: 'https://api.testnet.solana.com',
    wsUrl: 'wss://api.testnet.solana.com/'
  }
};

/**
 * Helper function to create a complete mock Solana environment
 */
export const createMockSolanaEnvironment = () => ({
  connection: createMockSolanaConnection(),
  transaction: createMockTransaction(),
  publicKey: createMockPublicKey,
  systemProgram: mockSystemProgram,
  addressInfo: mockSolanaAddressInfo,
  balance: mockSolanaBalance,
  tokenBalances: mockSplTokenBalances,
  networkConfigs: mockNetworkConfigs,
  errors: mockSolanaErrors
});