/**
 * Type definitions for the blockchain service
 */

import type { Address, Hash, Hex } from 'viem';

export type SupportedNetwork = 
  | 'mainnet'
  | 'sepolia'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'solana-mainnet'
  | 'solana-devnet'
  | 'solana-testnet';

export type EthereumNetwork = 
  | 'mainnet'
  | 'sepolia'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base';

export type SolanaNetwork = 
  | 'solana-mainnet'
  | 'solana-devnet'
  | 'solana-testnet';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl?: string;
  blockExplorer?: string;
}

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
}

export interface NFTInfo {
  contractAddress: Address;
  tokenId: bigint;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Record<string, any>;
  owner?: Address | undefined;
  tokenUri?: string | undefined;
}

export interface GasInfo {
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedGas?: bigint;
}

export interface TransactionData {
  from?: Address;
  to: Address;
  value?: bigint;
  data?: Hex;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

export interface BlockInfo {
  number: bigint;
  hash: Hash;
  parentHash: Hash;
  timestamp: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas?: bigint | null;
  miner: Address;
  transactions: Hash[];
}

export interface TransactionReceiptInfo {
  transactionHash: Hash;
  blockHash: Hash;
  blockNumber: bigint;
  from: Address;
  to?: Address | null;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: 'success' | 'reverted';
  logs: Array<{
    address: Address;
    topics: Hex[];
    data: Hex;
  }>;
}

export interface TokenBalance {
  address: Address;
  balance: bigint;
  decimals: number;
  symbol: string;
  name: string;
}

export interface BlockchainServiceConfig {
  networks?: Partial<Record<SupportedNetwork, NetworkConfig>>;
  defaultNetwork?: SupportedNetwork;
  cacheEnabled?: boolean;
  cacheTTL?: number; // in seconds
  requestTimeout?: number; // in milliseconds
  maxRetries?: number;
}

export class BlockchainError extends Error {
  constructor(
    message: string,
    public code: string,
    public network?: SupportedNetwork,
    public cause?: Error
  ) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export enum BlockchainErrorCode {
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  RPC_ERROR = 'RPC_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_HASH = 'INVALID_HASH',
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
}

// ============ Solana-specific types ============

export interface SolanaNetworkConfig extends NetworkConfig {
  commitment: 'processed' | 'confirmed' | 'finalized';
  wsEndpoint?: string;
}

export interface SolanaAddress {
  address: string;          // Base58 encoded
  derivationPath: string;   // BIP44 path
  publicKey: string;        // Hex encoded public key
}

export interface SolanaBalance {
  lamports: bigint;         // Balance in lamports
  sol: string;              // Human-readable SOL amount
  rentExemptReserve: bigint; // Minimum balance for rent exemption
}

export interface SPLTokenInfo {
  mint: string;             // Token mint address
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  logoUri?: string;
}

export interface SPLTokenBalance {
  mint: string;             // Token mint address
  amount: bigint;           // Token amount in base units
  decimals: number;         // Token decimals
  uiAmount: string;         // Human-readable amount
  tokenAccount?: string;    // Associated token account address
  tokenInfo?: SPLTokenInfo; // Optional token metadata
}

export interface SolanaAccountInfo {
  address: string;
  lamports: bigint;
  owner: string;            // Program that owns this account
  executable: boolean;      // Whether account contains executable code
  rentEpoch: number;        // Next epoch when rent is due
  data?: Buffer;            // Account data
}

export interface SolanaTransaction {
  signatures: string[];    // Base58 encoded signatures
  message: {
    header: {
      numRequiredSignatures: number;
      numReadonlySignedAccounts: number;
      numReadonlyUnsignedAccounts: number;
    };
    accountKeys: string[];  // All accounts referenced
    recentBlockhash: string; // Recent blockhash
    instructions: SolanaInstruction[];
  };
}

export interface SolanaInstruction {
  programId: string;        // Program to call
  accounts: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: Buffer;             // Instruction data
}

export interface SolanaFeeEstimate {
  baseFee: number;          // Base transaction fee in lamports
  priorityFee?: number;     // Optional priority fee in lamports
  totalFee: number;         // Total estimated fee
  computeUnits?: number;    // Estimated compute units
}

export interface SolanaBlockInfo {
  slot: number;
  blockhash: string;
  previousBlockhash: string;
  parentSlot: number;
  timestamp: number;
  transactions: string[];   // Transaction signatures
}

export interface SolanaTransactionInfo {
  slot: number;
  signature: string;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  err: any | null;
  memo?: string;
  blockTime?: number;
}

export interface SolanaBlockchainServiceConfig {
  networks?: Partial<Record<SolanaNetwork, SolanaNetworkConfig>>;
  defaultNetwork?: SolanaNetwork;
  cacheEnabled?: boolean;
  cacheTTL?: number;        // in seconds
  requestTimeout?: number;  // in milliseconds
  maxRetries?: number;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

// Extended error codes for Solana-specific errors
export enum SolanaErrorCode {
  INVALID_SOLANA_ADDRESS = 'INVALID_SOLANA_ADDRESS',
  INVALID_MINT_ADDRESS = 'INVALID_MINT_ADDRESS',
  INSUFFICIENT_SOL_BALANCE = 'INSUFFICIENT_SOL_BALANCE',
  INSUFFICIENT_TOKEN_BALANCE = 'INSUFFICIENT_TOKEN_BALANCE',
  TOKEN_ACCOUNT_NOT_FOUND = 'TOKEN_ACCOUNT_NOT_FOUND',
  MINT_NOT_FOUND = 'MINT_NOT_FOUND',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  TRANSACTION_TOO_LARGE = 'TRANSACTION_TOO_LARGE',
  BLOCKHASH_EXPIRED = 'BLOCKHASH_EXPIRED',
  COMPUTE_BUDGET_EXCEEDED = 'COMPUTE_BUDGET_EXCEEDED',
  RENT_EXEMPT_MINIMUM_NOT_MET = 'RENT_EXEMPT_MINIMUM_NOT_MET',
  PROGRAM_ERROR = 'PROGRAM_ERROR',
  SOLANA_RPC_ERROR = 'SOLANA_RPC_ERROR',
  LEDGER_SOLANA_APP_ERROR = 'LEDGER_SOLANA_APP_ERROR',
}

export class SolanaError extends Error {
  constructor(
    message: string,
    public code: SolanaErrorCode,
    public network?: SolanaNetwork,
    public cause?: Error
  ) {
    super(message);
    this.name = 'SolanaError';
  }
}