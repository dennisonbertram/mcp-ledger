# MCP Ledger Server

A comprehensive Model Context Protocol (MCP) server for secure Ledger hardware wallet integration with **Ethereum and Solana** blockchain operations. Build AI agents that can safely interact with your crypto assets across multiple blockchains using hardware-level security.

## 🚀 Features

### 🔒 **Hardware Wallet Security**
- ✅ Ledger hardware wallet integration with latest @ledgerhq libraries
- ✅ Private keys never leave your device - all signing happens on hardware
- ✅ Transaction confirmation required on device screen
- ✅ Multi-account support with BIP32 derivation paths

### ⛓️ **Multi-Blockchain Support**  
- ✅ **Ethereum**: 6 Networks (Mainnet, Polygon, Arbitrum, Optimism, Base, Sepolia)
- ✅ **Solana**: 3 Networks (Mainnet, Devnet, Testnet)
- ✅ Enhanced RPC with Alchemy API integration for Ethereum
- ✅ Custom Solana RPC support (Helius, QuickNode, Alchemy)
- ✅ Automatic fallback to public endpoints
- ✅ EIP-1559 transaction support with dynamic gas pricing (Ethereum)
- ✅ Solana transaction optimization with priority fees

### 🪙 **Complete Asset Management**
- ✅ **Ethereum**: Real-time ETH balances across all networks
- ✅ **Ethereum**: ERC20 token discovery and balances via Dune Sim API
- ✅ **Ethereum**: ERC721/ERC1155 NFT tracking and transfers
- ✅ **Ethereum**: Token approval management (approve/revoke/modify)
- ✅ **Solana**: Real-time SOL balances across all networks
- ✅ **Solana**: SPL token discovery and balances
- ✅ **Solana**: Associated token account management
- ✅ USD pricing and portfolio valuation (both chains)

### 🤖 **AI Agent Ready**
- ✅ **22 MCP tools** for complete multi-chain operations
- ✅ **Ethereum** (14 tools): Send ETH, transfer ERC20/NFT tokens, manage approvals
- ✅ **Solana** (8 tools): Send SOL, transfer SPL tokens, craft complex transactions
- ✅ Transaction crafting with automatic fee estimation (both chains)
- ✅ Message signing for authentication (SIWE for Ethereum, Solana messages)
- ✅ Real-time fee analysis and optimization

## 📋 Available Tools

### **🔍 Ethereum Tools**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_ledger_address` | Get Ethereum address from Ledger | Get your wallet address |
| `get_balance` | Get ETH balance for any address | Check account balance |
| `get_token_balances` | Get ERC20 token balances | View your token portfolio |
| `get_nft_balances` | Get NFT collection balances | See your NFT holdings |
| `craft_transaction` | Create unsigned transactions | Prepare complex contract calls |
| `sign_transaction` | Sign with Ledger device | Sign prepared transactions |
| `sign_message` | Sign messages (SIWE) | Authenticate with dApps |
| `broadcast_transaction` | Send signed tx to network | Submit transactions |
| `send_eth` | Send ETH (craft→sign→broadcast) | Send ETH to friend |
| `send_erc20_token` | Send tokens (craft→sign→broadcast) | Send USDC payment |
| `send_erc721_token` | Send NFTs (craft→sign→broadcast) | Transfer NFT |
| `manage_token_approval` | Manage approvals | Approve DEX spending |
| `get_contract_abi` | Get verified contract ABIs | Interact with contracts |
| `analyze_gas` | Gas price analysis | Optimize transaction costs |

### **🌟 Solana Tools**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_solana_address` | Get Solana address from Ledger | Get your Solana wallet address |
| `get_solana_balance` | Get SOL balance for any address | Check SOL balance |
| `get_spl_token_balances` | Get SPL token balances | View your Solana token portfolio |
| `craft_solana_transaction` | Create unsigned Solana transactions | Prepare complex transactions |
| `sign_solana_transaction` | Sign with Ledger device | Sign prepared Solana transactions |
| `send_sol` | Send SOL (craft→sign→broadcast) | Send SOL to friend |
| `send_spl_token` | Send SPL tokens (craft→sign→broadcast) | Send USDC-SPL payment |
| `analyze_solana_fees` | Solana fee analysis | Optimize transaction costs |


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
3. 📱 **Install and open** required apps:
   - **For Ethereum**: Ethereum app (enable "Blind signing" in settings)
   - **For Solana**: Solana app (ensure latest version for full compatibility)
4. ⚙️ The server will automatically switch between apps as needed

### 5. **Test Connection**

```bash
# Test basic connection
node test-ledger-connection.js

# Test MCP server
npm start
# In another terminal:
node test-server.cjs
```

## 🖥️ Integration with AI Tools

### **🚀 Claude Code (Recommended)**

The easiest way to use MCP Ledger with Claude Code:

```bash
# Add MCP Ledger server to your current project
claude mcp add ledger --env DUNE_SIM_API_KEY=your_key_here -- node /absolute/path/to/mcp-ledger/dist/index.js

# Or add with all environment variables
claude mcp add ledger \
  --env DUNE_SIM_API_KEY=your_dune_key \
  --env ALCHEMY_API_KEY=your_alchemy_key \
  --env ETHERSCAN_API_KEY=your_etherscan_key \
  -- node /absolute/path/to/mcp-ledger/dist/index.js

# Check server status
claude mcp list
/mcp

# Remove server if needed
claude mcp remove ledger
```

**Configuration Scopes:**
- `--scope local` - Private to current project (default)
- `--scope project` - Shared via `.mcp.json` (team access)
- `--scope user` - Available across all your projects

### **🖥️ Claude Desktop** (macOS/Windows)

1. Open Claude Desktop settings
2. Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-ledger": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-ledger/dist/index.js"],
      "env": {
        "DUNE_SIM_API_KEY": "your_dune_key_here",
        "ALCHEMY_API_KEY": "your_alchemy_key_here",
        "ETHERSCAN_API_KEY": "your_etherscan_key_here"
      }
    }
  }
}
```

### **✅ Verify Integration**

After setup, verify the server is working:

```bash
# In Claude Code
/mcp

# Should show:
✅ ledger: Connected (22 tools available)
  - 14 Ethereum tools + 8 Solana tools
  - Networks: mainnet, polygon, arbitrum, optimism, base, sepolia, solana-mainnet, solana-devnet, solana-testnet
```

**Available Tools:**
- **Ethereum**: `get_ledger_address`, `get_balance`, `get_token_balances`, `get_nft_balances`, `craft_transaction`, `get_contract_abi`, `sign_transaction`, `sign_message`, `broadcast_transaction`, `send_eth`, `send_erc20_token`, `send_erc721_token`, `manage_token_approval`, `analyze_gas`
- **Solana**: `get_solana_address`, `get_solana_balance`, `get_spl_token_balances`, `craft_solana_transaction`, `sign_solana_transaction`, `send_sol`, `send_spl_token`, `analyze_solana_fees`

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
Show me my SOL balance and SPL token holdings on Solana mainnet
```

### **Send Payments**
```
Send 0.1 ETH to 0x742d35Cc6631C0532925a3b8D0c7e89e5a3A5d34 on mainnet
Send 2 SOL to DsVmA5hWGtwLjMBVMGgPisFaMfRjNRzVvMZDZMK21SrP on Solana mainnet
```

### **Transfer Tokens**
```
Send 100 USDC to my friend at 0x... on polygon network
Send 50 USDC (SPL) to my friend at DsV... on Solana mainnet
```

### **Manage Approvals (Ethereum)** 
```
Revoke all token approvals for Uniswap router on mainnet
```

### **Fee Optimization**
```
Analyze current gas prices on mainnet and recommend optimal settings for an ERC20 transfer
Analyze current Solana fees and recommend priority fee for SPL token transfer
```

### **NFT Operations (Ethereum)**
```
Transfer my CryptoPunk #1234 to 0x... and show me the transaction details
```

### **Cross-Chain Portfolio**
```
Show me my complete portfolio across both Ethereum and Solana
```

## 🔧 Advanced Configuration

### **Custom Networks**

Add custom RPC endpoints in `.env`:

```bash
# Custom Ethereum RPC URLs (optional)
MAINNET_RPC_URL=https://your-custom-ethereum-rpc.com
POLYGON_RPC_URL=https://polygon-custom.com

# Custom Solana RPC URLs (optional) 
SOLANA_MAINNET_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_DEVNET_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Solana WebSocket endpoints (optional)
SOLANA_MAINNET_WS_URL=wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY
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
- ❌ **Ethereum**: Token discovery won't work  
- ❌ **Ethereum**: NFT discovery won't work
- ❌ Only basic ETH operations available
- ✅ **Solana**: All operations work (public RPC endpoints)
- ✅ **Both chains**: Ledger signing still works
- ✅ **Both chains**: Custom transaction crafting works

**💡 Minimum Setup**: Even without API keys, you get:
- ✅ All 8 Solana tools working
- ✅ Basic Ethereum operations (ETH transfers, custom contracts)
- ✅ Full Ledger hardware wallet security

## 🔧 Troubleshooting

### **Common Issues**

**MCP Server Not Connecting:**
```bash
# Check if server is properly built
npm run build

# Test server directly
node dist/index.js

# Verify in Claude Code
/mcp
claude mcp list
```

**Ledger Device Issues:**
1. 🔌 Ensure device is connected via USB
2. 🔓 Device is unlocked with PIN
3. 📱 Correct app is open (Ethereum or Solana)
4. ⚙️ "Blind signing" enabled in Ethereum app
5. 📡 No other applications using the device

**Environment Variables:**
```bash
# Check your environment file
cat .env

# Verify paths are absolute
which node  # Use this path in configurations
pwd         # Current directory for absolute paths
```

**Network Issues:**
- **Ethereum**: Use Alchemy API key for better reliability
- **Solana**: Consider Helius or QuickNode for production
- **Both**: Check firewall settings for outbound connections

## 🏗️ Architecture

### **Core Technologies**
- **TypeScript** - Full type safety with strict configuration  
- **Viem** - Modern Ethereum library for blockchain interactions
- **@solana/web3.js** - Official Solana JavaScript SDK
- **Ledger SDK** - Official hardware wallet integration (@ledgerhq/hw-app-eth, @ledgerhq/hw-app-solana)
- **MCP SDK** - Model Context Protocol compliance
- **Zod** - Runtime schema validation

### **Service Architecture**
- 🔄 **ServiceOrchestrator** - Coordinates all multi-chain operations
- 🔐 **LedgerService** - Hardware wallet communication (Ethereum + Solana)
- ⛓️ **BlockchainService** - Ethereum multi-network RPC management
- 🌟 **SolanaBlockchainService** - Solana multi-network RPC management
- 🏗️ **TransactionCrafter** - Smart Ethereum transaction building
- 🌟 **SolanaTransactionCrafter** - Smart Solana transaction building
- 🔍 **BlockscoutClient** - Contract verification and ABIs (Ethereum)

### **Security Model**

**🔒 Hardware Security**:
- ✅ Private keys never leave Ledger device (both chains)
- ✅ All transactions require physical confirmation on device screen
- ✅ **Ethereum**: BIP32 hierarchical deterministic key derivation (secp256k1)
- ✅ **Solana**: BIP44 hierarchical deterministic key derivation (Ed25519)
- ✅ Comprehensive input validation and sanitization

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

## 🌟 Solana-Specific Features

### **Advanced Solana Support**
- ✅ **Multiple Networks**: Mainnet, Devnet, Testnet with automatic configuration
- ✅ **SPL Token Standard**: Complete support for fungible and non-fungible tokens
- ✅ **Associated Token Accounts**: Automatic creation and management
- ✅ **Transaction Optimization**: Priority fees and compute unit optimization
- ✅ **Complex Transactions**: Multi-instruction transaction support
- ✅ **Fee Analysis**: Real-time network congestion and fee recommendations
- ✅ **Ed25519 Signatures**: Native Solana cryptography support via Ledger

### **Solana Network Recommendations**
- 🚀 **Production**: Use Helius or QuickNode for best performance and reliability
- 🧪 **Development**: Public endpoints work fine for testing
- 💰 **Rate Limits**: Consider premium RPC providers for high-volume usage

---

🔒 **Keep Your Crypto Safe**: This tool enhances security by keeping your private keys on hardware while enabling powerful AI interactions with your crypto assets **across Ethereum and Solana ecosystems**.

Built with ❤️ by [Dennison Bertram](https://github.com/crazyrabbitltc)