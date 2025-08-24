/**
 * TransactionCrafter - Transaction crafting utility
 * Integrates Ledger, Blockscout, and Viem services for secure blockchain transactions
 */

import {
  type Address,
  type Hex,
  encodeFunctionData,
  parseEther,
  parseUnits,
  formatEther,
  isAddress,
  keccak256,
  type TransactionSerializable,
  serializeTransaction,
} from 'viem';

import { LedgerService } from './ledger.js';
import { BlockscoutClient } from './blockscout.js';
import { BlockchainService } from './blockchain.js';

import type {
  ETHTransferParams,
  ERC20TransferParams,
  ERC20ApproveParams,
  CustomTransactionParams,
  PreparedTransaction,
  SignedTransaction,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TransactionCrafterConfig,
  GasEstimation,
  BaseTransactionParams,
} from '../types/transaction-crafter.js';
import type { EthereumNetwork } from '../types/blockchain.js';

import {
  ValidationErrorCode,
  ValidationWarningCode,
  TransactionCrafterError,
} from '../types/transaction-crafter.js';

// Standard ABIs
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// Chain IDs mapping
const CHAIN_IDS: Record<string, number> = {
  mainnet: 1,
  sepolia: 11155111,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

interface TransactionCrafterOptions {
  ledgerService: LedgerService;
  blockscoutClient: BlockscoutClient;
  blockchainService: BlockchainService;
  config?: TransactionCrafterConfig;
}

export class TransactionCrafter {
  private ledgerService: LedgerService;
  private blockscoutClient: BlockscoutClient;
  private blockchainService: BlockchainService;
  private config: Required<TransactionCrafterConfig>;

  constructor(options: TransactionCrafterOptions) {
    this.ledgerService = options.ledgerService;
    this.blockscoutClient = options.blockscoutClient;
    this.blockchainService = options.blockchainService;

    // Set default configuration
    this.config = {
      ledgerDerivationPath: options.config?.ledgerDerivationPath || "44'/60'/0'/0/0",
      defaultNetwork: options.config?.defaultNetwork || 'mainnet',
      validateBeforeSigning: options.config?.validateBeforeSigning !== false,
      autoEstimateGas: options.config?.autoEstimateGas !== false,
      securityChecks: options.config?.securityChecks !== false,
      maxGasLimit: options.config?.maxGasLimit || 10000000n,
      warningThresholds: {
        largeTransferEth: options.config?.warningThresholds?.largeTransferEth || parseEther('10'),
        highGasPrice: options.config?.warningThresholds?.highGasPrice || parseUnits('200', 9),
      },
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<TransactionCrafterConfig> {
    return { ...this.config };
  }

  /**
   * Helper method to estimate gas and costs
   */
  private async estimateGasWithCost(
    transaction: { from: Address; to: Address; data?: Hex; value?: bigint },
    network: string,
    params: BaseTransactionParams
  ): Promise<GasEstimation> {
    if (!this.config.autoEstimateGas && params.gasLimit) {
      return {
        gasLimit: params.gasLimit,
        maxFeePerGas: params.maxFeePerGas || parseUnits('50', 9),
        maxPriorityFeePerGas: params.maxPriorityFeePerGas || parseUnits('2', 9),
        estimatedCost: params.gasLimit * (params.maxFeePerGas || parseUnits('50', 9)),
        estimatedCostInEth: formatEther(params.gasLimit * (params.maxFeePerGas || parseUnits('50', 9))),
      };
    }

    const estimatedGas = await this.blockchainService.estimateGas(transaction as any, network as any);
    const gasPrice = await this.blockchainService.getGasPrice(network as any);
    const maxFeePerGas = params.maxFeePerGas || gasPrice.gasPrice || parseUnits('50', 9);
    const maxPriorityFeePerGas = params.maxPriorityFeePerGas || parseUnits('2', 9);
    const estimatedCost = estimatedGas * maxFeePerGas;

    return {
      gasLimit: estimatedGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedCost,
      estimatedCostInEth: formatEther(estimatedCost),
    };
  }

  /**
   * Connect to Ledger device
   */
  public async connectLedger(timeout: number = 5000): Promise<boolean> {
    try {
      return await this.ledgerService.connectToLedger(timeout);
    } catch (error) {
      throw new TransactionCrafterError(
        `Failed to connect to Ledger: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ValidationErrorCode.LEDGER_NOT_CONNECTED,
        error
      );
    }
  }

  /**
   * Get sender address from Ledger
   */
  private async getSenderAddress(): Promise<Address> {
    if (!this.ledgerService.isConnected()) {
      throw new TransactionCrafterError(
        'Ledger not connected',
        ValidationErrorCode.LEDGER_NOT_CONNECTED
      );
    }

    const { address } = await this.ledgerService.getAddress(
      this.config.ledgerDerivationPath,
      false,
      false
    );

    if (!isAddress(address)) {
      throw new TransactionCrafterError(
        'Invalid address from Ledger',
        ValidationErrorCode.INVALID_ADDRESS,
        address
      );
    }

    return address as Address;
  }

  /**
   * Craft ETH transfer transaction
   */
  public async craftETHTransfer(params: ETHTransferParams): Promise<PreparedTransaction> {
    // Validate addresses
    if (!isAddress(params.to)) {
      throw new TransactionCrafterError(
        'Invalid recipient address',
        ValidationErrorCode.INVALID_ADDRESS,
        params.to
      );
    }

    const from = params.from || await this.getSenderAddress();
    const amount = typeof params.amount === 'string' 
      ? parseEther(params.amount) 
      : params.amount;

    // Validate balance
    const balance = await this.blockchainService.getBalance(from, params.network);
    if (balance < amount) {
      throw new TransactionCrafterError(
        'Insufficient balance',
        ValidationErrorCode.INSUFFICIENT_BALANCE,
        { required: amount, available: balance }
      );
    }

    // Get proper nonce - CRITICAL FIX: Use transaction count, NOT block number!
    const nonce = params.nonce !== undefined 
      ? params.nonce 
      : Number(await this.blockchainService.getTransactionCount(from, params.network));

    // Estimate gas
    const gasEstimation = await this.estimateGasWithCost(
      { from, to: params.to, value: amount },
      params.network,
      params
    );

    // Check gas balance
    const totalCost = amount + gasEstimation.estimatedCost;
    if (balance < totalCost) {
      throw new TransactionCrafterError(
        'Insufficient balance for transaction and gas',
        ValidationErrorCode.INSUFFICIENT_GAS,
        { required: totalCost, available: balance }
      );
    }

    return {
      to: params.to,
      from,
      data: '0x' as Hex,
      value: amount,
      nonce: nonce || 0,
      gasLimit: gasEstimation.gasLimit,
      chainId: CHAIN_IDS[params.network] || 1,
      maxFeePerGas: gasEstimation.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.maxPriorityFeePerGas,
      type: 'eip1559',
    };
  }

  /**
   * Craft ERC20 transfer transaction
   */
  public async craftERC20Transfer(params: ERC20TransferParams): Promise<PreparedTransaction> {
    // Validate addresses
    if (!isAddress(params.to)) {
      throw new TransactionCrafterError(
        'Invalid recipient address',
        ValidationErrorCode.INVALID_ADDRESS,
        params.to
      );
    }

    if (!isAddress(params.tokenAddress)) {
      throw new TransactionCrafterError(
        'Invalid token address',
        ValidationErrorCode.INVALID_TOKEN_ADDRESS,
        params.tokenAddress
      );
    }

    const from = params.from || await this.getSenderAddress();

    // Get token info and ABI
    const [tokenInfo, contractABI] = await Promise.all([
      this.blockchainService.getTokenInfo(params.tokenAddress, params.network as EthereumNetwork),
      this.blockscoutClient.getContractABI(params.tokenAddress, params.network as EthereumNetwork),
    ]);

    // Use provided decimals or fetch from contract
    const decimals = params.decimals ?? tokenInfo.decimals;
    const amount = typeof params.amount === 'string'
      ? parseUnits(params.amount, decimals)
      : params.amount;

    // Check token balance
    const tokenBalance = await this.blockchainService.getTokenBalance(
      params.tokenAddress,
      from,
      params.network
    );

    if (tokenBalance < amount) {
      throw new TransactionCrafterError(
        'Insufficient token balance',
        ValidationErrorCode.INSUFFICIENT_BALANCE,
        { required: amount, available: tokenBalance }
      );
    }

    // Encode transfer function
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [params.to, amount],
    });

    // Check ETH balance for gas
    const ethBalance = await this.blockchainService.getBalance(from, params.network);
    // Get proper nonce - CRITICAL FIX: Use transaction count, NOT block number!
    const nonce = params.nonce !== undefined 
      ? params.nonce 
      : Number(await this.blockchainService.getTransactionCount(from, params.network));

    // Estimate gas
    const gasEstimation = await this.estimateGasWithCost(
      { from, to: params.tokenAddress, data, value: 0n },
      params.network,
      { ...params, gasLimit: params.gasLimit || 65000n }
    );

    if (ethBalance < gasEstimation.estimatedCost) {
      throw new TransactionCrafterError(
        'Insufficient ETH balance for gas',
        ValidationErrorCode.INSUFFICIENT_GAS,
        { required: gasEstimation.estimatedCost, available: ethBalance }
      );
    }

    return {
      to: params.tokenAddress,
      from,
      data,
      value: 0n,
      nonce: nonce || 0,
      gasLimit: gasEstimation.gasLimit,
      chainId: CHAIN_IDS[params.network] || 1,
      maxFeePerGas: gasEstimation.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.maxPriorityFeePerGas,
      type: 'eip1559',
    };
  }

  /**
   * Craft ERC20 approve transaction
   */
  public async craftERC20Approve(params: ERC20ApproveParams): Promise<PreparedTransaction> {
    // Validate addresses
    if (!isAddress(params.spender)) {
      throw new TransactionCrafterError(
        'Invalid spender address',
        ValidationErrorCode.INVALID_ADDRESS,
        params.spender
      );
    }

    if (!isAddress(params.tokenAddress)) {
      throw new TransactionCrafterError(
        'Invalid token address',
        ValidationErrorCode.INVALID_TOKEN_ADDRESS,
        params.tokenAddress
      );
    }

    const from = params.from || await this.getSenderAddress();

    // Get token info
    const tokenInfo = await this.blockchainService.getTokenInfo(params.tokenAddress, params.network);

    // Use provided decimals or fetch from contract
    const decimals = params.decimals ?? tokenInfo.decimals;
    const amount = typeof params.amount === 'string'
      ? parseUnits(params.amount, decimals)
      : params.amount;

    // Encode approve function
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [params.spender, amount],
    });

    // Check ETH balance for gas
    const ethBalance = await this.blockchainService.getBalance(from, params.network);
    // Get proper nonce - CRITICAL FIX: Use transaction count, NOT block number!
    const nonce = params.nonce !== undefined 
      ? params.nonce 
      : Number(await this.blockchainService.getTransactionCount(from, params.network));

    // Estimate gas
    const gasEstimation = await this.estimateGasWithCost(
      { from, to: params.tokenAddress, data, value: 0n },
      params.network,
      { ...params, gasLimit: params.gasLimit || 50000n }
    );

    if (ethBalance < gasEstimation.estimatedCost) {
      throw new TransactionCrafterError(
        'Insufficient ETH balance for gas',
        ValidationErrorCode.INSUFFICIENT_GAS,
        { required: gasEstimation.estimatedCost, available: ethBalance }
      );
    }

    return {
      to: params.tokenAddress,
      from,
      data,
      value: 0n,
      nonce: nonce || 0,
      gasLimit: gasEstimation.gasLimit,
      chainId: CHAIN_IDS[params.network] || 1,
      maxFeePerGas: gasEstimation.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.maxPriorityFeePerGas,
      type: 'eip1559',
    };
  }

  /**
   * Craft custom contract transaction
   */
  public async craftCustomTransaction(params: CustomTransactionParams): Promise<PreparedTransaction> {
    // Validate contract address
    if (!isAddress(params.contractAddress)) {
      throw new TransactionCrafterError(
        'Invalid contract address',
        ValidationErrorCode.INVALID_ADDRESS,
        params.contractAddress
      );
    }

    const from = params.from || await this.getSenderAddress();

    // Get contract ABI if not provided
    let abi = params.abi;
    if (!abi) {
      const contractABI = await this.blockscoutClient.getContractABI(
        params.contractAddress,
        params.network as EthereumNetwork
      );
      
      abi = contractABI;
    }

    // Validate method exists in ABI
    const methodExists = abi.some((item: any) => 
      item.type === 'function' && item.name === params.methodName
    );

    if (!methodExists) {
      throw new TransactionCrafterError(
        'Method not found in contract ABI',
        ValidationErrorCode.METHOD_NOT_FOUND,
        { methodName: params.methodName, contractAddress: params.contractAddress }
      );
    }

    // Encode function data
    let data: Hex;
    try {
      data = encodeFunctionData({
        abi,
        functionName: params.methodName,
        args: params.params,
      });
    } catch (error) {
      throw new TransactionCrafterError(
        'Invalid parameters for method',
        ValidationErrorCode.INVALID_PARAMETERS,
        { methodName: params.methodName, params: params.params, error }
      );
    }

    const value = params.value || 0n;

    // Check ETH balance for gas and value
    const ethBalance = await this.blockchainService.getBalance(from, params.network);
    // Get proper nonce - CRITICAL FIX: Use transaction count, NOT block number!
    const nonce = params.nonce !== undefined 
      ? params.nonce 
      : Number(await this.blockchainService.getTransactionCount(from, params.network));

    // Estimate gas
    const gasEstimation = await this.estimateGasWithCost(
      { from, to: params.contractAddress, data, value },
      params.network,
      { ...params, gasLimit: params.gasLimit || 100000n }
    );

    const totalCost = value + gasEstimation.estimatedCost;
    if (ethBalance < totalCost) {
      throw new TransactionCrafterError(
        'Insufficient ETH balance for transaction',
        ValidationErrorCode.INSUFFICIENT_BALANCE,
        { required: totalCost, available: ethBalance }
      );
    }

    return {
      to: params.contractAddress,
      from,
      data,
      value,
      nonce: nonce || 0,
      gasLimit: gasEstimation.gasLimit,
      chainId: CHAIN_IDS[params.network] || 1,
      maxFeePerGas: gasEstimation.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.maxPriorityFeePerGas,
      type: 'eip1559',
    };
  }

  /**
   * Sign a prepared transaction with Ledger
   */
  public async signTransaction(preparedTx: PreparedTransaction): Promise<SignedTransaction> {
    if (!this.ledgerService.isConnected()) {
      throw new TransactionCrafterError(
        'Ledger not connected',
        ValidationErrorCode.LEDGER_NOT_CONNECTED
      );
    }

    // Validate transaction if configured
    if (this.config.validateBeforeSigning) {
      const validation = await this.validatePreparedTransaction(preparedTx);
      if (!validation.valid) {
        throw new TransactionCrafterError(
          `Transaction validation failed: ${validation.errors[0]?.message}`,
          validation.errors[0]?.code || ValidationErrorCode.INVALID_PARAMETERS,
          validation.errors
        );
      }
    }

    // Serialize transaction for signing
    const serializedTx: TransactionSerializable = {
      to: preparedTx.to,
      data: preparedTx.data,
      value: preparedTx.value,
      nonce: preparedTx.nonce,
      gas: preparedTx.gasLimit,
      chainId: preparedTx.chainId,
      type: preparedTx.type === 'eip1559' ? 'eip1559' : 'legacy',
    };

    if (preparedTx.type === 'eip1559') {
      (serializedTx as any).maxFeePerGas = preparedTx.maxFeePerGas;
      (serializedTx as any).maxPriorityFeePerGas = preparedTx.maxPriorityFeePerGas;
    } else {
      (serializedTx as any).gasPrice = preparedTx.gasPrice;
    }

    const rawTxHex = serializeTransaction(serializedTx);

    // Sign with Ledger
    const signature = await this.ledgerService.signTransaction(
      this.config.ledgerDerivationPath,
      rawTxHex.slice(2), // Remove 0x prefix
      null
    );

    // Create signed transaction
    const signedTx = serializeTransaction(serializedTx, {
      r: `0x${signature.r}` as Hex,
      s: `0x${signature.s}` as Hex,
      v: BigInt(`0x${signature.v}`),
    });

    const hash = keccak256(signedTx);

    return {
      raw: signedTx,
      hash,
      from: preparedTx.from,
      to: preparedTx.to,
      signature: {
        r: `0x${signature.r}` as Hex,
        s: `0x${signature.s}` as Hex,
        v: BigInt(`0x${signature.v}`),
      },
    };
  }

  /**
   * Validate a prepared transaction
   */
  private async validatePreparedTransaction(tx: PreparedTransaction): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check gas limit
    if (tx.gasLimit > this.config.maxGasLimit) {
      errors.push({
        code: ValidationErrorCode.INVALID_PARAMETERS,
        message: `Gas limit exceeds maximum: ${tx.gasLimit} > ${this.config.maxGasLimit}`,
        field: 'gasLimit',
        value: tx.gasLimit,
      });
    }

    // Check addresses
    if (!isAddress(tx.from)) {
      errors.push({
        code: ValidationErrorCode.INVALID_ADDRESS,
        message: 'Invalid from address',
        field: 'from',
        value: tx.from,
      });
    }

    if (!isAddress(tx.to)) {
      errors.push({
        code: ValidationErrorCode.INVALID_ADDRESS,
        message: 'Invalid to address',
        field: 'to',
        value: tx.to,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}