# Authentication Guide

## Overview

The MCP Ledger system supports different authentication modes depending on the transport type:

- **STDIO Transport**: No authentication needed (local process communication)
- **HTTP Transport**: API key authentication required (for web/multi-user deployment)

## Transport Modes & Security

### 1. STDIO Transport (Local Use)
```bash
# No authentication needed - secure by default
npm start
```
- ✅ **Use Case**: Personal use, Claude Desktop integration
- ✅ **Security**: Process isolation, local machine boundary
- ✅ **Authentication**: None required (Ledger device provides hardware confirmation)

### 2. HTTP Transport (Web Deployment)
```bash
# Authentication required for web access
LEDGER_PROXY_API_KEY=your-key npm run proxy
```
- ⚠️ **Use Case**: Web applications, Next.js API routes, multi-user systems
- ⚠️ **Security**: Network-accessible endpoints require protection
- ⚠️ **Authentication**: **REQUIRED** via API key headers

## HTTP Authentication Setup

### Environment Variables

Add to your `.env` file:
```env
# For Ledger Hardware Proxy (localhost:3001)
LEDGER_PROXY_API_KEY=your-secure-proxy-key-here

# For Vercel MCP HTTP Server 
VERCEL_MCP_API_KEY=your-secure-mcp-key-here

# CORS Configuration (optional)
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

### API Key Usage

Include the API key in request headers:

```typescript
// For Ledger Proxy requests
const response = await fetch('http://localhost:3001/ledger/address', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.LEDGER_PROXY_API_KEY
  },
  body: JSON.stringify({ derivationPath: "44'/60'/0'/0/0" })
});

// For Vercel MCP HTTP requests
const response = await fetch('https://your-app.vercel.app/mcp/tools/list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.VERCEL_MCP_API_KEY
  }
});
```

### Next.js API Integration

When using behind Next.js API routes:

```typescript
// pages/api/ledger/[...action].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Forward the API key to the proxy service
  const response = await fetch(`http://localhost:3001/ledger/${action}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.LEDGER_PROXY_API_KEY
    },
    body: JSON.stringify(req.body)
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}
```

## Security Considerations

### Development vs Production

**Development (Default Keys)**:
```env
LEDGER_PROXY_API_KEY=ledger-proxy-dev-key
VERCEL_MCP_API_KEY=vercel-mcp-dev-key
```

**Production (Custom Keys)**:
```env
LEDGER_PROXY_API_KEY=prod-xyz-secure-random-key-789
VERCEL_MCP_API_KEY=prod-abc-secure-random-key-456
```

### Key Requirements

- **Minimum 16 characters**
- **Include letters, numbers, special characters**
- **Different keys for different services**
- **Rotate keys regularly in production**

### CORS Configuration

Limit origins to trusted domains:
```env
ALLOWED_ORIGINS=https://yourapp.com,https://yourapp.vercel.app
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized - Valid API key required",
  "hint": "Include X-API-Key header with valid API key"
}
```

### Missing API Key
```json
{
  "error": "Unauthorized - Valid API key required",
  "hint": "Include X-API-Key header with valid API key",
  "documentation": "See README.md for authentication setup"
}
```

## Deployment Checklist

### For HTTP Deployment:
- [ ] Set secure API keys in environment
- [ ] Configure CORS origins
- [ ] Test authentication with curl
- [ ] Verify error responses
- [ ] Document keys for team

### For Local STDIO:
- [ ] No additional configuration needed
- [ ] Keys are optional (will use defaults)

## Testing Authentication

Test the proxy service:
```bash
# Should fail without API key
curl -X POST http://localhost:3001/ledger/address

# Should succeed with API key
curl -X POST http://localhost:3001/ledger/address \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"derivationPath": "44'\''/60'\''/0'\''/0/0"}'
```

## Migration Guide

If upgrading from pre-authentication version:

1. **Update environment variables** with new keys
2. **Update client code** to include API key headers
3. **Test locally** before deploying
4. **Update deployment scripts** with new environment setup

The system maintains backward compatibility - if no API key is set, it uses development defaults.