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

// Tool metadata
export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}