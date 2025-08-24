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
  // Primary Token/Blockchain Data Provider
  DUNE_SIM_API_KEY: z.string().optional(),
  
  // RPC Provider API Keys
  ALCHEMY_API_KEY: z.string().optional(),
  INFURA_PROJECT_ID: z.string().optional(),
  
  // Blockchain Explorer API Keys
  ETHERSCAN_API_KEY: z.string().optional(),
  POLYGONSCAN_API_KEY: z.string().optional(),
  ARBISCAN_API_KEY: z.string().optional(),
  OPTIMISTIC_ETHERSCAN_API_KEY: z.string().optional(),
  BASESCAN_API_KEY: z.string().optional(),
  
  // Legacy Token/NFT Discovery Services (Fallback)
  MORALIS_API_KEY: z.string().optional(),
  OPENSEA_API_KEY: z.string().optional(),
  
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
  const { ALCHEMY_API_KEY, INFURA_PROJECT_ID } = env;
  
  return {
    mainnet: env.MAINNET_RPC_URL || 
             (ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : 
              INFURA_PROJECT_ID ? `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}` :
              'https://cloudflare-eth.com'), // Fallback to public RPC
              
    sepolia: env.SEPOLIA_RPC_URL ||
             (ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
              INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}` :
              'https://rpc.sepolia.org'), // Fallback to public RPC
              
    polygon: env.POLYGON_RPC_URL ||
             (ALCHEMY_API_KEY ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
              INFURA_PROJECT_ID ? `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}` :
              'https://polygon-rpc.com'), // Fallback to public RPC
              
    arbitrum: env.ARBITRUM_RPC_URL ||
              (ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
               INFURA_PROJECT_ID ? `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}` :
               'https://arb1.arbitrum.io/rpc'), // Fallback to public RPC
               
    optimism: env.OPTIMISM_RPC_URL ||
              (ALCHEMY_API_KEY ? `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
               INFURA_PROJECT_ID ? `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}` :
               'https://mainnet.optimism.io'), // Fallback to public RPC
               
    base: env.BASE_RPC_URL ||
          (ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` :
           'https://mainnet.base.org'), // Fallback to public RPC
  };
};

/**
 * Get API configuration for external services
 */
export const getApiConfig = () => ({
  duneSim: env.DUNE_SIM_API_KEY,
  alchemy: env.ALCHEMY_API_KEY,
  infura: env.INFURA_PROJECT_ID,
  etherscan: env.ETHERSCAN_API_KEY,
  polygonscan: env.POLYGONSCAN_API_KEY,
  arbiscan: env.ARBISCAN_API_KEY,
  optimisticEtherscan: env.OPTIMISTIC_ETHERSCAN_API_KEY,
  basescan: env.BASESCAN_API_KEY,
  moralis: env.MORALIS_API_KEY,
  opensea: env.OPENSEA_API_KEY,
});

/**
 * Check if enhanced features are available (requires API keys)
 */
export const hasEnhancedFeatures = () => {
  const config = getApiConfig();
  return !!(config.duneSim || config.alchemy || config.infura || config.moralis);
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
  
  // Check for primary token discovery service (Dune Sim)
  if (config.duneSim) {
    console.log('✅ Dune Sim API configured for reliable token discovery');
  } else {
    warnings.push('⚠️  No Dune Sim API key configured. This is the recommended primary data source.');
  }
  
  // Check for enhanced RPC providers
  if (!config.alchemy && !config.infura) {
    warnings.push('⚠️  No enhanced RPC provider configured (Alchemy/Infura). Using public endpoints with rate limits.');
  }
  
  // Check for fallback token discovery services
  if (!config.duneSim && !config.moralis && !config.alchemy) {
    warnings.push('⚠️  No token discovery API configured. Token balances will be very limited.');
  }
  
  // Check for blockchain explorers (for comprehensive features)
  if (!config.etherscan) {
    warnings.push('⚠️  No Etherscan API key configured. Contract verification may be limited.');
  }
  
  // Info messages
  if (config.duneSim && (config.alchemy || config.infura) && config.etherscan) {
    console.log('✅ Optimal configuration detected - all enhanced features available');
  } else if (config.duneSim) {
    console.log('✅ Good configuration - primary token discovery available');
  }
  
  return { warnings, errors };
};