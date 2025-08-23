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
  LedgerAddressResponse,
  BalanceResponse,
  TokenBalancesResponse,
  NftBalancesResponse,
  TransactionResponse,
  ContractAbiResponse,
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

      return {
        transaction: responseTransaction,
        gasEstimation: {
          gasLimit: preparedTx.gasLimit.toString(),
          maxFeePerGas: preparedTx.maxFeePerGas?.toString() || '0',
          maxPriorityFeePerGas: preparedTx.maxPriorityFeePerGas?.toString() || '0',
          estimatedCost: (preparedTx.gasLimit * (preparedTx.maxFeePerGas || 0n)).toString(),
          estimatedCostInEth: formatEther(preparedTx.gasLimit * (preparedTx.maxFeePerGas || 0n)),
        },
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
}