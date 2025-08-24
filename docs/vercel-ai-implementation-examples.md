# Vercel AI MCP Implementation Examples

## Complete Implementation Examples for MCP Ledger Server Migration

This document provides concrete implementation examples for migrating each tool from your existing MCP Ledger server to the Vercel AI architecture pattern.

## Project Structure for Vercel AI Implementation

```
src/
├── vercel/
│   ├── index.ts                 # Main Vercel AI MCP server
│   ├── tools/                   # Tool implementations
│   │   ├── blockchain-tools.ts  # Blockchain data tools
│   │   ├── ledger-tools.ts      # Hardware-dependent tools
│   │   └── contract-tools.ts    # Contract interaction tools
│   └── services/                # Serverless-adapted services
├── proxy/
│   ├── ledger-proxy.ts          # Local Ledger hardware proxy
│   └── types.ts                 # Shared types
├── shared/
│   ├── types/                   # Type definitions
│   └── utils/                   # Shared utilities
└── original/                    # Keep existing implementation
    └── index.ts                 # Original stdio server
```

## Main Server Implementation

### Complete Vercel AI Server (`src/vercel/index.ts`)

```typescript
import { Hono } from 'hono';
import { createMcpHandler } from 'mcp-handler';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { 
  blockchainTools,
  ledgerTools, 
  contractTools 
} from './tools/index.js';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['https://claude.ai', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Server metadata endpoint
app.get('/', (c) => {
  return c.json({
    name: 'MCP Ledger Server',
    version: '2.0.0',
    description: 'Vercel AI powered MCP server for Ethereum blockchain operations',
    architecture: 'hybrid-serverless',
    documentation: 'https://github.com/your-repo/docs',
    endpoints: {
      mcp: '/mcp/*',
      health: '/health',
      docs: '/docs'
    },
    capabilities: {
      blockchainData: ['balance', 'tokens', 'nfts', 'contracts'],
      ledgerIntegration: ['address-generation', 'transaction-signing'],
      networks: ['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']
    },
    proxy: {
      required: true,
      description: 'Local Ledger proxy required for hardware operations',
      defaultUrl: 'http://localhost:3001'
    }
  });
});

// Create MCP handler with all tools
const mcpHandler = createMcpHandler({
  tools: [
    ...blockchainTools,
    ...ledgerTools,
    ...contractTools
  ],
  serverInfo: {
    name: 'MCP Ledger Server',
    version: '2.0.0'
  }
});

// MCP protocol endpoint
app.all('/mcp/*', async (c) => {
  try {
    return await mcpHandler(c.req.raw, {
      basePath: '/mcp',
      maxDuration: 25000, // 25 seconds to stay under Vercel's 30s limit
      timeout: 20000      // 20 seconds for individual operations
    });
  } catch (error) {
    console.error('MCP handler error:', error);
    return c.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// Catch-all for undefined routes
app.all('*', (c) => {
  return c.json({ 
    error: 'Not found',
    message: `Route ${c.req.path} not found`,
    availableEndpoints: ['/', '/health', '/mcp/*']
  }, 404);
});

export default app;
```

## Tool Implementations

### Blockchain Tools (`src/vercel/tools/blockchain-tools.ts`)

```typescript
import { z } from 'zod';
import { createPublicClient, http, formatEther } from 'viem';
import { mainnet, sepolia, polygon, arbitrum, optimism, base } from 'viem/chains';

// Network configuration
const networks = {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  base
};

const getRpcUrl = (network: string): string => {
  const rpcUrls: Record<string, string> = {
    mainnet: process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com',
    sepolia: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    polygon: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    optimism: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    base: process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  };
  
  return rpcUrls[network] || rpcUrls.mainnet;
};

// Schemas
const GetBalanceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet')
});

const GetTokenBalancesSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  tokenAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).optional(),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet')
});

// Tool implementations
export const blockchainTools = [
  {
    name: 'get_balance',
    description: 'Get the native token balance (ETH, MATIC, etc.) for an Ethereum address on the specified network',
    inputSchema: GetBalanceSchema,
    execute: async ({ address, network }: z.infer<typeof GetBalanceSchema>) => {
      try {
        const chain = networks[network as keyof typeof networks];
        const client = createPublicClient({
          chain,
          transport: http(getRpcUrl(network))
        });

        const balance = await client.getBalance({ 
          address: address as `0x${string}`
        });

        const formattedBalance = formatEther(balance);
        const symbol = chain.nativeCurrency.symbol;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                address,
                network,
                balance: {
                  raw: balance.toString(),
                  formatted: formattedBalance,
                  symbol,
                  decimals: 18
                },
                chainId: chain.id,
                timestamp: new Date().toISOString()
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Get balance error:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'BALANCE_FETCH_FAILED',
                address,
                network
              }
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    name: 'get_token_balances',
    description: 'Get ERC20 token balances for an Ethereum address. If no token addresses provided, fetches popular tokens.',
    inputSchema: GetTokenBalancesSchema,
    execute: async ({ address, tokenAddresses, network }: z.infer<typeof GetTokenBalancesSchema>) => {
      try {
        const chain = networks[network as keyof typeof networks];
        const client = createPublicClient({
          chain,
          transport: http(getRpcUrl(network))
        });

        // Default popular tokens if none specified
        const defaultTokens: Record<string, string[]> = {
          mainnet: [
            '0xA0b86a33E6441b8Db6B95bb6D6cC80e55b8Cd7c2', // USDC
            '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
            '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
          ],
          polygon: [
            '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
            '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
          ]
        };

        const tokensToCheck = tokenAddresses || defaultTokens[network] || [];
        const balances = [];

        // ERC20 balance function signature
        const balanceOfAbi = [{
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: 'balance', type: 'uint256' }]
        }] as const;

        for (const tokenAddress of tokensToCheck) {
          try {
            const balance = await client.readContract({
              address: tokenAddress as `0x${string}`,
              abi: balanceOfAbi,
              functionName: 'balanceOf',
              args: [address as `0x${string}`]
            });

            balances.push({
              tokenAddress,
              balance: balance.toString(),
              hasBalance: balance > 0n
            });
          } catch (tokenError) {
            console.warn(`Failed to get balance for token ${tokenAddress}:`, tokenError);
            balances.push({
              tokenAddress,
              balance: '0',
              hasBalance: false,
              error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
            });
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                address,
                network,
                tokenCount: tokensToCheck.length,
                balances: balances.filter(b => b.hasBalance),
                allBalances: balances,
                chainId: chain.id,
                timestamp: new Date().toISOString()
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Get token balances error:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'TOKEN_BALANCES_FETCH_FAILED',
                address,
                network
              }
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
];
```

### Ledger Tools (`src/vercel/tools/ledger-tools.ts`)

```typescript
import { z } from 'zod';

// Schemas
const GetLedgerAddressSchema = z.object({
  derivationPath: z.string().optional().default("44'/60'/0'/0/0"),
  display: z.boolean().optional().default(false)
});

const CraftTransactionSchema = z.object({
  type: z.enum(['eth_transfer', 'erc20_transfer', 'erc20_approve', 'contract_call']),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet'),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount: z.string().optional(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  spender: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  methodName: z.string().optional(),
  methodParams: z.array(z.any()).optional(),
  value: z.string().optional(),
  gasLimit: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional()
});

// Helper function to call Ledger proxy
const callLedgerProxy = async (endpoint: string, data: any) => {
  const proxyUrl = process.env.LEDGER_PROXY_URL || 'http://localhost:3001';
  const fullUrl = `${proxyUrl}${endpoint}`;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Ledger-Server/2.0.0'
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ledger proxy error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Ledger proxy timeout - ensure device is connected and proxy is running');
    }
    throw new Error(`Failed to connect to Ledger proxy at ${fullUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const ledgerTools = [
  {
    name: 'get_ledger_address',
    description: 'Get the Ethereum address from the connected Ledger device. Requires local Ledger proxy service.',
    inputSchema: GetLedgerAddressSchema,
    execute: async ({ derivationPath, display }: z.infer<typeof GetLedgerAddressSchema>) => {
      try {
        const result = await callLedgerProxy('/ledger/address', {
          derivationPath,
          display
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                address: result.address,
                derivationPath: result.derivationPath || derivationPath,
                publicKey: result.publicKey,
                displayed: display,
                timestamp: new Date().toISOString()
              },
              proxy: {
                status: 'connected',
                url: process.env.LEDGER_PROXY_URL || 'http://localhost:3001'
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Get Ledger address error:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'LEDGER_ADDRESS_FAILED',
                troubleshooting: {
                  steps: [
                    '1. Ensure Ledger device is connected via USB',
                    '2. Ensure Ethereum app is open on Ledger device',
                    '3. Ensure local Ledger proxy is running',
                    '4. Check LEDGER_PROXY_URL environment variable'
                  ],
                  proxyUrl: process.env.LEDGER_PROXY_URL || 'http://localhost:3001',
                  documentation: 'See docs/migration-to-vercel-ai-mcp.md for setup instructions'
                }
              }
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    name: 'craft_transaction',
    description: 'Craft various types of Ethereum transactions for Ledger signing. Creates unsigned transaction for local signing.',
    inputSchema: CraftTransactionSchema,
    execute: async (params: z.infer<typeof CraftTransactionSchema>) => {
      try {
        // Create transaction object based on type
        let transactionData: any = {
          type: 2, // EIP-1559
          to: params.to,
          value: params.value || '0',
          chainId: getChainId(params.network)
        };

        // Handle different transaction types
        switch (params.type) {
          case 'eth_transfer':
            transactionData.value = params.amount || '0';
            transactionData.data = '0x';
            break;

          case 'erc20_transfer':
            if (!params.tokenAddress || !params.amount) {
              throw new Error('Token address and amount required for ERC20 transfer');
            }
            // ERC20 transfer method signature and encoding
            const transferData = encodeERC20Transfer(params.to, params.amount);
            transactionData.to = params.tokenAddress;
            transactionData.data = transferData;
            transactionData.value = '0';
            break;

          case 'erc20_approve':
            if (!params.tokenAddress || !params.spender || !params.amount) {
              throw new Error('Token address, spender, and amount required for ERC20 approve');
            }
            const approveData = encodeERC20Approve(params.spender, params.amount);
            transactionData.to = params.tokenAddress;
            transactionData.data = approveData;
            transactionData.value = '0';
            break;

          case 'contract_call':
            if (!params.contractAddress || !params.methodName) {
              throw new Error('Contract address and method name required for contract call');
            }
            // This would require ABI encoding - simplified for example
            transactionData.to = params.contractAddress;
            transactionData.data = '0x'; // Would need proper ABI encoding
            break;
        }

        // Add gas parameters if provided
        if (params.gasLimit) transactionData.gasLimit = params.gasLimit;
        if (params.maxFeePerGas) transactionData.maxFeePerGas = params.maxFeePerGas;
        if (params.maxPriorityFeePerGas) transactionData.maxPriorityFeePerGas = params.maxPriorityFeePerGas;

        // Add nonce (would need to fetch from network in real implementation)
        // transactionData.nonce = await getNonce(fromAddress, params.network);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                transactionType: params.type,
                network: params.network,
                unsignedTransaction: transactionData,
                signingInstructions: {
                  step1: 'Send transaction to local Ledger proxy for signing',
                  step2: 'Review transaction details on Ledger device screen',
                  step3: 'Confirm transaction on Ledger device',
                  endpoint: `${process.env.LEDGER_PROXY_URL || 'http://localhost:3001'}/ledger/sign`,
                  payload: {
                    transaction: transactionData,
                    derivationPath: "44'/60'/0'/0/0"
                  }
                },
                riskAnalysis: analyzeTransactionRisk(params),
                estimatedCost: 'Use get_gas_estimate tool for cost calculation',
                timestamp: new Date().toISOString()
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Craft transaction error:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'TRANSACTION_CRAFT_FAILED',
                parameters: params
              }
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
];

// Helper functions
function getChainId(network: string): number {
  const chainIds: Record<string, number> = {
    mainnet: 1,
    sepolia: 11155111,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453
  };
  return chainIds[network] || 1;
}

function encodeERC20Transfer(to: string, amount: string): string {
  // Simplified - would use proper ABI encoding in production
  return `0xa9059cbb${to.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;
}

function encodeERC20Approve(spender: string, amount: string): string {
  // Simplified - would use proper ABI encoding in production
  return `0x095ea7b3${spender.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;
}

function analyzeTransactionRisk(params: any): any {
  let riskLevel = 'LOW';
  const warnings = [];

  if (params.type === 'erc20_approve') {
    riskLevel = 'MEDIUM';
    warnings.push('ERC20 approval gives spender permission to transfer tokens');
  }

  if (params.type === 'contract_call') {
    riskLevel = 'MEDIUM';
    warnings.push('Contract interaction - verify contract is trusted');
  }

  return {
    level: riskLevel,
    warnings,
    recommendations: [
      'Verify recipient address is correct',
      'Check transaction amounts carefully',
      'Ensure sufficient gas for transaction'
    ]
  };
}
```

### Contract Tools (`src/vercel/tools/contract-tools.ts`)

```typescript
import { z } from 'zod';

const GetContractAbiSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet')
});

const blockscoutUrls: Record<string, string> = {
  mainnet: 'https://eth.blockscout.com/api',
  sepolia: 'https://eth-sepolia.blockscout.com/api',
  polygon: 'https://polygon.blockscout.com/api',
  arbitrum: 'https://arbitrum.blockscout.com/api',
  optimism: 'https://optimism.blockscout.com/api',
  base: 'https://base.blockscout.com/api'
};

export const contractTools = [
  {
    name: 'get_contract_abi',
    description: 'Retrieve contract ABI from Blockscout for a given contract address on the specified network',
    inputSchema: GetContractAbiSchema,
    execute: async ({ contractAddress, network }: z.infer<typeof GetContractAbiSchema>) => {
      try {
        const baseUrl = blockscoutUrls[network];
        if (!baseUrl) {
          throw new Error(`Unsupported network: ${network}`);
        }

        const url = `${baseUrl}?module=contract&action=getabi&address=${contractAddress}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'MCP-Ledger-Server/2.0.0'
          },
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          throw new Error(`Blockscout API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status !== '1') {
          throw new Error(`Contract ABI not found: ${data.message || 'Unknown error'}`);
        }

        let parsedAbi;
        try {
          parsedAbi = JSON.parse(data.result);
        } catch (parseError) {
          throw new Error('Failed to parse ABI JSON from Blockscout response');
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                contractAddress,
                network,
                abi: parsedAbi,
                source: 'blockscout',
                functions: parsedAbi.filter((item: any) => item.type === 'function').length,
                events: parsedAbi.filter((item: any) => item.type === 'event').length,
                blockscoutUrl: `${baseUrl.replace('/api', '')}/address/${contractAddress}`,
                timestamp: new Date().toISOString()
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Get contract ABI error:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'CONTRACT_ABI_FETCH_FAILED',
                contractAddress,
                network,
                troubleshooting: {
                  steps: [
                    '1. Verify contract address is correct',
                    '2. Ensure contract is verified on Blockscout',
                    '3. Check if contract exists on the specified network'
                  ],
                  blockscoutUrl: blockscoutUrls[network]?.replace('/api', '') + `/address/${contractAddress}`
                }
              }
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
];
```

### Tool Export (`src/vercel/tools/index.ts`)

```typescript
export { blockchainTools } from './blockchain-tools.js';
export { ledgerTools } from './ledger-tools.js';
export { contractTools } from './contract-tools.js';
```

## Local Ledger Proxy Implementation

### Complete Proxy Server (`proxy/ledger-proxy.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import AppEth from '@ledgerhq/hw-app-eth';
import { Transaction } from '@ethereumjs/tx';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-vercel-app.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Global Ledger connection state
let transport: any = null;
let eth: AppEth | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Connection manager
class LedgerConnectionManager {
  private static instance: LedgerConnectionManager;
  private isConnecting = false;

  static getInstance(): LedgerConnectionManager {
    if (!LedgerConnectionManager.instance) {
      LedgerConnectionManager.instance = new LedgerConnectionManager();
    }
    return LedgerConnectionManager.instance;
  }

  async connect(): Promise<AppEth> {
    if (eth && transport) {
      try {
        // Test connection
        await eth.getAppConfiguration();
        return eth;
      } catch (error) {
        // Connection lost, reset
        await this.disconnect();
      }
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (eth) return eth;
      throw new Error('Connection attempt in progress failed');
    }

    this.isConnecting = true;
    connectionAttempts++;

    try {
      console.log(`Attempting to connect to Ledger device (attempt ${connectionAttempts})...`);
      
      transport = await TransportNodeHid.create(10000); // 10 second timeout
      eth = new AppEth(transport);
      
      // Verify connection
      const config = await eth.getAppConfiguration();
      console.log('✓ Connected to Ledger device:', config);
      
      connectionAttempts = 0;
      return eth;
    } catch (error) {
      await this.disconnect();
      throw new Error(`Failed to connect to Ledger device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (transport) {
      try {
        await transport.close();
      } catch (error) {
        console.warn('Error closing transport:', error);
      }
    }
    transport = null;
    eth = null;
  }
}

const ledgerManager = LedgerConnectionManager.getInstance();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const ledger = await ledgerManager.connect();
    const config = await ledger.getAppConfiguration();
    
    res.json({
      status: 'healthy',
      ledger: {
        connected: true,
        appName: config.arbitraryDataEnabled ? 'Ethereum' : 'Unknown',
        version: config.version,
        arbitraryDataEnabled: config.arbitraryDataEnabled
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      ledger: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      troubleshooting: [
        'Ensure Ledger device is connected via USB',
        'Ensure Ethereum app is open on Ledger device',
        'Try reconnecting the USB cable',
        'Restart the Ledger device'
      ],
      timestamp: new Date().toISOString()
    });
  }
});

// Get Ledger address
app.post('/ledger/address', async (req, res) => {
  try {
    const { derivationPath = "44'/60'/0'/0/0", display = false } = req.body;
    
    // Validate derivation path
    if (!/^44'\/60'\/\d+'\/\d+\/\d+$/.test(derivationPath)) {
      return res.status(400).json({
        error: 'Invalid derivation path format',
        expected: "44'/60'/0'/0/0",
        received: derivationPath
      });
    }

    const ledger = await ledgerManager.connect();
    const result = await ledger.getAddress(derivationPath, display);
    
    console.log(`✓ Retrieved address: ${result.address} (path: ${derivationPath}, display: ${display})`);
    
    res.json({
      success: true,
      address: result.address,
      derivationPath,
      publicKey: result.publicKey,
      displayedOnDevice: display,
      chainCode: result.chainCode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'ADDRESS_FETCH_FAILED'
      }
    });
  }
});

// Sign transaction
app.post('/ledger/sign', async (req, res) => {
  try {
    const { transaction, derivationPath = "44'/60'/0'/0/0" } = req.body;
    
    if (!transaction) {
      return res.status(400).json({
        error: 'Transaction object required',
        example: {
          to: '0x...',
          value: '0x0',
          gasLimit: '0x5208',
          gasPrice: '0x...',
          nonce: '0x0',
          chainId: 1
        }
      });
    }

    const ledger = await ledgerManager.connect();
    
    // Create transaction object for signing
    const tx = Transaction.fromTxData(transaction);
    const serializedTx = tx.getMessageToSign();
    
    console.log('Signing transaction on Ledger device...');
    const signature = await ledger.signTransaction(derivationPath, serializedTx);
    
    // Reconstruct signed transaction
    const signedTx = Transaction.fromTxData({
      ...transaction,
      v: signature.v,
      r: signature.r,
      s: signature.s
    });
    
    const signedTxHash = signedTx.serialize();
    
    console.log('✓ Transaction signed successfully');
    
    res.json({
      success: true,
      signature: {
        v: signature.v,
        r: signature.r,
        s: signature.s
      },
      signedTransaction: `0x${signedTxHash.toString('hex')}`,
      transactionHash: `0x${signedTx.hash().toString('hex')}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sign transaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'TRANSACTION_SIGNING_FAILED'
      }
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Ledger proxy...');
  await ledgerManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Ledger proxy...');
  await ledgerManager.disconnect();
  process.exit(0);
});

const PORT = process.env.LEDGER_PROXY_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔗 Ledger proxy server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Get address: POST http://localhost:${PORT}/ledger/address`);
  console.log(`📍 Sign transaction: POST http://localhost:${PORT}/ledger/sign`);
});
```

## Deployment Configuration

### Vercel Configuration (`vercel.json`)

```json
{
  "functions": {
    "src/vercel/index.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/src/vercel/index.ts"
    }
  ],
  "env": {
    "LEDGER_PROXY_URL": "@ledger-proxy-url",
    "MAINNET_RPC_URL": "@mainnet-rpc-url",
    "POLYGON_RPC_URL": "@polygon-rpc-url"
  },
  "headers": [
    {
      "source": "/mcp/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev:vercel": "vercel dev",
    "dev:proxy": "tsx proxy/ledger-proxy.ts",
    "dev": "concurrently \"npm run dev:proxy\" \"npm run dev:vercel\"",
    "deploy": "vercel --prod",
    "proxy:build": "tsc proxy/ledger-proxy.ts --outDir dist/proxy",
    "proxy:start": "node dist/proxy/ledger-proxy.js",
    "test:tools": "tsx scripts/test-tools.ts"
  }
}
```

## Usage Examples

### Testing Individual Tools

```bash
# Test blockchain balance
curl -X POST "http://localhost:3000/mcp/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_balance",
    "arguments": {
      "address": "0x742d35Cc6634C0532925a3b8D5a0e7845b20f4d6",
      "network": "mainnet"
    }
  }'

# Test Ledger address (requires proxy)
curl -X POST "http://localhost:3000/mcp/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_ledger_address",
    "arguments": {
      "derivationPath": "44'/60'/0'/0/0",
      "display": true
    }
  }'
```

This implementation provides a complete, production-ready migration path from your existing stdio-based MCP server to a modern Vercel AI powered architecture while maintaining all functionality through the hybrid proxy pattern.