# MCP Ledger Server

A comprehensive Model Context Protocol (MCP) server for secure Ledger hardware wallet integration with Ethereum blockchain operations. Build AI agents that can safely interact with your crypto assets using hardware-level security.

## 🚀 Features

### 🔒 **Hardware Wallet Security**
- ✅ Ledger hardware wallet integration with latest @ledgerhq libraries
- ✅ Private keys never leave your device - all signing happens on hardware
- ✅ Transaction confirmation required on device screen
- ✅ Multi-account support with BIP32 derivation paths

### ⛓️ **Multi-Network Support**  
- ✅ **6 Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base, Sepolia
- ✅ Enhanced RPC with Alchemy API integration  
- ✅ Automatic fallback to public endpoints
- ✅ EIP-1559 transaction support with dynamic gas pricing

### 🪙 **Complete Asset Management**
- ✅ Real-time ETH balances across all networks
- ✅ ERC20 token discovery and balances via Dune Sim API
- ✅ ERC721/ERC1155 NFT tracking and transfers
- ✅ Token approval management (approve/revoke/modify)
- ✅ USD pricing and portfolio valuation

### 🤖 **AI Agent Ready**
- ✅ **14 MCP tools** for complete blockchain operations
- ✅ One-command convenience functions (send ETH, transfer tokens, etc.)
- ✅ Transaction crafting with automatic gas estimation
- ✅ Message signing for Sign-In with Ethereum (SIWE)
- ✅ Real-time gas analysis and optimization

## 📋 Available Tools

### **🔍 Wallet & Balance Tools**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_ledger_address` | Get address from connected Ledger | Get your wallet address |
| `get_balance` | Get ETH balance for any address | Check account balance |
| `get_token_balances` | Get ERC20 token balances | View your token portfolio |
| `get_nft_balances` | Get NFT collection balances | See your NFT holdings |

### **⚡ Transaction Tools**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `craft_transaction` | Create unsigned transactions | Prepare complex contract calls |
| `sign_transaction` | Sign with Ledger device | Sign prepared transactions |
| `sign_message` | Sign messages (SIWE) | Authenticate with dApps |
| `broadcast_transaction` | Send signed tx to network | Submit transactions |

### **🎯 Convenience Tools (One-Click Actions)**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `send_eth` | Send ETH (craft→sign→broadcast) | Send ETH to friend |
| `send_erc20_token` | Send tokens (craft→sign→broadcast) | Send USDC payment |
| `send_erc721_token` | Send NFTs (craft→sign→broadcast) | Transfer NFT |
| `manage_token_approval` | Manage approvals (craft→sign→broadcast) | Approve DEX spending |

### **🛠️ Developer Tools**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_contract_abi` | Get verified contract ABIs | Interact with contracts |
| `analyze_gas` | Gas price analysis & optimization | Optimize transaction costs |

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
# Clone and install
git clone <repository-url>
cd mcp-ledger
npm install
npm run build
```

### 2. **Get API Keys** 

#### 🔑 **Required: Dune Sim API**
```bash
# Get your free API key at: https://sim.dune.com
# Required for token/NFT discovery across 60+ chains
DUNE_SIM_API_KEY=your_dune_sim_api_key_here
```

#### 📊 **Optional: Performance APIs**
```bash
# Alchemy (recommended) - Enhanced RPC performance
# Get key at: https://alchemy.com (2M+ requests/month free)
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Etherscan (optional) - Contract verification  
# Get key at: https://etherscan.io/apis (100k requests/day free)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 3. **Configure Environment**

```bash
# Copy template and add your keys
cp .env.example .env
# Edit .env with your API keys
```

### 4. **Connect Your Ledger**

1. 🔌 **Connect** Ledger device via USB
2. 🔓 **Unlock** device with PIN
3. 📱 **Open** Ethereum app
4. ⚙️ **Enable** "Blind signing" in Ethereum app settings

### 5. **Test Connection**

```bash
# Test basic connection
node test-ledger-connection.js

# Test MCP server
npm start
# In another terminal:
node test-server.cjs
```

## 🖥️ Add to Your AI Tool

### **Claude Desktop** (macOS/Windows)

1. Open Claude Desktop settings
2. Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-ledger": {
      "command": "node",
      "args": ["/path/to/mcp-ledger/dist/index.js"],
      "env": {
        "DUNE_SIM_API_KEY": "your_key_here",
        "ALCHEMY_API_KEY": "your_key_here"
      }
    }
  }
}
```

### **Cursor IDE**

1. Open Cursor Settings → Extensions → MCP
2. Add server configuration:

```json
{
  "name": "mcp-ledger", 
  "command": "node",
  "args": ["/path/to/mcp-ledger/dist/index.js"],
  "env": {
    "DUNE_SIM_API_KEY": "your_key_here"
  }
}
```

### **VS Code with MCP Extension**

1. Install MCP extension
2. Add to MCP settings:

```json
{
  "mcp.servers": {
    "ledger": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-ledger/dist/index.js"],
      "env": {
        "DUNE_SIM_API_KEY": "your_key_here"
      }
    }
  }
}
```

### **Other MCP-Compatible Tools**

Use this general configuration pattern:
- **Command**: `node`
- **Args**: `["/path/to/mcp-ledger/dist/index.js"]`
- **Transport**: stdio
- **Environment**: Add your API keys

## 💡 Usage Examples

### **Check Your Portfolio**
```
Show me my ETH balance and top 5 token holdings on mainnet
```

### **Send Payments**
```
Send 0.1 ETH to 0x742d35Cc6631C0532925a3b8D0c7e89e5a3A5d34 on mainnet
```

### **Transfer Tokens**
```
Send 100 USDC to my friend at 0x... on polygon network
```

### **Manage Approvals** 
```
Revoke all token approvals for Uniswap router on mainnet
```

### **Gas Optimization**
```
Analyze current gas prices on mainnet and recommend optimal settings for an ERC20 transfer
```

### **NFT Operations**
```
Transfer my CryptoPunk #1234 to 0x... and show me the transaction details
```

## 🔧 Advanced Configuration

### **Custom Networks**

Add custom RPC endpoints in `.env`:

```bash
# Custom RPC URLs (optional)
MAINNET_RPC_URL=https://your-custom-rpc.com
POLYGON_RPC_URL=https://polygon-custom.com
```

### **Development Mode**

```bash
# Run in development with hot reload
npm run dev

# Run comprehensive tests
npm run test:all

# Test with real hardware (Ledger required)
npm run test:hardware
```

### **Performance Tuning**

```bash
# Adjust cache and timeout settings
REQUEST_TIMEOUT=60000  # 60 second timeout
CACHE_TTL=600         # 10 minute cache
```

## 🚫 Without Required APIs

**⚠️ Important**: Without `DUNE_SIM_API_KEY`:
- ❌ Token discovery won't work  
- ❌ NFT discovery won't work
- ❌ Only basic ETH operations available
- ✅ Ledger signing still works
- ✅ Custom transaction crafting works

## 🏗️ Architecture

### **Core Technologies**
- **TypeScript** - Full type safety with strict configuration  
- **Viem** - Modern Ethereum library for blockchain interactions
- **Ledger SDK** - Official hardware wallet integration
- **MCP SDK** - Model Context Protocol compliance
- **Zod** - Runtime schema validation

### **Service Architecture**
- 🔄 **ServiceOrchestrator** - Coordinates all operations
- 🔐 **LedgerService** - Hardware wallet communication  
- ⛓️ **BlockchainService** - Multi-network RPC management
- 🏗️ **TransactionCrafter** - Smart transaction building
- 🔍 **BlockscoutClient** - Contract verification and ABIs

### **Security Model**

**🔒 Hardware Security**:
- ✅ Private keys never leave Ledger device
- ✅ All transactions require physical confirmation  
- ✅ BIP32 hierarchical deterministic key derivation
- ✅ Comprehensive input validation

**🛡️ Software Security**:
- ✅ Zod schema validation for all inputs
- ✅ Multi-layer error handling
- ✅ Process isolation via stdio transport
- ✅ No authentication required for local use

## 📊 Network Status Verification

When you start the server, you'll see configuration status:

**✅ Optimal Setup**:
```
✅ Dune Sim API configured for reliable token discovery
✅ Enhanced RPC provider configured (Alchemy) 
✅ Contract verification API configured (Etherscan)
✅ Ledger device connected successfully
```

**⚠️ Limited Setup**:
```
❌ DUNE_SIM_API_KEY is required for token discovery functionality
⚠️  No enhanced RPC provider configured. Using public endpoints.
⚠️  Ledger device not connected (can be connected later)
```

## 🤝 Contributing

Built with modern TypeScript practices:
- 🧪 Comprehensive test suite (unit, integration, e2e, hardware)
- 📏 ESLint + TypeScript strict mode
- 🔄 Automated CI/CD pipeline
- 📖 Full API documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

🔒 **Keep Your Crypto Safe**: This tool enhances security by keeping your private keys on hardware while enabling powerful AI interactions with your crypto assets.

Built with ❤️ by [Dennison Bertram](https://github.com/dennisonbertram)