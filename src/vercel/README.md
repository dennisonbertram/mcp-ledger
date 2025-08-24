# MCP Ledger Server - Vercel AI Edition

A **Vercel AI powered MCP server** for Ledger hardware wallet blockchain operations, designed for serverless deployment with hybrid architecture.

## 🏗️ Architecture Overview

This implementation uses a **hybrid architecture** to solve the fundamental challenge of hardware wallet integration in serverless environments:

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Functions                    │
│  ├─ HTTP MCP Server (Hono framework)                       │
│  ├─ Blockchain Data Operations (get_balance, tokens, NFTs) │
│  ├─ Contract ABI Retrieval                                 │
│  └─ Multi-network Support (6 networks)                     │
├─────────────────────────────────────────────────────────────┤
│                    Local Ledger Proxy                      │
│  ├─ Hardware Connection Manager                            │
│  ├─ Address Generation (get_ledger_address)                │
│  └─ Transaction Crafting (craft_transaction)               │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Features

### Vercel AI MCP Server (Serverless)
✅ **Blockchain Data Operations**
- `get_balance` - ETH balance queries across all networks
- `get_token_balances` - ERC20 token discovery via Dune Sim API
- `get_nft_balances` - NFT/ERC721 discovery via Dune Sim API  
- `get_contract_abi` - Contract ABI retrieval from Blockscout

✅ **Multi-Network Support**
- Ethereum Mainnet, Sepolia, Polygon, Arbitrum, Optimism, Base
- Enhanced RPC with Alchemy integration
- Automatic fallback to public endpoints

✅ **Production Ready**
- Global edge deployment
- Automatic scaling  
- Zero infrastructure management
- CORS enabled for web integration

### Local Ledger Proxy (Hardware)
🔐 **Hardware Operations**
- `get_ledger_address` - Secure address generation from Ledger
- `craft_transaction` - Transaction preparation for signing
- Device connection management
- Health monitoring

## 🚀 Quick Start

### 1. Deploy Vercel AI Server

```bash
cd src/vercel

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add your API keys:
# DUNE_SIM_API_KEY=your_dune_sim_key     # Required for token/NFT discovery
# ALCHEMY_API_KEY=your_alchemy_key       # Optional for enhanced RPC
# ETHERSCAN_API_KEY=your_etherscan_key   # Optional for contract verification

# Deploy to Vercel
vercel deploy --prod
```

### 2. Start Local Ledger Proxy

```bash
cd src/proxy

# Install dependencies  
npm install

# Start proxy service
npm start
# Proxy runs on http://localhost:3001
```

### 3. Test the Setup

**Test Vercel AI Server:**
```bash
curl https://your-deployment.vercel.app/
curl https://your-deployment.vercel.app/health
```

**Test Ledger Proxy:**
```bash
curl http://localhost:3001/health
curl http://localhost:3001/config
```

## 🔧 API Reference

### Vercel AI Server Endpoints

**Server Info & Health**
- `GET /` - Server metadata and configuration status
- `GET /health` - Health check endpoint

**MCP Protocol**  
- `POST /mcp/*` - MCP protocol communication (tools, resources, prompts)

### Local Proxy Endpoints

**Hardware Operations**
- `POST /ledger/address` - Get address from Ledger device
- `POST /ledger/craft-transaction` - Prepare transaction for signing
- `GET /ledger/devices` - List connected Ledger devices
- `POST /ledger/disconnect` - Disconnect from Ledger

**Management**
- `GET /health` - Proxy health and Ledger connection status
- `GET /config` - Configuration and capability information

## 📋 Tool Usage Examples

### Using with AI Agents

The Vercel AI server provides an HTTP MCP interface for AI agents:

```json
{
  "mcpServers": {
    "mcp-ledger-vercel": {
      "url": "https://your-deployment.vercel.app/mcp"
    }
  }
}
```

### Direct API Usage

**Get ETH Balance:**
```bash
curl -X POST https://your-deployment.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_balance",
      "arguments": {
        "address": "0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c",
        "network": "mainnet"
      }
    }
  }'
```

**Get Token Balances:**
```bash
curl -X POST https://your-deployment.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call", 
    "params": {
      "name": "get_token_balances",
      "arguments": {
        "address": "0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c",
        "networks": ["mainnet", "polygon", "base"]
      }
    }
  }'
```

**Get Ledger Address (via Proxy):**
```bash
curl -X POST http://localhost:3001/ledger/address \
  -H "Content-Type: application/json" \
  -d '{
    "derivationPath": "44'/60'/0'/0/0",
    "verify": false
  }'
```

## 🔑 Environment Variables

### Required for Full Functionality
- `DUNE_SIM_API_KEY` - **Required** for token/NFT discovery (get from [sim.dune.com](https://sim.dune.com))

### Optional for Enhanced Performance  
- `ALCHEMY_API_KEY` - Enhanced RPC performance (get from [alchemy.com](https://alchemy.com))
- `ETHERSCAN_API_KEY` - Contract verification (get from [etherscan.io/apis](https://etherscan.io/apis))

### Proxy Configuration
- `LEDGER_PROXY_PORT` - Local proxy port (default: 3001)

## 🛠️ Development

**Local Development:**
```bash
# Vercel server
cd src/vercel
npm run dev

# Proxy service  
cd src/proxy
npm run dev
```

**Testing:**
```bash
# Test individual tools
npm run test:tools

# Test Ledger integration (requires hardware)
npm run test:ledger
```

## 🚀 Deployment

### Vercel Deployment
- Automatic deployment from Git repository
- Environment variables configured in Vercel dashboard  
- Global edge distribution
- Zero configuration scaling

### Local Proxy Deployment
- Run on local machine or server with USB access
- Systemd service or PM2 for process management
- Local network access for AI agents
- Hardware security maintained

## 🔒 Security Considerations

- **Private keys never leave Ledger device** - all signing occurs on hardware
- **Vercel server is read-only** - cannot perform sensitive operations  
- **Local proxy required** - for hardware wallet access
- **HTTPS/TLS encryption** - for all communications
- **Input validation** - Zod schema validation on all inputs
- **Rate limiting** - Vercel provides automatic DDoS protection

## 🤝 Integration Patterns

### With Claude Desktop
```json
{
  "mcpServers": {
    "ledger-blockchain": {
      "url": "https://your-deployment.vercel.app/mcp"
    },
    "ledger-hardware": {
      "command": "node", 
      "args": ["/path/to/proxy/ledger-proxy.ts"]
    }
  }
}
```

### With Custom AI Applications
- HTTP MCP protocol for blockchain operations
- REST API for hardware operations
- WebSocket support for real-time updates
- GraphQL compatibility layer available

## 📈 Monitoring & Analytics

### Vercel Analytics
- Function execution metrics
- Response times and error rates  
- Geographic distribution
- Usage analytics

### Proxy Monitoring
- Ledger connection health
- API response times
- Error tracking and alerts
- Hardware device status

---

**Built with ❤️ using Vercel AI, Hono, and modern Web3 technologies**