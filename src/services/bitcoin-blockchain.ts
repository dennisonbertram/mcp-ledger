/**
 * Bitcoin Blockchain Service
 * Provides Bitcoin blockchain operations using Blockstream Esplora API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import NodeCache from 'node-cache';
import type {
  BitcoinNetwork,
  BitcoinNetworkConfig,
  BitcoinBlockchainServiceConfig,
  UTXO,
  BitcoinBalance,
  BitcoinTransaction,
  BitcoinFeeEstimate,
  BitcoinAddress,
  BitcoinAddressType,
} from '../types/blockchain.js';
import {
  BlockchainError,
  BlockchainErrorCode,
} from '../types/blockchain.js';

/**
 * Default Bitcoin network configurations
 */
const DEFAULT_BITCOIN_NETWORKS: Record<BitcoinNetwork, BitcoinNetworkConfig> = {
  bitcoin: {
    chainId: 0, // Bitcoin mainnet doesn't use chainId like Ethereum
    name: 'Bitcoin Mainnet',
    rpcUrl: 'https://blockstream.info/api',
    blockExplorer: 'https://blockstream.info',
    esploraUrl: 'https://blockstream.info/api',
    dustThreshold: 546, // satoshis
    defaultFeeRate: 10, // sat/vB
  },
  'bitcoin-testnet': {
    chainId: 1, // Bitcoin testnet identifier
    name: 'Bitcoin Testnet',
    rpcUrl: 'https://blockstream.info/testnet/api',
    blockExplorer: 'https://blockstream.info/testnet',
    esploraUrl: 'https://blockstream.info/testnet/api',
    dustThreshold: 546, // satoshis
    defaultFeeRate: 5, // sat/vB (lower for testnet)
  },
};

/**
 * Bitcoin Blockchain Service
 * Handles all Bitcoin blockchain interactions via Esplora API
 */
export class BitcoinBlockchainService {
  private clients: Map<BitcoinNetwork, AxiosInstance> = new Map();
  private cache: NodeCache;
  private config: BitcoinBlockchainServiceConfig;
  private networks: Record<BitcoinNetwork, BitcoinNetworkConfig>;

  constructor(config: BitcoinBlockchainServiceConfig = {}) {
    this.config = {
      defaultNetwork: 'bitcoin',
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      requestTimeout: 30000, // 30 seconds
      maxRetries: 3,
      dustThreshold: 546,
      ...config,
    };

    this.networks = {
      ...DEFAULT_BITCOIN_NETWORKS,
      ...config.networks,
    };

    this.cache = new NodeCache({ 
      stdTTL: this.config.cacheTTL!,
      checkperiod: 60,
    });

    this.initializeClients();
  }

  /**
   * Initialize HTTP clients for each network
   */
  private initializeClients(): void {
    for (const [network, networkConfig] of Object.entries(this.networks) as [BitcoinNetwork, BitcoinNetworkConfig][]) {
      const client = axios.create({
        baseURL: networkConfig.esploraUrl,
        timeout: this.config.requestTimeout!,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          throw this.handleApiError(error, network);
        }
      );

      this.clients.set(network, client);
    }
  }

  /**
   * Handle API errors with proper error mapping
   */
  private handleApiError(error: AxiosError, network: BitcoinNetwork): BlockchainError {
    let message = 'Bitcoin API request failed';
    let code = BlockchainErrorCode.RPC_ERROR;

    if (error.response) {
      message = `Bitcoin API error: ${error.response.status} ${error.response.statusText}`;
      if (error.response.status === 429) {
        code = BlockchainErrorCode.RATE_LIMITED;
        message = 'Bitcoin API rate limit exceeded';
      }
    } else if (error.code === 'ECONNABORTED') {
      code = BlockchainErrorCode.TIMEOUT;
      message = 'Bitcoin API request timeout';
    }

    return new BlockchainError(message, code, network, error);
  }

  /**
   * Get Bitcoin network configuration
   */
  getNetworkConfig(network: BitcoinNetwork): BitcoinNetworkConfig {
    const config = this.networks[network];
    if (!config) {
      throw new BlockchainError(
        `Unsupported Bitcoin network: ${network}`,
        BlockchainErrorCode.NETWORK_NOT_SUPPORTED,
        network
      );
    }
    return config;
  }

  /**
   * Validate Bitcoin address format
   */
  isValidAddress(address: string, network: BitcoinNetwork = 'bitcoin'): boolean {
    try {
      // Basic validation - starts with expected prefixes
      if (network === 'bitcoin') {
        return address.startsWith('1') || 
               address.startsWith('3') || 
               address.startsWith('bc1');
      } else {
        return address.startsWith('m') || 
               address.startsWith('n') || 
               address.startsWith('2') || 
               address.startsWith('tb1');
      }
    } catch {
      return false;
    }
  }

  /**
   * Determine address type from address string
   */
  getAddressType(address: string): BitcoinAddressType {
    if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
      return 'legacy';
    } else if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
      return 'segwit';
    } else if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
      return 'taproot';
    }
    return 'legacy'; // fallback
  }

  /**
   * Get address balance and UTXO information
   */
  async getAddressBalance(address: string, network: BitcoinNetwork = 'bitcoin'): Promise<BitcoinBalance> {
    if (!this.isValidAddress(address, network)) {
      throw new BlockchainError(
        `Invalid Bitcoin address: ${address}`,
        BlockchainErrorCode.INVALID_ADDRESS,
        network
      );
    }

    const cacheKey = `balance:${network}:${address}`;
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<BitcoinBalance>(cacheKey);
      if (cached) return cached;
    }

    const client = this.clients.get(network);
    if (!client) {
      throw new BlockchainError(
        `No client configured for network: ${network}`,
        BlockchainErrorCode.CLIENT_NOT_INITIALIZED,
        network
      );
    }

    try {
      // Get address stats
      const response = await client.get(`/address/${address}`);
      const addressData = response.data;

      const balance: BitcoinBalance = {
        confirmed: addressData.chain_stats?.funded_txo_sum || 0,
        unconfirmed: addressData.mempool_stats?.funded_txo_sum || 0,
        total: (addressData.chain_stats?.funded_txo_sum || 0) + (addressData.mempool_stats?.funded_txo_sum || 0),
        utxoCount: (addressData.chain_stats?.funded_txo_count || 0) + (addressData.mempool_stats?.funded_txo_count || 0),
        addresses: {
          [address]: {
            balance: (addressData.chain_stats?.funded_txo_sum || 0) + (addressData.mempool_stats?.funded_txo_sum || 0),
            utxoCount: (addressData.chain_stats?.funded_txo_count || 0) + (addressData.mempool_stats?.funded_txo_count || 0),
          },
        },
      };

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, balance);
      }

      return balance;
    } catch (error) {
      if (error instanceof BlockchainError) throw error;
      throw this.handleApiError(error as AxiosError, network);
    }
  }

  /**
   * Get UTXOs for an address
   */
  async getAddressUTXOs(address: string, network: BitcoinNetwork = 'bitcoin'): Promise<UTXO[]> {
    if (!this.isValidAddress(address, network)) {
      throw new BlockchainError(
        `Invalid Bitcoin address: ${address}`,
        BlockchainErrorCode.INVALID_ADDRESS,
        network
      );
    }

    const cacheKey = `utxos:${network}:${address}`;
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<UTXO[]>(cacheKey);
      if (cached) return cached;
    }

    const client = this.clients.get(network);
    if (!client) {
      throw new BlockchainError(
        `No client configured for network: ${network}`,
        BlockchainErrorCode.CLIENT_NOT_INITIALIZED,
        network
      );
    }

    try {
      const response = await client.get(`/address/${address}/utxo`);
      const utxoData = response.data;

      const utxos: UTXO[] = utxoData.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: '', // Not provided by Esplora, would need additional call
        confirmations: utxo.status?.confirmed ? utxo.status.block_height : 0,
        address,
        spendable: utxo.status?.confirmed || false,
      }));

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, utxos, 60); // Cache UTXOs for 1 minute only
      }

      return utxos;
    } catch (error) {
      if (error instanceof BlockchainError) throw error;
      throw this.handleApiError(error as AxiosError, network);
    }
  }

  /**
   * Get transaction information
   */
  async getTransaction(txid: string, network: BitcoinNetwork = 'bitcoin'): Promise<BitcoinTransaction> {
    const cacheKey = `tx:${network}:${txid}`;
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<BitcoinTransaction>(cacheKey);
      if (cached) return cached;
    }

    const client = this.clients.get(network);
    if (!client) {
      throw new BlockchainError(
        `No client configured for network: ${network}`,
        BlockchainErrorCode.CLIENT_NOT_INITIALIZED,
        network
      );
    }

    try {
      const response = await client.get(`/tx/${txid}`);
      const txData = response.data;

      const transaction: BitcoinTransaction = {
        txid: txData.txid,
        hash: txData.txid, // Same as txid for Bitcoin
        size: txData.size,
        vsize: txData.vsize,
        weight: txData.weight,
        version: txData.version,
        locktime: txData.locktime,
        fee: txData.fee,
        confirmations: txData.status?.confirmed ? txData.status.confirmations : 0,
        time: txData.status?.block_time,
        blocktime: txData.status?.block_time,
        blockhash: txData.status?.block_hash,
        blockheight: txData.status?.block_height,
        inputs: txData.vin?.map((input: any) => ({
          txid: input.txid,
          vout: input.vout,
          sequence: input.sequence,
          scriptSig: input.scriptsig,
          witness: input.witness,
        })) || [],
        outputs: txData.vout?.map((output: any) => ({
          address: output.scriptpubkey_address || '',
          value: output.value,
          scriptPubKey: output.scriptpubkey,
        })) || [],
      };

      if (this.config.cacheEnabled && transaction.confirmations > 0) {
        this.cache.set(cacheKey, transaction, 3600); // Cache confirmed transactions for 1 hour
      }

      return transaction;
    } catch (error) {
      if (error instanceof BlockchainError) throw error;
      throw this.handleApiError(error as AxiosError, network);
    }
  }

  /**
   * Get current fee estimates
   */
  async getFeeEstimates(network: BitcoinNetwork = 'bitcoin'): Promise<BitcoinFeeEstimate> {
    const cacheKey = `fees:${network}`;
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<BitcoinFeeEstimate>(cacheKey);
      if (cached) return cached;
    }

    const client = this.clients.get(network);
    if (!client) {
      throw new BlockchainError(
        `No client configured for network: ${network}`,
        BlockchainErrorCode.CLIENT_NOT_INITIALIZED,
        network
      );
    }

    try {
      const response = await client.get('/fee-estimates');
      const feeData = response.data;

      const networkConfig = this.getNetworkConfig(network);
      
      const feeEstimate: BitcoinFeeEstimate = {
        minimumFee: 1, // 1 sat/vB minimum
        economyFee: feeData['144'] || networkConfig.defaultFeeRate, // ~1 day
        slowFee: feeData['25'] || networkConfig.defaultFeeRate, // ~4 hours
        standardFee: feeData['6'] || networkConfig.defaultFeeRate, // ~1 hour
        fastFee: feeData['2'] || networkConfig.defaultFeeRate * 2, // ~20 minutes
      };

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, feeEstimate, 300); // Cache fees for 5 minutes
      }

      return feeEstimate;
    } catch (error) {
      // If fee estimates fail, return defaults
      const networkConfig = this.getNetworkConfig(network);
      return {
        minimumFee: 1,
        economyFee: networkConfig.defaultFeeRate,
        slowFee: networkConfig.defaultFeeRate,
        standardFee: networkConfig.defaultFeeRate * 2,
        fastFee: networkConfig.defaultFeeRate * 3,
      };
    }
  }

  /**
   * Broadcast a signed transaction
   */
  async broadcastTransaction(rawTx: string, network: BitcoinNetwork = 'bitcoin'): Promise<string> {
    const client = this.clients.get(network);
    if (!client) {
      throw new BlockchainError(
        `No client configured for network: ${network}`,
        BlockchainErrorCode.CLIENT_NOT_INITIALIZED,
        network
      );
    }

    try {
      const response = await client.post('/tx', rawTx, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      return response.data; // Returns txid
    } catch (error) {
      if (error instanceof BlockchainError) throw error;
      throw this.handleApiError(error as AxiosError, network);
    }
  }

  /**
   * Get multiple address balances efficiently
   */
  async getMultipleAddressBalances(addresses: string[], network: BitcoinNetwork = 'bitcoin'): Promise<Record<string, BitcoinBalance>> {
    const results: Record<string, BitcoinBalance> = {};
    
    // Process addresses in parallel with limited concurrency
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const promises = batch.map(async (address) => {
        try {
          const balance = await this.getAddressBalance(address, network);
          return { address, balance };
        } catch (error) {
          console.warn(`Failed to get balance for address ${address}:`, error);
          return { address, balance: null };
        }
      });

      const batchResults = await Promise.allSettled(promises);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.balance) {
          results[result.value.address] = result.value.balance;
        }
      });
    }

    return results;
  }

  /**
   * Clear cache for testing or manual refresh
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<{ network: BitcoinNetwork; healthy: boolean; latency?: number }[]> {
    const results = [];
    
    for (const network of Object.keys(this.networks) as BitcoinNetwork[]) {
      const client = this.clients.get(network);
      if (!client) {
        results.push({ network, healthy: false });
        continue;
      }

      try {
        const start = Date.now();
        await client.get('/fee-estimates');
        const latency = Date.now() - start;
        results.push({ network, healthy: true, latency });
      } catch {
        results.push({ network, healthy: false });
      }
    }

    return results;
  }
}