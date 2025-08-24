# @ledgerhq/hw-transport-node-hid Documentation

## Overview

The `@ledgerhq/hw-transport-node-hid` library is a Node.js/Electron transport layer that enables communication with Ledger Hardware Wallets using the HID (Human Interface Device) protocol. It serves as the primary interface for desktop applications to interact with Ledger devices via USB connections.

### Key Features
- **Node.js/Electron Support**: Designed specifically for desktop applications
- **HID Protocol**: Uses Human Interface Device protocol for USB communication
- **Device Discovery**: Automatic detection and listing of connected Ledger devices
- **Connection Management**: Robust connection handling with retry mechanisms
- **Event Handling**: Real-time monitoring of device connections and disconnections

## Installation and Setup Requirements

### Package Installation
```bash
npm install @ledgerhq/hw-transport-node-hid
```

### Dependencies
The package relies on the following core dependencies:
- `@ledgerhq/hw-transport`: Base transport interface
- `@ledgerhq/devices`: Ledger device definitions
- `@ledgerhq/errors`: Standardized error handling
- `node-hid`: Native HID device access
- `usb`: USB device management

### Basic Import
```typescript
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
```

### TypeScript Support
The package includes built-in TypeScript declarations, eliminating the need for separate `@types` packages. The stub package `@types/ledgerhq__hw-transport-node-hid` should not be used as the main package provides its own type definitions.

## API Methods and Parameters

### Static Methods

#### `TransportNodeHid.create()`
Creates a new transport instance using the first available Ledger device.

```typescript
static create(): Promise<TransportNodeHid>
```

**Usage:**
```typescript
const transport = await TransportNodeHid.create();
```

**Returns:** Promise resolving to a TransportNodeHid instance

#### `TransportNodeHid.isSupported()`
Checks if HID transport is supported on the current platform.

```typescript
static isSupported(): Promise<boolean>
```

**Usage:**
```typescript
const supported = await TransportNodeHid.isSupported();
if (supported) {
  // Proceed with HID transport
}
```

#### `TransportNodeHid.list()`
Lists all available Ledger devices connected via USB.

```typescript
static list(): Promise<Array<HIDDevice>>
```

**Usage:**
```typescript
const devices = await TransportNodeHid.list();
console.log(`Found ${devices.length} Ledger devices`);
```

#### `TransportNodeHid.open(path?: string)`
Opens a connection to a specific device or the first available device.

```typescript
static open(path?: string): Promise<TransportNodeHid>
```

**Parameters:**
- `path` (optional): Device path identifier. If omitted, connects to the first available device.

**Usage:**
```typescript
// Connect to first available device
const transport = await TransportNodeHid.open();

// Connect to specific device
const transport = await TransportNodeHid.open("/dev/hidraw0");
```

#### `TransportNodeHid.listen(observer)`
Monitors device connection and disconnection events.

```typescript
static listen(observer: Observer<DescriptorEvent>): Subscription
```

**Parameters:**
- `observer`: Observer object with `next`, `error`, and `complete` methods

**Usage:**
```typescript
const subscription = TransportNodeHid.listen({
  next: (event) => {
    if (event.type === 'add') {
      console.log('Device connected:', event.device);
    } else if (event.type === 'remove') {
      console.log('Device disconnected:', event.device);
    }
  },
  error: (error) => {
    console.error('Device listening error:', error);
  },
  complete: () => {
    console.log('Device listening completed');
  }
});

// Stop listening
subscription.unsubscribe();
```

### Configuration Methods

#### `TransportNodeHid.setListenDevicesDebounce(delay)`
Controls the frequency of device detection polling.

```typescript
static setListenDevicesDebounce(delay: number): void
```

**Parameters:**
- `delay`: Debounce delay in milliseconds

**Usage:**
```typescript
// Set 500ms debounce delay
TransportNodeHid.setListenDevicesDebounce(500);
```

#### `TransportNodeHid.setListenDevicesPollingSkip(condition)`
Conditionally skips device polling based on a custom condition.

```typescript
static setListenDevicesPollingSkip(conditionToSkip: () => boolean): void
```

**Parameters:**
- `conditionToSkip`: Function returning boolean to determine if polling should be skipped

**Usage:**
```typescript
// Skip polling when application is not focused
TransportNodeHid.setListenDevicesPollingSkip(() => !document.hasFocus());
```

#### `TransportNodeHid.setListenDevicesDebug()`
Enables debugging for device detection and connection processes.

```typescript
static setListenDevicesDebug(): void
```

**Usage:**
```typescript
// Enable debugging
TransportNodeHid.setListenDevicesDebug();
```

### Instance Methods

#### `transport.exchange(apdu)`
Sends APDU (Application Protocol Data Unit) commands to the device.

```typescript
exchange(apdu: Buffer): Promise<Buffer>
```

**Parameters:**
- `apdu`: Buffer containing the APDU command

**Usage:**
```typescript
const response = await transport.exchange(Buffer.from([0x80, 0x00, 0x00, 0x00, 0x00]));
```

#### `transport.close()`
Closes the transport connection.

```typescript
close(): Promise<void>
```

**Usage:**
```typescript
await transport.close();
```

## Connection Handling and Error Management

### Connection Lifecycle
1. **Discovery**: Use `list()` to find available devices
2. **Connection**: Use `create()` or `open()` to establish connection
3. **Communication**: Use `exchange()` for APDU commands
4. **Cleanup**: Always call `close()` when done

### Error Handling Best Practices

```typescript
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { TransportError } from "@ledgerhq/errors";

async function connectToLedger() {
  let transport;
  
  try {
    // Check support first
    const supported = await TransportNodeHid.isSupported();
    if (!supported) {
      throw new Error("HID transport not supported");
    }
    
    // Create transport
    transport = await TransportNodeHid.create();
    
    // Perform operations
    const result = await transport.exchange(command);
    return result;
    
  } catch (error) {
    if (error instanceof TransportError) {
      // Handle transport-specific errors
      console.error("Transport error:", error.message);
    } else {
      // Handle general errors
      console.error("General error:", error.message);
    }
    throw error;
  } finally {
    // Always cleanup
    if (transport) {
      await transport.close();
    }
  }
}
```

### Common Error Scenarios
- **Device not found**: No Ledger device connected
- **Device busy**: Another application is using the device
- **Permission denied**: Insufficient system permissions for USB access
- **Communication timeout**: Device not responding within expected timeframe
- **Invalid APDU**: Malformed command sent to device

### Retry Mechanism
```typescript
async function connectWithRetry(maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await TransportNodeHid.create();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Best Practices for USB HID Communication

### 1. Resource Management
Always close transport connections to prevent resource leaks:

```typescript
const transport = await TransportNodeHid.create();
try {
  // Use transport
} finally {
  await transport.close();
}
```

### 2. Device State Management
Check device availability before attempting operations:

```typescript
async function ensureDeviceReady() {
  const devices = await TransportNodeHid.list();
  if (devices.length === 0) {
    throw new Error("No Ledger device found. Please connect your device.");
  }
}
```

### 3. Concurrent Access Prevention
Avoid multiple simultaneous connections to the same device:

```typescript
let activeTransport = null;

async function getTransport() {
  if (activeTransport) {
    return activeTransport;
  }
  activeTransport = await TransportNodeHid.create();
  return activeTransport;
}
```

### 4. User Guidance
Provide clear instructions for device preparation:

```typescript
async function prepareDevice() {
  console.log("Please ensure:");
  console.log("1. Ledger device is connected via USB");
  console.log("2. Device is unlocked with PIN");
  console.log("3. Required app (e.g., Bitcoin, Ethereum) is open");
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // Give user time to prepare
}
```

## TypeScript Type Definitions and Interfaces

### Core Interfaces

```typescript
interface HIDDevice {
  vendorId: number;
  productId: number;
  path: string;
  serialNumber?: string;
  manufacturer?: string;
  product?: string;
  release: number;
  interface: number;
}

interface DescriptorEvent<T> {
  type: "add" | "remove";
  descriptor: T;
  deviceModel?: DeviceModel;
}

interface Observer<T> {
  next: (event: T) => void;
  error: (error: Error) => void;
  complete: () => void;
}

interface Subscription {
  unsubscribe(): void;
}
```

### Transport Class Definition

```typescript
declare class TransportNodeHid extends Transport {
  constructor(device: HID.HID, ledgerTransport?: boolean, timeout?: number);
  
  // Static methods
  static create(): Promise<TransportNodeHid>;
  static isSupported(): Promise<boolean>;
  static list(): Promise<Array<HIDDevice>>;
  static listen(observer: Observer<DescriptorEvent<HIDDevice>>): Subscription;
  static open(path?: string): Promise<TransportNodeHid>;
  static setListenDevicesDebounce(delay: number): void;
  static setListenDevicesPollingSkip(conditionToSkip: () => boolean): void;
  static setListenDevicesDebug(): void;
  
  // Instance methods
  exchange(apdu: Buffer): Promise<Buffer>;
  close(): Promise<void>;
  
  // Properties
  device: HID.HID;
  ledgerTransport: boolean;
  timeout: number;
  exchangeStack: any[];
}
```

## Example Usage Patterns

### Basic Bitcoin Address Retrieval
```typescript
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import AppBtc from "@ledgerhq/hw-app-btc";

async function getBitcoinAddress() {
  let transport;
  
  try {
    transport = await TransportNodeHid.create();
    const btc = new AppBtc(transport);
    
    // Get Bitcoin address for path "44'/0'/0'/0/0"
    const result = await btc.getWalletPublicKey("44'/0'/0'/0/0");
    console.log("Bitcoin address:", result.bitcoinAddress);
    
    return result.bitcoinAddress;
  } finally {
    if (transport) await transport.close();
  }
}
```

### Ethereum Address Retrieval
```typescript
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import AppEth from "@ledgerhq/hw-app-eth";

async function getEthereumAddress() {
  let transport;
  
  try {
    transport = await TransportNodeHid.create();
    const eth = new AppEth(transport);
    
    // Get Ethereum address for path "44'/60'/0'/0/0"
    const result = await eth.getAddress("44'/60'/0'/0/0");
    console.log("Ethereum address:", result.address);
    
    return result.address;
  } finally {
    if (transport) await transport.close();
  }
}
```

### Device Monitoring
```typescript
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

function monitorDevices() {
  const subscription = TransportNodeHid.listen({
    next: (event) => {
      if (event.type === "add") {
        console.log("✅ Ledger device connected");
        onDeviceConnected(event.descriptor);
      } else if (event.type === "remove") {
        console.log("❌ Ledger device disconnected");
        onDeviceDisconnected(event.descriptor);
      }
    },
    error: (error) => {
      console.error("Device monitoring error:", error);
    },
    complete: () => {
      console.log("Device monitoring stopped");
    }
  });
  
  return subscription;
}

function onDeviceConnected(device) {
  // Handle device connection
}

function onDeviceDisconnected(device) {
  // Handle device disconnection
}
```

### Multiple Device Handling
```typescript
async function listAllDevices() {
  try {
    const devices = await TransportNodeHid.list();
    
    console.log(`Found ${devices.length} Ledger device(s):`);
    devices.forEach((device, index) => {
      console.log(`${index + 1}. ${device.product} (${device.path})`);
    });
    
    return devices;
  } catch (error) {
    console.error("Failed to list devices:", error);
    return [];
  }
}

async function connectToSpecificDevice(devicePath) {
  try {
    const transport = await TransportNodeHid.open(devicePath);
    console.log(`Connected to device at ${devicePath}`);
    return transport;
  } catch (error) {
    console.error(`Failed to connect to device ${devicePath}:`, error);
    throw error;
  }
}
```

## Troubleshooting Common Connection Issues

### Issue 1: "Device not found" Error
**Symptoms:** Transport creation fails with device not found error

**Solutions:**
1. Verify Ledger device is connected via USB
2. Check USB cable integrity
3. Try different USB ports
4. Restart the Ledger device

```typescript
async function diagnosticDeviceCheck() {
  const devices = await TransportNodeHid.list();
  if (devices.length === 0) {
    console.error("No devices found. Check USB connection.");
    return false;
  }
  
  console.log(`Found ${devices.length} device(s)`);
  return true;
}
```

### Issue 2: Permission Denied on Linux
**Symptoms:** USB access denied error on Linux systems

**Solutions:**
1. Add user to `plugdev` group
2. Configure udev rules for Ledger devices
3. Run application with appropriate permissions

```bash
# Add user to plugdev group
sudo usermod -a -G plugdev $USER

# Create udev rule
echo 'KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="2c97", MODE="0664", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/20-hw1.rules

# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Issue 3: Device Busy Error
**Symptoms:** Another application is using the device

**Solutions:**
1. Close other applications that might be using the device
2. Restart the device
3. Wait and retry connection

```typescript
async function handleDeviceBusy() {
  const maxRetries = 5;
  const retryDelay = 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await TransportNodeHid.create();
    } catch (error) {
      if (error.message.includes("busy") && attempt < maxRetries) {
        console.log(`Device busy, retrying in ${retryDelay}ms... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      throw error;
    }
  }
}
```

### Issue 4: Communication Timeout
**Symptoms:** Operations timeout without response

**Solutions:**
1. Ensure correct app is open on the device
2. Check if device requires user confirmation
3. Increase timeout values

```typescript
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

// Increase default timeout
const transport = await TransportNodeHid.create();
transport.setExchangeTimeout(60000); // 60 seconds
```

### Issue 5: App Not Open on Device
**Symptoms:** Specific app operations fail

**Solutions:**
1. Navigate to the required app on the Ledger device
2. Verify app is properly installed
3. Check app compatibility with device firmware

```typescript
async function ensureAppOpen(appName) {
  console.log(`Please open the ${appName} app on your Ledger device`);
  console.log("Press any key when ready...");
  
  // Wait for user confirmation
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
}
```

### Issue 6: Outdated Firmware
**Symptoms:** Incompatible device responses

**Solutions:**
1. Update Ledger device firmware via Ledger Live
2. Update app versions on the device
3. Check compatibility matrix

```typescript
async function checkDeviceCompatibility() {
  try {
    const transport = await TransportNodeHid.create();
    // Attempt basic operation to verify compatibility
    const response = await transport.exchange(Buffer.from([0xe0, 0x01, 0x00, 0x00, 0x00]));
    console.log("Device compatibility check passed");
    await transport.close();
    return true;
  } catch (error) {
    console.error("Device compatibility check failed:", error.message);
    return false;
  }
}
```

### Diagnostic Helper Function
```typescript
async function fullDiagnostic() {
  console.log("🔍 Running Ledger HID Transport Diagnostics...\n");
  
  // Check support
  const supported = await TransportNodeHid.isSupported();
  console.log(`✓ HID Transport Supported: ${supported}`);
  
  if (!supported) {
    console.log("❌ HID transport not supported on this platform");
    return;
  }
  
  // List devices
  const devices = await TransportNodeHid.list();
  console.log(`✓ Devices Found: ${devices.length}`);
  
  if (devices.length === 0) {
    console.log("❌ No Ledger devices found");
    console.log("Please check:");
    console.log("  - Device is connected via USB");
    console.log("  - USB cable is functional");
    console.log("  - Device is powered on");
    return;
  }
  
  // Test connection
  try {
    const transport = await TransportNodeHid.create();
    console.log("✓ Connection Test: Passed");
    await transport.close();
  } catch (error) {
    console.log(`❌ Connection Test: Failed - ${error.message}`);
  }
  
  console.log("\n🎉 Diagnostic complete");
}
```

## Advanced Configuration

### Custom Device Filters
```typescript
// Filter devices by vendor ID (Ledger devices use 0x2c97)
const ledgerDevices = devices.filter(device => device.vendorId === 0x2c97);
```

### Performance Optimization
```typescript
// Reduce polling frequency for better performance
TransportNodeHid.setListenDevicesDebounce(1000); // 1 second

// Skip polling when not needed
TransportNodeHid.setListenDevicesPollingSkip(() => {
  return !window.document.hasFocus(); // Skip when window not focused
});
```

### Memory Management
```typescript
class LedgerManager {
  private transport: TransportNodeHid | null = null;
  
  async connect() {
    if (this.transport) {
      return this.transport;
    }
    
    this.transport = await TransportNodeHid.create();
    return this.transport;
  }
  
  async disconnect() {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }
  
  async cleanup() {
    await this.disconnect();
  }
}
```

## Package Migration Notes

**Important:** The `@ledgerhq/hw-transport-node-hid` package was originally part of the LedgerJS repository, which has been moved to the Ledger Live monorepo. While the package remains available on npm, the source code is now maintained in the [LedgerHQ/ledger-live](https://github.com/LedgerHQ/ledger-live) repository under `libs/ledgerjs/packages/hw-transport-node-hid`.

For the most up-to-date documentation and source code, refer to:
- **Current Repository**: https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-hid
- **Legacy Repository**: https://github.com/LedgerHQ/ledgerjs (archived)
- **NPM Package**: https://www.npmjs.com/package/@ledgerhq/hw-transport-node-hid

This documentation is based on version 6.29.8 and may need updates as the package evolves in its new repository structure.