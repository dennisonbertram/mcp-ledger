/**
 * Vercel AI Powered MCP Server for Ledger Hardware Wallet Integration
 * Handles blockchain data operations in serverless environment
 */

// @ts-ignore - Types will be available at runtime  
import { Hono } from 'hono';
// @ts-ignore - Types will be available at runtime
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
// @ts-ignore - Types will be available at runtime
import { handle } from 'hono/vercel';
import { 
  createPublicClient, 
  http, 
  formatEther, 
  formatUnits, 
  isAddress 
} from 'viem';
import {
  mainnet,
  sepolia, 
  polygon,
  arbitrum,
  optimism,
  base
} from 'viem/chains';
import axios from 'axios';

// Environment configuration
const env = {
  DUNE_SIM_API_KEY: process.env.DUNE_SIM_API_KEY,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
};

// Network configurations
const NETWORKS = {
  mainnet: { chain: mainnet, rpc: env.ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : 'https://cloudflare-eth.com' },
  sepolia: { chain: sepolia, rpc: env.ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : 'https://rpc.sepolia.org' },
  polygon: { chain: polygon, rpc: env.ALCHEMY_API_KEY ? `https://polygon-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : 'https://polygon-rpc.com' },
  arbitrum: { chain: arbitrum, rpc: env.ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : 'https://arb1.arbitrum.io/rpc' },
  optimism: { chain: optimism, rpc: env.ALCHEMY_API_KEY ? `https://opt-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : 'https://mainnet.optimism.io' },
  base: { chain: base, rpc: env.ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : 'https://mainnet.base.org' },
} as const;

type SupportedNetwork = keyof typeof NETWORKS;

// Schemas for tool inputs
const GetBalanceSchema = z.object({
  address: z.string().describe('Ethereum address to check balance for'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet').describe('Blockchain network')
});

const GetTokenBalancesSchema = z.object({
  address: z.string().describe('Ethereum address to check token balances for'), 
  networks: z.array(z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base'])).default(['mainnet']).describe('Blockchain networks to check')
});

const GetNftBalancesSchema = z.object({
  address: z.string().describe('Ethereum address to check NFT balances for'),
  networks: z.array(z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base'])).default(['mainnet']).describe('Blockchain networks to check')
});

const GetContractAbiSchema = z.object({
  contractAddress: z.string().describe('Contract address to get ABI for'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base']).default('mainnet').describe('Blockchain network')
});

// Utility functions
function getClient(network: SupportedNetwork) {
  const config = NETWORKS[network];
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpc)
  });
}

function validateAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return address;
}

// Dune Sim API functions
async function getDuneSimTokenBalances(address: string, networks: SupportedNetwork[]) {
  if (!env.DUNE_SIM_API_KEY) {
    throw new Error('DUNE_SIM_API_KEY is required for token discovery. Please add it to environment variables.');
  }

  const chainIds = networks.map(network => {
    const chainIdMap: Record<SupportedNetwork, number> = {
      mainnet: 1,
      sepolia: 11155111,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      base: 8453
    };
    return chainIdMap[network];
  }).join(',');

  const url = `https://api.sim.dune.com/v1/evm/balances/${address}?chain_ids=${chainIds}`;
  
  const response = await axios.get(url, {
    headers: {
      'X-Sim-Api-Key': env.DUNE_SIM_API_KEY,
    },
    timeout: 15000,
  });

  return response.data.balances || [];
}

async function getDuneSimNFTBalances(address: string, networks: SupportedNetwork[]) {
  if (!env.DUNE_SIM_API_KEY) {
    throw new Error('DUNE_SIM_API_KEY is required for NFT discovery. Please add it to environment variables.');
  }

  const chainIds = networks.map(network => {
    const chainIdMap: Record<SupportedNetwork, number> = {
      mainnet: 1,
      sepolia: 11155111,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      base: 8453
    };
    return chainIdMap[network];
  }).join(',');

  const url = `https://api.sim.dune.com/v1/evm/collectibles/${address}?chain_ids=${chainIds}`;

  const response = await axios.get(url, {
    headers: {
      'X-Sim-Api-Key': env.DUNE_SIM_API_KEY,
    },
    timeout: 15000,
  });

  return response.data.collectibles || [];
}

// Contract ABI fetching
async function getContractAbi(contractAddress: string, network: SupportedNetwork) {
  // Use Blockscout API for ABI retrieval
  const blockscoutUrls: Record<SupportedNetwork, string> = {
    mainnet: 'https://eth.blockscout.com',
    sepolia: 'https://eth-sepolia.blockscout.com',
    polygon: 'https://polygon.blockscout.com',
    arbitrum: 'https://arbitrum.blockscout.com', 
    optimism: 'https://optimism.blockscout.com',
    base: 'https://base.blockscout.com'
  };

  const baseUrl = blockscoutUrls[network];
  const url = `${baseUrl}/api/v2/smart-contracts/${contractAddress}`;

  try {
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data?.abi) {
      return {
        abi: response.data.abi,
        name: response.data.name,
        is_verified: response.data.is_verified,
        source: 'blockscout'
      };
    }
  } catch (error) {
    console.warn(`Blockscout ABI fetch failed for ${contractAddress} on ${network}:`, (error as Error).message);
  }

  throw new Error(`Unable to fetch ABI for contract ${contractAddress} on ${network}`);
}

// Create MCP handler
const mcpHandler = createMcpHandler({
  tools: [
    {
      name: 'get_balance',
      description: 'Get ETH balance for an Ethereum address on supported networks',
      inputSchema: GetBalanceSchema,
      handler: async ({ address, network }: { address: string; network: SupportedNetwork }) => {
        const validAddress = validateAddress(address);
        const client = getClient(network);
        
        const balance = await client.getBalance({ 
          address: validAddress as `0x${string}` 
        });

        return {
          address: validAddress,
          network,
          balance: balance.toString(),
          balanceFormatted: formatEther(balance),
          symbol: network === 'polygon' ? 'MATIC' : 'ETH'
        };
      }
    },

    {
      name: 'get_token_balances',
      description: 'Get ERC20 token balances for an address using Dune Sim API (requires DUNE_SIM_API_KEY)',
      inputSchema: GetTokenBalancesSchema,
      handler: async ({ address, networks }: { address: string; networks: SupportedNetwork[] }) => {
        const validAddress = validateAddress(address);
        const balances = await getDuneSimTokenBalances(validAddress, networks);
        
        return {
          address: validAddress,
          networks,
          tokens: balances.map((balance: any) => ({
            address: balance.address || 'native',
            name: balance.name || 'Unknown Token',
            symbol: balance.symbol || '???',
            decimals: balance.decimals || 18,
            balance: balance.balance || '0',
            balanceFormatted: balance.balanceFormatted || '0',
            balanceUsd: balance.balanceUsd || undefined,
            priceUsd: balance.priceUsd || undefined,
            chainId: balance.chainId,
            chainName: balance.chainName,
            logo: balance.logo || undefined
          }))
        };
      }
    },

    {
      name: 'get_nft_balances', 
      description: 'Get NFT/ERC721 balances for an address using Dune Sim API (requires DUNE_SIM_API_KEY)',
      inputSchema: GetNftBalancesSchema,
      handler: async ({ address, networks }: { address: string; networks: SupportedNetwork[] }) => {
        const validAddress = validateAddress(address);
        const nfts = await getDuneSimNFTBalances(validAddress, networks);
        
        return {
          address: validAddress,
          networks,
          nfts: nfts.map((nft: any) => ({
            contractAddress: nft.contract_address,
            tokenId: nft.token_id,
            name: nft.name || undefined,
            description: nft.description || undefined,
            image: nft.image || undefined,
            chainId: nft.chain_id,
            chainName: nft.chain_name
          }))
        };
      }
    },

    {
      name: 'get_contract_abi',
      description: 'Get contract ABI from blockchain explorers for verified contracts',
      inputSchema: GetContractAbiSchema,
      handler: async ({ contractAddress, network }: { contractAddress: string; network: SupportedNetwork }) => {
        const validAddress = validateAddress(contractAddress);
        const abiData = await getContractAbi(validAddress, network);
        
        return {
          contractAddress: validAddress,
          network,
          ...abiData
        };
      }
    }
  ]
});

// Create Hono app
const app = new Hono();

// Root endpoint with server info
app.get('/', (c: any) => {
  const config = {
    duneSimConfigured: !!env.DUNE_SIM_API_KEY,
    alchemyConfigured: !!env.ALCHEMY_API_KEY,
    etherscanConfigured: !!env.ETHERSCAN_API_KEY,
  };

  return c.json({
    name: 'MCP Ledger Server (Vercel AI)',
    version: '1.0.0',
    description: 'Vercel AI powered MCP server for Ledger hardware wallet blockchain operations',
    capabilities: {
      tools: ['get_balance', 'get_token_balances', 'get_nft_balances', 'get_contract_abi'],
      networks: ['mainnet', 'sepolia', 'polygon', 'arbitrum', 'optimism', 'base'],
      configuration: config
    },
    warnings: [
      ...(!config.duneSimConfigured ? ['❌ DUNE_SIM_API_KEY required for token/NFT discovery'] : []),
      ...(!config.alchemyConfigured ? ['⚠️ ALCHEMY_API_KEY recommended for enhanced performance'] : []),
    ],
    notes: [
      '🏗️ This is the serverless component - Ledger hardware operations require separate local proxy service',
      '🔗 For hardware wallet operations (get_ledger_address, craft_transaction), use the local MCP server'
    ]
  });
});

// Health check endpoint
app.get('/health', (c: any) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

// MCP protocol endpoints
app.all('/mcp/*', mcpHandler);

export default handle(app);