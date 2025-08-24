#!/usr/bin/env node

/**
 * Test script to retrieve multiple Ethereum addresses from Ledger
 * Tests different derivation paths and address generation
 */

import TransportNodeHidModule from '@ledgerhq/hw-transport-node-hid';
import EthModule from '@ledgerhq/hw-app-eth';

const TransportNodeHid = TransportNodeHidModule.default;
const Eth = EthModule.default;

console.log('🔍 Testing Multiple Ledger Address Derivation...\n');

async function testMultipleAddresses() {
  let transport = null;
  
  try {
    console.log('1. Connecting to Ledger...');
    transport = await TransportNodeHid.create(5000);
    const eth = new Eth(transport);
    console.log('✅ Connected successfully\n');
    
    // Test different derivation paths
    const testPaths = [
      "44'/60'/0'/0/0",   // First address (default)
      "44'/60'/0'/0/1",   // Second address
      "44'/60'/0'/0/2",   // Third address
      "44'/60'/1'/0/0",   // First address of second account
      "44'/60'/2'/0/0",   // First address of third account
    ];
    
    console.log('📋 Retrieving addresses for different derivation paths:\n');
    
    for (let i = 0; i < testPaths.length; i++) {
      const path = testPaths[i];
      console.log(`${i + 1}. Testing path: ${path}`);
      
      try {
        const addressInfo = await eth.getAddress(path, false); // false = don't display on device
        console.log(`   ✅ Address: ${addressInfo.address}`);
        console.log(`   📝 Public Key Length: ${addressInfo.publicKey.length} bytes`);
        
        // Optional: Show first few bytes of public key for verification
        const pubKeyHex = addressInfo.publicKey.toString('hex').substring(0, 16);
        console.log(`   🔑 Public Key (first 8 bytes): ${pubKeyHex}...\n`);
        
      } catch (error) {
        console.log(`   ❌ Failed to get address: ${error.message}\n`);
      }
    }
    
    console.log('🧪 Testing address display on device (will require confirmation)...');
    console.log('Please confirm the address on your Ledger device when prompted.');
    
    try {
      const displayTest = await eth.getAddress("44'/60'/0'/0/0", true); // true = display on device
      console.log('✅ Address display test successful');
      console.log(`📱 Displayed address: ${displayTest.address}\n`);
    } catch (error) {
      console.log(`❌ Address display test failed: ${error.message}\n`);
    }
    
    console.log('🎉 Address derivation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('cannot open device')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure Ledger device is connected via USB');
      console.log('2. Unlock the device with your PIN');
      console.log('3. Open the Ethereum app on the device');
    }
    
  } finally {
    if (transport) {
      console.log('\n🔌 Closing connection...');
      await transport.close();
      console.log('✅ Connection closed');
    }
  }
}

// Run the test
testMultipleAddresses();