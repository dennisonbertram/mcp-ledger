/**
 * Ledger Hardware Wallet Integration Service
 * Provides secure interaction with Ledger devices for Ethereum operations
 */

import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import type Transport from '@ledgerhq/hw-transport';
import Eth from '@ledgerhq/hw-app-eth';
import type { LedgerEthTransactionResolution } from '@ledgerhq/hw-app-eth/lib/services/types';

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
 */
export class LedgerService {
  private transport: Transport | null = null;
  private ethApp: Eth | null = null;
  private connected: boolean = false;

  constructor() {
    // Initialize with disconnected state
    this.connected = false;
  }

  /**
   * Check if Ledger is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Connect to Ledger device
   * @param timeout - Connection timeout in milliseconds (default: 5000)
   * @returns Promise<boolean> - True if connection successful
   */
  public async connectToLedger(timeout: number = 5000): Promise<boolean> {
    // Don't create multiple connections
    if (this.connected && this.transport) {
      return true;
    }

    try {
      // Create connection with timeout
      const connectionPromise = TransportNodeHid.create();
      const timeoutPromise = new Promise<never>((_, reject) => {
        globalThis.setTimeout(() => reject(new Error(ErrorMessages.CONNECTION_TIMEOUT)), timeout);
      });

      this.transport = await Promise.race([connectionPromise, timeoutPromise]);
      this.ethApp = new Eth(this.transport);
      this.connected = true;
      
      return true;
    } catch (error: unknown) {
      this.connected = false;
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
   * Get Ethereum address from Ledger
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
    if (!this.connected || !this.ethApp) {
      throw new Error(ErrorMessages.NOT_CONNECTED);
    }

    try {
      const result = await this.ethApp.getAddress(path, display, chainCode);
      return result;
    } catch (error: unknown) {
      return this.handleError(error, 'getAddress');
    }
  }

  /**
   * Sign a transaction using Ledger
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
    if (!this.connected || !this.ethApp) {
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
  }

  /**
   * Get Ledger app configuration
   * @returns Promise<AppConfiguration>
   */
  public async getAppConfiguration(): Promise<AppConfiguration> {
    if (!this.connected || !this.ethApp) {
      throw new Error(ErrorMessages.NOT_CONNECTED);
    }

    try {
      const result = await this.ethApp.getAppConfiguration();
      return result;
    } catch (error: unknown) {
      return this.handleError(error, 'getAppConfiguration');
    }
  }

  /**
   * Disconnect from Ledger device
   */
  public async disconnect(): Promise<void> {
    if (!this.connected || !this.transport) {
      this.connected = false;
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
      throw new Error(ErrorMessages.USER_REJECTED_REQUEST);
    }

    // Wrong app opened
    if (errorMessage.includes('0x6e00') || errorMessage.includes('UNKNOWN_ERROR')) {
      throw new Error(ErrorMessages.WRONG_APP);
    }

    // Device disconnected
    if (errorMessage.includes('Device is not connected')) {
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