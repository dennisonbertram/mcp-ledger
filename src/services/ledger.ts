/**
 * Ledger Hardware Wallet Integration Service
 * Provides secure interaction with Ledger devices for Ethereum operations
 * FIXED: Race conditions with proper synchronization using mutex
 */

import TransportNodeHidModule from '@ledgerhq/hw-transport-node-hid';
import type Transport from '@ledgerhq/hw-transport';
import EthModule from '@ledgerhq/hw-app-eth';
import type { LedgerEthTransactionResolution } from '@ledgerhq/hw-app-eth/lib/services/types';
import SolanaModule from '@ledgerhq/hw-app-solana';

const TransportNodeHid = (TransportNodeHidModule as any).default;
const Eth = (EthModule as any).default;
const Solana = (SolanaModule as any).default;
import { Mutex } from 'async-mutex';
import type { SolanaAddress } from '../types/blockchain.js';

/**
 * Error messages for better debugging
 */
const ErrorMessages = {
  DEVICE_NOT_CONNECTED: 'Ledger device not connected',
  NOT_CONNECTED: 'Ledger not connected',
  WRONG_APP: 'Wrong app opened on Ledger',
  WRONG_ETH_APP: 'Wrong app opened on Ledger. Please open Ethereum app',
  WRONG_SOLANA_APP: 'Wrong app opened on Ledger. Please open Solana app',
  USER_REJECTED_REQUEST: 'User rejected the request',
  USER_REJECTED_TRANSACTION: 'User rejected the transaction',
  DEVICE_DISCONNECTED: 'Ledger device disconnected',
  DEVICE_LOCKED: 'Ledger device is locked',
  CONNECTION_TIMEOUT: 'Connection timeout',
  INVALID_TRANSACTION: 'Invalid transaction format',
  INVALID_DERIVATION_PATH: 'Invalid derivation path',
  SOLANA_APP_NOT_CONNECTED: 'Solana app not connected',
} as const;

/**
 * Interface for Ledger address response
 */
export interface LedgerAddress {
  address: string;
  publicKey: string;
  chainCode?: string;
}

/**
 * Interface for transaction signature
 */
export interface TransactionSignature {
  r: string;
  s: string;
  v: string;
}

/**
 * Interface for app configuration
 */
export interface AppConfiguration {
  arbitraryDataEnabled: number;
  erc20ProvisioningNecessary: number;
  starkEnabled: number;
  starkv2Supported: number;
  version: string;
}

/**
 * Interface for Solana transaction signature
 */
export interface SolanaTransactionSignature {
  signature: Buffer;
}

/**
 * Interface for Solana message signature  
 */
export interface SolanaMessageSignature {
  signature: Buffer;
}

/**
 * Interface for Solana app configuration
 */
export interface SolanaAppConfiguration {
  version: string;
  blindSigningEnabled: boolean;
}

/**
 * LedgerService class for managing Ledger hardware wallet interactions
 * FIXED: Added mutex for thread-safe operations and connection state management
 */
export class LedgerService {
  private transport: Transport | null = null;
  private ethApp: any | null = null;
  private solanaApp: any | null = null;
  private connected: boolean = false;
  private currentApp: 'ethereum' | 'solana' | null = null;
  
  // Mutex for synchronizing connection operations
  private connectionMutex: Mutex = new Mutex();
  // Mutex for synchronizing all operations
  private operationMutex: Mutex = new Mutex();
  // Track connection state to prevent multiple concurrent connections
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  // Store the connection promise to reuse for concurrent connection attempts
  private activeConnectionPromise: Promise<boolean> | null = null;

  constructor() {
    // Initialize with disconnected state
    this.connected = false;
    this.connectionState = 'disconnected';
  }

  /**
   * Check if Ledger is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Connect to Ledger device with proper synchronization
   * FIXED: Prevents multiple concurrent connections with mutex
   * @param timeout - Connection timeout in milliseconds (default: 5000)
   * @returns Promise<boolean> - True if connection successful
   */
  public async connectToLedger(timeout: number = 5000): Promise<boolean> {
    // If already connected, return immediately
    if (this.connectionState === 'connected' && this.transport) {
      return true;
    }

    // If a connection is already in progress, wait for it
    if (this.connectionState === 'connecting' && this.activeConnectionPromise) {
      return this.activeConnectionPromise;
    }

    // Acquire the connection mutex to prevent race conditions
    return this.connectionMutex.runExclusive(async () => {
      // Double-check after acquiring the lock
      if (this.connectionState === 'connected' && this.transport) {
        return true;
      }

      // If another connection started while we were waiting, use it
      if (this.connectionState === 'connecting' && this.activeConnectionPromise) {
        return this.activeConnectionPromise;
      }

      // Mark as connecting
      this.connectionState = 'connecting';

      // Create the connection promise that can be reused
      this.activeConnectionPromise = this.performConnection(timeout);

      try {
        const result = await this.activeConnectionPromise;
        return result;
      } finally {
        // Clear the active connection promise
        this.activeConnectionPromise = null;
      }
    });
  }

  /**
   * Perform the actual connection (internal method)
   * @param timeout - Connection timeout in milliseconds
   * @returns Promise<boolean>
   */
  private async performConnection(timeout: number): Promise<boolean> {
    try {
      // Create connection with timeout
      const connectionPromise = TransportNodeHid.create();
      const timeoutPromise = new Promise<never>((_, reject) => {
        globalThis.setTimeout(() => reject(new Error(ErrorMessages.CONNECTION_TIMEOUT)), timeout);
      });

      this.transport = await Promise.race([connectionPromise, timeoutPromise]);
      this.ethApp = new Eth(this.transport);
      this.solanaApp = new Solana(this.transport);
      this.connected = true;
      this.connectionState = 'connected';
      
      return true;
    } catch (error: unknown) {
      this.connected = false;
      this.connectionState = 'disconnected';
      this.transport = null;
      this.ethApp = null;
      this.solanaApp = null;
      this.currentApp = null;

      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('No device found')) {
        throw new Error(ErrorMessages.DEVICE_NOT_CONNECTED);
      }
      if (errorMessage === ErrorMessages.CONNECTION_TIMEOUT) {
        throw error instanceof Error ? error : new Error(ErrorMessages.CONNECTION_TIMEOUT);
      }
      
      throw new Error(ErrorMessages.DEVICE_NOT_CONNECTED);
    }
  }

  /**
   * Get Ethereum address from Ledger with proper synchronization
   * FIXED: Synchronized operation to prevent race conditions
   * @param path - BIP32 derivation path (e.g., "44'/60'/0'/0/0")
   * @param display - Whether to display address on device
   * @param chainCode - Whether to return chain code
   * @returns Promise<LedgerAddress>
   */
  public async getAddress(
    path: string,
    display: boolean = false,
    chainCode: boolean = false
  ): Promise<LedgerAddress> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.ethApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.NOT_CONNECTED);
      }

      try {
        const result = await this.ethApp.getAddress(path, display, chainCode);
        return result;
      } catch (error: unknown) {
        return this.handleError(error, 'getAddress');
      }
    });
  }

  /**
   * Sign a transaction using Ledger with proper synchronization
   * FIXED: Synchronized operation to prevent race conditions
   * @param path - BIP32 derivation path
   * @param rawTxHex - Raw transaction in hexadecimal
   * @param resolution - Optional resolution data for clear signing
   * @returns Promise<TransactionSignature>
   */
  public async signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null
  ): Promise<TransactionSignature> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.ethApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.NOT_CONNECTED);
      }

      try {
        const result = await this.ethApp.signTransaction(
          path,
          rawTxHex,
          resolution || null
        );
        return result;
      } catch (error: unknown) {
        return this.handleError(error, 'signTransaction');
      }
    });
  }

  /**
   * Sign a personal message using Ledger with proper synchronization
   * @param path - BIP32 derivation path (e.g., "44'/60'/0'/0/0")
   * @param message - Message to sign (will be converted to hex)
   * @returns Promise<TransactionSignature>
   */
  public async signPersonalMessage(
    path: string,
    message: string
  ): Promise<TransactionSignature> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.ethApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.NOT_CONNECTED);
      }

      try {
        // Convert message to hex format as expected by Ledger
        const messageHex = Buffer.from(message).toString('hex');
        
        const result = await this.ethApp.signPersonalMessage(path, messageHex);
        
        // Convert v value (Ledger returns v + 27, we need the raw v)
        const v = (result.v - 27).toString(16).padStart(2, '0');
        
        return {
          r: result.r,
          s: result.s,
          v: v
        };
      } catch (error: unknown) {
        return this.handleError(error, 'signPersonalMessage');
      }
    });
  }

  /**
   * Get Ledger app configuration with proper synchronization
   * FIXED: Synchronized operation to prevent race conditions
   * @returns Promise<AppConfiguration>
   */
  public async getAppConfiguration(): Promise<AppConfiguration> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.ethApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.NOT_CONNECTED);
      }

      try {
        const result = await this.ethApp.getAppConfiguration();
        return result;
      } catch (error: unknown) {
        return this.handleError(error, 'getAppConfiguration');
      }
    });
  }

  /**
   * Disconnect from Ledger device with proper synchronization
   * FIXED: Synchronized disconnect to prevent race conditions
   */
  public async disconnect(): Promise<void> {
    return this.connectionMutex.runExclusive(async () => {
      // Mark as disconnecting to prevent new operations
      this.connectionState = 'disconnected';
      
      if (!this.connected || !this.transport) {
        this.connected = false;
        this.transport = null;
        this.ethApp = null;
        return;
      }

      try {
        await this.transport.close();
      } catch {
        // Gracefully handle disconnect errors - silently fail as device may already be disconnected
        // In production, this could be logged to a proper logging service
      } finally {
        this.transport = null;
        this.ethApp = null;
        this.connected = false;
      }
    });
  }

  /**
   * Handle Ledger-specific errors
   * @param error - The error object
   * @param operation - The operation that failed
   */
  private handleError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // User rejection errors
    if (errorMessage.includes('0x6985') || errorMessage.includes('denied by the user')) {
      if (operation === 'signTransaction') {
        throw new Error(ErrorMessages.USER_REJECTED_TRANSACTION);
      }
      if (operation === 'signPersonalMessage') {
        throw new Error(ErrorMessages.USER_REJECTED_REQUEST);
      }
      throw new Error(ErrorMessages.USER_REJECTED_REQUEST);
    }

    // Wrong app opened
    if (errorMessage.includes('0x6e00') || errorMessage.includes('UNKNOWN_ERROR')) {
      throw new Error(ErrorMessages.WRONG_APP);
    }

    // Device disconnected
    if (errorMessage.includes('Device is not connected') || errorMessage.includes('Device disconnected')) {
      throw new Error(ErrorMessages.DEVICE_DISCONNECTED);
    }

    // Device locked
    if (errorMessage.includes('Device is locked')) {
      throw new Error(ErrorMessages.DEVICE_LOCKED);
    }

    // Invalid data
    if (errorMessage.includes('0x6a80') || errorMessage.includes('Invalid data')) {
      throw new Error(ErrorMessages.INVALID_TRANSACTION);
    }

    // Default error
    throw error;
  }

  // ============ Solana Methods ============

  /**
   * Get Solana address from Ledger with proper synchronization
   * @param path - BIP32 derivation path (e.g., "44'/501'/0'/0'")
   * @param display - Whether to display address on device
   * @returns Promise<SolanaAddress>
   */
  public async getSolanaAddress(
    path: string,
    display: boolean = false
  ): Promise<SolanaAddress> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.solanaApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.SOLANA_APP_NOT_CONNECTED);
      }

      try {
        // Validate derivation path
        this.validateSolanaDerivationPath(path);
        
        const result = await this.solanaApp.getAddress(path, display);
        this.currentApp = 'solana';
        
        return {
          address: result.address,
          derivationPath: path,
          publicKey: result.publicKey,
        };
      } catch (error: unknown) {
        return this.handleSolanaError(error, 'getSolanaAddress');
      }
    });
  }

  /**
   * Sign Solana transaction with proper synchronization
   * @param path - BIP32 derivation path
   * @param transactionBuffer - Serialized transaction buffer
   * @returns Promise<SolanaTransactionSignature>
   */
  public async signSolanaTransaction(
    path: string,
    transactionBuffer: Buffer
  ): Promise<SolanaTransactionSignature> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.solanaApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.SOLANA_APP_NOT_CONNECTED);
      }

      try {
        // Validate derivation path
        this.validateSolanaDerivationPath(path);
        
        // Validate transaction size (Ledger limit: 1232 bytes)
        if (transactionBuffer.length > 1232) {
          throw new Error('Transaction too large for Ledger signing (max 1232 bytes)');
        }
        
        const result = await this.solanaApp.signTransaction(path, transactionBuffer);
        this.currentApp = 'solana';
        
        return {
          signature: result.signature,
        };
      } catch (error: unknown) {
        return this.handleSolanaError(error, 'signSolanaTransaction');
      }
    });
  }

  /**
   * Sign Solana off-chain message with proper synchronization
   * @param path - BIP32 derivation path
   * @param messageBuffer - Message buffer to sign
   * @returns Promise<SolanaMessageSignature>
   */
  public async signSolanaMessage(
    path: string,
    messageBuffer: Buffer
  ): Promise<SolanaMessageSignature> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.solanaApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.SOLANA_APP_NOT_CONNECTED);
      }

      try {
        // Validate derivation path
        this.validateSolanaDerivationPath(path);
        
        const result = await this.solanaApp.signOffchainMessage(path, messageBuffer);
        this.currentApp = 'solana';
        
        return {
          signature: result.signature,
        };
      } catch (error: unknown) {
        return this.handleSolanaError(error, 'signSolanaMessage');
      }
    });
  }

  /**
   * Get Solana app configuration with proper synchronization
   * @returns Promise<SolanaAppConfiguration>
   */
  public async getSolanaAppConfiguration(): Promise<SolanaAppConfiguration> {
    return this.operationMutex.runExclusive(async () => {
      if (!this.connected || !this.solanaApp || this.connectionState !== 'connected') {
        throw new Error(ErrorMessages.SOLANA_APP_NOT_CONNECTED);
      }

      try {
        const result = await this.solanaApp.getAppConfiguration();
        this.currentApp = 'solana';
        
        return {
          version: result.version,
          blindSigningEnabled: result.blindSigningEnabled || false,
        };
      } catch (error: unknown) {
        return this.handleSolanaError(error, 'getSolanaAppConfiguration');
      }
    });
  }

  /**
   * Validate Solana derivation path
   * @param path - Derivation path to validate
   */
  private validateSolanaDerivationPath(path: string): void {
    // Solana uses BIP44 with coin type 501
    // Standard format: m/44'/501'/account'/change'
    const pathRegex = /^44'\/501'\/\d+'\/\d+'?$/;
    
    if (!pathRegex.test(path)) {
      throw new Error(ErrorMessages.INVALID_DERIVATION_PATH);
    }
  }

  /**
   * Handle Solana-specific errors
   * @param error - The error object
   * @param operation - The operation that failed
   */
  private handleSolanaError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // User rejection errors
    if (errorMessage.includes('0x6985') || errorMessage.includes('denied by the user')) {
      if (operation === 'signSolanaTransaction') {
        throw new Error(ErrorMessages.USER_REJECTED_TRANSACTION);
      }
      if (operation === 'signSolanaMessage') {
        throw new Error(ErrorMessages.USER_REJECTED_REQUEST);
      }
      throw new Error(ErrorMessages.USER_REJECTED_REQUEST);
    }

    // Wrong app opened (Solana app not open)
    if (errorMessage.includes('0x6e00') || errorMessage.includes('UNKNOWN_ERROR')) {
      throw new Error(ErrorMessages.WRONG_SOLANA_APP);
    }

    // Device disconnected
    if (errorMessage.includes('Device is not connected') || errorMessage.includes('Device disconnected')) {
      throw new Error(ErrorMessages.DEVICE_DISCONNECTED);
    }

    // Device locked
    if (errorMessage.includes('Device is locked')) {
      throw new Error(ErrorMessages.DEVICE_LOCKED);
    }

    // Invalid transaction data
    if (errorMessage.includes('0x6a80') || errorMessage.includes('Invalid data')) {
      throw new Error('Invalid Solana transaction format');
    }

    // Transaction too large
    if (errorMessage.includes('too large') || errorMessage.includes('size')) {
      throw new Error('Transaction too large for Ledger device');
    }

    // Blind signing required
    if (errorMessage.includes('blind') || errorMessage.includes('signing')) {
      throw new Error('Complex transaction requires blind signing to be enabled in Solana app');
    }

    // Default error
    throw error;
  }

  /**
   * Test Solana app connectivity
   * @returns Promise<boolean> - True if Solana app is accessible
   */
  public async testSolanaApp(): Promise<boolean> {
    if (!this.connected || !this.solanaApp) {
      return false;
    }

    try {
      // Try to get app configuration as a connectivity test
      await this.solanaApp.getAppConfiguration();
      this.currentApp = 'solana';
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test Ethereum app connectivity  
   * @returns Promise<boolean> - True if Ethereum app is accessible
   */
  public async testEthereumApp(): Promise<boolean> {
    if (!this.connected || !this.ethApp) {
      return false;
    }

    try {
      // Try to get app configuration as a connectivity test
      await this.ethApp.getAppConfiguration();
      this.currentApp = 'ethereum';
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get currently active app
   * @returns 'ethereum' | 'solana' | null
   */
  public getCurrentApp(): 'ethereum' | 'solana' | null {
    return this.currentApp;
  }

  /**
   * Update disconnect method to clean up Solana app
   */
  public async disconnect(): Promise<void> {
    return this.connectionMutex.runExclusive(async () => {
      // Mark as disconnecting to prevent new operations
      this.connectionState = 'disconnected';
      
      if (!this.connected || !this.transport) {
        this.connected = false;
        this.transport = null;
        this.ethApp = null;
        this.solanaApp = null;
        this.currentApp = null;
        return;
      }

      try {
        await this.transport.close();
      } catch {
        // Gracefully handle disconnect errors - silently fail as device may already be disconnected
        // In production, this could be logged to a proper logging service
      } finally {
        this.transport = null;
        this.ethApp = null;
        this.solanaApp = null;
        this.currentApp = null;
        this.connected = false;
      }
    });
  }
}