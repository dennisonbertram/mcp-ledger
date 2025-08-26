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
  | 'base';

export type EthereumNetwork = 
  | 'mainnet'
  | 'sepolia'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base';

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

