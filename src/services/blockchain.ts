/**
 * Blockchain service implementation using Viem for all blockchain interactions
 */

import {
  createPublicClient,
  http,
  type PublicClient,
  type Address,
  type Hash,
  type Hex,
  type Chain,
  isAddress,
  formatEther,
  formatUnits,
  parseUnits,
} from 'viem';
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base,
} from 'viem/chains';
import type {
  SupportedNetwork,
  EthereumNetwork,
  NetworkConfig,
  TokenInfo,
  NFTInfo,
  GasInfo,
  TransactionData,
  BlockInfo,
  TransactionReceiptInfo,
  TokenBalance,
  BlockchainServiceConfig,
} from '../types/blockchain.js';
import {
  BlockchainError,
  BlockchainErrorCode,
} from '../types/blockchain.js';
import { getRpcUrls, getApiConfig, hasEnhancedFeatures } from '../config/environment.js';

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ERC721 ABI for NFT operations
const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// Cache entry interface
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class BlockchainService {
  private clients: Map<EthereumNetwork, PublicClient> = new Map();
  private config: Required<BlockchainServiceConfig>;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private networkConfigs: Record<EthereumNetwork, Chain>;

  constructor(config?: BlockchainServiceConfig) {
    // Get RPC URLs with API key integration
    const rpcUrls = getRpcUrls();
    
    // Set default configuration with API-enabled RPC endpoints
    this.config = {
      networks: {
        mainnet: { rpcUrl: rpcUrls.mainnet, chainId: 1, name: 'Ethereum Mainnet' },
        sepolia: { rpcUrl: rpcUrls.sepolia, chainId: 11155111, name: 'Sepolia Testnet' },
        polygon: { rpcUrl: rpcUrls.polygon, chainId: 137, name: 'Polygon' },
        arbitrum: { rpcUrl: rpcUrls.arbitrum, chainId: 42161, name: 'Arbitrum One' },
        optimism: { rpcUrl: rpcUrls.optimism, chainId: 10, name: 'Optimism' },
        base: { rpcUrl: rpcUrls.base, chainId: 8453, name: 'Base' },
        ...config?.networks,
      },
      defaultNetwork: config?.defaultNetwork || 'mainnet',
      cacheEnabled: config?.cacheEnabled !== false,
      cacheTTL: config?.cacheTTL || 300, // 5 minutes default
      requestTimeout: config?.requestTimeout || 30000, // 30 seconds default
      maxRetries: config?.maxRetries || 3,
    };

    // Network chain configurations (Ethereum only)
    this.networkConfigs = {
      mainnet,
      sepolia,
      polygon,
      arbitrum,
      optimism,
      base,
    };
    
    // Log configuration status
    const apiConfig = getApiConfig();
    if (hasEnhancedFeatures()) {
      console.log('✅ BlockchainService initialized with enhanced RPC providers');
    } else {
      console.log('⚠️  BlockchainService using public RPC endpoints (rate limited)');
      console.log('   💡 Add ALCHEMY_API_KEY for enhanced performance');
    }
  }

  /**
   * Get or create a public client for the specified network
   */
  private getClient(network: SupportedNetwork): PublicClient {
    // Check if this is an Ethereum network
    if (!Object.keys(this.networkConfigs).includes(network)) {
      throw new BlockchainError(
        `Network ${network} is not supported by BlockchainService (Ethereum networks only)`,
        BlockchainErrorCode.NETWORK_NOT_SUPPORTED,
        network
      );
    }
    
    const ethNetwork = network as EthereumNetwork;
    let client = this.clients.get(ethNetwork);
    if (!client) {
      const chain = this.networkConfigs[ethNetwork];
      const networkConfig = this.config.networks?.[ethNetwork];
      
      client = createPublicClient({
        chain,
        transport: http(networkConfig?.rpcUrl, {
          timeout: this.config.requestTimeout,
        }),
      }) as PublicClient;

      this.clients.set(ethNetwork, client);
    }

    return client;
  }

  /**
   * Validate Ethereum address
   */
  private validateAddress(address: string): Address {
    if (!isAddress(address, { strict: false })) {
      throw new BlockchainError(
        `Invalid address: ${address}`,
        BlockchainErrorCode.INVALID_ADDRESS
      );
    }
    return address as Address;
  }

  /**
   * Validate transaction hash
   */
  private validateHash(hash: string): Hash {
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      throw new BlockchainError(
        `Invalid transaction hash: ${hash}`,
        BlockchainErrorCode.INVALID_HASH
      );
    }
    return hash as Hash;
  }

  /**
   * Get cache key
   */
  private getCacheKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.config.cacheEnabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set in cache
   */
  private setInCache<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
    });
  }

  /**
   * Execute with error handling
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    network: SupportedNetwork
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors
        if (error instanceof BlockchainError && 
            (error.code === BlockchainErrorCode.INVALID_ADDRESS ||
             error.code === BlockchainErrorCode.INVALID_HASH)) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (i < this.config.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw new BlockchainError(
      `Operation failed after ${this.config.maxRetries} retries: ${lastError?.message}`,
      BlockchainErrorCode.RPC_ERROR,
      network,
      lastError
    );
  }

  /**
   * Get ETH balance for an address
   */
  async getBalance(address: string, network: SupportedNetwork): Promise<bigint> {
    const validAddress = this.validateAddress(address);
    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      return await client.getBalance({
        address: validAddress,
      });
    }, network);
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    userAddress: string,
    network: SupportedNetwork
  ): Promise<bigint> {
    const validTokenAddress = this.validateAddress(tokenAddress);
    const validUserAddress = this.validateAddress(userAddress);
    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const balance = await client.readContract({
          address: validTokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [validUserAddress],
        });
        return balance;
      } catch (error) {
        throw new BlockchainError(
          `Failed to get token balance: ${(error as Error).message}`,
          BlockchainErrorCode.CONTRACT_CALL_FAILED,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get NFT balance (ERC721/1155)
   */
  async getNFTBalance(
    contractAddress: string,
    userAddress: string,
    network: SupportedNetwork
  ): Promise<bigint> {
    const validContractAddress = this.validateAddress(contractAddress);
    const validUserAddress = this.validateAddress(userAddress);
    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const balance = await client.readContract({
          address: validContractAddress,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [validUserAddress],
        });
        return balance;
      } catch (error) {
        throw new BlockchainError(
          `Failed to get NFT balance: ${(error as Error).message}`,
          BlockchainErrorCode.CONTRACT_CALL_FAILED,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get token metadata
   */
  async getTokenInfo(tokenAddress: string, network: SupportedNetwork): Promise<TokenInfo> {
    const validAddress = this.validateAddress(tokenAddress);
    
    // Check cache
    const cacheKey = this.getCacheKey('tokenInfo', [tokenAddress, network]);
    const cached = this.getFromCache<TokenInfo>(cacheKey);
    if (cached) return cached;

    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const results = await client.multicall({
          contracts: [
            {
              address: validAddress,
              abi: ERC20_ABI,
              functionName: 'name',
            },
            {
              address: validAddress,
              abi: ERC20_ABI,
              functionName: 'symbol',
            },
            {
              address: validAddress,
              abi: ERC20_ABI,
              functionName: 'decimals',
            },
            {
              address: validAddress,
              abi: ERC20_ABI,
              functionName: 'totalSupply',
            },
          ],
        });

        const tokenInfo: TokenInfo = {
          address: validAddress,
          name: results[0].status === 'success' ? results[0].result as string : '',
          symbol: results[1].status === 'success' ? results[1].result as string : '',
          decimals: results[2].status === 'success' ? results[2].result as number : 18,
          ...(results[3].status === 'success' && { totalSupply: results[3].result as bigint }),
        };

        // Cache the result
        this.setInCache(cacheKey, tokenInfo);

        return tokenInfo;
      } catch (error) {
        throw new BlockchainError(
          `Failed to get token info: ${(error as Error).message}`,
          BlockchainErrorCode.CONTRACT_CALL_FAILED,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get NFT metadata
   */
  async getNFTInfo(
    contractAddress: string,
    tokenId: bigint,
    network: SupportedNetwork
  ): Promise<NFTInfo> {
    const validAddress = this.validateAddress(contractAddress);
    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const results = await client.multicall({
          contracts: [
            {
              address: validAddress,
              abi: ERC721_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            },
            {
              address: validAddress,
              abi: ERC721_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            },
          ],
        });

        const nftInfo: NFTInfo = {
          contractAddress: validAddress,
          tokenId,
          ...(results[0].status === 'success' && { tokenUri: results[0].result as string }),
          ...(results[1].status === 'success' && { owner: results[1].result as Address }),
        };

        return nftInfo;
      } catch (error) {
        throw new BlockchainError(
          `Failed to get NFT info: ${(error as Error).message}`,
          BlockchainErrorCode.CONTRACT_CALL_FAILED,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: TransactionData, network: SupportedNetwork): Promise<bigint> {
    const client = this.getClient(network);

    // Validate addresses
    if (transaction.from) this.validateAddress(transaction.from);
    this.validateAddress(transaction.to);

    return this.executeWithRetry(async () => {
      try {
        const gas = await client.estimateGas({
          account: transaction.from,
          to: transaction.to,
          value: transaction.value,
          data: transaction.data,
        });
        return gas;
      } catch (error) {
        throw new BlockchainError(
          `Failed to estimate gas: ${(error as Error).message}`,
          BlockchainErrorCode.RPC_ERROR,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get current gas prices
   */
  async getGasPrice(network: SupportedNetwork): Promise<GasInfo> {
    // Check cache (short TTL for gas prices)
    const cacheKey = this.getCacheKey('gasPrice', [network]);
    const cached = this.getFromCache<GasInfo>(cacheKey);
    if (cached) return cached;

    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const gasPrice = await client.getGasPrice();
        
        const gasInfo: GasInfo = {
          gasPrice,
        };

        // Cache with short TTL (10 seconds)
        this.setInCache(cacheKey, gasInfo, 10);

        return gasInfo;
      } catch (error) {
        throw new BlockchainError(
          `Failed to get gas price: ${(error as Error).message}`,
          BlockchainErrorCode.RPC_ERROR,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    txHash: string,
    network: SupportedNetwork
  ): Promise<TransactionReceiptInfo> {
    const validHash = this.validateHash(txHash);
    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const receipt = await client.getTransactionReceipt({ hash: validHash });
        
        return {
          transactionHash: receipt.transactionHash,
          blockHash: receipt.blockHash,
          blockNumber: receipt.blockNumber,
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed,
          effectiveGasPrice: receipt.effectiveGasPrice,
          status: receipt.status,
          logs: receipt.logs.map(log => ({
            address: log.address,
            topics: log.topics,
            data: log.data,
          })),
        };
      } catch (error) {
        throw new BlockchainError(
          `Failed to get transaction receipt: ${(error as Error).message}`,
          BlockchainErrorCode.RPC_ERROR,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get block information
   */
  async getBlock(
    blockNumber: bigint | undefined,
    network: SupportedNetwork
  ): Promise<BlockInfo> {
    const client = this.getClient(network);

    return this.executeWithRetry(async () => {
      try {
        const block = blockNumber 
          ? await client.getBlock({ blockNumber })
          : await client.getBlock({});
        
        return {
          number: block.number!,
          hash: block.hash!,
          parentHash: block.parentHash,
          timestamp: block.timestamp,
          gasLimit: block.gasLimit,
          gasUsed: block.gasUsed,
          baseFeePerGas: block.baseFeePerGas,
          miner: block.miner!,
          transactions: block.transactions,
        };
      } catch (error) {
        throw new BlockchainError(
          `Failed to get block: ${(error as Error).message}`,
          BlockchainErrorCode.RPC_ERROR,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Get transaction count (nonce) for an address
   * CRITICAL: This is required for proper transaction crafting
   * Using block numbers as nonces is a catastrophic bug
   */
  async getTransactionCount(
    address: string,
    network: SupportedNetwork,
    blockTag: 'latest' | 'pending' | 'earliest' = 'pending'
  ): Promise<number> {
    const validAddress = this.validateAddress(address);
    const client = this.getClient(network);

    try {
      // Use 'pending' by default to include pending transactions in the count
      // This prevents nonce conflicts when multiple transactions are sent quickly
      const count = await client.getTransactionCount({
        address: validAddress,
        blockTag
      });
      return Number(count);
    } catch (error) {
      throw new BlockchainError(
        `Failed to get transaction count: ${(error as Error).message}`,
        BlockchainErrorCode.RPC_ERROR,
        network,
        error as Error
      );
    }
  }

  /**
   * Get multiple token balances in batch
   */
  async getTokenBalances(
    userAddress: string,
    tokenAddresses: string[],
    network: SupportedNetwork
  ): Promise<TokenBalance[]> {
    const validUserAddress = this.validateAddress(userAddress);
    
    // Validate token addresses and filter out invalid ones
    const validTokenAddresses: Address[] = [];
    for (const addr of tokenAddresses) {
      try {
        validTokenAddresses.push(this.validateAddress(addr));
      } catch {
        // Skip invalid addresses
        continue;
      }
    }
    
    if (validTokenAddresses.length === 0) {
      return [];
    }
    
    const client = this.getClient(network);

    // First, get token info for all tokens
    const tokenInfoPromises = validTokenAddresses.map(addr => 
      this.getTokenInfo(addr, network).catch(() => null)
    );
    const tokenInfos = await Promise.all(tokenInfoPromises);

    // Filter out failed token info queries
    const validTokens = tokenInfos
      .map((info, index) => info ? { info, address: validTokenAddresses[index] } : null)
      .filter(Boolean) as Array<{ info: TokenInfo; address: Address }>;

    if (validTokens.length === 0) {
      return [];
    }

    return this.executeWithRetry(async () => {
      try {
        // Batch balance queries
        const balanceContracts = validTokens.map(({ address }) => ({
          address,
          abi: ERC20_ABI,
          functionName: 'balanceOf' as const,
          args: [validUserAddress] as const,
        }));

        const results = await client.multicall({
          contracts: balanceContracts,
        });

        const balances: TokenBalance[] = [];
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const tokenData = validTokens[i];
          if (result && result.status === 'success' && tokenData && tokenData.info) {
            balances.push({
              address: tokenData.address,
              balance: result.result as bigint,
              decimals: tokenData.info.decimals,
              symbol: tokenData.info.symbol,
              name: tokenData.info.name,
            });
          }
        }

        return balances;
      } catch (error) {
        throw new BlockchainError(
          `Failed to get token balances: ${(error as Error).message}`,
          BlockchainErrorCode.CONTRACT_CALL_FAILED,
          network,
          error as Error
        );
      }
    }, network);
  }

  /**
   * Broadcast a signed transaction to the network
   */
  async broadcastTransaction(signedTx: string, network: SupportedNetwork): Promise<string> {
    return this.executeWithRetry(async () => {
      const client = this.getClient(network);
      
      try {
        const txHash = await client.sendRawTransaction({ 
          serializedTransaction: signedTx as `0x${string}` 
        });
        
        console.log(`Transaction broadcasted on ${network}: ${txHash}`);
        return txHash;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to broadcast transaction on ${network}:`, errorMessage);
        
        throw new BlockchainError(
          `Failed to broadcast transaction: ${errorMessage}`,
          BlockchainErrorCode.RPC_ERROR,
          network
        );
      }
    }, network);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Close all clients
   */
  async close(): Promise<void> {
    this.clients.clear();
    this.cache.clear();
  }
}