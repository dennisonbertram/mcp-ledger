/**
 * TypeScript interfaces and types for Blockscout API client
 */

// Network configurations
export type SupportedNetwork = 
  | 'mainnet'
  | 'sepolia'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'goerli'
  | 'polygon-mumbai'
  | 'arbitrum-sepolia'
  | 'optimism-sepolia'
  | 'base-sepolia';

export interface NetworkConfig {
  name: string;
  chainId: number;
  apiUrl: string;
  rpcUrl?: string;
}

// Contract ABI types
export interface ABIEntry {
  constant?: boolean;
  inputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
    components?: unknown[];
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
    components?: unknown[];
  }>;
  name?: string;
  type: string;
  stateMutability?: string;
  payable?: boolean;
  anonymous?: boolean;
}

// API Response types
export interface ContractABIResponse {
  status: string;
  message: string;
  result: string | ABIEntry[];
}

export interface ContractInfo {
  address: string;
  name?: string;
  compiler?: string;
  version?: string;
  optimizationUsed?: boolean;
  runs?: number;
  constructorArguments?: string;
  evmVersion?: string;
  library?: string;
  licenseType?: string;
  proxy?: boolean;
  implementation?: string;
  swarmSource?: string;
  sourceCode?: string;
  abi?: ABIEntry[];
  contractCreator?: string;
  creationTxHash?: string;
  verifiedAt?: string;
}

export interface TokenInfo {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  type?: 'ERC20' | 'ERC721' | 'ERC1155';
  owner?: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  marketCap?: string;
  price?: string;
  holders?: number;
  transfers?: number;
}

export interface Transaction {
  hash: string;
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  nonce: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status?: string;
  input: string;
  contractAddress?: string;
  cumulativeGasUsed: string;
  confirmations: string;
  methodId?: string;
  functionName?: string;
}

export interface TransactionHistoryResponse {
  status: string;
  message: string;
  result: Transaction[];
}

export interface SearchResult {
  address: string;
  name?: string;
  symbol?: string;
  type?: string;
  verified?: boolean;
  logoUrl?: string;
  website?: string;
}

// Error types
export class BlockscoutError extends Error {
  public code?: string;
  public statusCode?: number;
  public details?: unknown;
  
  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'BlockscoutError';
    if (code !== undefined) this.code = code;
    if (statusCode !== undefined) this.statusCode = statusCode;
    if (details !== undefined) this.details = details;
  }
}

export class NetworkNotSupportedError extends BlockscoutError {
  constructor(network: string) {
    super(`Network '${network}' is not supported`, 'NETWORK_NOT_SUPPORTED');
  }
}

export class ContractNotFoundError extends BlockscoutError {
  constructor(address: string, network: string) {
    super(`Contract ${address} not found on ${network}`, 'CONTRACT_NOT_FOUND', 404);
  }
}

export class ContractNotVerifiedError extends BlockscoutError {
  constructor(address: string, network: string) {
    super(`Contract ${address} is not verified on ${network}`, 'CONTRACT_NOT_VERIFIED');
  }
}

export class InvalidAddressError extends BlockscoutError {
  constructor(address: string) {
    super(`Invalid Ethereum address: ${address}`, 'INVALID_ADDRESS');
  }
}

export class RateLimitError extends BlockscoutError {
  constructor(message?: string) {
    super(message || 'API rate limit exceeded', 'RATE_LIMIT', 429);
  }
}

export class NetworkTimeoutError extends BlockscoutError {
  constructor(message?: string) {
    super(message || 'Network request timeout', 'TIMEOUT', 408);
  }
}

// Client configuration
export interface BlockscoutClientConfig {
  networks?: Record<SupportedNetwork, NetworkConfig>;
  defaultNetwork?: SupportedNetwork;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  customEndpoints?: Record<string, string>;
}

// Pagination options
export interface PaginationOptions {
  page?: number;
  offset?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

// Search options
export interface SearchOptions {
  type?: 'contract' | 'token' | 'all';
  verified?: boolean;
  limit?: number;
}