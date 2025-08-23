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

// Tool metadata
export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}