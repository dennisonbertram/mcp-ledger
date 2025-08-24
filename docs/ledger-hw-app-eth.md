# @ledgerhq/hw-app-eth - Comprehensive Documentation

## Overview

The `@ledgerhq/hw-app-eth` library provides JavaScript/TypeScript bindings for interacting with Ethereum applications on Ledger Hardware Wallets. This library enables developers to integrate Ledger device functionality for Ethereum transactions, address generation, and cryptographic operations.

**Latest Version**: 6.45.15  
**License**: Apache-2.0  
**Repository**: https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-app-eth

## Installation and Setup

### Installation

```bash
npm install @ledgerhq/hw-app-eth
```

### Basic Setup

```javascript
import Eth from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport-node-hid"; // or other transport

const transport = await Transport.create();
const eth = new Eth(transport);
```

### Constructor

```typescript
constructor(
  transport: Transport, 
  scrambleKey: string = "w0w", 
  loadConfig: LoadConfig = {}
)
```

- `transport`: Transport instance for communicating with the Ledger device
- `scrambleKey`: Optional scrambling key for communication (default: "w0w")
- `loadConfig`: Optional configuration object

## EthApp Class Methods

### Address Operations

#### getAddress()

Retrieves an Ethereum address for a given BIP 32 derivation path.

```typescript
getAddress(
  path: string, 
  boolDisplay?: boolean, 
  boolChaincode?: boolean
): Promise<{
  publicKey: string;
  address: string;
  chainCode?: string;
}>
```

**Parameters:**
- `path`: BIP 32 derivation path (e.g., "44'/60'/0'/0/0")
- `boolDisplay`: Optional. Display address on device for confirmation
- `boolChaincode`: Optional. Include chain code in response

**Example:**
```javascript
const result = await eth.getAddress("44'/60'/0'/0/0");
console.log(result.address); // 0x...
```

### Transaction Signing

#### signTransaction()

Signs an Ethereum transaction using the Ledger device.

```typescript
signTransaction(
  path: string, 
  rawTxHex: string, 
  resolution?: LedgerEthTransactionResolution | null
): Promise<{
  v: string;
  r: string;
  s: string;
}>
```

**Parameters:**
- `path`: BIP 32 derivation path for the signing key
- `rawTxHex`: Raw transaction in hexadecimal format
- `resolution`: Optional metadata for clear signing (ERC20 tokens, contracts, NFTs)

**Example:**
```javascript
const rawTx = "0x..."; // Raw transaction hex
const resolution = {
  // ERC20 token information, plugin data, etc.
};

const signature = await eth.signTransaction("44'/60'/0'/0/0", rawTx, resolution);
console.log(signature); // { v: "0x1c", r: "0x...", s: "0x..." }
```

#### clearSignTransaction()

Alternative transaction signing method with enhanced clear signing capabilities.

### Message Signing

#### signPersonalMessage()

Signs a personal message following the `eth_sign` RPC specification.

```typescript
signPersonalMessage(
  path: string, 
  messageHex: string
): Promise<{
  v: number;
  r: string;
  s: string;
}>
```

**Parameters:**
- `path`: BIP 32 derivation path
- `messageHex`: Message in hexadecimal format

**Example:**
```javascript
const message = "0x48656c6c6f20576f726c64"; // "Hello World" in hex
const signature = await eth.signPersonalMessage("44'/60'/0'/0/0", message);
```

#### signEIP712HashedMessage()

Signs EIP-712 structured data messages.

```typescript
signEIP712HashedMessage(
  path: string, 
  domainSeparatorHex: string, 
  hashStructMessageHex: string
): Promise<{
  v: number;
  r: string;
  s: string;
}>
```

**Parameters:**
- `path`: BIP 32 derivation path
- `domainSeparatorHex`: Domain separator hash in hex
- `hashStructMessageHex`: Struct message hash in hex

### Configuration Methods

#### getAppConfiguration()

Retrieves the Ethereum application configuration from the Ledger device.

```typescript
getAppConfiguration(): Promise<{
  version: string;
  arbitraryDataEnabled: boolean;
  erc20ProvisioningNecessary: boolean;
  starkEnabled: boolean;
  starkv2Supported: boolean;
}>
```

**Example:**
```javascript
const config = await eth.getAppConfiguration();
console.log(config.version); // "1.10.3"
console.log(config.arbitraryDataEnabled); // true/false
```

## Address Derivation and Verification

### BIP 44 Path Structure

Ethereum addresses follow BIP 44 derivation:
```
m/44'/60'/account'/change/address_index
```

**Standard Examples:**
- First account, first address: `"44'/60'/0'/0/0"`
- First account, second address: `"44'/60'/0'/0/1"`
- Second account, first address: `"44'/60'/1'/0/0"`

### Address Verification

```javascript
// Display address on device for user verification
const result = await eth.getAddress("44'/60'/0'/0/0", true);
// User must confirm the address on the Ledger device
```

## ERC20 Token Operations

### provideERC20TokenInformation()

Provides trusted ERC20 token information to the device for clear signing.

```typescript
provideERC20TokenInformation(
  tokenInfo: {
    contractAddress: string;
    ticker: string;
    decimals: number;
  }
): Promise<boolean>
```

**Example:**
```javascript
await eth.provideERC20TokenInformation({
  contractAddress: "0xA0b86a33E6441027247f4c67b5cDB8D3C4e0C86C",
  ticker: "USDC",
  decimals: 6
});
```

### ERC20 Transaction Signing

For ERC20 transactions, use the resolution parameter in `signTransaction()`:

```javascript
const resolution = {
  erc20Tokens: [
    {
      contractAddress: "0xA0b86a33E6441027247f4c67b5cDB8D3C4e0C86C",
      ticker: "USDC",
      decimals: 6
    }
  ]
};

const signature = await eth.signTransaction(path, rawTx, resolution);
```

## TypeScript Type Definitions

### Core Interfaces

```typescript
interface LedgerEthTransactionResolution {
  erc20Tokens?: Array<{
    contractAddress: string;
    ticker: string;
    decimals: number;
  }>;
  nfts?: Array<{
    contractAddress: string;
    tokenId: string;
    collectionName: string;
  }>;
  plugins?: Array<PluginInfo>;
}

interface LoadConfig {
  // Configuration options for the Eth instance
}

interface Signature {
  v: number | string;
  r: string;
  s: string;
}
```

### Stark-related Types

```typescript
type StarkQuantizationType = 
  | "eth" 
  | "erc20" 
  | "erc721" 
  | "erc20mintable" 
  | "erc721mintable";
```

## Example Usage Patterns

### Basic Wallet Integration

```javascript
import Eth from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport-webusb";

async function connectLedger() {
  const transport = await Transport.create();
  const eth = new Eth(transport);
  
  // Get device configuration
  const config = await eth.getAppConfiguration();
  console.log("Ethereum app version:", config.version);
  
  // Get first Ethereum address
  const address = await eth.getAddress("44'/60'/0'/0/0");
  console.log("Address:", address.address);
  
  return { eth, address: address.address };
}
```

### Transaction Signing Workflow

```javascript
async function signEthereumTransaction(eth, txParams) {
  try {
    // Build raw transaction
    const rawTx = buildRawTransaction(txParams);
    
    // Create resolution for clear signing
    const resolution = {
      erc20Tokens: [], // Add token info if needed
      nfts: [],        // Add NFT info if needed
    };
    
    // Sign transaction
    const signature = await eth.signTransaction(
      "44'/60'/0'/0/0", 
      rawTx, 
      resolution
    );
    
    // Combine signature with transaction
    return {
      ...txParams,
      v: signature.v,
      r: signature.r,
      s: signature.s
    };
    
  } catch (error) {
    console.error("Transaction signing failed:", error);
    throw error;
  }
}
```

### Message Signing

```javascript
async function signMessage(eth, message) {
  const messageHex = "0x" + Buffer.from(message, 'utf8').toString('hex');
  const signature = await eth.signPersonalMessage("44'/60'/0'/0/0", messageHex);
  
  return {
    message,
    signature: signature.r + signature.s.substr(2) + signature.v.toString(16)
  };
}
```

## Error Handling and Troubleshooting

### Common Error Types

1. **Device Not Connected**
   ```javascript
   // Error: Transport is not open
   // Solution: Ensure device is connected and app is open
   ```

2. **User Rejection**
   ```javascript
   // Error: User rejected transaction
   // Solution: Handle user cancellation gracefully
   ```

3. **Invalid Path**
   ```javascript
   // Error: Invalid derivation path
   // Solution: Use proper BIP 44 format
   ```

### Error Handling Pattern

```javascript
async function safeOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.statusCode === 0x6985) {
      throw new Error("User rejected the operation");
    } else if (error.statusCode === 0x6b0c) {
      throw new Error("Locked device or invalid state");
    } else {
      throw new Error(`Operation failed: ${error.message}`);
    }
  }
}
```

### Device Status Codes

- `0x6985`: User rejected
- `0x6b0c`: Device locked or wrong state
- `0x6a82`: App not selected
- `0x6d00`: Invalid instruction
- `0x9000`: Success

## Integration with Different Ethereum Networks

### Network Configuration

The library works with any Ethereum-compatible network. Network-specific parameters are handled at the transaction level:

```javascript
// Mainnet transaction
const mainnetTx = {
  chainId: 1,
  // ... other params
};

// Polygon transaction
const polygonTx = {
  chainId: 137,
  // ... other params
};

// Sign for any network
const signature = await eth.signTransaction(path, rawTx, resolution);
```

### Multi-Chain Support

```javascript
const networks = {
  ethereum: { chainId: 1, name: "Ethereum Mainnet" },
  polygon: { chainId: 137, name: "Polygon" },
  arbitrum: { chainId: 42161, name: "Arbitrum One" },
  optimism: { chainId: 10, name: "Optimism" }
};

async function signForNetwork(networkName, txParams) {
  const network = networks[networkName];
  const txWithChainId = { ...txParams, chainId: network.chainId };
  
  const rawTx = buildRawTransaction(txWithChainId);
  return await eth.signTransaction(path, rawTx, resolution);
}
```

## Advanced Features

### Ethereum 2.0 Support

```typescript
eth2GetPublicKey(path: string): Promise<{
  publicKey: string;
}>
```

### Stark Curve Operations

```typescript
starkGetPublicKey(path: string, boolDisplay?: boolean): Promise<{
  publicKey: string;
}>
```

### EIP-1024 Encryption

```typescript
getEIP1024SharedSecret(path: string, otherPublicKey: string): Promise<{
  sharedSecret: string;
}>
```

## Best Practices

1. **Always validate user input** before sending to the device
2. **Handle user rejection gracefully** with appropriate UI feedback
3. **Verify addresses** by displaying them on the device when critical
4. **Use resolution metadata** for clear signing of complex transactions
5. **Implement proper error handling** for all device interactions
6. **Cache device configuration** to avoid repeated calls
7. **Use appropriate derivation paths** following BIP 44 standards

## Transport Layer

The library requires a transport layer to communicate with Ledger devices:

- **WebUSB**: `@ledgerhq/hw-transport-webusb` (web browsers)
- **Node HID**: `@ledgerhq/hw-transport-node-hid` (Node.js)
- **Web Bluetooth**: `@ledgerhq/hw-transport-web-ble` (Bluetooth)

Choose the appropriate transport for your platform and use case.

## Support and Resources

- **Developer Portal**: https://developers.ledger.com/
- **Discord**: Ledger Developers Discord community
- **GitHub Issues**: Report issues on the ledger-live repository
- **Documentation**: Official Ledger developer documentation

This comprehensive documentation covers all major aspects of the `@ledgerhq/hw-app-eth` library for implementing Ethereum operations with Ledger hardware wallets.