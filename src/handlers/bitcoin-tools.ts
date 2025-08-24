/**
 * Bitcoin MCP Tool Handlers
 * Implements Bitcoin-specific MCP tools for address generation, balance checking, 
 * transaction crafting, and fee analysis
 */

import type {
  GetBitcoinAddressSchema,
  GetBitcoinBalanceSchema,
  CraftBitcoinTransactionSchema,
  SendBitcoinSchema,
  AnalyzeBitcoinFeesSchema,
  BitcoinAddressResponse,
  BitcoinBalanceResponse,
  BitcoinTransactionResponse,
  BitcoinPSBTResponse,
  BitcoinFeeAnalysisResponse,
} from '../types/index.js';
import type {
  BitcoinNetwork,
  BitcoinAddressType,
} from '../types/blockchain.js';
import { z } from 'zod';
import { LedgerService } from '../services/ledger.js';
import { BitcoinBlockchainService } from '../services/bitcoin-blockchain.js';
import { BitcoinTransactionCrafter } from '../services/bitcoin-transaction-crafter.js';

export class BitcoinToolHandlers {
  private ledgerService: LedgerService;
  private blockchainService: BitcoinBlockchainService;
  private transactionCrafter: BitcoinTransactionCrafter;

  constructor(
    ledgerService: LedgerService,
    blockchainService: BitcoinBlockchainService,
    transactionCrafter: BitcoinTransactionCrafter
  ) {
    this.ledgerService = ledgerService;
    this.blockchainService = blockchainService;
    this.transactionCrafter = transactionCrafter;
  }

  /**
   * Get Bitcoin address from Ledger device
   */
  async getBitcoinAddress(
    params: z.infer<typeof GetBitcoinAddressSchema>
  ): Promise<BitcoinAddressResponse> {
    const { derivationPath, addressType, display, network } = params;

    // Ensure Ledger is connected
    if (!this.ledgerService.isConnected()) {
      await this.ledgerService.connectToLedger();
    }

    const address = await this.ledgerService.getBitcoinAddress(
      derivationPath,
      addressType as BitcoinAddressType,
      display,
      network as BitcoinNetwork
    );

    return {
      address: address.address,
      type: address.type,
      derivationPath: address.derivationPath,
      publicKey: address.publicKey || '',
      network: network as 'bitcoin' | 'bitcoin-testnet',
    };
  }

  /**
   * Get Bitcoin balance for an address
   */
  async getBitcoinBalance(
    params: z.infer<typeof GetBitcoinBalanceSchema>
  ): Promise<BitcoinBalanceResponse> {
    const { address, network } = params;

    const balance = await this.blockchainService.getAddressBalance(
      address,
      network as BitcoinNetwork
    );

    // Convert satoshis to BTC
    const balanceInBTC = (balance.total / 100000000).toFixed(8);
    
    // Get USD value (simplified - in production, you'd use a price API)
    // const balanceInUSD = undefined; // TODO: Implement price lookup

    const response: BitcoinBalanceResponse = {
      address,
      confirmed: balance.confirmed,
      unconfirmed: balance.unconfirmed,
      total: balance.total,
      balanceInBTC,
      utxoCount: balance.utxoCount,
      network: network as 'bitcoin' | 'bitcoin-testnet',
    };
    
    // TODO: Implement price lookup and add balanceInUSD when available
    // response.balanceInUSD = calculatedUSDValue;
    
    return response;
  }

  /**
   * Craft a Bitcoin transaction (PSBT)
   */
  async craftBitcoinTransaction(
    params: z.infer<typeof CraftBitcoinTransactionSchema>
  ): Promise<BitcoinPSBTResponse> {
    const { fromAddress, outputs, network, feeRate, changeAddress, strategy } = params;

    const psbtResult = await this.transactionCrafter.craftBitcoinTransaction(
      fromAddress,
      outputs,
      network as BitcoinNetwork,
      {
        ...(feeRate !== undefined && { feeRate }),
        ...(changeAddress !== undefined && { changeAddress }),
        ...(strategy !== undefined && { strategy: strategy as any }),
      }
    );

    return {
      psbt: psbtResult.psbt,
      fee: psbtResult.fee,
      feeRate: psbtResult.feeRate,
      size: psbtResult.size,
      vsize: psbtResult.vsize,
      inputCount: psbtResult.inputs.length,
      outputCount: psbtResult.outputs.length,
      network: network as 'bitcoin' | 'bitcoin-testnet',
    };
  }

  /**
   * Send Bitcoin (convenience method: craft → sign → broadcast)
   */
  async sendBitcoin(
    params: z.infer<typeof SendBitcoinSchema>
  ): Promise<BitcoinTransactionResponse> {
    const { 
      to, 
      amount, 
      network, 
      derivationPath, 
      addressType, 
      feeRate, 
      enableRBF 
    } = params;

    try {
      // First get the sender address
      const senderAddress = await this.getBitcoinAddress({
        derivationPath,
        addressType,
        display: false,
        network,
      });

      // Create transaction
      const result = await this.transactionCrafter.createSignedTransaction(
        senderAddress.address,
        [{ address: to, value: amount }],
        network as BitcoinNetwork,
        {
          ...(feeRate !== undefined && { feeRate }),
          ...(enableRBF !== undefined && { enableRBF }),
        }
      );

      // Broadcast transaction
      const txid = await this.blockchainService.broadcastTransaction(
        result.txHex,
        network as BitcoinNetwork
      );

      const explorerBaseUrl = network === 'bitcoin' 
        ? 'https://blockstream.info/tx/'
        : 'https://blockstream.info/testnet/tx/';

      return {
        success: true,
        txid,
        fee: result.fee,
        feeRate: result.psbt.feeRate,
        size: result.psbt.size,
        vsize: result.psbt.vsize,
        confirmations: 0, // New transaction
        inputs: result.psbt.inputs.map(input => ({
          txid: input.txid,
          vout: input.vout,
          value: input.value,
        })),
        outputs: result.psbt.outputs.map(output => ({
          address: output.address,
          value: output.value,
        })),
        network: network as 'bitcoin' | 'bitcoin-testnet',
        explorerUrl: `${explorerBaseUrl}${txid}`,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Bitcoin transaction failed: ${errorMessage}`);
    }
  }

  /**
   * Analyze Bitcoin network fees
   */
  async analyzeBitcoinFees(
    params: z.infer<typeof AnalyzeBitcoinFeesSchema>
  ): Promise<BitcoinFeeAnalysisResponse> {
    const { 
      network, 
      transactionSize, 
      inputCount, 
      outputCount, 
      addressType 
    } = params;

    // Get current fee estimates
    const feeEstimates = await this.blockchainService.getFeeEstimates(
      network as BitcoinNetwork
    );

    // Calculate transaction size if not provided
    let estimatedSize = transactionSize;
    let estimatedVsize = transactionSize;
    
    if (!estimatedSize) {
      estimatedSize = this.estimateTransactionSize(inputCount!, outputCount!, addressType);
      estimatedVsize = this.estimateVirtualSize(inputCount!, outputCount!, addressType);
    }

    // Calculate fees for each speed
    const calculateFee = (feeRate: number) => {
      const totalFee = Math.ceil(feeRate * (estimatedVsize || estimatedSize || 250));
      const costInBTC = (totalFee / 100000000).toFixed(8);
      return { feeRate, totalFee, costInBTC };
    };

    const currentFees = {
      minimum: { 
        ...calculateFee(feeEstimates.minimumFee), 
      },
      economy: { 
        ...calculateFee(feeEstimates.economyFee || feeEstimates.slowFee), 
        timeEstimate: '~6+ hours' 
      },
      slow: { 
        ...calculateFee(feeEstimates.slowFee), 
        timeEstimate: '~2-4 hours' 
      },
      standard: { 
        ...calculateFee(feeEstimates.standardFee), 
        timeEstimate: '~30-60 minutes' 
      },
      fast: { 
        ...calculateFee(feeEstimates.fastFee), 
        timeEstimate: '~10-20 minutes' 
      },
    };

    // Determine recommendation based on network conditions
    let recommended: 'minimum' | 'economy' | 'slow' | 'standard' | 'fast' = 'standard';
    let reasoning = 'Standard fee for reliable confirmation';

    if (feeEstimates.standardFee <= 5) {
      recommended = 'economy';
      reasoning = 'Low network congestion - economy fee sufficient';
    } else if (feeEstimates.standardFee > 20) {
      recommended = 'slow';
      reasoning = 'High network congestion - slow fee for cost efficiency';
    }

    const response: BitcoinFeeAnalysisResponse = {
      network: network as 'bitcoin' | 'bitcoin-testnet',
      currentFees,
      recommendations: {
        recommended,
        reasoning,
      },
    };

    if (!transactionSize && inputCount && outputCount && addressType) {
      response.transactionEstimate = {
        inputCount,
        outputCount,
        estimatedSize: estimatedSize || 0,
        estimatedVsize: estimatedVsize || 0,
        addressType,
      };
    }

    return response;
  }

  /**
   * Estimate transaction size in bytes
   */
  private estimateTransactionSize(
    inputCount: number,
    outputCount: number,
    addressType: 'legacy' | 'segwit' | 'taproot'
  ): number {
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
    const overhead = 10; // Transaction overhead
    
    return overhead + (inputCount * inputSize) + (outputCount * outputSize);
  }

  /**
   * Estimate virtual transaction size (for segwit)
   */
  private estimateVirtualSize(
    inputCount: number,
    outputCount: number,
    addressType: 'legacy' | 'segwit' | 'taproot'
  ): number {
    if (addressType === 'legacy') {
      return this.estimateTransactionSize(inputCount, outputCount, addressType);
    }

    // For segwit, virtual size is smaller due to witness discount
    const baseSize = 10 + (inputCount * 32) + (outputCount * 34); // Base transaction
    const witnessSize = inputCount * (addressType === 'taproot' ? 64 : 107); // Witness data
    
    return Math.ceil(baseSize + (witnessSize / 4));
  }
}