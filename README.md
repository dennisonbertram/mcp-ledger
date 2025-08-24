# MCP Ledger Server

A comprehensive Model Context Protocol (MCP) server for secure Ledger hardware wallet integration with Ethereum blockchain operations.

## 🚀 Features

🔒 **Hardware Wallet Security**
- Ledger hardware wallet integration using modern @ledgerhq libraries
- No private key exposure - all signing occurs on device
- Graceful degradation when device not connected

⛓️ **Multi-Network Support**
- Ethereum Mainnet, Sepolia, Polygon, Arbitrum, Optimism, Base
- Enhanced RPC providers (Alchemy) with API key support
- Fallback to public endpoints when API keys not configured

🪙 **Comprehensive Token & NFT Discovery**
- **Dune Sim API integration** - most reliable 60+ chain token discovery
- Real-time pricing and USD valuations across all networks
- Advanced spam filtering with liquidity thresholds and allowlists
- ERC20 token balances and NFT collection tracking
- Historical price data and activity monitoring

🤖 **AI Agent Integration**
- Full MCP protocol compliance for AI agent interaction
- 6 comprehensive tools for blockchain operations
- JSON-RPC stdio transport for seamless integration

## ⚠️ API Keys Required

### 🔑 **Required API**
- **Dune Sim API Key** - **Required** for all token/NFT discovery functionality
  - Get your key at: [sim.dune.com](https://sim.dune.com)
  - Provides reliable multi-chain token data (60+ networks)
  - Real-time pricing, spam filtering, and activity monitoring

### 📊 **Optional APIs (Performance)**  
- **Alchemy API Key** - Improves RPC performance (recommended)
  - Get your key at: [alchemy.com](https://alchemy.com)
  - 2M+ requests/month free tier
  
- **Etherscan API Key** - Enables contract verification
  - Get your key at: [etherscan.io/apis](https://etherscan.io/apis)
  - 100k requests/day free tier

### 🚫 **Without Dune Sim API**
- **Token discovery will not work**
- Only basic ETH balance queries available
- **You must have DUNE_SIM_API_KEY for full functionality**

## MCP Tools

1. **`get_ledger_address`** - Retrieve Ethereum address from connected Ledger
2. **`get_balance`** - Get ETH balance for any address on supported networks  
3. **`get_token_balances`** - Get ERC20 token balances with batch support
4. **`get_nft_balances`** - Get NFT balances for ERC721/ERC1155 contracts
5. **`craft_transaction`** - Create transactions for Ledger signing
6. **`get_contract_abi`** - Retrieve contract ABIs from Blockscout

## 🚀 Quick Start

### 1. **Get Required API Key**

```bash
# Required: Get Dune Sim API key
# Visit: https://sim.dune.com

# Optional: Get enhanced performance APIs
# - Alchemy: https://alchemy.com (RPC performance)
# - Etherscan: https://etherscan.io/apis (contract verification)
```

### 2. **Configure Environment**

```bash
# Copy environment template
cp .env.example .env

# Add your API keys to .env file
DUNE_SIM_API_KEY=your_dune_sim_api_key_here  # REQUIRED
ALCHEMY_API_KEY=your_alchemy_api_key_here    # Optional
ETHERSCAN_API_KEY=your_etherscan_api_key_here # Optional
```

### 3. **Install and Run**

```bash
# Install dependencies
npm install

# Build the project  
npm run build

# Start the MCP server
npm start

# Test the server
node test-server.cjs
```

### 4. **Verify Setup**

The server will show configuration status on startup:

**With Dune Sim API key (Recommended):**
```
✅ Dune Sim API configured for reliable token discovery
✅ Enhanced RPC provider configured (Alchemy)
✅ Contract verification API configured (Etherscan)
```

**Missing Dune Sim API key:**
```
❌ DUNE_SIM_API_KEY is required for token discovery functionality
⚠️  No enhanced RPC provider configured. Using public endpoints (slower, rate limited).
```

**⚠️ Important:** Without `DUNE_SIM_API_KEY`, token and NFT discovery tools will not work.

## Architecture

- **TypeScript** - Full type safety with strict configuration
- **Viem** - Modern Ethereum library for blockchain interactions
- **Ledger SDK** - Hardware wallet integration
- **Blockscout API** - Contract verification and ABI retrieval
- **MCP SDK** - Protocol compliance for AI agent integration

## Usage with AI Agents

The server can be integrated with Claude Desktop, Cursor, or other MCP-compatible AI tools for secure blockchain operations:

```json
{
  "mcpServers": {
    "mcp-ledger": {
      "command": "node",
      "args": ["/path/to/mcp-ledger/dist/index.js"]
    }
  }
}
```

## Security

- All private keys remain on Ledger hardware device
- Comprehensive input validation using Zod schemas
- Multi-layer error handling with graceful degradation
- Transaction validation before signing

## Contributing

This project was built using modern TypeScript development practices with comprehensive testing and production-ready architecture.

## License

MIT

---

Built with ❤️ by [Dennison Bertram](https://github.com/crazyrabbitltc)