# MCP Ledger Server

A comprehensive Model Context Protocol (MCP) server for secure Ledger hardware wallet integration with Ethereum blockchain operations.

## Features

🔒 **Hardware Wallet Security**
- Ledger hardware wallet integration using modern @ledgerhq libraries
- No private key exposure - all signing occurs on device
- Graceful degradation when device not connected

⛓️ **Multi-Network Support**
- Ethereum Mainnet, Sepolia, Polygon, Arbitrum, Optimism, Base
- Real-time balance queries for ETH and ERC20 tokens
- NFT balance tracking for ERC721/ERC1155 contracts

🤖 **AI Agent Integration**
- Full MCP protocol compliance for AI agent interaction
- 6 comprehensive tools for blockchain operations
- JSON-RPC stdio transport for seamless integration

## MCP Tools

1. **`get_ledger_address`** - Retrieve Ethereum address from connected Ledger
2. **`get_balance`** - Get ETH balance for any address on supported networks  
3. **`get_token_balances`** - Get ERC20 token balances with batch support
4. **`get_nft_balances`** - Get NFT balances for ERC721/ERC1155 contracts
5. **`craft_transaction`** - Create transactions for Ledger signing
6. **`get_contract_abi`** - Retrieve contract ABIs from Blockscout

## Quick Start

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