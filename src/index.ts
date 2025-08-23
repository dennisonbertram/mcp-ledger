#!/usr/bin/env node
/**
 * Main entry point for the MCP Ledger server
 * Initializes the MCP server with stdio transport and real service integrations
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  GetLedgerAddressSchema,
  GetBalanceSchema,
  GetTokenBalancesSchema,
  GetNftBalancesSchema,
  CraftTransactionSchema,
  GetContractAbiSchema,
} from './types/index.js';
import { ServiceOrchestrator } from './services/orchestrator.js';
import { ToolHandlers } from './handlers/tools.js';

// Server configuration
const SERVER_NAME = 'mcp-ledger-server';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'MCP server for Ledger hardware wallet integration with Ethereum blockchain';

// Global orchestrator instance
let orchestrator: ServiceOrchestrator;
let toolHandlers: ToolHandlers;

/**
 * Initialize services and orchestrator
 */
async function initializeServices(): Promise<void> {
  console.error('Initializing services...');
  
  // Create service orchestrator with default configuration
  orchestrator = new ServiceOrchestrator({
    defaultNetwork: 'mainnet',
    blockchain: {
      defaultNetwork: 'mainnet',
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      requestTimeout: 30000, // 30 seconds
      maxRetries: 3,
    },
    blockscout: {
      defaultNetwork: 'mainnet',
      cacheEnabled: true,
      cacheTTL: 3600, // 1 hour
      timeout: 30000,
      retries: 3,
    },
    transactionCrafter: {
      defaultNetwork: 'mainnet',
      validateBeforeSigning: true,
      autoEstimateGas: true,
      securityChecks: true,
      ledgerDerivationPath: "44'/60'/0'/0/0",
    },
  });

  // Create tool handlers
  toolHandlers = new ToolHandlers(orchestrator);

  // Initialize services (this will attempt to connect to Ledger)
  try {
    const initialized = await orchestrator.initialize();
    if (initialized) {
      console.error('✓ Ledger device connected successfully');
    } else {
      console.error('⚠ Ledger device not connected (can be connected later)');
    }
  } catch (error) {
    console.error('⚠ Warning: Could not connect to Ledger device at startup:', error instanceof Error ? error.message : 'Unknown error');
    console.error('  Device can be connected later when needed.');
  }

  console.error('Services initialized successfully');
}

/**
 * Initialize and start the MCP server
 */
async function startServer() {
  console.error(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`);

  // Initialize services first
  await initializeServices();

  // Create the MCP server instance
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Register tool: get_ledger_address
  server.tool(
    'get_ledger_address',
    'Get the Ethereum address from the connected Ledger device',
    {
      derivationPath: GetLedgerAddressSchema.shape.derivationPath,
      display: GetLedgerAddressSchema.shape.display,
    },
    async (params) => {
      try {
        const result = await toolHandlers.getLedgerAddress(params as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool: get_balance
  server.tool(
    'get_balance',
    'Get the ETH balance for a given Ethereum address on the specified network',
    {
      address: GetBalanceSchema.shape.address,
      network: GetBalanceSchema.shape.network,
    },
    async (params) => {
      try {
        const result = await toolHandlers.getBalance(params as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool: get_token_balances
  server.tool(
    'get_token_balances',
    'Get ERC20 token balances for a given Ethereum address on the specified network',
    {
      address: GetTokenBalancesSchema.shape.address,
      tokenAddresses: GetTokenBalancesSchema.shape.tokenAddresses,
      network: GetTokenBalancesSchema.shape.network,
    },
    async (params) => {
      try {
        const result = await toolHandlers.getTokenBalances(params as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool: get_nft_balances
  server.tool(
    'get_nft_balances',
    'Get ERC721/ERC1155 NFT balances for a given Ethereum address on the specified network',
    {
      address: GetNftBalancesSchema.shape.address,
      contractAddresses: GetNftBalancesSchema.shape.contractAddresses,
      network: GetNftBalancesSchema.shape.network,
    },
    async (params) => {
      try {
        const result = await toolHandlers.getNftBalances(params as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool: craft_transaction
  server.tool(
    'craft_transaction',
    'Craft various types of Ethereum transactions for Ledger signing (ETH transfer, ERC20 transfer/approve, custom contract calls)',
    {
      type: CraftTransactionSchema.shape.type,
      network: CraftTransactionSchema.shape.network,
      to: CraftTransactionSchema.shape.to,
      amount: CraftTransactionSchema.shape.amount,
      tokenAddress: CraftTransactionSchema.shape.tokenAddress,
      spender: CraftTransactionSchema.shape.spender,
      contractAddress: CraftTransactionSchema.shape.contractAddress,
      methodName: CraftTransactionSchema.shape.methodName,
      methodParams: CraftTransactionSchema.shape.methodParams,
      value: CraftTransactionSchema.shape.value,
      gasLimit: CraftTransactionSchema.shape.gasLimit,
      maxFeePerGas: CraftTransactionSchema.shape.maxFeePerGas,
      maxPriorityFeePerGas: CraftTransactionSchema.shape.maxPriorityFeePerGas,
    },
    async (params) => {
      try {
        const result = await toolHandlers.craftTransaction(params as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool: get_contract_abi
  server.tool(
    'get_contract_abi',
    'Retrieve contract ABI from Blockscout for a given contract address on the specified network',
    {
      contractAddress: GetContractAbiSchema.shape.contractAddress,
      network: GetContractAbiSchema.shape.network,
    },
    async (params) => {
      try {
        const result = await toolHandlers.getContractAbi(params as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register a resource for server information
  server.resource(
    'server-info',
    'mcp-ledger://server/info',
    {
      name: 'Server Information',
      description: 'Information about the MCP Ledger server and service health',
      mimeType: 'application/json',
    },
    async () => {
      const healthCheck = await orchestrator.healthCheck();
      return {
        contents: [
          {
            uri: 'mcp-ledger://server/info',
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                name: SERVER_NAME,
                version: SERVER_VERSION,
                description: SERVER_DESCRIPTION,
                health: healthCheck,
                capabilities: {
                  tools: [
                    'get_ledger_address',
                    'get_balance',
                    'get_token_balances',
                    'get_nft_balances',
                    'craft_transaction',
                    'get_contract_abi',
                  ],
                  resources: ['server-info'],
                  prompts: ['transaction-review'],
                },
                supportedNetworks: [
                  'mainnet',
                  'sepolia',
                  'polygon',
                  'arbitrum',
                  'optimism',
                  'base',
                ],
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Register a prompt for transaction review
  server.prompt(
    'transaction-review',
    'Review and explain an Ethereum transaction before signing with detailed analysis',
    {
      transaction: z.string().describe('JSON string of the transaction object to review'),
    },
    async (args) => {
      let tx: any;
      try {
        tx = JSON.parse(args.transaction);
      } catch (e) {
        tx = { to: 'Invalid', value: '0', data: 'Parse error' };
      }
      
      // Enhanced transaction analysis
      let transactionType = 'Unknown';
      let riskLevel = 'Low';
      let analysis = '';

      if (tx.data === '0x' || !tx.data) {
        transactionType = 'ETH Transfer';
        analysis = 'Simple ETH transfer transaction.';
      } else if (tx.data.startsWith('0xa9059cbb')) {
        transactionType = 'ERC20 Transfer';
        analysis = 'ERC20 token transfer transaction.';
      } else if (tx.data.startsWith('0x095ea7b3')) {
        transactionType = 'ERC20 Approve';
        analysis = 'ERC20 token approval transaction. Be cautious with unlimited approvals.';
        riskLevel = 'Medium';
      } else {
        transactionType = 'Contract Interaction';
        analysis = 'Custom contract interaction. Verify the contract is trusted.';
        riskLevel = 'Medium';
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review this Ethereum transaction:

📋 TRANSACTION DETAILS:
Type: ${transactionType}
To: ${tx.to}
From: ${tx.from || 'Your Ledger Address'}
Value: ${tx.value} wei (${(parseFloat(tx.value) / 1e18).toFixed(6)} ETH)
Data: ${tx.data || 'None'}
Gas Limit: ${tx.gasLimit || 'Not set'}
Max Fee Per Gas: ${tx.maxFeePerGas || 'Not set'} wei
Max Priority Fee: ${tx.maxPriorityFeePerGas || 'Not set'} wei
Chain ID: ${tx.chainId || 'Not set'}
Nonce: ${tx.nonce || 'Not set'}

⚠️ RISK ASSESSMENT: ${riskLevel}
📊 ANALYSIS: ${analysis}

Please explain what this transaction will do, any potential risks, and whether it should be signed.`,
            },
          },
        ],
      };
    }
  );

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Handle server shutdown gracefully
  const handleShutdown = async () => {
    console.error('Shutting down server...');
    try {
      if (orchestrator) {
        await orchestrator.shutdown();
      }
      await server.close();
      console.error('Server shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    handleShutdown();
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    handleShutdown();
  });

  // Connect the server to the transport
  try {
    await server.connect(transport);
    console.error(`${SERVER_NAME} is running and ready to receive requests via stdio`);
    console.error('Available tools: get_ledger_address, get_balance, get_token_balances, get_nft_balances, craft_transaction, get_contract_abi');
    console.error('Supported networks: mainnet, sepolia, polygon, arbitrum, optimism, base');
  } catch (error) {
    console.error('Failed to start server:', error);
    if (orchestrator) {
      await orchestrator.shutdown();
    }
    process.exit(1);
  }
}

// Start the server
startServer().catch(async (error) => {
  console.error('Fatal error:', error);
  if (orchestrator) {
    await orchestrator.shutdown();
  }
  process.exit(1);
});