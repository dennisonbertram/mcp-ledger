/**
 * Ledger Hardware Wallet Integration Service
 * Provides secure interaction with Ledger devices for Ethereum operations
 * FIXED: Race conditions with proper synchronization using mutex
 */

import TransportNodeHidModule from '@ledgerhq/hw-transport-node-hid';
import type Transport from '@ledgerhq/hw-transport';
import EthModule from '@ledgerhq/hw-app-eth';
import type { LedgerEthTransactionResolution } from '@ledgerhq/hw-app-eth/lib/services/types';

const TransportNodeHid = (TransportNodeHidModule as any).default;
const Eth = (EthModule as any).default;
import { Mutex } from 'async-mutex';

/**
 * Error messages for better debugging
 */
const ErrorMessages = {
  DEVICE_NOT_CONNECTED: 'Ledger device not connected',
  NOT_CONNECTED: 'Ledger not connected',
  WRONG_APP: 'Wrong app opened on Ledger. Please open Ethereum app',
  USER_REJECTED_REQUEST: 'User rejected the request',
  USER_REJECTED_TRANSACTION: 'User rejected the transaction',
  DEVICE_DISCONNECTED: 'Ledger device disconnected',
  DEVICE_LOCKED: 'Ledger device is locked',
  CONNECTION_TIMEOUT: 'Connection timeout',
  INVALID_TRANSACTION: 'Invalid transaction format',
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
 * LedgerService class for managing Ledger hardware wallet interactions
 * FIXED: Added mutex for thread-safe operations and connection state management
 */
export class LedgerService {
  private transport: Transport | null = null;
  private ethApp: any | null = null;
  private connected: boolean = false;
  
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
      this.connected = true;
      this.connectionState = 'connected';
      
      return true;
    } catch (error: unknown) {
      this.connected = false;
      this.connectionState = 'disconnected';
      this.transport = null;
      this.ethApp = null;

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
}