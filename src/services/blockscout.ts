/**
 * Blockscout API Client for retrieving contract ABIs and blockchain data
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import NodeCache from 'node-cache';
import {
  SupportedNetwork,
  NetworkConfig,
  ABIEntry,
  ContractABIResponse,
  ContractInfo,
  TokenInfo,
  Transaction,
  TransactionHistoryResponse,
  SearchResult,
  BlockscoutError,
  NetworkNotSupportedError,
  ContractNotFoundError,
  ContractNotVerifiedError,
  InvalidAddressError,
  RateLimitError,
  NetworkTimeoutError,
  BlockscoutClientConfig,
  PaginationOptions,
  SearchOptions,
} from './blockscout.types.js';

// Default network configurations
const DEFAULT_NETWORKS: Record<SupportedNetwork, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    apiUrl: 'https://eth.blockscout.com',
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    apiUrl: 'https://eth-sepolia.blockscout.com',
  },
  goerli: {
    name: 'Goerli Testnet',
    chainId: 5,
    apiUrl: 'https://eth-goerli.blockscout.com',
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    apiUrl: 'https://polygon.blockscout.com',
  },
  'polygon-mumbai': {
    name: 'Polygon Mumbai',
    chainId: 80001,
    apiUrl: 'https://polygon-mumbai.blockscout.com',
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    apiUrl: 'https://arbitrum.blockscout.com',
  },
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    apiUrl: 'https://arbitrum-sepolia.blockscout.com',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    apiUrl: 'https://optimism.blockscout.com',
  },
  'optimism-sepolia': {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    apiUrl: 'https://optimism-sepolia.blockscout.com',
  },
  base: {
    name: 'Base',
    chainId: 8453,
    apiUrl: 'https://base.blockscout.com',
  },
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    apiUrl: 'https://base-sepolia.blockscout.com',
  },
};

export class BlockscoutClient {
  private axiosInstance: AxiosInstance;
  private cache?: NodeCache;
  private config: Required<BlockscoutClientConfig>;
  private networks: Record<SupportedNetwork, NetworkConfig>;

  constructor(config: BlockscoutClientConfig = {}) {
    // Merge config with defaults
    this.config = {
      networks: config.networks || DEFAULT_NETWORKS,
      defaultNetwork: config.defaultNetwork || 'mainnet',
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600,
      customEndpoints: config.customEndpoints || {},
    };

    this.networks = this.config.networks;

    // Apply custom endpoints
    if (this.config.customEndpoints) {
      Object.entries(this.config.customEndpoints).forEach(([network, url]) => {
        if (this.networks[network as SupportedNetwork]) {
          this.networks[network as SupportedNetwork].apiUrl = url;
        }
      });
    }

    // Initialize cache if enabled
    if (this.config.cacheEnabled) {
      this.cache = new NodeCache({
        stdTTL: this.config.cacheTTL,
        checkperiod: 600,
      });
    }

    // Initialize axios instance
    this.axiosInstance = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'BlockscoutClient/1.0.0',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for API key if provided
    if (this.config.apiKey) {
      this.axiosInstance.interceptors.request.use((config) => {
        config.params = {
          ...config.params,
          apikey: this.config.apiKey,
        };
        return config;
      });
    }

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Let the retry logic handle the error
        throw error;
      }
    );
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get network configuration
   */
  private getNetworkConfig(network: SupportedNetwork): NetworkConfig {
    const config = this.networks[network];
    if (!config) {
      throw new NetworkNotSupportedError(network);
    }
    return config;
  }

  /**
   * Handle axios errors and convert to custom errors
   */
  private async handleAxiosError(error: AxiosError): Promise<never> {
    if (error.code === 'ECONNABORTED') {
      throw new NetworkTimeoutError(`Request timeout: ${error.message}`);
    }

    if (error.response) {
      const status = error.response.status;
      
      if (status === 429) {
        throw new RateLimitError('API rate limit exceeded');
      }
      
      if (status === 404) {
        throw new ContractNotFoundError('', '');
      }
    }

    throw error;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.retries
  ): Promise<T> {
    let lastError: Error | unknown;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Handle axios errors
        const axiosError = error as AxiosError;
        if (axiosError.response || axiosError.request || axiosError.code) {
          // Check for timeout
          if (axiosError.code === 'ECONNABORTED') {
            lastError = new NetworkTimeoutError(`Request timeout: ${axiosError.message}`);
            if (i === retries) throw lastError;
          }
          // Check for rate limiting
          else if (axiosError.response?.status === 429) {
            lastError = new RateLimitError('API rate limit exceeded');
            if (i < retries) {
              await new Promise(resolve => 
                globalThis.setTimeout(resolve, this.config.retryDelay * Math.pow(2, i))
              );
              continue;
            }
            throw lastError;
          }
          // Check for not found
          else if (axiosError.response?.status === 404) {
            throw new ContractNotFoundError('', '');
          }
        }
        
        // Don't retry on certain errors
        if (
          error instanceof InvalidAddressError ||
          error instanceof NetworkNotSupportedError ||
          error instanceof ContractNotVerifiedError ||
          error instanceof ContractNotFoundError
        ) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (i === retries) {
          throw lastError;
        }
        
        // Wait before retry
        await new Promise(resolve => 
          globalThis.setTimeout(resolve, this.config.retryDelay)
        );
      }
    }
    
    throw lastError;
  }

  /**
   * Get contract ABI from Blockscout
   */
  async getContractABI(
    address: string,
    network: SupportedNetwork = this.config.defaultNetwork
  ): Promise<ABIEntry[]> {
    // Validate address
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(address);
    }

    // Check cache first
    const cacheKey = `abi:${network}:${address.toLowerCase()}`;
    if (this.cache) {
      const cached = this.cache.get<ABIEntry[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const networkConfig = this.getNetworkConfig(network);

    return this.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<ContractABIResponse>(
        `${networkConfig.apiUrl}/api`,
        {
          params: {
            module: 'contract',
            action: 'getabi',
            address: address,
          },
        }
      );

      const { status, message, result } = response.data;

      if (status === '0') {
        if (message.includes('not verified')) {
          throw new ContractNotVerifiedError(address, network);
        }
        throw new BlockscoutError(message || 'Failed to fetch ABI');
      }

      // Parse ABI if it's a string
      let abi: ABIEntry[];
      if (typeof result === 'string') {
        try {
          abi = JSON.parse(result);
        } catch {
          throw new BlockscoutError('Invalid ABI format');
        }
      } else {
        abi = result as ABIEntry[];
      }

      // Cache the result
      if (this.cache) {
        this.cache.set(cacheKey, abi, this.config.cacheTTL);
      }

      return abi;
    });
  }

  /**
   * Get contract information and metadata
   */
  async getContractInfo(
    address: string,
    network: SupportedNetwork = this.config.defaultNetwork
  ): Promise<ContractInfo> {
    // Validate address
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(address);
    }

    const networkConfig = this.getNetworkConfig(network);

    return this.executeWithRetry(async () => {
      const response = await this.axiosInstance.get(
        `${networkConfig.apiUrl}/api`,
        {
          params: {
            module: 'contract',
            action: 'getsourcecode',
            address: address,
          },
        }
      );

      const { status, message, result } = response.data;

      if (status === '0') {
        if (message.includes('not found')) {
          throw new ContractNotFoundError(address, network);
        }
        throw new BlockscoutError(message || 'Failed to fetch contract info');
      }

      // Result is typically an array with one element
      const contractData = Array.isArray(result) ? result[0] : result;

      return {
        address: address,
        name: contractData.ContractName || contractData.name,
        compiler: contractData.CompilerVersion || contractData.compiler,
        version: contractData.CompilerVersion,
        optimizationUsed: contractData.OptimizationUsed === '1',
        runs: parseInt(contractData.Runs || '0'),
        constructorArguments: contractData.ConstructorArguments,
        evmVersion: contractData.EVMVersion,
        library: contractData.Library,
        licenseType: contractData.LicenseType,
        proxy: contractData.Proxy === '1',
        implementation: contractData.Implementation,
        sourceCode: contractData.SourceCode,
        abi: contractData.ABI ? JSON.parse(contractData.ABI) : undefined,
      };
    });
  }

  /**
   * Get token information (ERC20/ERC721)
   */
  async getTokenInfo(
    address: string,
    network: SupportedNetwork = this.config.defaultNetwork
  ): Promise<TokenInfo> {
    // Validate address
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(address);
    }

    const networkConfig = this.getNetworkConfig(network);

    return this.executeWithRetry(async () => {
      const response = await this.axiosInstance.get(
        `${networkConfig.apiUrl}/api`,
        {
          params: {
            module: 'token',
            action: 'getToken',
            contractaddress: address,
          },
        }
      );

      const { status, message, result } = response.data;

      if (status === '0') {
        throw new BlockscoutError(message || 'Failed to fetch token info');
      }

      const tokenInfo: TokenInfo = {
        address: address,
      };

      if (result.name) tokenInfo.name = result.name;
      if (result.symbol) tokenInfo.symbol = result.symbol;
      if (result.decimals) tokenInfo.decimals = parseInt(result.decimals);
      if (result.totalSupply) tokenInfo.totalSupply = result.totalSupply;
      if (result.type) tokenInfo.type = result.type;
      if (result.owner) tokenInfo.owner = result.owner;
      if (result.logoUrl) tokenInfo.logoUrl = result.logoUrl;
      if (result.website) tokenInfo.website = result.website;
      if (result.description) tokenInfo.description = result.description;
      if (result.marketCap) tokenInfo.marketCap = result.marketCap;
      if (result.price) tokenInfo.price = result.price;
      if (result.holders) tokenInfo.holders = parseInt(result.holders);
      if (result.transfers) tokenInfo.transfers = parseInt(result.transfers);

      return tokenInfo;
    });
  }

  /**
   * Validate if a contract is verified on Blockscout
   */
  async validateContract(
    address: string,
    network: SupportedNetwork = this.config.defaultNetwork
  ): Promise<boolean> {
    try {
      // Try to get the ABI - if successful, contract is verified
      await this.getContractABI(address, network);
      return true;
    } catch (error) {
      if (error instanceof ContractNotVerifiedError) {
        return false;
      }
      // For any other error (network issues, etc.), return false
      return false;
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    network: SupportedNetwork = this.config.defaultNetwork,
    options: PaginationOptions = {}
  ): Promise<Transaction[]> {
    // Validate address
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(address);
    }

    const networkConfig = this.getNetworkConfig(network);

    return this.executeWithRetry(async () => {
      const params: Record<string, unknown> = {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        endblock: 99999999,
        sort: options.sort || 'asc',
      };

      // Add pagination parameters
      if (options.page !== undefined) {
        params.page = options.page;
      }
      if (options.limit !== undefined) {
        params.offset = options.limit;
      }

      const response = await this.axiosInstance.get<TransactionHistoryResponse>(
        `${networkConfig.apiUrl}/api`,
        { params }
      );

      const { status, message, result } = response.data;

      if (status === '0' && !message.includes('No transactions found')) {
        throw new BlockscoutError(message || 'Failed to fetch transactions');
      }

      return result || [];
    });
  }

  /**
   * Search for contracts by name or symbol
   */
  async searchContract(
    query: string,
    network: SupportedNetwork = this.config.defaultNetwork,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const networkConfig = this.getNetworkConfig(network);

    return this.executeWithRetry(async () => {
      const params: Record<string, unknown> = {
        module: 'contract',
        action: 'searchcontract',
        q: query,
      };

      // Add search options
      if (options.type) {
        params.filter = options.type;
      }
      if (options.verified !== undefined) {
        params.verified = options.verified ? 'true' : 'false';
      }
      if (options.limit !== undefined) {
        params.limit = options.limit;
      }

      const response = await this.axiosInstance.get(
        `${networkConfig.apiUrl}/api`,
        { params }
      );

      const { status, message, result } = response.data;

      if (status === '0' && !message.includes('No results found')) {
        throw new BlockscoutError(message || 'Search failed');
      }

      return result || [];
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.flushAll();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; keys: number } | null {
    if (!this.cache) {
      return null;
    }

    return {
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      keys: this.cache.getStats().keys,
    };
  }
}