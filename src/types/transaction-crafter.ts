/**
 * TypeScript interfaces and types for TransactionCrafter
 */

import type { Hex, Address } from 'viem';
import type { SupportedNetwork } from './blockchain.js';

/**
 * Base transaction parameters
 */
export interface BaseTransactionParams {
  network: SupportedNetwork;
  from?: Address; // If not provided, will be retrieved from Ledger
  nonce?: number; // If not provided, will be retrieved from blockchain
  gasLimit?: bigint; // If not provided, will be estimated
  maxFeePerGas?: bigint; // For EIP-1559 transactions
  maxPriorityFeePerGas?: bigint; // For EIP-1559 transactions
  gasPrice?: bigint; // For legacy transactions
}

/**
 * ETH transfer parameters
 */
export interface ETHTransferParams extends BaseTransactionParams {
  to: Address;
  amount: bigint | string; // Amount in wei or formatted string with units
}

/**
 * ERC20 transfer parameters
 */
export interface ERC20TransferParams extends BaseTransactionParams {
  to: Address;
  amount: bigint | string; // Amount in token units
  tokenAddress: Address;
  decimals?: number; // If not provided, will be fetched from contract
}

/**
 * ERC20 approve parameters
 */
export interface ERC20ApproveParams extends BaseTransactionParams {
  spender: Address;
  amount: bigint | string; // Amount in token units
  tokenAddress: Address;
  decimals?: number; // If not provided, will be fetched from contract
}

/**
 * ERC721 transfer parameters
 */
export interface ERC721TransferParams extends BaseTransactionParams {
  to: Address;
  tokenId: bigint | string;
  contractAddress: Address;
  safeTransfer?: boolean; // Use safeTransferFrom if true
}

/**
 * ERC721 approve parameters
 */
export interface ERC721ApproveParams extends BaseTransactionParams {
  spender: Address;
  tokenId: bigint | string;
  contractAddress: Address;
}

/**
 * Custom transaction parameters
 */
export interface CustomTransactionParams extends BaseTransactionParams {
  contractAddress: Address;
  methodName: string;
  params: any[];
  value?: bigint; // ETH to send with transaction
  abi?: any[]; // If not provided, will be fetched from Blockscout
}

/**
 * Multi-call transaction
 */
export interface MultiCallTransaction {
  to: Address;
  data: Hex;
  value?: bigint;
}

/**
 * Multi-call parameters
 */
export interface MultiCallParams extends BaseTransactionParams {
  calls: MultiCallTransaction[];
}

/**
 * Prepared transaction ready for signing
 */
export interface PreparedTransaction {
  to: Address;
  from: Address;
  data: Hex;
  value: bigint;
  nonce: number;
  gasLimit: bigint;
  chainId: number;
  // EIP-1559 fields
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  // Legacy field
  gasPrice?: bigint;
  // Transaction type
  type: 'legacy' | 'eip1559';
}

/**
 * Signed transaction ready for broadcasting
 */
export interface SignedTransaction {
  raw: Hex;
  hash: Hex;
  from: Address;
  to: Address | null;
  signature: {
    r: Hex;
    s: Hex;
    v: bigint;
  };
}

/**
 * Transaction validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: string;
  value?: any;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: ValidationWarningCode;
  message: string;
  field?: string;
  value?: any;
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_NOT_VERIFIED = 'CONTRACT_NOT_VERIFIED',
  METHOD_NOT_FOUND = 'METHOD_NOT_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  INVALID_TOKEN_ADDRESS = 'INVALID_TOKEN_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_TOKEN_ID = 'INVALID_TOKEN_ID',
  LEDGER_NOT_CONNECTED = 'LEDGER_NOT_CONNECTED',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
}

/**
 * Validation warning codes
 */
export enum ValidationWarningCode {
  HIGH_GAS_PRICE = 'HIGH_GAS_PRICE',
  LOW_GAS_LIMIT = 'LOW_GAS_LIMIT',
  UNVERIFIED_CONTRACT = 'UNVERIFIED_CONTRACT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  LARGE_TRANSFER = 'LARGE_TRANSFER',
}

/**
 * Gas estimation result
 */
export interface GasEstimation {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCost: bigint;
  estimatedCostInEth: string;
}

/**
 * Transaction crafter error
 */
export class TransactionCrafterError extends Error {
  constructor(
    message: string,
    public code: ValidationErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'TransactionCrafterError';
  }
}

/**
 * Configuration for TransactionCrafter
 */
export interface TransactionCrafterConfig {
  ledgerDerivationPath?: string; // Default: "44'/60'/0'/0/0"
  defaultNetwork?: SupportedNetwork;
  validateBeforeSigning?: boolean; // Default: true
  autoEstimateGas?: boolean; // Default: true
  securityChecks?: boolean; // Default: true
  maxGasLimit?: bigint; // Maximum allowed gas limit
  warningThresholds?: {
    largeTransferEth?: bigint; // Warn for large ETH transfers
    highGasPrice?: bigint; // Warn for high gas prices
  };
}