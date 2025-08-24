/**
 * Bitcoin Transaction Crafter Service
 * Creates and manages Bitcoin transactions using PSBT format
 */

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import type {
  BitcoinNetwork,
  BitcoinTransactionData,
  BitcoinTransactionOutput,
  BitcoinFeeEstimate,
  UTXO,
  BitcoinAddressType,
} from '../types/blockchain.js';
import {
  BlockchainError,
  BlockchainErrorCode,
} from '../types/blockchain.js';
import { BitcoinBlockchainService } from './bitcoin-blockchain.js';
import { LedgerService } from './ledger.js';

// Initialize ECPair factory
const ECPair = ECPairFactory(ecc);

/**
 * UTXO selection strategies
 */
export type UTXOSelectionStrategy = 'largest-first' | 'smallest-first' | 'optimal';

/**
 * Transaction building options
 */
export interface BitcoinTransactionOptions {
  feeRate?: number; // sat/vB
  strategy?: UTXOSelectionStrategy;
  changeAddress?: string;
  dustThreshold?: number;
  enableRBF?: boolean; // Replace-by-Fee
}

/**
 * PSBT building result
 */
export interface PSBTResult {
  psbt: string; // base64 encoded PSBT
  fee: number; // satoshis
  size: number; // transaction size in bytes
  vsize: number; // virtual transaction size
  feeRate: number; // actual fee rate in sat/vB
  inputs: Array<{
    txid: string;
    vout: number;
    value: number;
    derivationPath: string;
  }>;
  outputs: BitcoinTransactionOutput[];
  changeOutput: BitcoinTransactionOutput | undefined;
}

/**
 * Bitcoin Transaction Crafter
 * Handles PSBT creation, UTXO selection, and fee calculation
 */
export class BitcoinTransactionCrafter {
  private blockchainService: BitcoinBlockchainService;
  private ledgerService: LedgerService;
  private defaultOptions: Required<BitcoinTransactionOptions> = {
    feeRate: 10, // sat/vB
    strategy: 'optimal',
    changeAddress: '',
    dustThreshold: 546,
    enableRBF: true,
  };

  constructor(
    blockchainService: BitcoinBlockchainService,
    ledgerService: LedgerService
  ) {
    this.blockchainService = blockchainService;
    this.ledgerService = ledgerService;
  }

  /**
   * Get Bitcoin network object for bitcoinjs-lib
   */
  private getBitcoinNetwork(network: BitcoinNetwork): bitcoin.Network {
    return network === 'bitcoin' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  }

  /**
   * Create a Bitcoin transaction PSBT
   */
  async craftBitcoinTransaction(
    fromAddress: string,
    outputs: BitcoinTransactionOutput[],
    network: BitcoinNetwork = 'bitcoin',
    options: Partial<BitcoinTransactionOptions> = {}
  ): Promise<PSBTResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Get UTXOs for the sender address
      const utxos = await this.blockchainService.getAddressUTXOs(fromAddress, network);
      
      if (utxos.length === 0) {
        throw new BlockchainError(
          'No UTXOs available for transaction',
          BlockchainErrorCode.INVALID_ADDRESS,
          network
        );
      }

      // Calculate total amount needed
      const totalOutput = outputs.reduce((sum, output) => sum + output.value, 0);
      
      // Get fee estimate if not provided
      let feeRate = opts.feeRate;
      if (!feeRate || feeRate <= 0) {
        const feeEstimate = await this.blockchainService.getFeeEstimates(network);
        feeRate = feeEstimate.standardFee;
      }

      // Select UTXOs
      const selectedUTXOs = this.selectUTXOs(utxos, totalOutput, feeRate, opts.strategy);
      
      // Calculate change
      const totalInput = selectedUTXOs.reduce((sum, utxo) => sum + utxo.value, 0);
      const estimatedFee = this.estimateFee(selectedUTXOs.length, outputs.length, feeRate);
      const changeAmount = totalInput - totalOutput - estimatedFee;

      // Prepare change output if needed
      let changeOutput: BitcoinTransactionOutput | undefined;
      let finalOutputs = [...outputs];
      
      if (changeAmount > opts.dustThreshold) {
        const changeAddr = opts.changeAddress || fromAddress;
        changeOutput = {
          address: changeAddr,
          value: changeAmount,
        };
        finalOutputs.push(changeOutput);
      }

      // Build PSBT
      const psbt = await this.buildPSBT(
        selectedUTXOs,
        finalOutputs,
        network,
        opts.enableRBF
      );

      // Calculate final metrics
      const actualFee = totalInput - finalOutputs.reduce((sum, out) => sum + out.value, 0);
      const txSize = psbt.extractTransaction().byteLength();
      const vsize = psbt.extractTransaction().virtualSize();
      const actualFeeRate = actualFee / vsize;

      return {
        psbt: psbt.toBase64(),
        fee: actualFee,
        size: txSize,
        vsize,
        feeRate: actualFeeRate,
        inputs: selectedUTXOs.map((utxo, index) => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          derivationPath: this.getDerivationPathForUTXO(utxo, fromAddress),
        })),
        outputs: outputs,
        changeOutput,
      };

    } catch (error) {
      if (error instanceof BlockchainError) throw error;
      throw new BlockchainError(
        `Failed to craft Bitcoin transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BlockchainErrorCode.CONTRACT_CALL_FAILED,
        network,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Select optimal UTXOs for transaction
   */
  private selectUTXOs(
    utxos: UTXO[],
    targetAmount: number,
    feeRate: number,
    strategy: UTXOSelectionStrategy
  ): UTXO[] {
    // Filter only spendable UTXOs
    const spendableUTXOs = utxos.filter(utxo => utxo.spendable && utxo.value > 0);
    
    if (spendableUTXOs.length === 0) {
      throw new Error('No spendable UTXOs available');
    }

    // Sort UTXOs based on strategy
    let sortedUTXOs: UTXO[];
    
    switch (strategy) {
      case 'largest-first':
        sortedUTXOs = spendableUTXOs.sort((a, b) => b.value - a.value);
        break;
      case 'smallest-first':
        sortedUTXOs = spendableUTXOs.sort((a, b) => a.value - b.value);
        break;
      case 'optimal':
      default:
        // Use branch and bound for optimal selection
        return this.branchAndBoundUTXOSelection(spendableUTXOs, targetAmount, feeRate);
    }

    // Simple greedy selection for non-optimal strategies
    const selected: UTXO[] = [];
    let totalValue = 0;
    
    for (const utxo of sortedUTXOs) {
      selected.push(utxo);
      totalValue += utxo.value;
      
      const estimatedFee = this.estimateFee(selected.length, 2, feeRate); // Assume 2 outputs (recipient + change)
      
      if (totalValue >= targetAmount + estimatedFee) {
        break;
      }
    }

    const finalFee = this.estimateFee(selected.length, 2, feeRate);
    if (totalValue < targetAmount + finalFee) {
      throw new Error('Insufficient funds');
    }

    return selected;
  }

  /**
   * Branch and bound UTXO selection for optimal fee efficiency
   */
  private branchAndBoundUTXOSelection(
    utxos: UTXO[],
    targetAmount: number,
    feeRate: number
  ): UTXO[] {
    // Sort by value descending for better pruning
    const sortedUTXOs = utxos.sort((a, b) => b.value - a.value);
    
    let bestSelection: UTXO[] = [];
    let bestWaste = Number.MAX_SAFE_INTEGER;

    const search = (index: number, currentSelection: UTXO[], currentValue: number) => {
      if (index >= sortedUTXOs.length) {
        const fee = this.estimateFee(currentSelection.length, 2, feeRate);
        if (currentValue >= targetAmount + fee) {
          const waste = currentValue - targetAmount - fee;
          if (waste < bestWaste) {
            bestWaste = waste;
            bestSelection = [...currentSelection];
          }
        }
        return;
      }

      const utxo = sortedUTXOs[index];
      if (!utxo) return;
      
      const fee = this.estimateFee(currentSelection.length + 1, 2, feeRate);
      
      // Pruning conditions
      if (currentValue + utxo.value >= targetAmount + fee && 
          currentValue + utxo.value - targetAmount - fee < bestWaste) {
        // Include this UTXO
        search(index + 1, [...currentSelection, utxo], currentValue + utxo.value);
      }
      
      // Skip this UTXO
      const remainingValue = sortedUTXOs.slice(index + 1).reduce((sum, u) => sum + u.value, 0);
      if (currentValue + remainingValue >= targetAmount + this.estimateFee(currentSelection.length, 2, feeRate)) {
        search(index + 1, currentSelection, currentValue);
      }
    };

    search(0, [], 0);

    if (bestSelection.length === 0) {
      // Fallback to greedy selection
      return this.selectUTXOs(utxos, targetAmount, feeRate, 'largest-first');
    }

    return bestSelection;
  }

  /**
   * Estimate transaction fee
   */
  private estimateFee(
    inputCount: number,
    outputCount: number,
    feeRate: number,
    addressType: BitcoinAddressType = 'segwit'
  ): number {
    // Estimate transaction size based on input/output types
    let inputSize: number;
    
    switch (addressType) {
      case 'legacy':
        inputSize = 148; // P2PKH input
        break;
      case 'segwit':
        inputSize = 68; // P2WPKH input (with witness discount)
        break;
      case 'taproot':
        inputSize = 58; // P2TR input (with witness discount)
        break;
      default:
        inputSize = 68;
    }

    const outputSize = 34; // Standard output size
    const overhead = 10; // Transaction overhead (version, locktime, etc.)
    
    const estimatedSize = overhead + (inputCount * inputSize) + (outputCount * outputSize);
    
    return Math.ceil(estimatedSize * feeRate);
  }

  /**
   * Build PSBT from UTXOs and outputs
   */
  private async buildPSBT(
    utxos: UTXO[],
    outputs: BitcoinTransactionOutput[],
    network: BitcoinNetwork,
    enableRBF: boolean = true
  ): Promise<bitcoin.Psbt> {
    const bitcoinNetwork = this.getBitcoinNetwork(network);
    const psbt = new bitcoin.Psbt({ network: bitcoinNetwork });

    // Add inputs
    for (const utxo of utxos) {
      // Get previous transaction details
      const prevTx = await this.blockchainService.getTransaction(utxo.txid, network);
      
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence: enableRBF ? 0xfffffffd : 0xffffffff, // Enable RBF if requested
        // Note: For production, you'd need to add witnessUtxo or nonWitnessUtxo
        // This is simplified for the example
      });
    }

    // Add outputs
    for (const output of outputs) {
      psbt.addOutput({
        address: output.address,
        value: output.value,
      });
    }

    return psbt;
  }

  /**
   * Get derivation path for a UTXO (simplified)
   */
  private getDerivationPathForUTXO(utxo: UTXO, address: string): string {
    // This is a simplified implementation
    // In practice, you'd track derivation paths per address
    return "84'/0'/0'/0/0"; // Default native segwit path
  }

  /**
   * Sign PSBT with Ledger
   */
  async signPSBTWithLedger(
    psbtResult: PSBTResult,
    network: BitcoinNetwork = 'bitcoin'
  ): Promise<string> {
    try {
      const derivationPaths = psbtResult.inputs.map(input => input.derivationPath);
      
      const signedPSBT = await this.ledgerService.signBitcoinPSBT(
        psbtResult.psbt,
        derivationPaths
      );

      return signedPSBT;
    } catch (error) {
      throw new BlockchainError(
        `Failed to sign PSBT with Ledger: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BlockchainErrorCode.CONTRACT_CALL_FAILED,
        network,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Finalize and extract transaction from signed PSBT
   */
  finalizePSBT(signedPSBT: string, network: BitcoinNetwork = 'bitcoin'): string {
    try {
      const bitcoinNetwork = this.getBitcoinNetwork(network);
      const psbt = bitcoin.Psbt.fromBase64(signedPSBT, { network: bitcoinNetwork });
      
      // Finalize all inputs
      psbt.finalizeAllInputs();
      
      // Extract the final transaction
      const tx = psbt.extractTransaction();
      
      return tx.toHex();
    } catch (error) {
      throw new BlockchainError(
        `Failed to finalize PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BlockchainErrorCode.INVALID_HASH,
        network,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create, sign, and finalize a complete Bitcoin transaction
   */
  async createSignedTransaction(
    fromAddress: string,
    outputs: BitcoinTransactionOutput[],
    network: BitcoinNetwork = 'bitcoin',
    options: Partial<BitcoinTransactionOptions> = {}
  ): Promise<{ txHex: string; txid: string; fee: number; psbt: PSBTResult }> {
    // Create PSBT
    const psbtResult = await this.craftBitcoinTransaction(fromAddress, outputs, network, options);
    
    // Sign with Ledger
    const signedPSBT = await this.signPSBTWithLedger(psbtResult, network);
    
    // Finalize transaction
    const txHex = this.finalizePSBT(signedPSBT, network);
    
    // Calculate txid
    const bitcoinNetwork = this.getBitcoinNetwork(network);
    const tx = bitcoin.Transaction.fromHex(txHex);
    const txid = tx.getId();

    return {
      txHex,
      txid,
      fee: psbtResult.fee,
      psbt: psbtResult,
    };
  }

  /**
   * Get fee estimate for a potential transaction
   */
  async estimateTransactionFee(
    fromAddress: string,
    outputs: BitcoinTransactionOutput[],
    network: BitcoinNetwork = 'bitcoin',
    feeRate?: number
  ): Promise<{
    fee: number;
    feeRate: number;
    inputCount: number;
    outputCount: number;
    size: number;
    vsize: number;
  }> {
    try {
      // Get fee rate if not provided
      if (!feeRate) {
        const feeEstimate = await this.blockchainService.getFeeEstimates(network);
        feeRate = feeEstimate.standardFee;
      }

      // Get UTXOs to determine input count
      const utxos = await this.blockchainService.getAddressUTXOs(fromAddress, network);
      const totalOutput = outputs.reduce((sum, output) => sum + output.value, 0);
      
      // Select UTXOs (just for estimation, don't create actual transaction)
      const selectedUTXOs = this.selectUTXOs(utxos, totalOutput, feeRate, 'optimal');
      
      const inputCount = selectedUTXOs.length;
      const outputCount = outputs.length + 1; // +1 for potential change output
      
      const estimatedFee = this.estimateFee(inputCount, outputCount, feeRate);
      const estimatedSize = this.estimateFee(inputCount, outputCount, 1); // Size when fee rate = 1
      
      return {
        fee: estimatedFee,
        feeRate,
        inputCount,
        outputCount,
        size: estimatedSize,
        vsize: estimatedSize, // Simplified for now
      };
    } catch (error) {
      throw new BlockchainError(
        `Failed to estimate transaction fee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BlockchainErrorCode.CONTRACT_CALL_FAILED,
        network,
        error instanceof Error ? error : undefined
      );
    }
  }
}