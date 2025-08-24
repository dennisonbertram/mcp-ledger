# MCP Ledger Server

A comprehensive Model Context Protocol (MCP) server for secure Ledger hardware wallet integration with Ethereum and Bitcoin blockchain operations. Build AI agents that can safely interact with your crypto assets using hardware-level security.

## 🚀 Features

### 🔒 **Hardware Wallet Security**
- ✅ Ledger hardware wallet integration with latest @ledgerhq libraries
- ✅ Private keys never leave your device - all signing happens on hardware
- ✅ Transaction confirmation required on device screen
- ✅ Multi-account support with BIP32 derivation paths

### ⛓️ **Multi-Network Support**  
- ✅ **8 Networks**: Ethereum, Polygon, Arbitrum, Optimism, Base, Sepolia, Bitcoin, Bitcoin Testnet
- ✅ Enhanced RPC with Alchemy API integration for Ethereum networks
- ✅ Blockstream Esplora API for Bitcoin networks
- ✅ Automatic fallback to public endpoints
- ✅ EIP-1559 transaction support with dynamic gas pricing
- ✅ Bitcoin PSBT (Partially Signed Bitcoin Transaction) support

### 🪙 **Complete Asset Management**
- ✅ Real-time ETH balances across all Ethereum networks
- ✅ Real-time Bitcoin balances with UTXO tracking
- ✅ ERC20 token discovery and balances via Dune Sim API
- ✅ ERC721/ERC1155 NFT tracking and transfers
- ✅ Token approval management (approve/revoke/modify)
- ✅ USD pricing and portfolio valuation
- ✅ Bitcoin fee estimation and optimization

### 🤖 **AI Agent Ready**
- ✅ **19 MCP tools** for complete blockchain operations (14 Ethereum + 5 Bitcoin)
- ✅ One-command convenience functions (send ETH, Bitcoin, transfer tokens, etc.)
- ✅ Transaction crafting with automatic gas/fee estimation
- ✅ Message signing for Sign-In with Ethereum (SIWE)
- ✅ Real-time gas/fee analysis and optimization
- ✅ Bitcoin PSBT crafting and hardware signing

## 📋 Available Tools

### **🔍 Wallet & Balance Tools**
#### Ethereum
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_ledger_address` | Get ETH address from connected Ledger | Get your wallet address |
| `get_balance` | Get ETH balance for any address | Check account balance |
| `get_token_balances` | Get ERC20 token balances | View your token portfolio |
| `get_nft_balances` | Get NFT collection balances | See your NFT holdings |

#### Bitcoin
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_bitcoin_address` | Get Bitcoin address from Ledger | Get your Bitcoin wallet address |
| `get_bitcoin_balance` | Get Bitcoin balance with UTXO data | Check Bitcoin account balance |

### **⚡ Transaction Tools**
#### Ethereum
| Tool | Description | Example Use |
|------|-------------|-------------|
| `craft_transaction` | Create unsigned transactions | Prepare complex contract calls |
| `sign_transaction` | Sign with Ledger device | Sign prepared transactions |
| `sign_message` | Sign messages (SIWE) | Authenticate with dApps |
| `broadcast_transaction` | Send signed tx to network | Submit transactions |

#### Bitcoin
| Tool | Description | Example Use |
|------|-------------|-------------|
| `craft_bitcoin_transaction` | Create Bitcoin PSBT | Prepare Bitcoin transactions |

### **🎯 Convenience Tools (One-Click Actions)**
#### Ethereum
| Tool | Description | Example Use |
|------|-------------|-------------|
| `send_eth` | Send ETH (craft→sign→broadcast) | Send ETH to friend |
| `send_erc20_token` | Send tokens (craft→sign→broadcast) | Send USDC payment |
| `send_erc721_token` | Send NFTs (craft→sign→broadcast) | Transfer NFT |
| `manage_token_approval` | Manage approvals (craft→sign→broadcast) | Approve DEX spending |

#### Bitcoin
| Tool | Description | Example Use |
|------|-------------|-------------|
| `send_bitcoin` | Send Bitcoin (craft→sign→broadcast) | Send Bitcoin to friend |

### **🛠️ Developer Tools**
#### Ethereum
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_contract_abi` | Get verified contract ABIs | Interact with contracts |
| `analyze_gas` | Gas price analysis & optimization | Optimize transaction costs |

#### Bitcoin
| Tool | Description | Example Use |
|------|-------------|-------------|
| `analyze_bitcoin_fees` | Bitcoin fee analysis & optimization | Optimize transaction fees |

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
3. 📱 **Install Apps**: Both Ethereum and Bitcoin apps from Ledger Live
4. ⚙️ **Enable** "Blind signing" in Ethereum app settings
5. 🔄 **Switch** between Ethereum and Bitcoin apps as needed

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
Show me my Bitcoin balance on mainnet and testnet
```

### **Send Payments**
```
Send 0.1 ETH to 0x742d35Cc6631C0532925a3b8D0c7e89e5a3A5d34 on mainnet
Send 0.001 Bitcoin to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```

### **Transfer Tokens**
```
Send 100 USDC to my friend at 0x... on polygon network
```

### **Manage Approvals** 
```
Revoke all token approvals for Uniswap router on mainnet
```

### **Gas/Fee Optimization**
```
Analyze current gas prices on mainnet and recommend optimal settings for an ERC20 transfer
Analyze Bitcoin network fees and recommend optimal fee rate for fast confirmation
```

### **Bitcoin Operations**
```
Get a new Bitcoin address from my Ledger using derivation path m/44'/0'/0'/0/0
Send 0.005 Bitcoin with priority fee rate for urgent transaction
Check current Bitcoin mempool conditions and fee recommendations
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
- **BitcoinJS** - Bitcoin transaction construction and validation
- **Ledger SDK** - Official hardware wallet integration (ETH + BTC)
- **MCP SDK** - Model Context Protocol compliance
- **Zod** - Runtime schema validation
- **Blockstream Esplora API** - Bitcoin network data and broadcasting

### **Service Architecture**
- 🔄 **ServiceOrchestrator** - Coordinates all Ethereum operations
- 🔐 **LedgerService** - Hardware wallet communication (ETH + BTC)
- ⛓️ **BlockchainService** - Multi-network Ethereum RPC management
- 🏗️ **TransactionCrafter** - Smart Ethereum transaction building
- 🔍 **BlockscoutClient** - Contract verification and ABIs
- ₿ **BitcoinBlockchainService** - Bitcoin network operations via Esplora API
- ₿ **BitcoinTransactionCrafter** - PSBT creation and UTXO management

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

Built with ❤️ by [Dennison Bertram](https://github.com/crazyrabbitltc)