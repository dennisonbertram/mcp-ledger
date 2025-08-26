/**
 * Service Orchestrator - Coordinates all services for the MCP server
 */

import { LedgerService } from './ledger.js';
import { BlockscoutClient } from './blockscout.js';
import { BlockchainService } from './blockchain.js';
import { TransactionCrafter } from './transaction-crafter.js';
import { SolanaBlockchainService } from './solana-blockchain.js';
import { SolanaTransactionCrafter } from './solana-transaction-crafter.js';
import type { SupportedNetwork, SolanaBlockchainServiceConfig } from '../types/blockchain.js';
import type { BlockchainServiceConfig } from '../types/blockchain.js';
import type { BlockscoutClientConfig } from './blockscout.types.js';
import type { TransactionCrafterConfig } from '../types/transaction-crafter.js';
import type { SolanaTransactionCrafterConfig } from './solana-transaction-crafter.js';

/**
 * Configuration for the service orchestrator
 */
export interface OrchestratorConfig {
  blockchain?: BlockchainServiceConfig;
  blockscout?: BlockscoutClientConfig;
  transactionCrafter?: TransactionCrafterConfig;
  defaultNetwork?: SupportedNetwork;
  // Solana-specific configurations
  solana?: {
    blockchain?: SolanaBlockchainServiceConfig;
    transactionCrafter?: SolanaTransactionCrafterConfig;
  };
}

/**
 * Service orchestrator that initializes and manages all services
 */
export class ServiceOrchestrator {
  private ledgerService: LedgerService;
  private blockscoutClient: BlockscoutClient;
  private blockchainService: BlockchainService;
  private transactionCrafter: TransactionCrafter;
  // Solana services
  private solanaBlockchainService: SolanaBlockchainService;
  private solanaTransactionCrafter: SolanaTransactionCrafter;
  private config: Required<OrchestratorConfig>;

  constructor(config: OrchestratorConfig = {}) {
    // Set default configuration
    this.config = {
      blockchain: config.blockchain || { defaultNetwork: 'mainnet' },
      blockscout: config.blockscout || { defaultNetwork: 'mainnet' },
      transactionCrafter: config.transactionCrafter || { defaultNetwork: 'mainnet' },
      defaultNetwork: config.defaultNetwork || 'mainnet',
      solana: config.solana || {
        blockchain: { defaultNetwork: 'solana-mainnet' },
        transactionCrafter: { defaultNetwork: 'solana-mainnet' },
      },
    };

    // Initialize Ethereum services
    this.ledgerService = new LedgerService();
    this.blockscoutClient = new BlockscoutClient(this.config.blockscout);
    this.blockchainService = new BlockchainService(this.config.blockchain);
    
    // Initialize Ethereum transaction crafter
    this.transactionCrafter = new TransactionCrafter({
      ledgerService: this.ledgerService,
      blockscoutClient: this.blockscoutClient,
      blockchainService: this.blockchainService,
      config: this.config.transactionCrafter,
    });

    // Initialize Solana services
    this.solanaBlockchainService = new SolanaBlockchainService(
      this.config.solana.blockchain
    );
    
    this.solanaTransactionCrafter = new SolanaTransactionCrafter(
      this.solanaBlockchainService,
      this.ledgerService,
      this.config.solana.transactionCrafter
    );
  }

  /**
   * Get the Ledger service
   */
  public getLedgerService(): LedgerService {
    return this.ledgerService;
  }

  /**
   * Get the Blockscout client
   */
  public getBlockscoutClient(): BlockscoutClient {
    return this.blockscoutClient;
  }

  /**
   * Get the blockchain service
   */
  public getBlockchainService(): BlockchainService {
    return this.blockchainService;
  }

  /**
   * Get the transaction crafter
   */
  public getTransactionCrafter(): TransactionCrafter {
    return this.transactionCrafter;
  }

  /**
   * Get the Solana blockchain service
   */
  public getSolanaBlockchainService(): SolanaBlockchainService {
    return this.solanaBlockchainService;
  }

  /**
   * Get the Solana transaction crafter
   */
  public getSolanaTransactionCrafter(): SolanaTransactionCrafter {
    return this.solanaTransactionCrafter;
  }

  /**
   * Initialize all services (e.g., connect to Ledger)
   */
  public async initialize(): Promise<boolean> {
    try {
      // Connect to Ledger device
      const ledgerConnected = await this.ledgerService.connectToLedger();
      return ledgerConnected;
    } catch (error) {
      console.error('Failed to initialize orchestrator:', error);
      return false;
    }
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<{
    ledger: boolean;
    blockscout: boolean;
    blockchain: boolean;
    solana: boolean;
    overall: boolean;
  }> {
    const checks = {
      ledger: this.ledgerService.isConnected(),
      blockscout: true, // Blockscout client doesn't have a health check, assume healthy
      blockchain: true, // Blockchain service doesn't have a health check, assume healthy
      solana: await this.solanaBlockchainService.healthCheck(),
      overall: false,
    };

    // Overall health is true if ledger is connected (critical service)
    // Solana is optional, so it doesn't affect overall health
    checks.overall = checks.ledger;

    return checks;
  }

  /**
   * Gracefully shutdown all services
   */
  public async shutdown(): Promise<void> {
    try {
      // Disconnect from Ledger
      await this.ledgerService.disconnect();
      
      // Close blockchain service clients
      await this.blockchainService.close();
      await this.solanaBlockchainService.close();
      
      // Clear caches
      this.blockscoutClient.clearCache();
      this.blockchainService.clearCache();
      this.solanaBlockchainService.clearCache();
      
      console.log('All services shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<OrchestratorConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration (note: this doesn't reinitialize services)
   */
  public updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }
}