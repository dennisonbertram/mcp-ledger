/**
 * Solana Transaction Crafter
 * Builds and crafts Solana transactions with multiple instructions for Ledger signing
 */

import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  AddressLookupTableProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createApproveInstruction,
  createRevokeInstruction,
} from '@solana/spl-token';

import { SolanaBlockchainService } from './solana-blockchain.js';
import { LedgerService } from './ledger.js';
import type {
  SolanaNetwork,
  SolanaFeeEstimate,
  SolanaError,
  SolanaErrorCode,
  SolanaInstruction,
} from '../types/blockchain.js';

/**
 * Configuration for Solana transaction crafter
 */
export interface SolanaTransactionCrafterConfig {
  defaultNetwork?: SolanaNetwork;
  maxTransactionSize?: number;      // Max transaction size for Ledger (default: 1232)
  defaultComputeUnits?: number;     // Default compute units limit
  defaultPriorityFee?: number;      // Default priority fee in microlamports
  validateBeforeSigning?: boolean;   // Validate transactions before signing
  securityChecks?: boolean;         // Enable additional security checks
}

/**
 * Parameters for crafting SOL transfer transaction
 */
export interface CraftSolTransferParams {
  fromAddress: string;
  toAddress: string;
  amount: bigint;                   // Amount in lamports
  network?: SolanaNetwork;
  priorityFee?: number;            // Priority fee in microlamports
  computeUnits?: number;           // Compute units limit
  memo?: string;                   // Optional memo
}

/**
 * Parameters for crafting SPL token transfer transaction  
 */
export interface CraftSplTokenTransferParams {
  fromAddress: string;
  toAddress: string;
  mintAddress: string;
  amount: bigint;                  // Amount in token's base units
  decimals: number;                // Token decimals for validation
  network?: SolanaNetwork;
  priorityFee?: number;           // Priority fee in microlamports
  computeUnits?: number;          // Compute units limit
  createRecipientAccount?: boolean; // Create recipient ATA if needed
  memo?: string;                  // Optional memo
}

/**
 * Parameters for complex transaction building
 */
export interface CraftComplexTransactionParams {
  instructions: SolanaInstruction[];
  network?: SolanaNetwork;
  priorityFee?: number;
  computeUnits?: number;
  memo?: string;
}

/**
 * Transaction validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSize: number;
  estimatedComputeUnits?: number;
}

/**
 * SolanaTransactionCrafter class for building Solana transactions
 */
export class SolanaTransactionCrafter {
  private config: Required<SolanaTransactionCrafterConfig>;

  constructor(
    private blockchainService: SolanaBlockchainService,
    private ledgerService: LedgerService,
    config: SolanaTransactionCrafterConfig = {}
  ) {
    this.config = {
      defaultNetwork: config.defaultNetwork || 'solana-mainnet',
      maxTransactionSize: config.maxTransactionSize || 1232, // Ledger limit
      defaultComputeUnits: config.defaultComputeUnits || 200000,
      defaultPriorityFee: config.defaultPriorityFee || 0,
      validateBeforeSigning: config.validateBeforeSigning !== false,
      securityChecks: config.securityChecks !== false,
    };
  }

  /**
   * Craft SOL transfer transaction
   */
  async craftSolTransfer(params: CraftSolTransferParams): Promise<Transaction> {
    try {
      const network = params.network || this.config.defaultNetwork;
      
      // Validate addresses
      const fromPubkey = this.validateAndCreatePublicKey(params.fromAddress);
      const toPubkey = this.validateAndCreatePublicKey(params.toAddress);
      
      // Validate amount
      if (params.amount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }

      // Check sender balance
      const balance = await this.blockchainService.getBalance(params.fromAddress, network);
      const minRent = await this.blockchainService.getMinimumBalanceForRentExemption(0, network);
      
      if (balance.lamports < params.amount + BigInt(minRent) + BigInt(5000)) { // 5000 lamports for fees
        throw new Error('Insufficient SOL balance for transfer and fees');
      }

      // Create transaction
      const transaction = new Transaction();

      // Add priority fee instruction if specified
      if (params.priorityFee && params.priorityFee > 0) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: params.priorityFee,
          })
        );
      }

      // Add compute units limit if specified
      if (params.computeUnits && params.computeUnits !== this.config.defaultComputeUnits) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: params.computeUnits,
          })
        );
      }

      // Add SOL transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: Number(params.amount), // SystemProgram expects number
        })
      );

      // Add memo if provided
      if (params.memo) {
        transaction.add(this.createMemoInstruction(params.memo));
      }

      // Set transaction properties
      const recentBlockhash = await this.blockchainService.getRecentBlockhash(network);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = fromPubkey;

      // Validate transaction if enabled
      if (this.config.validateBeforeSigning) {
        const validation = await this.validateTransaction(transaction);
        if (!validation.isValid) {
          throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return transaction;
    } catch (error) {
      throw this.handleError(error, 'craftSolTransfer');
    }
  }

  /**
   * Craft SPL token transfer transaction
   */
  async craftSplTokenTransfer(params: CraftSplTokenTransferParams): Promise<Transaction> {
    try {
      const network = params.network || this.config.defaultNetwork;
      
      // Validate addresses
      const fromPubkey = this.validateAndCreatePublicKey(params.fromAddress);
      const toPubkey = this.validateAndCreatePublicKey(params.toAddress);
      const mintPubkey = this.validateAndCreatePublicKey(params.mintAddress);
      
      // Validate amount
      if (params.amount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }

      // Get associated token accounts
      const fromATA = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
      const toATA = await getAssociatedTokenAddress(mintPubkey, toPubkey);

      // Check if recipient ATA exists
      const toATAInfo = await this.blockchainService.getAccountInfo(toATA.toBase58(), network);
      const needsRecipientATA = !toATAInfo;

      // Check sender token balance
      const senderTokens = await this.blockchainService.getTokenBalances(params.fromAddress, network);
      const senderTokenBalance = senderTokens.find(t => t.mint === params.mintAddress);
      
      if (!senderTokenBalance || senderTokenBalance.amount < params.amount) {
        throw new Error('Insufficient token balance for transfer');
      }

      // Check SOL balance for fees and rent
      const solBalance = await this.blockchainService.getBalance(params.fromAddress, network);
      let minSolNeeded = BigInt(5000); // Base transaction fee
      
      if (needsRecipientATA && params.createRecipientAccount) {
        const ataRent = await this.blockchainService.getMinimumBalanceForRentExemption(165, network); // ATA size
        minSolNeeded += BigInt(ataRent);
      }

      if (solBalance.lamports < minSolNeeded) {
        throw new Error('Insufficient SOL balance for transaction fees');
      }

      // Create transaction
      const transaction = new Transaction();

      // Add priority fee instruction if specified
      if (params.priorityFee && params.priorityFee > 0) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: params.priorityFee,
          })
        );
      }

      // Add compute units limit if specified
      if (params.computeUnits && params.computeUnits !== this.config.defaultComputeUnits) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: params.computeUnits,
          })
        );
      }

      // Create recipient ATA if needed and requested
      if (needsRecipientATA) {
        if (params.createRecipientAccount) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              fromPubkey,    // payer
              toATA,         // associatedToken
              toPubkey,      // owner
              mintPubkey     // mint
            )
          );
        } else {
          throw new Error('Recipient token account does not exist. Set createRecipientAccount to true.');
        }
      }

      // Add token transfer instruction
      transaction.add(
        createTransferInstruction(
          fromATA,           // source
          toATA,             // destination
          fromPubkey,        // owner
          Number(params.amount) // amount - SPL expects number
        )
      );

      // Add memo if provided
      if (params.memo) {
        transaction.add(this.createMemoInstruction(params.memo));
      }

      // Set transaction properties
      const recentBlockhash = await this.blockchainService.getRecentBlockhash(network);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = fromPubkey;

      // Validate transaction if enabled
      if (this.config.validateBeforeSigning) {
        const validation = await this.validateTransaction(transaction);
        if (!validation.isValid) {
          throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return transaction;
    } catch (error) {
      throw this.handleError(error, 'craftSplTokenTransfer');
    }
  }

  /**
   * Craft token approval transaction
   */
  async craftTokenApproval(
    ownerAddress: string,
    mintAddress: string,
    spenderAddress: string,
    amount: bigint,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<Transaction> {
    try {
      const ownerPubkey = this.validateAndCreatePublicKey(ownerAddress);
      const mintPubkey = this.validateAndCreatePublicKey(mintAddress);
      const spenderPubkey = this.validateAndCreatePublicKey(spenderAddress);

      // Get owner's token account
      const ownerATA = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);

      // Create transaction
      const transaction = new Transaction();

      // Add approval instruction
      transaction.add(
        createApproveInstruction(
          ownerATA,          // account
          spenderPubkey,     // delegate
          ownerPubkey,       // owner
          Number(amount)     // amount
        )
      );

      // Set transaction properties
      const recentBlockhash = await this.blockchainService.getRecentBlockhash(network);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = ownerPubkey;

      return transaction;
    } catch (error) {
      throw this.handleError(error, 'craftTokenApproval');
    }
  }

  /**
   * Craft token approval revocation transaction
   */
  async craftTokenApprovalRevoke(
    ownerAddress: string,
    mintAddress: string,
    network: SolanaNetwork = this.config.defaultNetwork
  ): Promise<Transaction> {
    try {
      const ownerPubkey = this.validateAndCreatePublicKey(ownerAddress);
      const mintPubkey = this.validateAndCreatePublicKey(mintAddress);

      // Get owner's token account
      const ownerATA = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);

      // Create transaction
      const transaction = new Transaction();

      // Add revoke instruction
      transaction.add(
        createRevokeInstruction(
          ownerATA,          // account
          ownerPubkey        // owner
        )
      );

      // Set transaction properties
      const recentBlockhash = await this.blockchainService.getRecentBlockhash(network);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = ownerPubkey;

      return transaction;
    } catch (error) {
      throw this.handleError(error, 'craftTokenApprovalRevoke');
    }
  }

  /**
   * Craft complex transaction with multiple instructions
   */
  async craftComplexTransaction(params: CraftComplexTransactionParams): Promise<Transaction> {
    try {
      const network = params.network || this.config.defaultNetwork;
      
      // Create transaction
      const transaction = new Transaction();

      // Add priority fee instruction if specified
      if (params.priorityFee && params.priorityFee > 0) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: params.priorityFee,
          })
        );
      }

      // Add compute units limit if specified
      if (params.computeUnits && params.computeUnits !== this.config.defaultComputeUnits) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: params.computeUnits,
          })
        );
      }

      // Convert and add custom instructions
      for (const instruction of params.instructions) {
        const txInstruction = new TransactionInstruction({
          keys: instruction.accounts.map(acc => ({
            pubkey: this.validateAndCreatePublicKey(acc.pubkey),
            isSigner: acc.isSigner,
            isWritable: acc.isWritable,
          })),
          programId: this.validateAndCreatePublicKey(instruction.programId),
          data: instruction.data,
        });
        
        transaction.add(txInstruction);
      }

      // Add memo if provided
      if (params.memo) {
        transaction.add(this.createMemoInstruction(params.memo));
      }

      // Set recent blockhash (fee payer should be set by caller)
      const recentBlockhash = await this.blockchainService.getRecentBlockhash(network);
      transaction.recentBlockhash = recentBlockhash;

      // Validate transaction if enabled
      if (this.config.validateBeforeSigning) {
        const validation = await this.validateTransaction(transaction);
        if (!validation.isValid) {
          throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return transaction;
    } catch (error) {
      throw this.handleError(error, 'craftComplexTransaction');
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
      return await this.blockchainService.estimateTransactionFees(transaction, network);
    } catch (error) {
      throw this.handleError(error, 'estimateTransactionFees');
    }
  }

  /**
   * Optimize transaction for size and performance
   */
  async optimizeTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      // Create a copy of the transaction
      const optimized = Transaction.from(transaction.serialize({ requireAllSignatures: false }));

      // Remove duplicate instructions (keeping the last occurrence)
      const uniqueInstructions = new Map<string, TransactionInstruction>();
      
      for (const instruction of optimized.instructions) {
        const key = `${instruction.programId.toBase58()}-${Buffer.from(instruction.data).toString('hex')}`;
        uniqueInstructions.set(key, instruction);
      }

      // Rebuild transaction with unique instructions
      const newTransaction = new Transaction();
      newTransaction.recentBlockhash = optimized.recentBlockhash;
      newTransaction.feePayer = optimized.feePayer;
      
      for (const instruction of uniqueInstructions.values()) {
        newTransaction.add(instruction);
      }

      return newTransaction;
    } catch (error) {
      throw this.handleError(error, 'optimizeTransaction');
    }
  }

  /**
   * Validate transaction before signing
   */
  async validateTransaction(transaction: Transaction): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if transaction has instructions
      if (transaction.instructions.length === 0) {
        errors.push('Transaction has no instructions');
      }

      // Check transaction size
      const serialized = transaction.serialize({ requireAllSignatures: false });
      const estimatedSize = serialized.length;
      
      if (estimatedSize > this.config.maxTransactionSize) {
        errors.push(`Transaction too large: ${estimatedSize} bytes (max: ${this.config.maxTransactionSize})`);
      } else if (estimatedSize > this.config.maxTransactionSize * 0.9) {
        warnings.push(`Transaction approaching size limit: ${estimatedSize} bytes`);
      }

      // Check recent blockhash
      if (!transaction.recentBlockhash) {
        errors.push('Transaction missing recent blockhash');
      }

      // Check fee payer
      if (!transaction.feePayer) {
        errors.push('Transaction missing fee payer');
      }

      // Validate all public keys
      const allPubkeys = new Set<string>();
      
      for (const instruction of transaction.instructions) {
        allPubkeys.add(instruction.programId.toBase58());
        
        for (const key of instruction.keys) {
          allPubkeys.add(key.pubkey.toBase58());
          
          // Validate public key is on curve
          if (!PublicKey.isOnCurve(key.pubkey.toBytes())) {
            errors.push(`Invalid public key: ${key.pubkey.toBase58()}`);
          }
        }
      }

      // Check for duplicate accounts that could cause issues
      const signers = transaction.instructions
        .flatMap(ix => ix.keys.filter(k => k.isSigner))
        .map(k => k.pubkey.toBase58());
      
      const uniqueSigners = new Set(signers);
      if (signers.length > uniqueSigners.size) {
        warnings.push('Transaction has duplicate signers');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        estimatedSize,
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        isValid: false,
        errors,
        warnings,
        estimatedSize: 0,
      };
    }
  }

  /**
   * Create memo instruction
   */
  private createMemoInstruction(memo: string): TransactionInstruction {
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    
    return new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf8'),
    });
  }

  /**
   * Validate address and create PublicKey
   */
  private validateAndCreatePublicKey(address: string): PublicKey {
    try {
      const publicKey = new PublicKey(address);
      if (!PublicKey.isOnCurve(publicKey.toBytes())) {
        throw new Error('Invalid public key - not on curve');
      }
      return publicKey;
    } catch (error) {
      throw new Error(`Invalid Solana address: ${address}`);
    }
  }

  /**
   * Handle errors and provide context
   */
  private handleError(error: unknown, operation: string): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Error(`${operation} failed: ${errorMessage}`);
  }

  /**
   * Get configuration
   */
  getConfig(): Required<SolanaTransactionCrafterConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SolanaTransactionCrafterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}