/**
 * Tool handlers for blockchain operations with real service implementations
 */

import { formatEther, formatUnits } from 'viem';
import type { ServiceOrchestrator } from '../services/orchestrator.js';
import type {
  GetLedgerAddressSchema,
  GetBalanceSchema,
  GetTokenBalancesSchema,
  GetNftBalancesSchema,
  CraftTransactionSchema,
  GetContractAbiSchema,
  SignTransactionSchema,
  SignMessageSchema,
  CraftAndSignTransactionSchema,
  BroadcastTransactionSchema,
  SendEthSchema,
  SendErc20TokenSchema,
  SendErc721TokenSchema,
  ManageTokenApprovalSchema,
  GasAnalysisSchema,
  LedgerAddressResponse,
  BalanceResponse,
  TokenBalancesResponse,
  NftBalancesResponse,
  TransactionResponse,
  ContractAbiResponse,
  TransactionSignatureResponse,
  MessageSignatureResponse,
  BroadcastTransactionResponse,
  SendTransactionResponse,
  TokenApprovalResponse,
  GasAnalysisResponse,
} from '../types/index.js';

/**
 * Tool handlers class that uses the service orchestrator
 */
export class ToolHandlers {
  constructor(private orchestrator: ServiceOrchestrator) {}

  /**
   * Get the connected Ledger device address
   * @param params - Optional derivation path and display parameters
   * @returns The Ethereum address from the connected Ledger device
   */
  public async getLedgerAddress(params: typeof GetLedgerAddressSchema._type): Promise<LedgerAddressResponse> {
    try {
      const ledgerService = this.orchestrator.getLedgerService();
      
      // Check if Ledger is connected
      if (!ledgerService.isConnected()) {
        throw new Error('Ledger device is not connected. Please connect your Ledger device.');
      }

      const derivationPath = params.derivationPath || "44'/60'/0'/0/0";
      const display = params.display || false;
      
      const result = await ledgerService.getAddress(derivationPath, display, true);
      
      return {
        address: result.address,
        publicKey: result.publicKey,
        derivationPath,
        chainCode: result.chainCode || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get Ledger address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ETH balance for a given address
   * @param params - The address and network to check
   * @returns The ETH balance
   */
  public async getBalance(params: typeof GetBalanceSchema._type): Promise<BalanceResponse> {
    try {
      const blockchainService = this.orchestrator.getBlockchainService();
      
      const balance = await blockchainService.getBalance(params.address, params.network || 'mainnet');
      const balanceEth = formatEther(balance);
      
      return {
        address: params.address,
        network: params.network || 'mainnet',
        balance: balance.toString(),
        balanceEth,
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ERC20 token balances for a given address
   * @param params - The address, optional token addresses, and network to check
   * @returns The token balances
   */
  public async getTokenBalances(params: typeof GetTokenBalancesSchema._type): Promise<TokenBalancesResponse> {
    try {
      const blockchainService = this.orchestrator.getBlockchainService();
      const network = params.network || 'mainnet';
      
      let tokenAddresses = params.tokenAddresses;
      
      // If no specific tokens requested, use common tokens for the network
      if (!tokenAddresses || tokenAddresses.length === 0) {
        tokenAddresses = this.getCommonTokens(network);
      }
      
      const tokenBalances = await blockchainService.getTokenBalances(
        params.address,
        tokenAddresses,
        network
      );
      
      return {
        address: params.address,
        network,
        tokens: tokenBalances.map(token => ({
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          balance: token.balance.toString(),
          balanceFormatted: formatUnits(token.balance, token.decimals),
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get token balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get NFT balances for a given address
   * @param params - The address, optional NFT contract addresses, and network to check
   * @returns The NFT balances
   */
  public async getNftBalances(params: typeof GetNftBalancesSchema._type): Promise<NftBalancesResponse> {
    try {
      const blockchainService = this.orchestrator.getBlockchainService();
      const network = params.network || 'mainnet';
      
      let contractAddresses = params.contractAddresses;
      
      // If no specific contracts requested, use common NFT contracts for the network
      if (!contractAddresses || contractAddresses.length === 0) {
        contractAddresses = this.getCommonNftContracts(network);
      }
      
      const nftBalances: NftBalancesResponse['nfts'] = [];
      
      for (const contractAddress of contractAddresses) {
        try {
          const balance = await blockchainService.getNFTBalance(
            contractAddress,
            params.address,
            network
          );
          
          if (balance > 0n) {
            // Get basic NFT info (name/symbol would require additional contract calls)
            nftBalances.push({
              contractAddress,
              balance: balance.toString(),
            });
          }
        } catch (error) {
          // Skip contracts that fail (they might not be NFT contracts)
          continue;
        }
      }
      
      return {
        address: params.address,
        network,
        nfts: nftBalances,
      };
    } catch (error) {
      throw new Error(`Failed to get NFT balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Craft a transaction for Ledger signing
   * @param params - The transaction parameters
   * @returns The crafted transaction ready for signing
   */
  public async craftTransaction(params: typeof CraftTransactionSchema._type): Promise<TransactionResponse> {
    try {
      const transactionCrafter = this.orchestrator.getTransactionCrafter();
      const network = params.network || 'mainnet';
      
      let preparedTx;
      
      switch (params.type) {
        case 'eth_transfer':
          if (!params.amount) throw new Error('Amount is required for ETH transfer');
          const ethTransferParams: any = {
            network,
            to: params.to as any,
            amount: params.amount,
          };
          if (params.gasLimit) ethTransferParams.gasLimit = BigInt(params.gasLimit);
          if (params.maxFeePerGas) ethTransferParams.maxFeePerGas = BigInt(params.maxFeePerGas);
          if (params.maxPriorityFeePerGas) ethTransferParams.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
          preparedTx = await transactionCrafter.craftETHTransfer(ethTransferParams);
          break;
          
        case 'erc20_transfer':
          if (!params.amount || !params.tokenAddress) {
            throw new Error('Amount and tokenAddress are required for ERC20 transfer');
          }
          const erc20TransferParams: any = {
            network,
            to: params.to as any,
            amount: params.amount,
            tokenAddress: params.tokenAddress as any,
          };
          if (params.gasLimit) erc20TransferParams.gasLimit = BigInt(params.gasLimit);
          if (params.maxFeePerGas) erc20TransferParams.maxFeePerGas = BigInt(params.maxFeePerGas);
          if (params.maxPriorityFeePerGas) erc20TransferParams.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
          preparedTx = await transactionCrafter.craftERC20Transfer(erc20TransferParams);
          break;
          
        case 'erc20_approve':
          if (!params.amount || !params.tokenAddress || !params.spender) {
            throw new Error('Amount, tokenAddress, and spender are required for ERC20 approve');
          }
          const erc20ApproveParams: any = {
            network,
            spender: params.spender as any,
            amount: params.amount,
            tokenAddress: params.tokenAddress as any,
          };
          if (params.gasLimit) erc20ApproveParams.gasLimit = BigInt(params.gasLimit);
          if (params.maxFeePerGas) erc20ApproveParams.maxFeePerGas = BigInt(params.maxFeePerGas);
          if (params.maxPriorityFeePerGas) erc20ApproveParams.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
          preparedTx = await transactionCrafter.craftERC20Approve(erc20ApproveParams);
          break;
          
        case 'custom':
          if (!params.contractAddress || !params.methodName) {
            throw new Error('contractAddress and methodName are required for custom transactions');
          }
          const customTransactionParams: any = {
            network,
            contractAddress: params.contractAddress as any,
            methodName: params.methodName,
            params: params.methodParams || [],
          };
          if (params.value) customTransactionParams.value = BigInt(params.value);
          if (params.gasLimit) customTransactionParams.gasLimit = BigInt(params.gasLimit);
          if (params.maxFeePerGas) customTransactionParams.maxFeePerGas = BigInt(params.maxFeePerGas);
          if (params.maxPriorityFeePerGas) customTransactionParams.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
          preparedTx = await transactionCrafter.craftCustomTransaction(customTransactionParams);
          break;
          
        default:
          throw new Error(`Unsupported transaction type: ${params.type}`);
      }
      
      const responseTransaction: TransactionResponse['transaction'] = {
        to: preparedTx.to,
        from: preparedTx.from,
        value: preparedTx.value.toString(),
        data: preparedTx.data,
        nonce: preparedTx.nonce,
        gasLimit: preparedTx.gasLimit.toString(),
        chainId: preparedTx.chainId,
        type: preparedTx.type,
      };
      
      if (preparedTx.maxFeePerGas !== undefined) {
        responseTransaction.maxFeePerGas = preparedTx.maxFeePerGas.toString();
      }
      if (preparedTx.maxPriorityFeePerGas !== undefined) {
        responseTransaction.maxPriorityFeePerGas = preparedTx.maxPriorityFeePerGas.toString();
      }
      if (preparedTx.gasPrice !== undefined) {
        responseTransaction.gasPrice = preparedTx.gasPrice.toString();
      }

      // Serialize the transaction for Ledger signing
      const { serializeTransaction } = await import('viem');
      
      // Convert PreparedTransaction to viem-compatible format
      const viemTx: any = {
        to: preparedTx.to,
        value: preparedTx.value,
        data: preparedTx.data,
        gas: preparedTx.gasLimit,
        nonce: preparedTx.nonce,
        chainId: preparedTx.chainId,
      };
      
      // Add EIP-1559 or legacy fields based on transaction type
      if (preparedTx.type === 'eip1559') {
        viemTx.type = 'eip1559';
        viemTx.maxFeePerGas = preparedTx.maxFeePerGas;
        viemTx.maxPriorityFeePerGas = preparedTx.maxPriorityFeePerGas;
      } else {
        viemTx.type = 'legacy';
        viemTx.gasPrice = preparedTx.gasPrice;
      }
      
      const serializedTransaction = serializeTransaction(viemTx);

      return {
        transaction: responseTransaction,
        gasEstimation: {
          gasLimit: preparedTx.gasLimit.toString(),
          maxFeePerGas: preparedTx.maxFeePerGas?.toString() || '0',
          maxPriorityFeePerGas: preparedTx.maxPriorityFeePerGas?.toString() || '0',
          estimatedCost: (preparedTx.gasLimit * (preparedTx.maxFeePerGas || 0n)).toString(),
          estimatedCostInEth: formatEther(preparedTx.gasLimit * (preparedTx.maxFeePerGas || 0n)),
        },
        serializedTransaction,
        message: 'Transaction crafted successfully. Ready for Ledger signing.',
      };
    } catch (error) {
      throw new Error(`Failed to craft transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get contract ABI from Blockscout
   * @param params - The contract address and network
   * @returns The contract ABI
   */
  public async getContractAbi(params: typeof GetContractAbiSchema._type): Promise<ContractAbiResponse> {
    try {
      const blockscoutClient = this.orchestrator.getBlockscoutClient();
      const network = params.network || 'mainnet';
      
      const abi = await blockscoutClient.getContractABI(params.contractAddress, network as any);
      
      // Get additional contract info
      let contractInfo;
      try {
        contractInfo = await blockscoutClient.getContractInfo(params.contractAddress, network as any);
      } catch (error) {
        // Contract info is optional
        contractInfo = null;
      }
      
      const response: ContractAbiResponse = {
        contractAddress: params.contractAddress,
        network,
        abi,
        verified: true, // If we got the ABI, it's verified
      };
      
      if (contractInfo) {
        response.contractInfo = {
          name: contractInfo.name || undefined,
          compiler: contractInfo.compiler || undefined,
          version: contractInfo.version || undefined,
          optimizationUsed: contractInfo.optimizationUsed || undefined,
          runs: contractInfo.runs || undefined,
        };
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to get contract ABI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign a transaction using the connected Ledger device
   * @param params - Transaction data, derivation path, and network
   * @returns The signature components and signed transaction
   */
  public async signTransaction(params: typeof SignTransactionSchema._type): Promise<TransactionSignatureResponse> {
    try {
      const ledgerService = this.orchestrator.getLedgerService();
      
      // Check if Ledger is connected
      if (!ledgerService.isConnected()) {
        throw new Error('Ledger device is not connected. Please connect your Ledger device.');
      }

      const derivationPath = params.derivationPath || "44'/60'/0'/0/0";
      const transactionData = params.transactionData;
      const network = params.network || 'mainnet';
      
      // Simple resolution data for Ledger signing
      const resolution = {
        domains: [],
        externalPlugin: [],
        plugin: [],
        nfts: [],
        erc20Tokens: []
      };

      console.log(`Signing transaction on ${network} with derivation path: ${derivationPath}`);
      
      // Sign the transaction with the Ledger device
      // Remove 0x prefix if present - Ledger expects raw hex without prefix
      const cleanTransactionData = transactionData.startsWith('0x') ? transactionData.slice(2) : transactionData;
      
      const signature = await ledgerService.signTransaction(
        derivationPath,
        cleanTransactionData,
        resolution
      );
      
      // Reconstruct the signed transaction properly using viem
      const { serializeTransaction, keccak256, parseTransaction } = await import('viem');
      
      // Parse the original transaction to get its structure
      const originalTransaction = parseTransaction(`0x${cleanTransactionData}`);
      
      // Convert signature components to proper format
      const vValue = parseInt(signature.v, 16);
      const signedTx = {
        ...originalTransaction,
        r: `0x${signature.r}` as `0x${string}`,
        s: `0x${signature.s}` as `0x${string}`,
        v: BigInt(vValue),
      };
      
      // Serialize the signed transaction
      const signedTransaction = serializeTransaction(signedTx);
      const transactionHash = keccak256(signedTransaction);
      
      return {
        signature: {
          r: signature.r,
          s: signature.s,
          v: signature.v,
        },
        signedTransaction,
        transactionHash,
        network,
        derivationPath,
      };
      
    } catch (error) {
      console.error('Sign transaction error:', error);
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign a message using the connected Ledger device (for Sign-In with Ethereum)
   * @param params - Message and derivation path
   * @returns The signature components
   */
  public async signMessage(params: typeof SignMessageSchema._type): Promise<MessageSignatureResponse> {
    try {
      const ledgerService = this.orchestrator.getLedgerService();
      
      // Check if Ledger is connected
      if (!ledgerService.isConnected()) {
        throw new Error('Ledger device is not connected. Please connect your Ledger device.');
      }

      const derivationPath = params.derivationPath || "44'/60'/0'/0/0";
      
      console.log(`Signing message with derivation path: ${derivationPath}`);
      
      // Get the address for this derivation path
      const addressResult = await ledgerService.getAddress(derivationPath, false, true);
      
      // Sign the message with the Ledger device
      const signature = await ledgerService.signPersonalMessage(derivationPath, params.message);
      
      // Format the signature as 0x + r + s + v
      const fullSignature = `0x${signature.r}${signature.s}${signature.v}`;
      
      return {
        signature: fullSignature,
        address: addressResult.address,
        derivationPath,
        message: params.message,
      };
      
    } catch (error) {
      console.error('Sign message error:', error);
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Craft and sign a transaction in one convenient step
   * @param params - Transaction parameters including signing derivation path
   * @returns The signed transaction ready for broadcast
   */
  public async craftAndSignTransaction(params: typeof CraftAndSignTransactionSchema._type): Promise<TransactionSignatureResponse> {
    try {
      // First craft the transaction
      const craftedTx = await this.craftTransaction(params);
      
      // Then sign it using the serialized transaction data
      const signParams = {
        transactionData: craftedTx.serializedTransaction,
        derivationPath: params.derivationPath || "44'/60'/0'/0/0",
        network: params.network || 'mainnet'
      };
      
      return await this.signTransaction(signParams);
    } catch (error) {
      console.error('Craft and sign transaction error:', error);
      throw new Error(`Failed to craft and sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Broadcast a signed transaction to the network
   * @param params - Signed transaction hex and network
   * @returns Transaction hash and status
   */
  public async broadcastTransaction(params: typeof BroadcastTransactionSchema._type): Promise<BroadcastTransactionResponse> {
    try {
      const blockchainService = this.orchestrator.getBlockchainService();
      const network = params.network || 'mainnet';
      
      console.log(`Broadcasting transaction on ${network}...`);
      
      // Broadcast the signed transaction
      const transactionHash = await blockchainService.broadcastTransaction(params.signedTransaction, network);
      
      // Get block explorer URL for the network
      const blockExplorerUrls: Record<string, string> = {
        mainnet: 'https://etherscan.io/tx/',
        sepolia: 'https://sepolia.etherscan.io/tx/',
        polygon: 'https://polygonscan.com/tx/',
        arbitrum: 'https://arbiscan.io/tx/',
        optimism: 'https://optimistic.etherscan.io/tx/',
        base: 'https://basescan.org/tx/',
      };
      
      const blockExplorerUrl = blockExplorerUrls[network] ? `${blockExplorerUrls[network]}${transactionHash}` : undefined;
      
      return {
        transactionHash,
        network,
        status: 'pending',
        blockExplorerUrl,
      };
      
    } catch (error) {
      console.error('Broadcast transaction error:', error);
      throw new Error(`Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get common token addresses for a network
   */
  private getCommonTokens(network: string): string[] {
    const commonTokens: Record<string, string[]> = {
      mainnet: [
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      ],
      polygon: [
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC.e
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH
      ],
      arbitrum: [
        '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e
        '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
        '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
      ],
      optimism: [
        '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC.e
        '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
        '0x68f180fcCe6836688e9084f035309E29Bf0A2095', // WBTC
        '0x4200000000000000000000000000000000000006', // WETH
      ],
      base: [
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
        '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
        '0x4200000000000000000000000000000000000006', // WETH
      ],
    };
    
    return commonTokens[network] || [];
  }

  /**
   * Get common NFT contract addresses for a network
   */
  private getCommonNftContracts(network: string): string[] {
    const commonNfts: Record<string, string[]> = {
      mainnet: [
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
        '0x60E4d786628Fea6478F785A6d7e704777c86a7c6', // MAYC
        '0xED5AF388653567Af2F388E6224dC7C4b3241C544', // Azuki
        '0x23581767a106ae21c074b2276D25e5C3e136a68b', // Moonbirds
        '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e', // Doodles
      ],
      polygon: [
        '0x9df8Aa7C681f33E442A0d57B838555da863504f3', // Aavegotchi
      ],
    };
    
    return commonNfts[network] || [];
  }

  // CONVENIENCE METHODS

  /**
   * Send ETH - Convenience method that crafts, signs, and broadcasts an ETH transfer
   * @param params - Recipient, amount, network, and gas parameters
   * @returns Complete transaction result with hash and status
   */
  public async sendEth(params: typeof SendEthSchema._type): Promise<SendTransactionResponse> {
    try {
      console.log(`Sending ${params.amount} ETH to ${params.to} on ${params.network || 'mainnet'}`);

      // Step 1: Craft the transaction
      const craftParams = {
        type: 'eth_transfer' as const,
        network: params.network || 'mainnet',
        to: params.to,
        amount: params.amount,
        gasLimit: params.gasLimit,
        maxFeePerGas: params.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas,
      };

      const craftedTx = await this.craftTransaction(craftParams);

      // Step 2: Sign the transaction
      const signParams = {
        transactionData: craftedTx.serializedTransaction,
        derivationPath: params.derivationPath || "44'/60'/0'/0/0",
        network: params.network || 'mainnet'
      };

      const signedTx = await this.signTransaction(signParams);

      // Step 3: Broadcast the transaction
      const broadcastParams = {
        signedTransaction: signedTx.signedTransaction,
        network: params.network || 'mainnet'
      };

      const broadcast = await this.broadcastTransaction(broadcastParams);

      // Return consolidated response
      return {
        transactionHash: broadcast.transactionHash,
        network: params.network || 'mainnet',
        from: craftedTx.transaction.from,
        to: params.to,
        amount: params.amount,
        gasUsed: craftedTx.gasEstimation.gasLimit,
        status: broadcast.status,
        blockExplorerUrl: broadcast.blockExplorerUrl,
        type: 'eth_transfer'
      };

    } catch (error) {
      console.error('Send ETH error:', error);
      throw new Error(`Failed to send ETH: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send ERC20 Token - Convenience method that crafts, signs, and broadcasts an ERC20 transfer
   * @param params - Token address, recipient, amount, network, and gas parameters
   * @returns Complete transaction result with hash and status
   */
  public async sendErc20Token(params: typeof SendErc20TokenSchema._type): Promise<SendTransactionResponse> {
    try {
      console.log(`Sending ${params.amount} tokens from ${params.tokenAddress} to ${params.to} on ${params.network || 'mainnet'}`);

      // Step 1: Craft the transaction
      const craftParams = {
        type: 'erc20_transfer' as const,
        network: params.network || 'mainnet',
        to: params.to,
        amount: params.amount,
        tokenAddress: params.tokenAddress,
        gasLimit: params.gasLimit,
        maxFeePerGas: params.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas,
      };

      const craftedTx = await this.craftTransaction(craftParams);

      // Step 2: Sign the transaction
      const signParams = {
        transactionData: craftedTx.serializedTransaction,
        derivationPath: params.derivationPath || "44'/60'/0'/0/0",
        network: params.network || 'mainnet'
      };

      const signedTx = await this.signTransaction(signParams);

      // Step 3: Broadcast the transaction
      const broadcastParams = {
        signedTransaction: signedTx.signedTransaction,
        network: params.network || 'mainnet'
      };

      const broadcast = await this.broadcastTransaction(broadcastParams);

      // Try to get token info for better response
      let tokenSymbol = 'TOKEN';
      try {
        const blockchainService = this.orchestrator.getBlockchainService();
        const tokenInfo = await blockchainService.getTokenInfo(params.tokenAddress as any, params.network || 'mainnet');
        tokenSymbol = tokenInfo.symbol;
      } catch (error) {
        console.warn('Could not fetch token symbol:', error);
      }

      // Return consolidated response
      return {
        transactionHash: broadcast.transactionHash,
        network: params.network || 'mainnet',
        from: craftedTx.transaction.from,
        to: params.to,
        amount: params.amount,
        gasUsed: craftedTx.gasEstimation.gasLimit,
        status: broadcast.status,
        blockExplorerUrl: broadcast.blockExplorerUrl,
        type: 'erc20_transfer',
        tokenInfo: {
          address: params.tokenAddress,
          symbol: tokenSymbol
        }
      };

    } catch (error) {
      console.error('Send ERC20 token error:', error);
      throw new Error(`Failed to send ERC20 token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send ERC721 NFT - Convenience method that crafts, signs, and broadcasts an ERC721 transfer
   * @param params - Contract address, recipient, token ID, network, and gas parameters
   * @returns Complete transaction result with hash and status
   */
  public async sendErc721Token(params: typeof SendErc721TokenSchema._type): Promise<SendTransactionResponse> {
    try {
      console.log(`Transferring NFT ${params.tokenId} from ${params.contractAddress} to ${params.to} on ${params.network || 'mainnet'}`);

      // Get the from address first
      const ledgerService = this.orchestrator.getLedgerService();
      if (!ledgerService.isConnected()) {
        await this.orchestrator.initialize();
      }
      const addressInfo = await ledgerService.getAddress(params.derivationPath || "44'/60'/0'/0/0");
      const from = addressInfo.address;

      // Step 1: Craft the custom transaction for ERC721 safeTransferFrom
      const craftParams = {
        type: 'custom' as const,
        network: params.network || 'mainnet',
        to: params.contractAddress, // For custom transactions, 'to' is the contract address
        contractAddress: params.contractAddress,
        methodName: 'safeTransferFrom',
        methodParams: [from, params.to, params.tokenId],
        value: '0',
        gasLimit: params.gasLimit,
        maxFeePerGas: params.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas,
      };

      const craftedTx = await this.craftTransaction(craftParams);

      // Step 2: Sign the transaction
      const signParams = {
        transactionData: craftedTx.serializedTransaction,
        derivationPath: params.derivationPath || "44'/60'/0'/0/0",
        network: params.network || 'mainnet'
      };

      const signedTx = await this.signTransaction(signParams);

      // Step 3: Broadcast the transaction
      const broadcastParams = {
        signedTransaction: signedTx.signedTransaction,
        network: params.network || 'mainnet'
      };

      const broadcast = await this.broadcastTransaction(broadcastParams);

      // Return consolidated response
      return {
        transactionHash: broadcast.transactionHash,
        network: params.network || 'mainnet',
        from: craftedTx.transaction.from,
        to: params.to,
        amount: '1', // NFTs are always 1 unit
        gasUsed: craftedTx.gasEstimation.gasLimit,
        status: broadcast.status,
        blockExplorerUrl: broadcast.blockExplorerUrl,
        type: 'erc721_transfer',
        tokenInfo: {
          address: params.contractAddress,
          tokenId: params.tokenId
        }
      };

    } catch (error) {
      console.error('Send ERC721 token error:', error);
      throw new Error(`Failed to send ERC721 token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Manage Token Approvals - Convenience method to approve, revoke, increase, or decrease token allowances
   * @param params - Token address, spender, action, amount, network, and gas parameters
   * @returns Complete transaction result with hash and status
   */
  public async manageTokenApproval(params: typeof ManageTokenApprovalSchema._type): Promise<TokenApprovalResponse> {
    try {
      const { action, tokenAddress, spender, amount } = params;
      const network = params.network || 'mainnet';
      
      console.log(`${action} token approval for ${tokenAddress} spender ${spender} on ${network}`);

      let craftParams: any;
      let finalAmount = '0';

      switch (action) {
        case 'approve':
          if (!amount) throw new Error('Amount is required for approve action');
          craftParams = {
            type: 'erc20_approve' as const,
            network,
            tokenAddress,
            spender,
            amount,
            gasLimit: params.gasLimit,
            maxFeePerGas: params.maxFeePerGas,
            maxPriorityFeePerGas: params.maxPriorityFeePerGas,
          };
          finalAmount = amount;
          break;

        case 'revoke':
          craftParams = {
            type: 'erc20_approve' as const,
            network,
            tokenAddress,
            spender,
            amount: '0',
            gasLimit: params.gasLimit,
            maxFeePerGas: params.maxFeePerGas,
            maxPriorityFeePerGas: params.maxPriorityFeePerGas,
          };
          finalAmount = '0';
          break;

        case 'increase':
        case 'decrease':
          // For increase/decrease, we need to get current allowance first
          // Then calculate new amount and use approve
          throw new Error(`${action} action not yet implemented - use approve with specific amount instead`);

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Step 1: Craft the transaction
      const craftedTx = await this.craftTransaction(craftParams);

      // Step 2: Sign the transaction
      const signParams = {
        transactionData: craftedTx.serializedTransaction,
        derivationPath: params.derivationPath || "44'/60'/0'/0/0",
        network
      };

      const signedTx = await this.signTransaction(signParams);

      // Step 3: Broadcast the transaction
      const broadcastParams = {
        signedTransaction: signedTx.signedTransaction,
        network
      };

      const broadcast = await this.broadcastTransaction(broadcastParams);

      // Return consolidated response
      return {
        transactionHash: broadcast.transactionHash,
        network,
        token: tokenAddress,
        spender,
        action,
        amount: finalAmount,
        status: broadcast.status,
        blockExplorerUrl: broadcast.blockExplorerUrl
      };

    } catch (error) {
      console.error('Manage token approval error:', error);
      throw new Error(`Failed to manage token approval: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gas Analysis - Comprehensive gas estimation and network analysis tool
   * @param params - Network, transaction type, and optional transaction details
   * @returns Detailed gas analysis with current prices, estimates, and recommendations
   */
  public async analyzeGas(params: typeof GasAnalysisSchema._type): Promise<GasAnalysisResponse> {
    try {
      const network = params.network || 'mainnet';
      console.log(`Analyzing gas conditions for ${network}${params.transactionType ? ` (${params.transactionType})` : ''}`);

      const blockchainService = this.orchestrator.getBlockchainService();

      // Get current gas prices and network stats
      const currentBlock = await this.getCurrentBlockInfo(network);

      // Calculate gas prices for different speeds
      const baseFee = BigInt(currentBlock.baseFee);
      const gasPrices = this.calculateGasPrices(baseFee);

      // Get transaction-specific estimation if details provided
      let transactionEstimate;
      if (params.transactionType) {
        transactionEstimate = await this.estimateTransactionGas(params, network);
      }

      // Determine network congestion level
      const congestionLevel = this.calculateCongestionLevel(currentBlock.gasUsedPercent);

      // Generate recommendations
      const recommendations = this.generateGasRecommendations(gasPrices, congestionLevel, params.speed);

      // Try to get ETH price for USD conversions (non-critical)
      let ethPriceUsd: number | undefined;
      try {
        // This is a simple fallback - in production you'd use a price API
        ethPriceUsd = 3000; // Placeholder - could integrate with CoinGecko/CoinMarketCap
      } catch (error) {
        console.warn('Could not fetch ETH price for USD conversion');
      }

      const result: GasAnalysisResponse = {
        network,
        timestamp: new Date().toISOString(),
        currentGasPrices: {
          slow: this.formatGasPrice(gasPrices.slow, transactionEstimate?.estimatedGasLimit || '21000', ethPriceUsd),
          standard: this.formatGasPrice(gasPrices.standard, transactionEstimate?.estimatedGasLimit || '21000', ethPriceUsd),
          fast: this.formatGasPrice(gasPrices.fast, transactionEstimate?.estimatedGasLimit || '21000', ethPriceUsd),
          instant: this.formatGasPrice(gasPrices.instant, transactionEstimate?.estimatedGasLimit || '21000', ethPriceUsd),
        },
        networkStats: {
          baseFee: currentBlock.baseFee,
          baseFeeInGwei: (Number(currentBlock.baseFee) / 1e9).toFixed(2),
          nextBlockBaseFee: this.calculateNextBaseFee(baseFee, currentBlock.gasUsedPercent).toString(),
          gasUsedPercent: currentBlock.gasUsedPercent,
          congestionLevel,
        },
        recommendations,
      };

      if (transactionEstimate) {
        result.transactionEstimate = transactionEstimate;
      }

      return result;

    } catch (error) {
      console.error('Gas analysis error:', error);
      throw new Error(`Failed to analyze gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current block information
   */
  private async getCurrentBlockInfo(network: string): Promise<{ baseFee: string; gasUsedPercent: number }> {
    try {
      const blockchainService = this.orchestrator.getBlockchainService();
      const client = (blockchainService as any).getClient(network);
      
      const block = await client.getBlock({ blockTag: 'latest' });
      const gasUsedPercent = Number(block.gasUsed * BigInt(100) / block.gasLimit);
      
      return {
        baseFee: block.baseFeePerGas?.toString() || '0',
        gasUsedPercent,
      };
    } catch (error) {
      console.warn('Could not get block info, using defaults:', error);
      return { baseFee: '20000000000', gasUsedPercent: 50 }; // 20 gwei default
    }
  }

  /**
   * Calculate gas prices for different speeds based on base fee
   */
  private calculateGasPrices(baseFee: bigint) {
    const slowPriorityFee = BigInt(1e9); // 1 gwei
    const standardPriorityFee = BigInt(2e9); // 2 gwei
    const fastPriorityFee = BigInt(5e9); // 5 gwei
    const instantPriorityFee = BigInt(10e9); // 10 gwei

    return {
      slow: {
        maxFeePerGas: baseFee + slowPriorityFee,
        maxPriorityFeePerGas: slowPriorityFee,
        estimatedTime: '5-10 minutes',
      },
      standard: {
        maxFeePerGas: baseFee + standardPriorityFee,
        maxPriorityFeePerGas: standardPriorityFee,
        estimatedTime: '1-3 minutes',
      },
      fast: {
        maxFeePerGas: baseFee + fastPriorityFee,
        maxPriorityFeePerGas: fastPriorityFee,
        estimatedTime: '15-30 seconds',
      },
      instant: {
        maxFeePerGas: baseFee + instantPriorityFee,
        maxPriorityFeePerGas: instantPriorityFee,
        estimatedTime: '< 15 seconds',
      },
    };
  }

  /**
   * Format gas price information with costs
   */
  private formatGasPrice(gasPrice: any, gasLimit: string, ethPriceUsd?: number) {
    const totalCostWei = gasPrice.maxFeePerGas * BigInt(gasLimit);
    const totalCostEth = Number(totalCostWei) / 1e18;
    
    const result: any = {
      maxFeePerGas: gasPrice.maxFeePerGas.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas.toString(),
      estimatedTime: gasPrice.estimatedTime,
      costInWei: totalCostWei.toString(),
      costInEth: totalCostEth.toFixed(8),
    };

    if (ethPriceUsd !== undefined) {
      result.costInUsd = (totalCostEth * ethPriceUsd).toFixed(2);
    }

    return result;
  }

  /**
   * Estimate gas for specific transaction types
   */
  private async estimateTransactionGas(params: any, network: string) {
    const gasLimits = {
      eth_transfer: 21000,
      erc20_transfer: 65000,
      erc20_approve: 46000,
      nft_transfer: 85000,
      contract_interaction: 150000, // Conservative estimate
    };

    const baseLimit = gasLimits[params.transactionType as keyof typeof gasLimits] || 150000;
    const recommendedLimit = Math.floor(baseLimit * 1.2); // Add 20% buffer

    const tips = [];
    let explanation = '';

    switch (params.transactionType) {
      case 'eth_transfer':
        explanation = 'Simple ETH transfer uses exactly 21,000 gas';
        tips.push('ETH transfers have fixed gas cost');
        break;
      case 'erc20_transfer':
        explanation = 'ERC20 transfers typically use ~65,000 gas';
        tips.push('First-time recipients may cost more gas');
        tips.push('Token contracts with transfer fees may use more gas');
        break;
      case 'erc20_approve':
        explanation = 'ERC20 approvals typically use ~46,000 gas';
        tips.push('Setting approval to 0 then to desired amount may be required for some tokens');
        break;
      case 'nft_transfer':
        explanation = 'NFT transfers (safeTransferFrom) typically use ~85,000 gas';
        tips.push('Gas cost varies by NFT contract complexity');
        break;
      case 'contract_interaction':
        explanation = 'Contract interactions vary widely - this is a conservative estimate';
        tips.push('Complex contracts may use significantly more gas');
        tips.push('Consider simulating the transaction first');
        break;
    }

    return {
      type: params.transactionType,
      estimatedGasLimit: baseLimit.toString(),
      recommendedGasLimit: recommendedLimit.toString(),
      explanation,
      tips,
    };
  }

  /**
   * Calculate network congestion level
   */
  private calculateCongestionLevel(gasUsedPercent: number): 'low' | 'medium' | 'high' | 'extreme' {
    if (gasUsedPercent < 50) return 'low';
    if (gasUsedPercent < 80) return 'medium';
    if (gasUsedPercent < 95) return 'high';
    return 'extreme';
  }

  /**
   * Calculate next block base fee using EIP-1559 formula
   */
  private calculateNextBaseFee(baseFee: bigint, gasUsedPercent: number): bigint {
    const targetGasUsed = 50; // 50% target
    const maxChangePercent = 12.5; // 12.5% max change per block
    
    if (gasUsedPercent > targetGasUsed) {
      const increase = (gasUsedPercent - targetGasUsed) / targetGasUsed * maxChangePercent;
      return baseFee + (baseFee * BigInt(Math.floor(increase * 100)) / BigInt(10000));
    } else {
      const decrease = (targetGasUsed - gasUsedPercent) / targetGasUsed * maxChangePercent;
      return baseFee - (baseFee * BigInt(Math.floor(decrease * 100)) / BigInt(10000));
    }
  }

  /**
   * Generate gas recommendations based on network conditions
   */
  private generateGasRecommendations(gasPrices: any, congestionLevel: string, preferredSpeed?: string) {
    let bestForCost: 'slow' | 'standard' | 'fast' | 'instant' = 'slow';
    let bestForSpeed: 'slow' | 'standard' | 'fast' | 'instant' = 'instant';
    let recommended: 'slow' | 'standard' | 'fast' | 'instant' = 'standard';
    let reasoning = '';

    switch (congestionLevel) {
      case 'low':
        recommended = preferredSpeed === 'slow' ? 'slow' : 'standard';
        reasoning = 'Network congestion is low. Standard speed offers good balance of cost and speed.';
        break;
      case 'medium':
        recommended = preferredSpeed === 'fast' || preferredSpeed === 'instant' ? 'fast' : 'standard';
        reasoning = 'Medium network congestion. Standard speed should work well, or fast if urgent.';
        break;
      case 'high':
        recommended = preferredSpeed === 'slow' ? 'standard' : 'fast';
        reasoning = 'High network congestion. Fast speed recommended to avoid delays.';
        break;
      case 'extreme':
        recommended = 'instant';
        reasoning = 'Extreme network congestion. Instant speed recommended to ensure transaction inclusion.';
        break;
    }

    return {
      bestForSpeed,
      bestForCost,
      recommended,
      reasoning,
    };
  }
}