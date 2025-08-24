# MCP Ledger Server Migration to Vercel AI Architecture

## Overview

This guide provides a step-by-step migration plan to convert your existing TypeScript MCP Ledger server from a traditional stdio-based server to a Vercel AI powered HTTP-based MCP server using Hono framework.

## Current Architecture Analysis

### Existing Server Structure
Your current server uses:
- **Transport**: StdioServerTransport (stdio-based communication)
- **Framework**: Direct MCP SDK server implementation
- **Deployment**: Long-running Node.js process
- **State**: In-memory service orchestrator and tool handlers
- **Hardware Integration**: Direct Ledger device connection via @ledgerhq packages

### Key Components to Migrate
1. **6 Tools**: get_ledger_address, get_balance, get_token_balances, get_nft_balances, craft_transaction, get_contract_abi
2. **1 Resource**: server-info with health check
3. **1 Prompt**: transaction-review for transaction analysis
4. **Service Layer**: ServiceOrchestrator, ToolHandlers, and various blockchain services

## Migration Strategy

### Phase 1: Assessment and Planning

#### Current Dependencies Analysis
```json
// Existing dependencies that need consideration
{
  "@ledgerhq/hw-app-eth": "^6.38.6",           // ⚠️  Browser/Node USB access - serverless challenge
  "@ledgerhq/hw-transport-node-hid": "^6.29.8", // ⚠️  Hardware-specific transport
  "@modelcontextprotocol/sdk": "^1.0.0",       // ✅ Compatible
  "viem": "^2.21.45",                          // ✅ Compatible
  "axios": "^1.7.9",                           // ✅ Compatible
  "node-cache": "^5.1.2",                     // ⚠️  In-memory cache - needs Redis/external cache
  "zod": "^3.23.8"                            // ✅ Compatible
}
```

#### Architecture Challenges
1. **Ledger Hardware Access**: Serverless functions cannot directly access USB/HID devices
2. **State Management**: ServiceOrchestrator and caches need external storage
3. **Long-running Connections**: Ledger device connections don't persist across function calls
4. **Network Timeouts**: Some blockchain operations may exceed serverless limits

### Phase 2: Architecture Transformation

#### New Dependencies Required
```json
{
  // Add for Vercel AI MCP
  "hono": "^4.9.2",
  "mcp-handler": "^1.0.1",
  
  // Keep existing
  "@modelcontextprotocol/sdk": "^1.17.3",  // Update to latest
  "viem": "^2.21.45",
  "axios": "^1.7.9",
  "zod": "^3.23.8",
  
  // Replace for serverless
  "@vercel/kv": "^1.0.1",      // Replace node-cache
  // Remove Ledger hardware dependencies - handle via proxy service
}
```

#### Recommended Hybrid Architecture
Given hardware constraints, implement a hybrid approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Functions                    │
│  ├─ HTTP MCP Server (Hono)                                 │
│  ├─ Blockchain Services (read-only)                        │
│  └─ Transaction Crafting (unsigned)                        │
├─────────────────────────────────────────────────────────────┤
│                    Local Ledger Proxy                      │
│  ├─ Hardware Connection Manager                            │
│  ├─ Address Generation                                     │
│  └─ Transaction Signing                                    │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Implementation Plan

#### Step 1: Create New Vercel AI Server Structure

Create a new server implementation:

```typescript
// src/vercel/index.ts
import { Hono } from 'hono';
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { 
  GetBalanceSchema, 
  GetTokenBalancesSchema,
  GetNftBalancesSchema,
  GetContractAbiSchema 
} from '../types/index.js';

const app = new Hono();

// Server metadata
app.get('/', (c) => {
  return c.json({
    name: 'MCP Ledger Server',
    version: '2.0.0',
    description: 'Vercel AI powered MCP server for Ethereum blockchain operations',
    architecture: 'hybrid',
    capabilities: ['blockchain-data', 'transaction-crafting', 'contract-interaction']
  });
});

// MCP Handler with migrated tools
const mcpHandler = createMcpHandler({
  tools: [
    // Blockchain data tools (fully serverless)
    {
      name: 'get_balance',
      description: 'Get ETH balance for an address on specified network',
      inputSchema: GetBalanceSchema,
      execute: async ({ address, network }) => {
        // Implement using existing blockchain service logic
        const blockchainService = new BlockchainService({ network });
        const balance = await blockchainService.getBalance(address);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              address,
              network,
              balance: balance.toString(),
              balanceETH: balance.toString(),
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    },

    {
      name: 'get_token_balances',
      description: 'Get ERC20 token balances for an address',
      inputSchema: GetTokenBalancesSchema,
      execute: async ({ address, tokenAddresses, network }) => {
        const blockchainService = new BlockchainService({ network });
        const balances = await blockchainService.getTokenBalances(address, tokenAddresses || []);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              address,
              network,
              balances,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    },

    {
      name: 'get_nft_balances',
      description: 'Get NFT balances for an address',
      inputSchema: GetNftBalancesSchema,
      execute: async ({ address, contractAddresses, network }) => {
        const blockscoutService = new BlockscoutService({ network });
        const nfts = await blockscoutService.getNftBalances(address, contractAddresses || []);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              address,
              network,
              nfts,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    },

    {
      name: 'get_contract_abi',
      description: 'Get contract ABI from Blockscout',
      inputSchema: GetContractAbiSchema,
      execute: async ({ contractAddress, network }) => {
        const blockscoutService = new BlockscoutService({ network });
        const abi = await blockscoutService.getContractAbi(contractAddress);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              contractAddress,
              network,
              abi,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    },

    // Hardware-dependent tools (proxy to local service)
    {
      name: 'get_ledger_address',
      description: 'Get address from Ledger device (requires local Ledger proxy)',
      inputSchema: z.object({
        derivationPath: z.string().optional(),
        display: z.boolean().optional()
      }),
      execute: async ({ derivationPath, display }) => {
        // Call local Ledger proxy service
        const proxyUrl = process.env.LEDGER_PROXY_URL || 'http://localhost:3001';
        
        try {
          const response = await fetch(`${proxyUrl}/ledger/address`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ derivationPath, display })
          });
          
          if (!response.ok) {
            throw new Error(`Ledger proxy error: ${response.statusText}`);
          }
          
          const result = await response.json();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error: Ledger device not accessible. Ensure local Ledger proxy is running at ${proxyUrl}`
            }],
            isError: true
          };
        }
      }
    },

    {
      name: 'craft_transaction',
      description: 'Craft transaction for Ledger signing (requires local proxy for signing)',
      inputSchema: CraftTransactionSchema,
      execute: async (params) => {
        // Craft unsigned transaction using existing logic
        const transactionCrafter = new TransactionCrafter({ 
          network: params.network,
          validateBeforeSigning: true,
          autoEstimateGas: true,
          securityChecks: true
        });
        
        const unsignedTx = await transactionCrafter.craftUnsignedTransaction(params);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              unsignedTransaction: unsignedTx,
              signingInstructions: 'Use local Ledger proxy to sign this transaction',
              proxyEndpoint: `${process.env.LEDGER_PROXY_URL || 'http://localhost:3001'}/ledger/sign`,
              warning: 'Verify all transaction details before signing'
            }, null, 2)
          }]
        };
      }
    }
  ]
});

// MCP endpoint
app.all('/mcp/*', (c) => {
  return mcpHandler(c.req.raw, {
    basePath: '/mcp',
    maxDuration: 30000
  });
});

export default app;
```

#### Step 2: Create Local Ledger Proxy Service

Create a companion service for hardware operations:

```typescript
// proxy/ledger-proxy.ts
import express from 'express';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import AppEth from '@ledgerhq/hw-app-eth';

const app = express();
app.use(express.json());

let transport: any = null;
let eth: AppEth | null = null;

// Initialize Ledger connection
async function initLedger() {
  if (!transport) {
    transport = await TransportNodeHid.create();
    eth = new AppEth(transport);
  }
  return eth;
}

// Get Ledger address
app.post('/ledger/address', async (req, res) => {
  try {
    const { derivationPath = "44'/60'/0'/0/0", display = false } = req.body;
    const ledger = await initLedger();
    const result = await ledger.getAddress(derivationPath, display);
    
    res.json({
      address: result.address,
      derivationPath,
      publicKey: result.publicKey
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Sign transaction
app.post('/ledger/sign', async (req, res) => {
  try {
    const { transaction, derivationPath = "44'/60'/0'/0/0" } = req.body;
    const ledger = await initLedger();
    
    // Sign transaction with Ledger
    const signature = await ledger.signTransaction(derivationPath, transaction);
    
    res.json({
      signature,
      signedTransaction: transaction + signature.r.slice(2) + signature.s.slice(2) + signature.v.toString(16)
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    if (transport) {
      res.json({ status: 'connected', ledger: 'available' });
    } else {
      await initLedger();
      res.json({ status: 'connected', ledger: 'initialized' });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'disconnected', 
      error: error instanceof Error ? error.message : 'Ledger not available' 
    });
  }
});

const PORT = process.env.LEDGER_PROXY_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Ledger proxy running on port ${PORT}`);
});
```

#### Step 3: Update Package Configuration

```json
{
  "name": "mcp-ledger-server",
  "version": "2.0.0",
  "scripts": {
    "build": "tsc",
    "dev:vercel": "vc dev",
    "dev:proxy": "tsx proxy/ledger-proxy.ts",
    "dev": "concurrently \"npm run dev:proxy\" \"npm run dev:vercel\"",
    "deploy": "vc deploy",
    "proxy:start": "node dist/proxy/ledger-proxy.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "hono": "^4.9.2",
    "mcp-handler": "^1.0.1",
    "viem": "^2.21.45",
    "axios": "^1.7.9",
    "zod": "^3.23.8",
    "@vercel/kv": "^1.0.1",
    
    // Proxy service dependencies
    "@ledgerhq/hw-app-eth": "^6.38.6",
    "@ledgerhq/hw-transport-node-hid": "^6.29.8",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "concurrently": "^8.2.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

#### Step 4: Service Layer Adaptation

Modify your existing services to work in serverless environment:

```typescript
// src/services/serverless-blockchain.ts
import { BlockchainService } from './blockchain.js';

export class ServerlessBlockchainService extends BlockchainService {
  constructor(config: any) {
    super({
      ...config,
      // Use external cache instead of node-cache
      cacheEnabled: false, // Or implement with Vercel KV
    });
  }

  // Override methods to handle serverless constraints
  async getBalance(address: string): Promise<bigint> {
    // Implement with shorter timeout for serverless
    return super.getBalance(address);
  }
  
  // Add methods optimized for serverless execution
}
```

### Phase 4: Deployment Configuration

#### Vercel Configuration
Create `vercel.json`:

```json
{
  "functions": {
    "src/vercel/index.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "LEDGER_PROXY_URL": "@ledger-proxy-url"
  }
}
```

#### Environment Variables
Set in Vercel dashboard:
- `LEDGER_PROXY_URL`: URL of your local Ledger proxy service
- `ETHEREUM_RPC_URL`: RPC endpoint for blockchain data
- `BLOCKSCOUT_API_KEY`: API key for Blockscout service

### Phase 5: Migration Benefits and Trade-offs

#### Benefits
- ✅ **Automatic Scaling**: Handle multiple requests without manual process management
- ✅ **Global Edge Distribution**: Faster response times worldwide
- ✅ **Zero Infrastructure Management**: No server maintenance required
- ✅ **Cost Efficiency**: Pay-per-request pricing model
- ✅ **HTTP API**: RESTful interface easier to integrate with AI systems

#### Trade-offs
- ⚠️ **Hardware Dependency**: Requires separate proxy service for Ledger operations
- ⚠️ **Cold Starts**: Initial request latency for unused functions
- ⚠️ **Execution Limits**: 30-second timeout for Vercel functions
- ⚠️ **State Management**: No persistent connections or in-memory caching
- ⚠️ **Complexity**: Hybrid architecture requires managing two services

### Phase 6: Testing and Validation

#### Local Development
```bash
# Terminal 1: Start Ledger proxy
npm run dev:proxy

# Terminal 2: Start Vercel development server
npm run dev:vercel

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_balance", "arguments": {"address": "0x...", "network": "mainnet"}}'
```

#### Integration Testing
1. Test each tool independently
2. Verify proxy service communication
3. Test error handling for hardware disconnection
4. Validate response formats match MCP protocol
5. Performance testing for acceptable response times

## Conclusion

This migration transforms your MCP Ledger server from a traditional stdio-based implementation to a modern, scalable Vercel AI powered service. The hybrid architecture maintains hardware wallet functionality while gaining cloud scalability benefits.

### Key Success Factors
1. **Gradual Migration**: Implement blockchain data tools first, then hardware-dependent features
2. **Robust Error Handling**: Handle hardware disconnection gracefully
3. **Clear Documentation**: Document the hybrid architecture for users
4. **Monitoring**: Implement proper logging and monitoring for both services
5. **Security**: Ensure secure communication between Vercel functions and local proxy

The resulting architecture provides a production-ready, scalable MCP server that can handle AI workloads while maintaining secure hardware wallet integration through the local proxy pattern.