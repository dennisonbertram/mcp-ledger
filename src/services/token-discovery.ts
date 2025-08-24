/**
 * Enhanced token and NFT discovery service using external APIs
 * Integrates with Moralis, Alchemy, and other providers for comprehensive token data
 */

import axios from 'axios';
import { getApiConfig, hasEnhancedFeatures } from '../config/environment.js';
import type { SupportedNetwork } from '../types/blockchain.js';
import { DuneSimService } from './dune-sim.js';

export interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  priceUsd?: number | undefined;
  valueUsd?: number | undefined;
  logo?: string | undefined;
}

export interface NFTBalance {
  contractAddress: string;
  tokenId: string;
  name?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  attributes?: Array<{ trait_type: string; value: string | number }> | undefined;
  collection?: {
    name: string;
    description?: string | undefined;
  } | undefined;
}

export interface TokenDiscoveryConfig {
  timeout?: number;
  includePrice?: boolean;
  includeMetadata?: boolean;
}

export class TokenDiscoveryService {
  private apiConfig = getApiConfig();
  private baseTimeout = 10000; // 10 seconds default
  private duneSimService = new DuneSimService();

  /**
   * Get comprehensive ERC20 token balances for an address
   */
  async getTokenBalances(
    address: string,
    networks: SupportedNetwork[] = ['mainnet'],
    config: TokenDiscoveryConfig = {}
  ): Promise<TokenBalance[]> {
    try {
      // Try Dune Sim API first (most reliable and comprehensive)
      if (this.duneSimService.isAvailable()) {
        const duneBalances = await this.duneSimService.getTokenBalances(address, networks, {
          liquidityThreshold: 10000, // Filter low liquidity tokens
          useAllowlist: true, // Use trusted token allowlist
        });

        return duneBalances.map(balance => ({
          address: balance.address,
          name: balance.name,
          symbol: balance.symbol,
          decimals: balance.decimals,
          balance: balance.balance,
          balanceFormatted: balance.balanceFormatted,
          priceUsd: balance.priceUsd || undefined,
          valueUsd: balance.balanceUsd || undefined,
          logo: balance.logo || undefined,
        }));
      }

      if (!hasEnhancedFeatures()) {
        console.log('⚠️  Enhanced token discovery requires API keys (Dune Sim, Moralis, Alchemy)');
        return [];
      }

      // Fallback to single-network queries for legacy APIs
      const network = networks[0] || 'mainnet';

      // Try Moralis API as fallback
      if (this.apiConfig.moralis) {
        return await this.getMoralisTokenBalances(address, network, config);
      }
      
      // Fallback to Alchemy if available
      if (this.apiConfig.alchemy) {
        return await this.getAlchemyTokenBalances(address, network, config);
      }

      console.log('⚠️  No token discovery API configured');
      return [];
    } catch (error) {
      console.error('Token discovery error:', error);
      throw new Error(`Failed to fetch token balances: ${error}`);
    }
  }

  /**
   * Get NFT balances for an address
   */
  async getNFTBalances(
    address: string,
    networks: SupportedNetwork[] = ['mainnet'],
    config: TokenDiscoveryConfig = {}
  ): Promise<NFTBalance[]> {
    try {
      // Try Dune Sim API first (most reliable)
      if (this.duneSimService.isAvailable()) {
        const duneNFTs = await this.duneSimService.getNFTBalances(address, networks);

        return duneNFTs.map(nft => ({
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          name: nft.name || undefined,
          description: nft.description || undefined,
          image: nft.image || undefined,
        }));
      }

      if (!hasEnhancedFeatures()) {
        console.log('⚠️  Enhanced NFT discovery requires API keys (Dune Sim, Moralis, Alchemy)');
        return [];
      }

      // Fallback to single-network queries for legacy APIs
      const network = networks[0] || 'mainnet';

      // Try Moralis API as fallback
      if (this.apiConfig.moralis) {
        return await this.getMoralisNFTBalances(address, network, config);
      }
      
      // Fallback to Alchemy
      if (this.apiConfig.alchemy) {
        return await this.getAlchemyNFTBalances(address, network, config);
      }

      console.log('⚠️  No NFT discovery API configured');
      return [];
    } catch (error) {
      console.error('NFT discovery error:', error);
      throw new Error(`Failed to fetch NFT balances: ${error}`);
    }
  }

  /**
   * Get token balances using Moralis API
   */
  private async getMoralisTokenBalances(
    address: string,
    network: SupportedNetwork,
    config: TokenDiscoveryConfig
  ): Promise<TokenBalance[]> {
    const chainMap: Record<SupportedNetwork, string> = {
      mainnet: 'eth',
      sepolia: 'sepolia',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
    };

    const chain = chainMap[network];
    if (!chain) {
      throw new Error(`Network ${network} not supported by Moralis`);
    }

    const response = await axios.get(
      `https://deep-index.moralis.io/api/v2/${address}/erc20`,
      {
        params: {
          chain,
          exclude_spam: true,
          exclude_unverified_contracts: true,
        },
        headers: {
          'X-API-Key': this.apiConfig.moralis!,
        },
        timeout: config.timeout || this.baseTimeout,
      }
    );

    return response.data.map((token: any) => ({
      address: token.token_address,
      name: token.name,
      symbol: token.symbol,
      decimals: parseInt(token.decimals),
      balance: token.balance,
      balanceFormatted: (
        parseInt(token.balance) / Math.pow(10, parseInt(token.decimals))
      ).toFixed(6),
      logo: token.logo,
      priceUsd: token.usd_price,
      valueUsd: token.usd_value,
    }));
  }

  /**
   * Get NFT balances using Moralis API
   */
  private async getMoralisNFTBalances(
    address: string,
    network: SupportedNetwork,
    config: TokenDiscoveryConfig
  ): Promise<NFTBalance[]> {
    const chainMap: Record<SupportedNetwork, string> = {
      mainnet: 'eth',
      sepolia: 'sepolia',
      polygon: 'polygon',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
      base: 'base',
    };

    const chain = chainMap[network];
    if (!chain) {
      throw new Error(`Network ${network} not supported by Moralis`);
    }

    const response = await axios.get(
      `https://deep-index.moralis.io/api/v2/${address}/nft`,
      {
        params: {
          chain,
          exclude_spam: true,
          media_items: config.includeMetadata !== false,
        },
        headers: {
          'X-API-Key': this.apiConfig.moralis!,
        },
        timeout: config.timeout || this.baseTimeout,
      }
    );

    return response.data.result.map((nft: any) => ({
      contractAddress: nft.token_address,
      tokenId: nft.token_id,
      name: nft.name,
      description: nft.metadata?.description,
      image: nft.metadata?.image,
      attributes: nft.metadata?.attributes,
      collection: {
        name: nft.name,
        description: nft.metadata?.description,
      },
    }));
  }

  /**
   * Get token balances using Alchemy API
   */
  private async getAlchemyTokenBalances(
    address: string,
    network: SupportedNetwork,
    config: TokenDiscoveryConfig
  ): Promise<TokenBalance[]> {
    const networkMap: Record<SupportedNetwork, string> = {
      mainnet: 'eth-mainnet',
      sepolia: 'eth-sepolia',
      polygon: 'polygon-mainnet',
      arbitrum: 'arb-mainnet',
      optimism: 'opt-mainnet',
      base: 'base-mainnet',
    };

    const alchemyNetwork = networkMap[network];
    if (!alchemyNetwork) {
      throw new Error(`Network ${network} not supported by Alchemy`);
    }

    const response = await axios.post(
      `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiConfig.alchemy}`,
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [address],
      },
      {
        timeout: config.timeout || this.baseTimeout,
      }
    );

    const balances = response.data.result.tokenBalances.filter(
      (token: any) => parseInt(token.tokenBalance, 16) > 0
    );

    // Get metadata for each token
    const tokensWithMetadata = await Promise.all(
      balances.map(async (token: any) => {
        try {
          const metadataResponse = await axios.post(
            `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiConfig.alchemy}`,
            {
              id: 1,
              jsonrpc: '2.0',
              method: 'alchemy_getTokenMetadata',
              params: [token.contractAddress],
            }
          );

          const metadata = metadataResponse.data.result;
          const balance = parseInt(token.tokenBalance, 16);
          const decimals = metadata.decimals || 18;

          return {
            address: token.contractAddress,
            name: metadata.name || 'Unknown Token',
            symbol: metadata.symbol || '???',
            decimals,
            balance: balance.toString(),
            balanceFormatted: (balance / Math.pow(10, decimals)).toFixed(6),
            logo: metadata.logo,
          };
        } catch (error) {
          console.warn(`Failed to get metadata for token ${token.contractAddress}`);
          return null;
        }
      })
    );

    return tokensWithMetadata.filter(Boolean) as TokenBalance[];
  }

  /**
   * Get NFT balances using Alchemy API
   */
  private async getAlchemyNFTBalances(
    address: string,
    network: SupportedNetwork,
    config: TokenDiscoveryConfig
  ): Promise<NFTBalance[]> {
    const networkMap: Record<SupportedNetwork, string> = {
      mainnet: 'eth-mainnet',
      sepolia: 'eth-sepolia',
      polygon: 'polygon-mainnet',
      arbitrum: 'arb-mainnet',
      optimism: 'opt-mainnet',
      base: 'base-mainnet',
    };

    const alchemyNetwork = networkMap[network];
    if (!alchemyNetwork) {
      throw new Error(`Network ${network} not supported by Alchemy`);
    }

    const response = await axios.post(
      `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiConfig.alchemy}`,
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getNFTs',
        params: [
          address,
          {
            withMetadata: config.includeMetadata !== false,
            excludeFilters: ['SPAM'],
          },
        ],
      },
      {
        timeout: config.timeout || this.baseTimeout,
      }
    );

    return response.data.result.ownedNfts.map((nft: any) => ({
      contractAddress: nft.contract.address,
      tokenId: nft.id.tokenId,
      name: nft.title || nft.metadata?.name,
      description: nft.description || nft.metadata?.description,
      image: nft.metadata?.image,
      attributes: nft.metadata?.attributes,
      collection: {
        name: nft.contract.name,
        description: nft.contract.symbol,
      },
    }));
  }

  /**
   * Search for tokens by name or symbol
   */
  async searchTokens(
    query: string,
    network: SupportedNetwork,
    limit: number = 10
  ): Promise<TokenBalance[]> {
    if (!this.apiConfig.moralis) {
      console.log('⚠️  Token search requires Moralis API key');
      return [];
    }

    try {
      const chainMap: Record<SupportedNetwork, string> = {
        mainnet: 'eth',
        sepolia: 'sepolia',
        polygon: 'polygon',
        arbitrum: 'arbitrum',
        optimism: 'optimism',
        base: 'base',
      };

      const chain = chainMap[network];
      const response = await axios.get(
        'https://deep-index.moralis.io/api/v2/erc20/metadata',
        {
          params: {
            chain,
            symbols: [query.toLowerCase()],
          },
          headers: {
            'X-API-Key': this.apiConfig.moralis,
          },
          timeout: this.baseTimeout,
        }
      );

      return response.data.slice(0, limit).map((token: any) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: '0',
        balanceFormatted: '0',
        logo: token.logo,
      }));
    } catch (error) {
      console.error('Token search error:', error);
      return [];
    }
  }
}