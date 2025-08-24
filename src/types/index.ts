/**
 * Type definitions for the MCP Ledger server
 */

import { z } from 'zod';

// Server configuration
export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
}

// Tool parameter schemas using Zod
export const GetLedgerAddressSchema = z.object({
  derivationPath: z.string().optional().describe('BIP32 derivation path (default: "44\'/60\'/0\'/0/0")'),
  display: z.boolean().optional().default(false).describe('Display address on Ledger device for confirmation'),
});

export const GetBalanceSchema = z.object({
  address: z.string().describe('Ethereum address to check balance for'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to check balance on'),
});

export const GetTokenBalancesSchema = z.object({
  address: z.string().describe('Ethereum address to check token balances for'),
  tokenAddresses: z.array(z.string()).optional().describe('Specific token addresses to check (optional)'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to check balances on'),
});

export const GetNftBalancesSchema = z.object({
  address: z.string().describe('Ethereum address to check NFT balances for'),
  contractAddresses: z.array(z.string()).optional().describe('Specific NFT contract addresses to check (optional)'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to check balances on'),
});

export const CraftTransactionSchema = z.object({
  type: z.enum(['eth_transfer', 'erc20_transfer', 'erc20_approve', 'custom']).describe('Type of transaction to craft'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network for the transaction'),
  to: z.string().describe('Recipient address'),
  amount: z.string().optional().describe('Amount to transfer (in ETH or token units)'),
  tokenAddress: z.string().optional().describe('Token contract address (for ERC20 transactions)'),
  spender: z.string().optional().describe('Spender address (for ERC20 approve)'),
  contractAddress: z.string().optional().describe('Contract address (for custom transactions)'),
  methodName: z.string().optional().describe('Method name (for custom transactions)'),
  methodParams: z.array(z.any()).optional().describe('Method parameters (for custom transactions)'),
  value: z.string().optional().describe('ETH value to send with transaction'),
  gasLimit: z.string().optional().describe('Gas limit'),
  maxFeePerGas: z.string().optional().describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z.string().optional().describe('Maximum priority fee per gas (EIP-1559)'),
});

export const GetContractAbiSchema = z.object({
  contractAddress: z.string().describe('Contract address to get ABI for'),
  network: z.enum(['mainnet', 'sepolia', 'goerli', 'polygon', 'polygon-mumbai', 'arbitrum', 'arbitrum-sepolia', 'optimism', 'optimism-sepolia', 'base', 'base-sepolia']).optional().default('mainnet').describe('Network the contract is deployed on'),
});

export const SignTransactionSchema = z.object({
  transactionData: z.string().describe('Serialized transaction data (hex string)'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network for the transaction'),
});

export const SignMessageSchema = z.object({
  message: z.string().describe('Message to sign (for Sign-In with Ethereum or personal messages)'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
});

export const CraftAndSignTransactionSchema = z.object({
  type: z.enum(['eth_transfer', 'erc20_transfer', 'erc20_approve', 'custom']).describe('Type of transaction to craft and sign'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network for the transaction'),
  to: z.string().describe('Recipient address'),
  amount: z.string().optional().describe('Amount to transfer (in ETH or token units)'),
  tokenAddress: z.string().optional().describe('Token contract address (for ERC20 transactions)'),
  spender: z.string().optional().describe('Spender address (for ERC20 approve)'),
  contractAddress: z.string().optional().describe('Contract address (for custom transactions)'),
  methodName: z.string().optional().describe('Method name (for custom transactions)'),
  methodParams: z.array(z.any()).optional().describe('Method parameters (for custom transactions)'),
  value: z.string().optional().describe('ETH value to send with transaction'),
  gasLimit: z.string().optional().describe('Gas limit'),
  maxFeePerGas: z.string().optional().describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z.string().optional().describe('Maximum priority fee per gas (EIP-1559)'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
});

export const BroadcastTransactionSchema = z.object({
  signedTransaction: z.string().describe('Hex-encoded signed transaction to broadcast'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to broadcast on'),
});

// Convenience tool schemas
export const SendEthSchema = z.object({
  to: z.string().describe('Recipient Ethereum address'),
  amount: z.string().describe('Amount in ETH to send (e.g., "0.1")'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to send on'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
  gasLimit: z.string().optional().describe('Gas limit override'),
  maxFeePerGas: z.string().optional().describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z.string().optional().describe('Maximum priority fee per gas (EIP-1559)'),
});

export const SendErc20TokenSchema = z.object({
  to: z.string().describe('Recipient Ethereum address'),
  amount: z.string().describe('Amount in token units to send (e.g., "100" for 100 USDC)'),
  tokenAddress: z.string().describe('ERC20 token contract address'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to send on'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
  gasLimit: z.string().optional().describe('Gas limit override'),
  maxFeePerGas: z.string().optional().describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z.string().optional().describe('Maximum priority fee per gas (EIP-1559)'),
});

export const SendErc721TokenSchema = z.object({
  to: z.string().describe('Recipient Ethereum address'),
  tokenId: z.string().describe('NFT token ID to transfer'),
  contractAddress: z.string().describe('ERC721 contract address'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to send on'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
  gasLimit: z.string().optional().describe('Gas limit override'),
  maxFeePerGas: z.string().optional().describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z.string().optional().describe('Maximum priority fee per gas (EIP-1559)'),
});

export const ManageTokenApprovalSchema = z.object({
  action: z.enum(['approve', 'revoke', 'increase', 'decrease']).describe('Approval action to perform'),
  tokenAddress: z.string().describe('ERC20 token contract address'),
  spender: z.string().describe('Address to approve/manage allowance for'),
  amount: z.string().optional().describe('Amount to approve/increase/decrease (required for approve/increase/decrease)'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to operate on'),
  derivationPath: z.string().optional().default("44'/60'/0'/0/0").describe('BIP32 derivation path for signing'),
  gasLimit: z.string().optional().describe('Gas limit override'),
  maxFeePerGas: z.string().optional().describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z.string().optional().describe('Maximum priority fee per gas (EIP-1559)'),
});

export const GasAnalysisSchema = z.object({
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).optional().default('mainnet').describe('Network to analyze gas for'),
  transactionType: z.enum(['eth_transfer', 'erc20_transfer', 'erc20_approve', 'nft_transfer', 'contract_interaction']).optional().describe('Type of transaction to estimate gas for'),
  to: z.string().optional().describe('Destination address (for specific gas estimation)'),
  tokenAddress: z.string().optional().describe('Token contract address (for ERC20 operations)'),
  contractAddress: z.string().optional().describe('Contract address (for contract interactions)'),
  methodName: z.string().optional().describe('Contract method name (for contract interactions)'),
  methodParams: z.array(z.any()).optional().describe('Method parameters (for contract interactions)'),
  value: z.string().optional().describe('ETH value to send (for contract interactions)'),
  speed: z.enum(['slow', 'standard', 'fast', 'instant']).optional().default('standard').describe('Transaction speed preference'),
});

// Response types
export interface LedgerAddressResponse {
  address: string;
  publicKey: string;
  derivationPath: string;
  chainCode?: string | undefined;
}

export interface BalanceResponse {
  address: string;
  network: string;
  balance: string;
  balanceEth: string;
}

export interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
}

export interface TokenBalancesResponse {
  address: string;
  network: string;
  tokens: TokenBalance[];
}

export interface NftBalance {
  contractAddress: string;
  name?: string;
  symbol?: string;
  balance: string;
  tokenIds?: string[];
}

export interface NftBalancesResponse {
  address: string;
  network: string;
  nfts: NftBalance[];
}

export interface TransactionResponse {
  transaction: {
    to: string;
    from: string;
    value: string;
    data: string;
    nonce: number;
    gasLimit: string;
    chainId: number;
    maxFeePerGas?: string | undefined;
    maxPriorityFeePerGas?: string | undefined;
    gasPrice?: string | undefined;
    type: 'legacy' | 'eip1559';
  };
  gasEstimation: {
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedCost: string;
    estimatedCostInEth: string;
  };
  serializedTransaction: string; // Hex-encoded transaction ready for Ledger signing
  message: string;
}

export interface ContractAbiResponse {
  contractAddress: string;
  network: string;
  abi: any[];
  verified: boolean;
  contractInfo?: {
    name?: string | undefined;
    compiler?: string | undefined;
    version?: string | undefined;
    optimizationUsed?: boolean | undefined;
    runs?: number | undefined;
  } | undefined;
}

export interface TransactionSignatureResponse {
  signature: {
    r: string;
    s: string;
    v: string;
  };
  signedTransaction: string;
  transactionHash: string;
  network: string;
  derivationPath: string;
}

export interface MessageSignatureResponse {
  signature: string;
  address: string;
  derivationPath: string;
  message: string;
}

export interface BroadcastTransactionResponse {
  transactionHash: string;
  network: string;
  status: 'pending' | 'success' | 'failed';
  blockExplorerUrl?: string | undefined;
}

export interface SendTransactionResponse {
  transactionHash: string;
  network: string;
  from: string;
  to: string;
  amount: string;
  gasUsed: string;
  status: 'pending' | 'success' | 'failed';
  blockExplorerUrl?: string | undefined;
  type: 'eth_transfer' | 'erc20_transfer' | 'erc721_transfer';
  tokenInfo?: {
    address?: string;
    symbol?: string;
    tokenId?: string;
  };
}

export interface TokenApprovalResponse {
  transactionHash: string;
  network: string;
  token: string;
  spender: string;
  action: 'approve' | 'revoke' | 'increase' | 'decrease';
  amount?: string;
  status: 'pending' | 'success' | 'failed';
  blockExplorerUrl?: string | undefined;
}

export interface GasAnalysisResponse {
  network: string;
  timestamp: string;
  currentGasPrices: {
    slow: {
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      estimatedTime: string;
      costInWei: string;
      costInEth: string;
      costInUsd?: string;
    };
    standard: {
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      estimatedTime: string;
      costInWei: string;
      costInEth: string;
      costInUsd?: string;
    };
    fast: {
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      estimatedTime: string;
      costInWei: string;
      costInEth: string;
      costInUsd?: string;
    };
    instant: {
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      estimatedTime: string;
      costInWei: string;
      costInEth: string;
      costInUsd?: string;
    };
  };
  networkStats: {
    baseFee: string;
    baseFeeInGwei: string;
    nextBlockBaseFee: string;
    gasUsedPercent: number;
    congestionLevel: 'low' | 'medium' | 'high' | 'extreme';
  };
  transactionEstimate?: {
    type: string;
    estimatedGasLimit: string;
    recommendedGasLimit: string;
    explanation: string;
    tips: string[];
  };
  recommendations: {
    bestForSpeed: 'slow' | 'standard' | 'fast' | 'instant';
    bestForCost: 'slow' | 'standard' | 'fast' | 'instant';
    recommended: 'slow' | 'standard' | 'fast' | 'instant';
    reasoning: string;
  };
}

// ============ Bitcoin MCP Tool Schemas ============

export const GetBitcoinAddressSchema = z.object({
  derivationPath: z.string().optional().default("84'/0'/0'/0/0").describe('BIP32 derivation path (default: native segwit)'),
  addressType: z.enum(['legacy', 'segwit', 'taproot']).optional().default('segwit').describe('Bitcoin address type'),
  display: z.boolean().optional().default(false).describe('Show address on Ledger screen for verification'),
  network: z.enum(['bitcoin', 'bitcoin-testnet']).optional().default('bitcoin').describe('Bitcoin network'),
});

export const GetBitcoinBalanceSchema = z.object({
  address: z.string().describe('Bitcoin address to check balance'),
  network: z.enum(['bitcoin', 'bitcoin-testnet']).optional().default('bitcoin').describe('Bitcoin network'),
});

export const CraftBitcoinTransactionSchema = z.object({
  fromAddress: z.string().describe('Sender Bitcoin address'),
  outputs: z.array(z.object({
    address: z.string().describe('Recipient Bitcoin address'),
    value: z.number().positive().describe('Amount in satoshis'),
  })).min(1).describe('Transaction outputs'),
  network: z.enum(['bitcoin', 'bitcoin-testnet']).optional().default('bitcoin').describe('Bitcoin network'),
  feeRate: z.number().positive().optional().describe('Fee rate in sat/vB (will use network estimate if not provided)'),
  changeAddress: z.string().optional().describe('Custom change address (uses sender if not provided)'),
  strategy: z.enum(['largest-first', 'smallest-first', 'optimal']).optional().default('optimal').describe('UTXO selection strategy'),
});

export const SendBitcoinSchema = z.object({
  to: z.string().describe('Recipient Bitcoin address'),
  amount: z.number().positive().describe('Amount to send in satoshis'),
  network: z.enum(['bitcoin', 'bitcoin-testnet']).optional().default('bitcoin').describe('Bitcoin network'),
  derivationPath: z.string().optional().default("84'/0'/0'/0/0").describe('BIP32 derivation path for sender'),
  addressType: z.enum(['legacy', 'segwit', 'taproot']).optional().default('segwit').describe('Sender address type'),
  feeRate: z.number().positive().optional().describe('Custom fee rate in sat/vB'),
  enableRBF: z.boolean().optional().default(true).describe('Enable Replace-by-Fee'),
});

export const AnalyzeBitcoinFeesSchema = z.object({
  network: z.enum(['bitcoin', 'bitcoin-testnet']).optional().default('bitcoin').describe('Bitcoin network'),
  transactionSize: z.number().positive().optional().describe('Estimated transaction size in bytes'),
  inputCount: z.number().positive().optional().default(2).describe('Number of transaction inputs'),
  outputCount: z.number().positive().optional().default(2).describe('Number of transaction outputs'),
  addressType: z.enum(['legacy', 'segwit', 'taproot']).optional().default('segwit').describe('Address type for fee calculation'),
});

// Bitcoin Response Interfaces

export interface BitcoinAddressResponse {
  address: string;
  type: 'legacy' | 'segwit' | 'taproot';
  derivationPath: string;
  publicKey: string;
  network: 'bitcoin' | 'bitcoin-testnet';
}

export interface BitcoinBalanceResponse {
  address: string;
  confirmed: number;      // satoshis
  unconfirmed: number;    // satoshis
  total: number;          // satoshis
  balanceInBTC: string;   // formatted BTC amount
  balanceInUSD?: number;  // USD value if available
  utxoCount: number;
  network: 'bitcoin' | 'bitcoin-testnet';
}

export interface BitcoinTransactionResponse {
  success: boolean;
  txid: string;
  fee: number;               // satoshis
  feeRate: number;           // sat/vB
  size: number;              // bytes
  vsize: number;             // virtual bytes
  confirmations: number;
  inputs: Array<{
    txid: string;
    vout: number;
    value: number;           // satoshis
  }>;
  outputs: Array<{
    address: string;
    value: number;           // satoshis
  }>;
  network: 'bitcoin' | 'bitcoin-testnet';
  explorerUrl: string;
}

export interface BitcoinPSBTResponse {
  psbt: string;              // base64 encoded PSBT
  fee: number;               // satoshis
  feeRate: number;           // sat/vB
  size: number;              // transaction size in bytes
  vsize: number;             // virtual size in bytes
  inputCount: number;
  outputCount: number;
  serializedTransaction?: string; // hex encoded transaction (if finalized)
  network: 'bitcoin' | 'bitcoin-testnet';
}

export interface BitcoinFeeAnalysisResponse {
  network: 'bitcoin' | 'bitcoin-testnet';
  currentFees: {
    minimum: { feeRate: number; totalFee: number; costInBTC: string; };
    economy: { feeRate: number; totalFee: number; costInBTC: string; timeEstimate: string; };
    slow: { feeRate: number; totalFee: number; costInBTC: string; timeEstimate: string; };
    standard: { feeRate: number; totalFee: number; costInBTC: string; timeEstimate: string; };
    fast: { feeRate: number; totalFee: number; costInBTC: string; timeEstimate: string; };
  };
  mempoolStats?: {
    size: number;              // transactions in mempool
    totalFees: number;         // total fees in mempool
    averageFeeRate: number;    // average fee rate
  };
  transactionEstimate?: {
    inputCount: number;
    outputCount: number;
    estimatedSize: number;     // bytes
    estimatedVsize: number;    // virtual bytes
    addressType: string;
  };
  recommendations: {
    recommended: 'minimum' | 'economy' | 'slow' | 'standard' | 'fast';
    reasoning: string;
  };
}

// Tool metadata
export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}