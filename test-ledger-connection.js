#!/usr/bin/env node

/**
 * Simple Ledger connection test script
 * Tests direct hardware connection without MCP overhead
 */

import TransportNodeHidModule from '@ledgerhq/hw-transport-node-hid';
import EthModule from '@ledgerhq/hw-app-eth';

const TransportNodeHid = TransportNodeHidModule.default;
const Eth = EthModule.default;

console.log('🔌 Testing Ledger Hardware Connection...\n');

async function testLedgerConnection() {
  let transport = null;
  
  try {
    console.log('1. Attempting to create transport...');
    transport = await TransportNodeHid.create(5000); // 5 second timeout
    console.log('✅ Transport created successfully');
    
    console.log('2. Creating Ethereum app instance...');
    const eth = new Eth(transport);
    console.log('✅ Ethereum app instance created');
    
    console.log('3. Getting app configuration...');
    const config = await eth.getAppConfiguration();
    console.log('✅ App configuration retrieved:', {
      arbitraryDataEnabled: config.arbitraryDataEnabled,
      erc20ProvisioningNecessary: config.erc20ProvisioningNecessary,
      starkEnabled: config.starkEnabled,
      starkv2Supported: config.starkv2Supported,
      version: config.version
    });
    
    console.log('4. Getting Ethereum address...');
    const addressInfo = await eth.getAddress("44'/60'/0'/0/0", false);
    console.log('✅ Address retrieved successfully:', {
      address: addressInfo.address,
      publicKey: addressInfo.publicKey.length + ' bytes'
    });
    
    console.log('\n🎉 Ledger connection test SUCCESSFUL!');
    console.log(`📍 Your Ethereum address: ${addressInfo.address}`);
    
  } catch (error) {
    console.error('\n❌ Ledger connection test FAILED:');
    console.error('Error:', error.message);
    
    // Provide helpful troubleshooting
    if (error.message.includes('cannot open device')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure Ledger device is connected via USB');
      console.log('2. Unlock the device with your PIN');
      console.log('3. Open the Ethereum app on the device');
      console.log('4. On macOS, you may need to allow USB access in System Preferences');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if Ledger Live is running (close it if open)');
      console.log('2. Try unplugging and reconnecting the device');
      console.log('3. Make sure Ethereum app is open on device');
    }
    
    process.exit(1);
  } finally {
    if (transport) {
      console.log('\n5. Closing transport...');
      await transport.close();
      console.log('✅ Transport closed');
    }
  }
}

// Run the test
testLedgerConnection();