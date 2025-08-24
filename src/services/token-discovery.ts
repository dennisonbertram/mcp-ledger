/**
 * Token and NFT discovery service using Dune Sim API
 * Provides reliable multi-chain token data with spam filtering
 */

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
  private duneSimService = new DuneSimService();

  /**
   * Get comprehensive ERC20 token balances for an address using Dune Sim API
   */
  async getTokenBalances(
    address: string,
    networks: SupportedNetwork[] = ['mainnet'],
    config: TokenDiscoveryConfig = {}
  ): Promise<TokenBalance[]> {
    if (!this.duneSimService.isAvailable()) {
      throw new Error('DUNE_SIM_API_KEY is required for token discovery. Please add it to your .env file.');
    }

    try {
      const duneBalances = await this.duneSimService.getTokenBalances(address, networks, {
        liquidityThreshold: 10000, // Filter low liquidity tokens
        useAllowlist: true, // Use trusted token allowlist
        ...(config.timeout && { timeout: config.timeout }),
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
    } catch (error) {
      console.error('Dune Sim token discovery error:', error);
      throw new Error(`Failed to fetch token balances: ${error}`);
    }
  }

  /**
   * Get NFT balances for an address using Dune Sim API
   */
  async getNFTBalances(
    address: string,
    networks: SupportedNetwork[] = ['mainnet'],
    config: TokenDiscoveryConfig = {}
  ): Promise<NFTBalance[]> {
    if (!this.duneSimService.isAvailable()) {
      throw new Error('DUNE_SIM_API_KEY is required for NFT discovery. Please add it to your .env file.');
    }

    try {
      const duneNFTs = await this.duneSimService.getNFTBalances(address, networks);

      return duneNFTs.map(nft => ({
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        name: nft.name || undefined,
        description: nft.description || undefined,
        image: nft.image || undefined,
      }));
    } catch (error) {
      console.error('Dune Sim NFT discovery error:', error);
      throw new Error(`Failed to fetch NFT balances: ${error}`);
    }
  }

}