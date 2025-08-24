/**
 * Local Ledger Hardware Proxy Service
 * Handles hardware-dependent operations that can't run in serverless
 * Provides HTTP API for Vercel AI MCP server to communicate with Ledger device
 */

import express from 'express';
import cors from 'cors';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import Eth from '@ledgerhq/hw-app-eth';
import { z } from 'zod';
import { parseEther } from 'viem';
// Import from main project structure
import type { SupportedNetwork } from '../types/blockchain.js';
import { TransactionCrafter } from '../services/transaction-crafter.js';
import { BlockchainService } from '../services/blockchain.js';
import { BlockscoutClient } from '../services/blockscout.js';
import { LedgerService } from '../services/ledger.js';
import { validateConfiguration } from '../config/environment.js';

const app = express();
const PORT = process.env.LEDGER_PROXY_PORT || 3001;

// Simple API key authentication
const API_KEY = process.env.LEDGER_PROXY_API_KEY || 'ledger-proxy-dev-key';

/**
 * Authentication middleware for HTTP requests
 * Checks for X-API-Key header with valid API key
 */
const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const providedKey = req.headers['x-api-key'];
  
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Valid API key required',
      hint: 'Include X-API-Key header with valid API key'
    });
  }
  
  next();
};

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Schemas
const GetAddressSchema = z.object({
  derivationPath: z.string().optional().default("44'/60'/0'/0/0"),
  verify: z.boolean().optional().default(false)
});

const CraftTransactionSchema = z.object({
  to: z.string(),
  value: z.string().optional(),
  data: z.string().optional(), 
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet')
});

// Ledger connection state
let transport: any = null;
let ethApp: Eth | null = null;

// Services
let blockchainService: BlockchainService;
let blockscoutClient: BlockscoutClient;
let ledgerService: LedgerService;
let transactionCrafter: TransactionCrafter;

/**
 * Initialize services
 */
async function initializeServices() {
  try {
    console.log('Initializing services...');
    
    // Initialize core services
    blockchainService = new BlockchainService();
    blockscoutClient = new BlockscoutClient();
    ledgerService = new LedgerService();
    
    // Initialize transaction crafter with all required services
    transactionCrafter = new TransactionCrafter({
      ledgerService,
      blockscoutClient,
      blockchainService
    });
    
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Connect to Ledger device
 */
async function connectLedger(): Promise<{ transport: any; ethApp: Eth }> {
  if (transport && ethApp) {
    try {
      // Test if connection is still alive
      await ethApp.getAddress("44'/60'/0'/0/0");
      return { transport, ethApp };
    } catch (error) {
      // Connection is dead, clean up
      await disconnectLedger();
    }
  }

  try {
    console.log('🔌 Connecting to Ledger device...');
    transport = await TransportNodeHid.create();
    ethApp = new Eth(transport);
    
    console.log('✅ Ledger connected successfully');
    return { transport, ethApp };
  } catch (error) {
    console.error('❌ Failed to connect to Ledger:', error);
    throw new Error(`Ledger connection failed: ${(error as Error).message}`);
  }
}

/**
 * Disconnect from Ledger device
 */
async function disconnectLedger(): Promise<void> {
  if (transport) {
    try {
      await transport.close();
    } catch (error) {
      console.warn('Warning during transport close:', error);
    }
  }
  transport = null;
  ethApp = null;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    ledgerConnected: !!(transport && ethApp),
    timestamp: new Date().toISOString(),
    service: 'ledger-proxy'
  });
});

/**
 * Get Ledger address
 */
app.post('/ledger/address', authenticateRequest, async (req, res) => {
  try {
    const { derivationPath, verify } = GetAddressSchema.parse(req.body);
    
    const { ethApp } = await connectLedger();
    const result = await ethApp.getAddress(derivationPath, verify);
    
    res.json({
      success: true,
      address: result.address,
      derivationPath,
      publicKey: result.publicKey
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      troubleshooting: [
        'Ensure Ledger device is connected via USB',
        'Unlock the device and open the Ethereum app',
        'Enable "Blind signing" in Ethereum app settings if needed',
        'Try reconnecting the USB cable'
      ]
    });
  }
});

/**
 * Craft transaction (prepare for Ledger signing)
 */
app.post('/ledger/craft-transaction', authenticateRequest, async (req, res) => {
  try {
    const { to, value, data, network } = CraftTransactionSchema.parse(req.body);
    
    // Get Ledger address first
    const { ethApp } = await connectLedger();
    const addressResult = await ethApp.getAddress("44'/60'/0'/0/0");
    const fromAddress = addressResult.address;
    
    // Connect Ledger service if not connected
    if (!ledgerService.isConnected()) {
      await ledgerService.connectToLedger();
    }
    
    // Craft the appropriate transaction based on whether data is provided
    let transaction;
    if (data && data !== '0x' && data !== '0x0') {
      // Custom transaction with data
      transaction = await transactionCrafter.craftCustomTransaction({
        contractAddress: to,
        methodName: 'fallback', // Or parse from data
        params: [],
        value: value ? parseEther(value) : undefined,
        network: network as SupportedNetwork
      });
    } else {
      // Simple ETH transfer
      transaction = await transactionCrafter.craftETHTransfer({
        to,
        amount: value || '0',
        network: network as SupportedNetwork
      });
    }
    
    res.json({
      success: true,
      transaction: {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value?.toString(),
        data: transaction.data,
        gasLimit: transaction.gasLimit?.toString(),
        maxFeePerGas: transaction.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toString(),
        nonce: transaction.nonce,
        chainId: transaction.chainId,
        type: transaction.type
      },
      network,
      estimatedGas: transaction.gasLimit?.toString(),
      note: 'Transaction prepared but not signed. Use appropriate signing method.'
    });
  } catch (error) {
    console.error('Craft transaction error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      troubleshooting: [
        'Ensure Ledger device is connected and Ethereum app is open',
        'Check that the destination address is valid',
        'Verify sufficient balance for transaction + gas fees',
        'Ensure network RPC is accessible'
      ]
    });
  }
});

/**
 * List connected devices
 */
app.get('/ledger/devices', authenticateRequest, async (req, res) => {
  try {
    const devices = await TransportNodeHid.list();
    res.json({
      success: true,
      devices: devices.map(device => ({
        path: device.path,
        descriptor: device.descriptor,
        productName: device.productName || 'Unknown'
      })),
      count: devices.length
    });
  } catch (error) {
    console.error('List devices error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Disconnect Ledger
 */
app.post('/ledger/disconnect', authenticateRequest, async (req, res) => {
  try {
    await disconnectLedger();
    res.json({
      success: true,
      message: 'Ledger disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get configuration status
 */
app.get('/config', (req, res) => {
  const { warnings, errors } = validateConfiguration();
  
  res.json({
    service: 'ledger-proxy',
    version: '1.0.0',
    capabilities: ['get_ledger_address', 'craft_transaction', 'device_management'],
    configuration: {
      warnings,
      errors
    },
    notes: [
      'This service handles hardware-dependent operations',
      'Ledger device must be connected locally via USB',
      'Works in conjunction with Vercel AI MCP server for full functionality'
    ]
  });
});

/**
 * Start the proxy server
 */
async function startServer() {
  try {
    // Initialize services
    await initializeServices();
    
    // Validate configuration
    const { warnings, errors } = validateConfiguration();
    
    console.log('\n🚀 Starting Ledger Hardware Proxy Service...\n');
    
    if (errors.length > 0) {
      console.log('Configuration Errors:');
      errors.forEach(error => console.log(error));
    }
    
    if (warnings.length > 0) {
      console.log('Configuration Warnings:');
      warnings.forEach(warning => console.log(warning));
    }
    
    app.listen(PORT, () => {
      console.log(`\n✅ Ledger Proxy Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`⚙️  Configuration: http://localhost:${PORT}/config`);
      console.log(`🔌 Connect Ledger and open Ethereum app to begin\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Ledger Proxy Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Ledger Proxy Service...');
  await disconnectLedger();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Ledger Proxy Service...');
  await disconnectLedger();
  process.exit(0);
});

export { startServer };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}