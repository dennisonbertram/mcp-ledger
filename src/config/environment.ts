/**
 * Environment configuration for MCP Ledger Server
 * Handles API keys, RPC endpoints, and service configurations
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

/**
 * Environment configuration schema with validation
 */
const EnvironmentSchema = z.object({
  // Primary Token/Blockchain Data Provider (Required for token discovery)
  DUNE_SIM_API_KEY: z.string().optional(),
  
  // Enhanced RPC Provider (Optional)
  ALCHEMY_API_KEY: z.string().optional(),
  
  // Contract Verification API (Optional)
  ETHERSCAN_API_KEY: z.string().optional(),
  
  // Custom RPC Endpoints (will use defaults if not provided)
  MAINNET_RPC_URL: z.string().url().optional(),
  SEPOLIA_RPC_URL: z.string().url().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  ARBITRUM_RPC_URL: z.string().url().optional(),
  OPTIMISM_RPC_URL: z.string().url().optional(),
  BASE_RPC_URL: z.string().url().optional(),
  
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Service Configuration
  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
  CACHE_TTL: z.string().transform(Number).default('300'),
});

/**
 * Parse and validate environment variables
 */
export const env = EnvironmentSchema.parse(process.env);

/**
 * Network RPC URL configuration with API key integration
 */
export const getRpcUrls = () => {
  const { ALCHEMY_API_KEY } = env;
  
  return {
    mainnet: env.MAINNET_RPC_URL || 
             (ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : 
              'https://cloudflare-eth.com'),
              
    sepolia: env.SEPOLIA_RPC_URL ||
             (ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
              'https://rpc.sepolia.org'),
              
    polygon: env.POLYGON_RPC_URL ||
             (ALCHEMY_API_KEY ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
              'https://polygon-rpc.com'),
              
    arbitrum: env.ARBITRUM_RPC_URL ||
              (ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
               'https://arb1.arbitrum.io/rpc'),
               
    optimism: env.OPTIMISM_RPC_URL ||
              (ALCHEMY_API_KEY ? `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
               'https://mainnet.optimism.io'),
               
    base: env.BASE_RPC_URL ||
          (ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
           'https://mainnet.base.org'),
  };
};

/**
 * Get API configuration for external services
 */
export const getApiConfig = () => ({
  duneSim: env.DUNE_SIM_API_KEY,
  alchemy: env.ALCHEMY_API_KEY,
  etherscan: env.ETHERSCAN_API_KEY,
});

/**
 * Check if enhanced features are available (requires API keys)
 */
export const hasEnhancedFeatures = () => {
  const config = getApiConfig();
  return !!(config.duneSim || config.alchemy);
};

/**
 * Get service configuration
 */
export const getServiceConfig = () => ({
  requestTimeout: env.REQUEST_TIMEOUT,
  cacheTtl: env.CACHE_TTL,
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
});

/**
 * Validate critical configuration and warn about missing API keys
 */
export const validateConfiguration = (): { warnings: string[], errors: string[] } => {
  const config = getApiConfig();
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check for Dune Sim API (required for token discovery)
  if (config.duneSim) {
    console.log('✅ Dune Sim API configured for reliable token discovery');
  } else {
    errors.push('❌ DUNE_SIM_API_KEY is required for token discovery functionality');
  }
  
  // Check for enhanced RPC provider (optional but recommended)
  if (config.alchemy) {
    console.log('✅ Enhanced RPC provider configured (Alchemy)');
  } else {
    warnings.push('⚠️  No enhanced RPC provider configured. Using public endpoints (slower, rate limited).');
  }
  
  // Check for contract verification (optional)
  if (config.etherscan) {
    console.log('✅ Contract verification API configured (Etherscan)');
  } else {
    warnings.push('⚠️  No Etherscan API key configured. Contract verification may be limited.');
  }
  
  return { warnings, errors };
};