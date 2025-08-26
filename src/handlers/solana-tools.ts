/**
 * Solana Tool Handlers for MCP Server
 * Handles all Solana-specific operations including address derivation, balance queries, and transactions
 */

import { LedgerService } from '../services/ledger.js';
import { SolanaBlockchainService } from '../services/solana-blockchain.js';
import { SolanaTransactionCrafter } from '../services/solana-transaction-crafter.js';
import { Transaction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import type {
  SolanaNetwork,
  SolanaAddress,
  SolanaBalance,
  SPLTokenBalance,
  SolanaFeeEstimate,
  SolanaError,
  SolanaErrorCode,
} from '../types/blockchain.js';

// ========== Parameter Interfaces ==========

export interface GetSolanaAddressParams {
  derivationPath?: string;
  display?: boolean;
  network?: SolanaNetwork;
}

export interface GetSolanaBalanceParams {
  address: string;
  network?: SolanaNetwork;
}

export interface GetSplTokenBalancesParams {
  address: string;
  mintAddresses?: string[];
  network?: SolanaNetwork;
}

export interface CraftSolanaTransactionParams {
  type: 'sol_transfer' | 'spl_token_transfer' | 'token_approval' | 'custom';
  network?: SolanaNetwork;
  // SOL transfer params
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  // SPL token params
  mintAddress?: string;
  decimals?: number;
  createRecipientAccount?: boolean;
  // Token approval params
  spenderAddress?: string;
  // Custom transaction params
  instructions?: Array<{
    programId: string;
    accounts: Array<{
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }>;
    data: string; // hex encoded
  }>;
  // Common params
  priorityFee?: number;
  computeUnits?: number;
  memo?: string;
}

export interface SignSolanaTransactionParams {
  transactionData: string; // Base64 encoded transaction
  derivationPath?: string;
  network?: SolanaNetwork;
}

export interface SendSolParams {
  toAddress: string;
  amount: string;
  network?: SolanaNetwork;
  derivationPath?: string;
  priorityFee?: number;
  memo?: string;
}

export interface SendSplTokenParams {
  toAddress: string;
  mintAddress: string;
  amount: string;
  network?: SolanaNetwork;
  derivationPath?: string;
  createRecipientAccount?: boolean;
  memo?: string;
}

export interface AnalyzeSolanaFeesParams {
  network?: SolanaNetwork;
  transactionType?: 'sol_transfer' | 'spl_token_transfer' | 'complex';
  priorityLevel?: 'low' | 'medium' | 'high';
}

// ========== Result Interfaces ==========

export interface SolanaAddressResult {
  success: boolean;
  address?: string;
  publicKey?: string;
  derivationPath?: string;
  network?: SolanaNetwork;
  error?: string;
}

export interface SolanaBalanceResult {
  success: boolean;
  balance?: {
    lamports: string;
    sol: string;
    usd?: string;
  };
  address?: string;
  network?: SolanaNetwork;
  error?: string;
}

export interface SplTokenBalancesResult {
  success: boolean;
  balances?: Array<{
    mint: string;
    amount: string;
    decimals: number;
    uiAmount: string;
    symbol?: string;
    name?: string;
    tokenAccount?: string;
  }>;
  totalTokens?: number;
  address?: string;
  network?: SolanaNetwork;
  error?: string;
}

export interface CraftedTransactionResult {
  success: boolean;
  transaction?: {
    serialized: string; // Base64 encoded
    size: number;
    estimatedFee: number;
    instructions: number;
  };
  type?: string;
  network?: SolanaNetwork;
  error?: string;
}

export interface SignedTransactionResult {
  success: boolean;
  signedTransaction?: string; // Base64 encoded
  signature?: string;
  transactionId?: string;
  network?: SolanaNetwork;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  transactionId?: string;
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
  cost?: {
    totalFee: number;
    lamports: number;
  };
  network?: SolanaNetwork;
  explorerUrl?: string;
  error?: string;
}

export interface FeeAnalysisResult {
  success: boolean;
  analysis?: {
    currentBaseFee: number;
    priorityFeeRecommendations: {
      low: number;
      medium: number;
      high: number;
    };
    estimatedCosts: {
      baseCost: number;
      lowPriority: number;
      mediumPriority: number;
      highPriority: number;
    };
    networkCongestion: 'low' | 'medium' | 'high';
  };
  network?: SolanaNetwork;
  error?: string;
}

/**
 * SolanaToolHandlers class for managing all Solana MCP tools
 */
export class SolanaToolHandlers {
  private defaultDerivationPath = "44'/501'/0'/0'";
  private defaultNetwork: SolanaNetwork = 'solana-mainnet';

  constructor(
    private ledgerService: LedgerService,
    private blockchainService: SolanaBlockchainService,
    private transactionCrafter: SolanaTransactionCrafter
  ) {}

  /**
   * Get Solana address from Ledger device
   */
  async getSolanaAddress(params: GetSolanaAddressParams): Promise<SolanaAddressResult> {
    try {
      const derivationPath = params.derivationPath || this.defaultDerivationPath;
      const display = params.display || false;
      const network = params.network || this.defaultNetwork;

      const addressInfo = await this.ledgerService.getSolanaAddress(derivationPath, display);

      return {
        success: true,
        address: addressInfo.address,
        publicKey: addressInfo.publicKey,
        derivationPath: addressInfo.derivationPath,
        network,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'getSolanaAddress'),
      };
    }
  }

  /**
   * Get SOL balance for an address
   */
  async getSolanaBalance(params: GetSolanaBalanceParams): Promise<SolanaBalanceResult> {
    try {
      const network = params.network || this.defaultNetwork;
      
      if (!this.validateSolanaAddress(params.address)) {
        throw new Error('Invalid Solana address');
      }

      const balance = await this.blockchainService.getBalance(params.address, network);

      return {
        success: true,
        balance: {
          lamports: balance.lamports.toString(),
          sol: balance.sol,
        },
        address: params.address,
        network,
      };
    } catch (error) {
      return {
        success: false,
        address: params.address,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'getSolanaBalance'),
      };
    }
  }

  /**
   * Get SPL token balances for an address
   */
  async getSplTokenBalances(params: GetSplTokenBalancesParams): Promise<SplTokenBalancesResult> {
    try {
      const network = params.network || this.defaultNetwork;
      
      if (!this.validateSolanaAddress(params.address)) {
        throw new Error('Invalid Solana address');
      }

      const tokenBalances = await this.blockchainService.getTokenBalances(params.address, network);

      // Filter by specific mints if provided
      let filteredBalances = tokenBalances;
      if (params.mintAddresses && params.mintAddresses.length > 0) {
        filteredBalances = tokenBalances.filter(balance => 
          params.mintAddresses!.includes(balance.mint)
        );
      }

      const balances = filteredBalances.map(balance => ({
        mint: balance.mint,
        amount: balance.amount.toString(),
        decimals: balance.decimals,
        uiAmount: balance.uiAmount,
        ...(balance.tokenInfo?.symbol && { symbol: balance.tokenInfo.symbol }),
        ...(balance.tokenInfo?.name && { name: balance.tokenInfo.name }),
        ...(balance.tokenAccount && { tokenAccount: balance.tokenAccount }),
      }));

      return {
        success: true,
        balances,
        totalTokens: balances.length,
        address: params.address,
        network,
      };
    } catch (error) {
      return {
        success: false,
        address: params.address,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'getSplTokenBalances'),
      };
    }
  }

  /**
   * Craft Solana transaction
   */
  async craftSolanaTransaction(params: CraftSolanaTransactionParams): Promise<CraftedTransactionResult> {
    try {
      const network = params.network || this.defaultNetwork;
      let transaction: Transaction;

      switch (params.type) {
        case 'sol_transfer':
          if (!params.fromAddress || !params.toAddress || !params.amount) {
            throw new Error('Missing required parameters for SOL transfer');
          }
          
          const solTransferParams: any = {
            fromAddress: params.fromAddress,
            toAddress: params.toAddress,
            amount: this.parseAmount(params.amount, 9), // SOL has 9 decimals
            network,
          };

          if (params.priorityFee !== undefined) solTransferParams.priorityFee = params.priorityFee;
          if (params.computeUnits !== undefined) solTransferParams.computeUnits = params.computeUnits;
          if (params.memo !== undefined) solTransferParams.memo = params.memo;

          transaction = await this.transactionCrafter.craftSolTransfer(solTransferParams);
          break;

        case 'spl_token_transfer':
          if (!params.fromAddress || !params.toAddress || !params.mintAddress || !params.amount || params.decimals === undefined) {
            throw new Error('Missing required parameters for SPL token transfer');
          }
          
          const splTransferParams: any = {
            fromAddress: params.fromAddress,
            toAddress: params.toAddress,
            mintAddress: params.mintAddress,
            amount: this.parseAmount(params.amount, params.decimals),
            decimals: params.decimals,
            network,
          };

          if (params.priorityFee !== undefined) splTransferParams.priorityFee = params.priorityFee;
          if (params.computeUnits !== undefined) splTransferParams.computeUnits = params.computeUnits;
          if (params.createRecipientAccount !== undefined) splTransferParams.createRecipientAccount = params.createRecipientAccount;
          if (params.memo !== undefined) splTransferParams.memo = params.memo;

          transaction = await this.transactionCrafter.craftSplTokenTransfer(splTransferParams);
          break;

        case 'token_approval':
          if (!params.fromAddress || !params.mintAddress || !params.spenderAddress || !params.amount || params.decimals === undefined) {
            throw new Error('Missing required parameters for token approval');
          }
          
          transaction = await this.transactionCrafter.craftTokenApproval(
            params.fromAddress,
            params.mintAddress,
            params.spenderAddress,
            this.parseAmount(params.amount, params.decimals),
            network
          );
          break;

        case 'custom':
          if (!params.instructions || params.instructions.length === 0) {
            throw new Error('Missing instructions for custom transaction');
          }
          
          const instructions = params.instructions.map(inst => ({
            programId: inst.programId,
            accounts: inst.accounts,
            data: Buffer.from(inst.data, 'hex'),
          }));

          const complexTxParams: any = {
            instructions,
            network,
          };

          if (params.priorityFee !== undefined) complexTxParams.priorityFee = params.priorityFee;
          if (params.computeUnits !== undefined) complexTxParams.computeUnits = params.computeUnits;
          if (params.memo !== undefined) complexTxParams.memo = params.memo;

          transaction = await this.transactionCrafter.craftComplexTransaction(complexTxParams);
          break;

        default:
          throw new Error(`Unsupported transaction type: ${params.type}`);
      }

      // Estimate fees
      const feeEstimate = await this.transactionCrafter.estimateTransactionFees(transaction, network);
      
      // Serialize transaction
      const serialized = transaction.serialize({ requireAllSignatures: false });
      
      return {
        success: true,
        transaction: {
          serialized: Buffer.from(serialized).toString('base64'),
          size: serialized.length,
          estimatedFee: feeEstimate.totalFee,
          instructions: transaction.instructions.length,
        },
        type: params.type,
        network,
      };
    } catch (error) {
      return {
        success: false,
        type: params.type,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'craftSolanaTransaction'),
      };
    }
  }

  /**
   * Sign Solana transaction with Ledger
   */
  async signSolanaTransaction(params: SignSolanaTransactionParams): Promise<SignedTransactionResult> {
    try {
      const derivationPath = params.derivationPath || this.defaultDerivationPath;
      const network = params.network || this.defaultNetwork;
      
      // Decode transaction
      const transactionBuffer = Buffer.from(params.transactionData, 'base64');
      
      // Sign with Ledger
      const signature = await this.ledgerService.signSolanaTransaction(
        derivationPath,
        transactionBuffer
      );

      // Create signed transaction
      const transaction = Transaction.from(transactionBuffer);
      transaction.addSignature(
        await this.ledgerService.getSolanaAddress(derivationPath).then(addr => addr.publicKey),
        signature.signature
      );

      const signedSerialized = transaction.serialize();
      const transactionId = bs58.encode(signature.signature);

      return {
        success: true,
        signedTransaction: Buffer.from(signedSerialized).toString('base64'),
        signature: transactionId,
        transactionId,
        network,
      };
    } catch (error) {
      return {
        success: false,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'signSolanaTransaction'),
      };
    }
  }

  /**
   * Send SOL (convenience method)
   */
  async sendSol(params: SendSolParams): Promise<TransactionResult> {
    try {
      const network = params.network || this.defaultNetwork;
      const derivationPath = params.derivationPath || this.defaultDerivationPath;
      
      // Get sender address
      const senderInfo = await this.ledgerService.getSolanaAddress(derivationPath);
      
      // Craft transaction
      const solTransferParams: any = {
        fromAddress: senderInfo.address,
        toAddress: params.toAddress,
        amount: this.parseAmount(params.amount, 9),
        network,
      };

      if (params.priorityFee !== undefined) solTransferParams.priorityFee = params.priorityFee;
      if (params.memo !== undefined) solTransferParams.memo = params.memo;

      const transaction = await this.transactionCrafter.craftSolTransfer(solTransferParams);

      // Sign transaction
      const transactionBuffer = transaction.serialize({ requireAllSignatures: false });
      const signature = await this.ledgerService.signSolanaTransaction(
        derivationPath,
        transactionBuffer
      );

      // Add signature to transaction
      transaction.addSignature(new PublicKey(senderInfo.publicKey), signature.signature);

      // Send transaction
      const txSignature = await this.blockchainService.sendTransaction(transaction, network);
      
      // Confirm transaction
      const confirmationInfo = await this.blockchainService.confirmTransaction(txSignature, network);

      // Get network config for explorer URL
      const networkConfig = this.blockchainService.getNetworkConfig(network);
      const explorerUrl = `${networkConfig.blockExplorer}/tx/${txSignature}`;

      return {
        success: true,
        signature: txSignature,
        transactionId: txSignature,
        confirmationStatus: confirmationInfo.confirmationStatus,
        network,
        explorerUrl,
      };
    } catch (error) {
      return {
        success: false,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'sendSol'),
      };
    }
  }

  /**
   * Send SPL token (convenience method)
   */
  async sendSplToken(params: SendSplTokenParams): Promise<TransactionResult> {
    try {
      const network = params.network || this.defaultNetwork;
      const derivationPath = params.derivationPath || this.defaultDerivationPath;
      
      // Get sender address
      const senderInfo = await this.ledgerService.getSolanaAddress(derivationPath);
      
      // Get token info to determine decimals
      const tokenBalances = await this.blockchainService.getTokenBalances(senderInfo.address, network);
      const tokenBalance = tokenBalances.find(balance => balance.mint === params.mintAddress);
      
      if (!tokenBalance) {
        throw new Error('Token not found in sender wallet');
      }

      // Craft transaction
      const splTransferParams: any = {
        fromAddress: senderInfo.address,
        toAddress: params.toAddress,
        mintAddress: params.mintAddress,
        amount: this.parseAmount(params.amount, tokenBalance.decimals),
        decimals: tokenBalance.decimals,
        network,
      };

      if (params.createRecipientAccount !== undefined) splTransferParams.createRecipientAccount = params.createRecipientAccount;
      if (params.memo !== undefined) splTransferParams.memo = params.memo;

      const transaction = await this.transactionCrafter.craftSplTokenTransfer(splTransferParams);

      // Sign transaction
      const transactionBuffer = transaction.serialize({ requireAllSignatures: false });
      const signature = await this.ledgerService.signSolanaTransaction(
        derivationPath,
        transactionBuffer
      );

      // Add signature to transaction
      transaction.addSignature(new PublicKey(senderInfo.publicKey), signature.signature);

      // Send transaction
      const txSignature = await this.blockchainService.sendTransaction(transaction, network);
      
      // Confirm transaction
      const confirmationInfo = await this.blockchainService.confirmTransaction(txSignature, network);

      // Get network config for explorer URL
      const networkConfig = this.blockchainService.getNetworkConfig(network);
      const explorerUrl = `${networkConfig.blockExplorer}/tx/${txSignature}`;

      return {
        success: true,
        signature: txSignature,
        transactionId: txSignature,
        confirmationStatus: confirmationInfo.confirmationStatus,
        network,
        explorerUrl,
      };
    } catch (error) {
      return {
        success: false,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'sendSplToken'),
      };
    }
  }

  /**
   * Analyze Solana fees and network conditions
   */
  async analyzeSolanaFees(params: AnalyzeSolanaFeesParams): Promise<FeeAnalysisResult> {
    try {
      const network = params.network || this.defaultNetwork;
      
      // Base transaction fee is fixed at 5000 lamports
      const baseFee = 5000;
      
      // Priority fee recommendations based on network conditions
      // These would ideally come from real network data
      const priorityFeeRecommendations = {
        low: 0,      // No priority fee
        medium: 10000, // 0.00001 SOL
        high: 50000,   // 0.00005 SOL
      };

      const estimatedCosts = {
        baseCost: baseFee,
        lowPriority: baseFee + priorityFeeRecommendations.low,
        mediumPriority: baseFee + priorityFeeRecommendations.medium,
        highPriority: baseFee + priorityFeeRecommendations.high,
      };

      // Network congestion would be determined by analyzing recent slots
      // For now, we'll use a simple heuristic
      const networkCongestion: 'low' | 'medium' | 'high' = 'medium';

      return {
        success: true,
        analysis: {
          currentBaseFee: baseFee,
          priorityFeeRecommendations,
          estimatedCosts,
          networkCongestion,
        },
        network,
      };
    } catch (error) {
      return {
        success: false,
        network: params.network || this.defaultNetwork,
        error: this.handleError(error, 'analyzeSolanaFees'),
      };
    }
  }

  /**
   * Validate Solana address format
   */
  private validateSolanaAddress(address: string): boolean {
    try {
      // Solana addresses are base58 encoded and 32 bytes long
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Parse amount string to bigint with proper decimal handling
   */
  private parseAmount(amount: string, decimals: number): bigint {
    try {
      const num = parseFloat(amount);
      if (isNaN(num) || num < 0) {
        throw new Error('Invalid amount');
      }
      
      // Convert to base units
      const multiplier = Math.pow(10, decimals);
      const baseAmount = Math.floor(num * multiplier);
      
      return BigInt(baseAmount);
    } catch (error) {
      throw new Error(`Invalid amount format: ${amount}`);
    }
  }

  /**
   * Handle errors with context
   */
  private handleError(error: unknown, operation: string): string {
    if (error instanceof Error) {
      return `${operation} failed: ${error.message}`;
    }
    return `${operation} failed: ${String(error)}`;
  }
}