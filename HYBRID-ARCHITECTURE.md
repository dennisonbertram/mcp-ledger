# MCP Ledger Server - Hybrid Architecture Guide

## 🏗️ Architecture Overview

This project now provides **two deployment options** for the MCP Ledger server:

1. **Traditional MCP Server** (stdio-based, runs locally)
2. **Vercel AI Hybrid Architecture** (HTTP-based, serverless + local proxy)

## 🎯 When to Use Each Architecture

### Use Traditional MCP Server When:
- You need all operations (including hardware) in a single process
- You're integrating with Claude Desktop or other stdio MCP clients
- You prefer simpler deployment (single service)
- You're developing locally and need direct hardware access

### Use Vercel AI Hybrid When:
- You want global edge deployment for blockchain operations
- You need HTTP API access for web applications
- You want automatic scaling and zero infrastructure management
- You're building distributed systems with separate concerns

## 📁 Project Structure

```
mcp-ledger/
├── src/
│   ├── index.ts                 # Traditional MCP server (stdio)
│   ├── services/               # Shared business logic
│   ├── types/                  # Shared type definitions
│   ├── config/                 # Shared configuration
│   ├── tools/                  # Traditional MCP tools
│   ├── vercel/                 # Vercel AI serverless components
│   │   ├── api/index.ts        # HTTP MCP server
│   │   ├── package.json        # Serverless dependencies
│   │   ├── vercel.json         # Vercel deployment config
│   │   └── README.md           # Vercel-specific docs
│   └── proxy/                  # Local hardware proxy
│       ├── ledger-proxy.ts     # Hardware operations API
│       └── package.json        # Proxy dependencies
├── package.json                # Traditional server dependencies
└── README.md                   # Main documentation
```

## 🔧 Feature Comparison

| Feature | Traditional MCP | Vercel AI Hybrid |
|---------|------------------|-------------------|
| **Deployment** | Single Node.js process | Vercel serverless + Local proxy |
| **Scaling** | Manual/PM2 | Automatic global edge |
| **Hardware Access** | Direct USB/HID | Via HTTP proxy |
| **Integration** | stdio MCP protocol | HTTP + MCP protocol |
| **Infrastructure** | Self-managed | Vercel-managed + Local |
| **Latency** | Local execution | Global edge (blockchain) + Local (hardware) |
| **Cost** | Server hosting | Vercel pricing + Local compute |

## 🚀 Tool Distribution

### Traditional MCP Server (All Local)
```typescript
✅ get_ledger_address      // Direct hardware access
✅ get_balance            // Local blockchain service  
✅ get_token_balances     // Local token discovery
✅ get_nft_balances       // Local NFT discovery
✅ craft_transaction      // Local transaction crafting
✅ get_contract_abi       // Local ABI retrieval
```

### Vercel AI Hybrid Architecture

**Vercel Serverless Functions:**
```typescript
✅ get_balance            // Global edge deployment
✅ get_token_balances     // Dune Sim API integration  
✅ get_nft_balances       // Dune Sim API integration
✅ get_contract_abi       // Blockscout API integration
```

**Local Ledger Proxy:**
```typescript  
✅ get_ledger_address     // Hardware USB/HID access
✅ craft_transaction      // Hardware-aware transaction prep
```

## 🔄 Migration Path

### Phase 1: Traditional Server (Current)
- ✅ Complete implementation
- ✅ All tools working locally
- ✅ Production ready

### Phase 2: Hybrid Architecture (New)
- ✅ Vercel AI server created
- ✅ Local proxy implemented
- ✅ Tool distribution completed
- 🟡 Testing and deployment (current phase)

### Phase 3: Enhanced Features (Future)
- WebSocket real-time updates
- Multi-device Ledger support
- Advanced caching strategies
- GraphQL API layer

## 🛠️ Development Workflows

### Traditional Development
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev

# Test with MCP client
node test-server.cjs
```

### Vercel AI Development  
```bash
# Set up Vercel server
cd src/vercel
npm install
vercel dev

# Set up local proxy  
cd src/proxy
npm install
npm run dev

# Test hybrid system
curl http://localhost:3000/
curl http://localhost:3001/health
```

## 🔐 Security Considerations

### Traditional Architecture
- Private keys never leave Ledger device
- All operations run in trusted local environment
- Direct hardware communication
- Single point of control

### Hybrid Architecture  
- **Vercel server**: Read-only blockchain operations, no private key access
- **Local proxy**: Hardware-dependent operations, private key isolation  
- **Network security**: HTTPS/TLS for all communications
- **Separation of concerns**: Blockchain data vs hardware operations

## 📊 Performance Characteristics

### Traditional Architecture
```
Latency: Low (all local)
Throughput: Limited by single process
Scaling: Manual horizontal scaling
Availability: Single point of failure
```

### Hybrid Architecture
```
Blockchain Operations:
- Latency: Low (global edge)
- Throughput: Automatic scaling  
- Availability: 99.99% SLA (Vercel)

Hardware Operations:
- Latency: Low (local USB)
- Throughput: Limited by hardware
- Availability: Depends on local setup
```

## 🎯 Use Case Scenarios

### Personal Development & Testing
**Recommendation**: Traditional MCP Server
- Simpler setup and debugging
- Direct hardware control
- Faster iteration cycles

### Production Web Applications
**Recommendation**: Vercel AI Hybrid
- Global performance optimization
- Automatic scaling
- Separation of concerns
- API-first architecture

### Enterprise Deployment
**Recommendation**: Both (Migration Strategy)
- Start with Traditional for proof-of-concept
- Migrate to Hybrid for production scale
- Maintain both for different use cases

### Integration with AI Agents
**Traditional**: stdio MCP protocol
```json
{
  "mcpServers": {
    "mcp-ledger": {
      "command": "node",
      "args": ["/path/to/dist/index.js"]
    }
  }
}
```

**Hybrid**: HTTP MCP + REST APIs
```json
{
  "mcpServers": {
    "ledger-blockchain": {
      "url": "https://your-deployment.vercel.app/mcp"
    }
  },
  "restApis": {
    "ledger-hardware": "http://localhost:3001"
  }
}
```

## 🚦 Getting Started

### Choose Your Architecture

**For Local Development & Claude Desktop Integration:**
```bash
npm install
npm run build  
npm start
```

**For Web Applications & Global Deployment:**
```bash
# Deploy blockchain operations to Vercel
cd src/vercel
vercel deploy --prod

# Start local hardware proxy
cd src/proxy  
npm install
npm start
```

### Configuration Required

**Both architectures need:**
- `DUNE_SIM_API_KEY` (required for token discovery)
- `ALCHEMY_API_KEY` (optional for enhanced RPC)
- `ETHERSCAN_API_KEY` (optional for contract verification)

---

**The hybrid architecture provides the best of both worlds: global performance for blockchain operations with local security for hardware operations.**