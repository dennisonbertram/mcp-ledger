/**
 * Dune Sim API service for reliable token and blockchain data
 * Provides comprehensive multi-chain token balances, pricing, and activity data
 */

import axios from 'axios';
import { getApiConfig } from '../config/environment.js';
import type { SupportedNetwork } from '../types/blockchain.js';

export interface DuneSimTokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  balanceUsd?: number | undefined;
  priceUsd?: number | undefined;
  chainId: number;
  chainName: string;
  poolSize?: number | undefined;
  lowLiquidity?: boolean | undefined;
  logo?: string | undefined;
}

export interface DuneSimNFTBalance {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  chainId: number;
  chainName: string;
}

export interface DuneSimActivity {
  transactionHash: string;
  timestamp: string;
  type: string;
  from: string;
  to: string;
  value?: string;
  valueUsd?: number;
  tokenAddress?: string;
  tokenSymbol?: string;
  chainId: number;
  chainName: string;
}

export interface DuneSimTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUsd?: number;
  chainId: number;
  poolSize?: number;
  lowLiquidity?: boolean;
  historicalPrices?: Array<{
    timestamp: string;
    priceUsd: number;
  }>;
}

export interface DuneSimConfig {
  timeout?: number;
  includeHistoricalPrices?: boolean;
  liquidityThreshold?: number;
  useAllowlist?: boolean;
}

// Network mapping for Dune Sim API
const NETWORK_CHAIN_IDS: Record<SupportedNetwork, number> = {
  mainnet: 1,
  sepolia: 11155111,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

// Trusted token allowlist (addresses should be lowercase)
const TRUSTED_TOKENS = [
  // Ethereum Mainnet
  { chainId: 1, address: 'native' }, // ETH
  { chainId: 1, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }, // USDC
  { chainId: 1, address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT
  { chainId: 1, address: '0x6b175474e89094c44da98b954eedeac495271d0f' }, // DAI
  { chainId: 1, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' }, // WBTC
  
  // Base
  { chainId: 8453, address: 'native' }, // ETH on Base
  { chainId: 8453, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' }, // USDC on Base
  
  // Arbitrum
  { chainId: 42161, address: 'native' }, // ETH on Arbitrum
  { chainId: 42161, address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' }, // USDC on Arbitrum
  
  // Polygon
  { chainId: 137, address: 'native' }, // MATIC
  { chainId: 137, address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' }, // USDC on Polygon
  
  // Optimism
  { chainId: 10, address: 'native' }, // ETH on Optimism
  { chainId: 10, address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607' }, // USDC on Optimism
];

export class DuneSimService {
  private apiConfig = getApiConfig();
  private baseUrl = 'https://api.sim.dune.com/v1/evm';
  private defaultTimeout = 15000; // 15 seconds

  constructor() {
    if (!this.apiConfig.duneSim) {
      console.log('⚠️  Dune Sim API key not configured. Enhanced token data unavailable.');
    }
  }

  /**
   * Check if Dune Sim API is available
   */
  isAvailable(): boolean {
    return !!this.apiConfig.duneSim;
  }

  /**
   * Get comprehensive token balances for an address across all supported chains
   */
  async getTokenBalances(
    address: string,
    networks: SupportedNetwork[] = ['mainnet'],
    config: DuneSimConfig = {}
  ): Promise<DuneSimTokenBalance[]> {
    if (!this.isAvailable()) {
      throw new Error('Dune Sim API key not configured');
    }

    try {
      const chainIds = networks.map(network => NETWORK_CHAIN_IDS[network]).join(',');
      const url = `${this.baseUrl}/balances/${address}?chain_ids=${chainIds}`;

      const response = await axios.get(url, {
        headers: {
          'X-Sim-Api-Key': this.apiConfig.duneSim!,
        },
        timeout: config.timeout || this.defaultTimeout,
      });

      const balances: DuneSimTokenBalance[] = response.data.balances || [];
      
      // Apply filtering based on configuration
      let filteredBalances = balances;

      // Filter by liquidity threshold
      if (config.liquidityThreshold) {
        filteredBalances = this.filterByLiquidity(filteredBalances, config.liquidityThreshold);
      }

      // Apply allowlist filtering
      if (config.useAllowlist) {
        filteredBalances = this.filterWithAllowlist(filteredBalances);
      }

      return filteredBalances.map(balance => ({
        address: balance.address || 'native',
        symbol: balance.symbol || 'ETH',
        name: balance.name || 'Ether',
        decimals: balance.decimals || 18,
        balance: balance.balance || '0',
        balanceFormatted: balance.balanceFormatted || '0',
        balanceUsd: balance.balanceUsd || undefined,
        priceUsd: balance.priceUsd || undefined,
        chainId: balance.chainId,
        chainName: balance.chainName,
        poolSize: balance.poolSize || undefined,
        lowLiquidity: balance.lowLiquidity || undefined,
        logo: balance.logo || undefined,
      }));

    } catch (error) {
      console.error('Dune Sim API error:', error);
      throw new Error(`Failed to fetch token balances: ${error}`);
    }
  }

  /**
   * Get detailed token information with optional historical prices
   */
  async getTokenInfo(
    tokenAddress: string,
    network: SupportedNetwork,
    config: DuneSimConfig = {}
  ): Promise<DuneSimTokenInfo> {
    if (!this.isAvailable()) {
      throw new Error('Dune Sim API key not configured');
    }

    try {
      const chainId = NETWORK_CHAIN_IDS[network];
      let url = `${this.baseUrl}/token-info/${tokenAddress}?chain_ids=${chainId}`;
      
      if (config.includeHistoricalPrices) {
        url += '&historical_prices=1,6,24'; // 1h, 6h, 24h historical prices
      }

      const response = await axios.get(url, {
        headers: {
          'X-Sim-Api-Key': this.apiConfig.duneSim!,
        },
        timeout: config.timeout || this.defaultTimeout,
      });

      const tokenData = response.data;

      return {
        address: tokenData.address || tokenAddress,
        symbol: tokenData.symbol || 'UNKNOWN',
        name: tokenData.name || 'Unknown Token',
        decimals: tokenData.decimals || 18,
        priceUsd: tokenData.price_usd,
        chainId: chainId,
        poolSize: tokenData.pool_size,
        lowLiquidity: tokenData.low_liquidity,
        historicalPrices: tokenData.historical_prices?.map((price: any) => ({
          timestamp: price.timestamp,
          priceUsd: price.price_usd,
        })),
      };

    } catch (error) {
      console.error('Dune Sim token info error:', error);
      throw new Error(`Failed to fetch token info: ${error}`);
    }
  }

  /**
   * Get wallet activity feed with transaction details
   */
  async getActivity(
    address: string,
    networks: SupportedNetwork[] = ['mainnet'],
    limit: number = 50,
    offset?: string
  ): Promise<{ activities: DuneSimActivity[], nextOffset?: string }> {
    if (!this.isAvailable()) {
      throw new Error('Dune Sim API key not configured');
    }

    try {
      const chainIds = networks.map(network => NETWORK_CHAIN_IDS[network]).join(',');
      let url = `${this.baseUrl}/activity/${address}?chain_ids=${chainIds}&limit=${limit}`;
      
      if (offset) {
        url += `&offset=${offset}`;
      }

      const response = await axios.get(url, {
        headers: {
          'X-Sim-Api-Key': this.apiConfig.duneSim!,
        },
        timeout: this.defaultTimeout,
      });

      const activities = response.data.activities || [];
      
      return {
        activities: activities.map((activity: any) => ({
          transactionHash: activity.transaction_hash,
          timestamp: activity.timestamp,
          type: activity.type,
          from: activity.from,
          to: activity.to,
          value: activity.value,
          valueUsd: activity.value_usd,
          tokenAddress: activity.token_address,
          tokenSymbol: activity.token_symbol,
          chainId: activity.chain_id,
          chainName: activity.chain_name,
        })),
        nextOffset: response.data.next_offset,
      };

    } catch (error) {
      console.error('Dune Sim activity error:', error);
      throw new Error(`Failed to fetch activity: ${error}`);
    }
  }

  /**
   * Get NFT balances for an address
   */
  async getNFTBalances(
    address: string,
    networks: SupportedNetwork[] = ['mainnet']
  ): Promise<DuneSimNFTBalance[]> {
    if (!this.isAvailable()) {
      throw new Error('Dune Sim API key not configured');
    }

    try {
      const chainIds = networks.map(network => NETWORK_CHAIN_IDS[network]).join(',');
      const url = `${this.baseUrl}/collectibles/${address}?chain_ids=${chainIds}`;

      const response = await axios.get(url, {
        headers: {
          'X-Sim-Api-Key': this.apiConfig.duneSim!,
        },
        timeout: this.defaultTimeout,
      });

      const collectibles = response.data.collectibles || [];
      
      return collectibles.map((nft: any) => ({
        contractAddress: nft.contract_address,
        tokenId: nft.token_id,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        chainId: nft.chain_id,
        chainName: nft.chain_name,
      }));

    } catch (error) {
      console.error('Dune Sim NFT error:', error);
      throw new Error(`Failed to fetch NFT balances: ${error}`);
    }
  }

  /**
   * Get supported chains from Dune Sim API
   */
  async getSupportedChains(): Promise<Array<{ chainId: number; chainName: string }>> {
    if (!this.isAvailable()) {
      throw new Error('Dune Sim API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/supported-chains`, {
        headers: {
          'X-Sim-Api-Key': this.apiConfig.duneSim!,
        },
        timeout: this.defaultTimeout,
      });

      return response.data.chains || [];

    } catch (error) {
      console.error('Dune Sim supported chains error:', error);
      throw new Error(`Failed to fetch supported chains: ${error}`);
    }
  }

  /**
   * Filter tokens by liquidity threshold
   */
  private filterByLiquidity(tokens: DuneSimTokenBalance[], minLiquidity: number): DuneSimTokenBalance[] {
    return tokens.filter(token => {
      return token.poolSize && token.poolSize >= minLiquidity;
    });
  }

  /**
   * Filter with allowlist for trusted tokens
   */
  private filterWithAllowlist(tokens: DuneSimTokenBalance[]): DuneSimTokenBalance[] {
    return tokens.filter(token => {
      const isAllowlisted = TRUSTED_TOKENS.some(trustedToken => {
        const tokenAddress = (token.address || '').toLowerCase();
        return token.chainId === trustedToken.chainId && 
               (tokenAddress === trustedToken.address || 
                (trustedToken.address === 'native' && !tokenAddress));
      });
      
      // Include allowlisted tokens or high liquidity tokens
      return isAllowlisted || (token.poolSize && token.poolSize >= 10000);
    });
  }

  /**
   * Convert network name to chain ID
   */
  static getChainId(network: SupportedNetwork): number {
    return NETWORK_CHAIN_IDS[network];
  }

  /**
   * Check if token is in trusted allowlist
   */
  static isTrustedToken(tokenAddress: string, chainId: number): boolean {
    return TRUSTED_TOKENS.some(token => 
      token.chainId === chainId && 
      (token.address === tokenAddress.toLowerCase() || 
       (token.address === 'native' && !tokenAddress))
    );
  }
}