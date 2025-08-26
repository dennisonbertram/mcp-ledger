/**
 * Solana Blockchain Service
 * Provides secure interaction with Solana blockchain networks through RPC
 */

import { 
  Connection,
  PublicKey,
  Transaction,
  AccountInfo as SolanaAccountInfo,
  ParsedAccountData,
  TokenAccountsFilter,
  GetProgramAccountsFilter,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  ConfirmOptions,
  Commitment,
  GetAccountInfoConfig,
} from '@solana/web3.js';

import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
} from '@solana/spl-token';

import NodeCache from 'node-cache';
import { 
  SolanaNetwork,
  SolanaNetworkConfig,
  SolanaBlockchainServiceConfig,
  SolanaBalance,
  SPLTokenBalance,
  SolanaAccountInfo,
  SolanaFeeEstimate,
  SolanaTransactionInfo,
  SolanaError,
  SolanaErrorCode,
} from '../types/blockchain.js';

/**
 * Default Solana network configurations
 */
const DEFAULT_SOLANA_NETWORKS: Record<SolanaNetwork, SolanaNetworkConfig> = {
  'solana-mainnet': {
    chainId: 101,
    name: 'Solana Mainnet',
    rpcUrl: process.env.SOLANA_MAINNET_RPC_URL || clusterApiUrl('mainnet-beta'),
    wsEndpoint: process.env.SOLANA_MAINNET_WS_URL || 'wss://api.mainnet-beta.solana.com/',
    commitment: 'confirmed',
    blockExplorer: 'https://solscan.io',
  },
  'solana-devnet': {
    chainId: 103,
    name: 'Solana Devnet',
    rpcUrl: process.env.SOLANA_DEVNET_RPC_URL || clusterApiUrl('devnet'),
    wsEndpoint: process.env.SOLANA_DEVNET_WS_URL || 'wss://api.devnet.solana.com/',
    commitment: 'confirmed',
    blockExplorer: 'https://solscan.io/?cluster=devnet',
  },
  'solana-testnet': {
    chainId: 102,
    name: 'Solana Testnet',
    rpcUrl: process.env.SOLANA_TESTNET_RPC_URL || clusterApiUrl('testnet'),
    wsEndpoint: process.env.SOLANA_TESTNET_WS_URL || 'wss://api.testnet.solana.com/',
    commitment: 'confirmed',
    blockExplorer: 'https://solscan.io/?cluster=testnet',
  },
};

/**
 * SolanaBlockchainService class for managing Solana blockchain interactions
 */
export class SolanaBlockchainService {
  private connections: Map<SolanaNetwork, Connection> = new Map();
  private cache: NodeCache;
  private config: Required<SolanaBlockchainServiceConfig>;
  private networkConfigs: Record<SolanaNetwork, SolanaNetworkConfig>;

  constructor(config: SolanaBlockchainServiceConfig = {}) {
    // Set default configuration
    this.config = {
      networks: config.networks || {},
      defaultNetwork: config.defaultNetwork || 'solana-mainnet',
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 300, // 5 minutes
      requestTimeout: config.requestTimeout || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      commitment: config.commitment || 'confirmed',
    };

    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      useClones: false,
    });

    // Merge default networks with user-provided networks
    this.networkConfigs = {
      ...DEFAULT_SOLANA_NETWORKS,
      ...this.config.networks,
    };

    // Initialize connections for all networks
    this.initializeConnections();
  }

  /**
   * Initialize connections for all networks
   */
  private initializeConnections(): void {
    for (const [network, networkConfig] of Object.entries(this.networkConfigs)) {
      try {
        const connection = new Connection(
          networkConfig.rpcUrl || '',
          {
            commitment: networkConfig.commitment,
            wsEndpoint: networkConfig.wsEndpoint,
            confirmTransactionInitialTimeout: this.config.requestTimeout,
          }
        );
        
        this.connections.set(network as SolanaNetwork, connection);
      } catch (error) {
        console.warn(`Failed to initialize connection for ${network}:`, error);
      }
    }
  }

  /**
   * Get connection for specified network
   */
  private getConnection(network: SolanaNetwork = this.config.defaultNetwork): Connection {
    const connection = this.connections.get(network);
    if (!connection) {
      throw new SolanaError(
        `Connection not initialized for network: ${network}`,
        SolanaErrorCode.SOLANA_RPC_ERROR,
        network
      );
    }
    return connection;
  }

  /**
   * Validate Solana address
   */
  private validateAddress(address: string): PublicKey {
    try {
      const publicKey = new PublicKey(address);
      if (!PublicKey.isOnCurve(publicKey.toBytes())) {
        throw new Error('Invalid public key');
      }
      return publicKey;
    } catch (error) {
      throw new SolanaError(
        `Invalid Solana address: ${address}`,
        SolanaErrorCode.INVALID_SOLANA_ADDRESS
      );
    }
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(
    address: string,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<SolanaBalance> {
    const cacheKey = `balance-${network}-${address}`;
    
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<SolanaBalance>(cacheKey);
      if (cached) return cached;
    }

    try {
      const publicKey = this.validateAddress(address);
      const connection = this.getConnection(network);
      
      // Get balance and rent exempt reserve in parallel
      const [lamports, rentExemptReserve] = await Promise.all([
        connection.getBalance(publicKey, this.config.commitment),
        connection.getMinimumBalanceForRentExemption(0),
      ]);

      const balance: SolanaBalance = {
        lamports: BigInt(lamports),
        sol: (lamports / LAMPORTS_PER_SOL).toFixed(9),
        rentExemptReserve: BigInt(rentExemptReserve),
      };

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, balance);
      }

      return balance;
    } catch (error) {
      throw this.handleError(error, 'getBalance', network);
    }
  }

  /**
   * Get SPL token balances for an address
   */
  async getTokenBalances(
    address: string,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<SPLTokenBalance[]> {
    const cacheKey = `token-balances-${network}-${address}`;
    
    if (this.config.cacheEnabled) {
      const cached = this.cache.get<SPLTokenBalance[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const publicKey = this.validateAddress(address);
      const connection = this.getConnection(network);
      
      // Get all token accounts owned by the address
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        this.config.commitment
      );

      const balances: SPLTokenBalance[] = [];

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data as ParsedAccountData;
        const info = accountData.parsed.info;
        
        const balance: SPLTokenBalance = {
          mint: info.mint,
          amount: BigInt(info.tokenAmount.amount),
          decimals: info.tokenAmount.decimals,
          uiAmount: info.tokenAmount.uiAmountString || '0',
          tokenAccount: tokenAccount.pubkey.toBase58(),
        };

        balances.push(balance);
      }

      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, balances);
      }

      return balances;
    } catch (error) {
      throw this.handleError(error, 'getTokenBalances', network);
    }
  }

  /**
   * Get account information for an address
   */
  async getAccountInfo(
    address: string,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<SolanaAccountInfo | null> {
    try {
      const publicKey = this.validateAddress(address);
      const connection = this.getConnection(network);
      
      const accountInfo = await connection.getAccountInfo(
        publicKey,
        this.config.commitment
      );

      if (!accountInfo) {
        return null;
      }

      return {
        address,
        lamports: BigInt(accountInfo.lamports),
        owner: accountInfo.owner.toBase58(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch,
        data: accountInfo.data,
      };
    } catch (error) {
      throw this.handleError(error, 'getAccountInfo', network);
    }
  }

  /**
   * Get or create associated token account
   */
  async getOrCreateAssociatedTokenAccount(
    owner: string,
    mint: string,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<string> {
    try {
      const ownerPublicKey = this.validateAddress(owner);
      const mintPublicKey = this.validateAddress(mint);
      
      // Calculate ATA address
      const ata = await getAssociatedTokenAddress(
        mintPublicKey,
        ownerPublicKey,
        false, // Allow owner off curve
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if ATA already exists
      const connection = this.getConnection(network);
      const accountInfo = await connection.getAccountInfo(ata, this.config.commitment);
      
      if (accountInfo) {
        return ata.toBase58();
      }

      // ATA doesn't exist - return the address where it should be created
      // The caller will need to create it with a transaction
      return ata.toBase58();
    } catch (error) {
      throw this.handleError(error, 'getOrCreateAssociatedTokenAccount', network);
    }
  }

  /**
   * Create instruction for creating associated token account
   */
  createAssociatedTokenAccountInstruction(
    payer: string,
    owner: string,
    mint: string
  ) {
    try {
      const payerPublicKey = this.validateAddress(payer);
      const ownerPublicKey = this.validateAddress(owner);
      const mintPublicKey = this.validateAddress(mint);
      
      return createAssociatedTokenAccountInstruction(
        payerPublicKey,
        ownerPublicKey,
        ownerPublicKey,
        mintPublicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    } catch (error) {
      throw this.handleError(error, 'createAssociatedTokenAccountInstruction');
    }
  }

  /**
   * Send transaction to the network
   */
  async sendTransaction(
    transaction: Transaction,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<string> {
    try {
      const connection = this.getConnection(network);
      
      const signature = await connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: this.config.commitment,
        }
      );

      return signature;
    } catch (error) {
      throw this.handleError(error, 'sendTransaction', network);
    }
  }

  /**
   * Confirm transaction
   */
  async confirmTransaction(
    signature: string,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<SolanaTransactionInfo> {
    try {
      const connection = this.getConnection(network);
      
      const confirmation = await connection.confirmTransaction(
        signature,
        this.config.commitment
      );

      if (confirmation.value.err) {
        throw new SolanaError(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
          SolanaErrorCode.PROGRAM_ERROR,
          network
        );
      }

      // Get additional transaction info
      const transactionInfo = await connection.getTransaction(signature, {
        commitment: 'confirmed',
      });

      return {
        slot: confirmation.context.slot,
        signature,
        confirmationStatus: 'confirmed',
        err: confirmation.value.err,
        blockTime: transactionInfo?.blockTime || undefined,
      };
    } catch (error) {
      throw this.handleError(error, 'confirmTransaction', network);
    }
  }

  /**
   * Get recent blockhash
   */
  async getRecentBlockhash(
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<string> {
    try {
      const connection = this.getConnection(network);
      const { blockhash } = await connection.getLatestBlockhash(this.config.commitment);
      return blockhash;
    } catch (error) {
      throw this.handleError(error, 'getRecentBlockhash', network);
    }
  }

  /**
   * Get minimum balance for rent exemption
   */
  async getMinimumBalanceForRentExemption(
    dataSize: number,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<number> {
    try {
      const connection = this.getConnection(network);
      return await connection.getMinimumBalanceForRentExemption(dataSize);
    } catch (error) {
      throw this.handleError(error, 'getMinimumBalanceForRentExemption', network);
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateTransactionFees(
    transaction: Transaction,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<SolanaFeeEstimate> {
    try {
      const connection = this.getConnection(network);
      
      // Get fee for the transaction
      const fee = await connection.getFeeForMessage(
        transaction.compileMessage(),
        this.config.commitment
      );

      if (fee.value === null) {
        throw new SolanaError(
          'Could not estimate transaction fees',
          SolanaErrorCode.SOLANA_RPC_ERROR,
          network
        );
      }

      return {
        baseFee: fee.value,
        totalFee: fee.value,
      };
    } catch (error) {
      throw this.handleError(error, 'estimateTransactionFees', network);
    }
  }

  /**
   * Subscribe to account changes
   */
  async subscribeToAccountChanges(
    address: string,
    callback: (accountInfo: SolanaAccountInfo | null, context: any) => void,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<number> {
    try {
      const publicKey = this.validateAddress(address);
      const connection = this.getConnection(network);
      
      return connection.onAccountChange(
        publicKey,
        (accountInfo, context) => {
          const solanaAccountInfo = accountInfo ? {
            address,
            lamports: BigInt(accountInfo.lamports),
            owner: accountInfo.owner.toBase58(),
            executable: accountInfo.executable,
            rentEpoch: accountInfo.rentEpoch,
            data: accountInfo.data,
          } : null;
          
          callback(solanaAccountInfo, context);
        },
        this.config.commitment
      );
    } catch (error) {
      throw this.handleError(error, 'subscribeToAccountChanges', network);
    }
  }

  /**
   * Unsubscribe from account changes
   */
  async unsubscribeFromAccountChanges(
    subscriptionId: number,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<void> {
    try {
      const connection = this.getConnection(network);
      await connection.removeAccountChangeListener(subscriptionId);
    } catch (error) {
      throw this.handleError(error, 'unsubscribeFromAccountChanges', network);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    // Close WebSocket connections
    for (const connection of this.connections.values()) {
      // Connection doesn't have a close method, but we can clear the map
    }
    this.connections.clear();
    this.clearCache();
  }

  /**
   * Health check
   */
  async healthCheck(network: SolanaNetwork = this.config.defaultNetwork): Promise<boolean> {
    try {
      const connection = this.getConnection(network);
      await connection.getSlot();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle errors and convert to SolanaError
   */
  private handleError(
    error: unknown,
    operation: string,
    network?: SolanaNetwork
  ): SolanaError {
    if (error instanceof SolanaError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    let errorCode = SolanaErrorCode.SOLANA_RPC_ERROR;

    // Map specific error messages to error codes
    if (errorMessage.includes('Invalid public key')) {
      errorCode = SolanaErrorCode.INVALID_SOLANA_ADDRESS;
    } else if (errorMessage.includes('Account does not exist')) {
      errorCode = SolanaErrorCode.ACCOUNT_NOT_FOUND;
    } else if (errorMessage.includes('Insufficient funds')) {
      errorCode = SolanaErrorCode.INSUFFICIENT_SOL_BALANCE;
    } else if (errorMessage.includes('Transaction too large')) {
      errorCode = SolanaErrorCode.TRANSACTION_TOO_LARGE;
    } else if (errorMessage.includes('Blockhash not found')) {
      errorCode = SolanaErrorCode.BLOCKHASH_EXPIRED;
    }

    return new SolanaError(
      `${operation} failed: ${errorMessage}`,
      errorCode,
      network,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(network: SolanaNetwork): SolanaNetworkConfig {
    return this.networkConfigs[network];
  }

  /**
   * Get all available networks
   */
  getAvailableNetworks(): SolanaNetwork[] {
    return Object.keys(this.networkConfigs) as SolanaNetwork[];
  }
}