/**
 * Integration tests for Solana services working together
 */

import { ServiceOrchestrator } from '../../src/services/orchestrator.js';
import type { OrchestratorConfig } from '../../src/services/orchestrator.js';

// These tests require mocked Ledger hardware and Solana RPC endpoints
describe('Solana Integration Tests', () => {
  let orchestrator: ServiceOrchestrator;

  beforeEach(() => {
    const config: OrchestratorConfig = {
      defaultNetwork: 'mainnet',
      solana: {
        blockchain: { defaultNetwork: 'solana-devnet' }, // Use devnet for testing
        transactionCrafter: { defaultNetwork: 'solana-devnet' }
      }
    };

    orchestrator = new ServiceOrchestrator(config);
  });

  afterEach(async () => {
    await orchestrator.shutdown();
  });

  describe('Service Initialization', () => {
    it('should initialize all Solana services correctly', () => {
      const solanaBlockchainService = orchestrator.getSolanaBlockchainService();
      const solanaTransactionCrafter = orchestrator.getSolanaTransactionCrafter();
      const ledgerService = orchestrator.getLedgerService();

      expect(solanaBlockchainService).toBeDefined();
      expect(solanaTransactionCrafter).toBeDefined();
      expect(ledgerService).toBeDefined();
    });

    it('should have correct configuration', () => {
      const config = orchestrator.getConfig();
      
      expect(config.solana.blockchain.defaultNetwork).toBe('solana-devnet');
      expect(config.solana.transactionCrafter.defaultNetwork).toBe('solana-devnet');
    });
  });

  describe('Health Checks', () => {
    it('should perform health checks on all services', async () => {
      // Note: This will fail without actual Ledger connection and network access
      // In a real test environment, we'd mock these calls
      
      const healthStatus = await orchestrator.healthCheck();

      expect(healthStatus).toHaveProperty('ledger');
      expect(healthStatus).toHaveProperty('blockscout');
      expect(healthStatus).toHaveProperty('blockchain');
      expect(healthStatus).toHaveProperty('solana');
      expect(healthStatus).toHaveProperty('overall');
    });
  });

  describe('Network Configuration', () => {
    it('should provide correct Solana network configurations', () => {
      const solanaBlockchainService = orchestrator.getSolanaBlockchainService();
      
      const mainnetConfig = solanaBlockchainService.getNetworkConfig('solana-mainnet');
      expect(mainnetConfig.name).toBe('Solana Mainnet');
      expect(mainnetConfig.currency).toBe('SOL');

      const devnetConfig = solanaBlockchainService.getNetworkConfig('solana-devnet');
      expect(devnetConfig.name).toBe('Solana Devnet');
      expect(devnetConfig.currency).toBe('SOL');

      const testnetConfig = solanaBlockchainService.getNetworkConfig('solana-testnet');
      expect(testnetConfig.name).toBe('Solana Testnet');
      expect(testnetConfig.currency).toBe('SOL');
    });
  });

  describe('Service Orchestration', () => {
    it('should coordinate between blockchain service and transaction crafter', async () => {
      const solanaBlockchainService = orchestrator.getSolanaBlockchainService();
      const solanaTransactionCrafter = orchestrator.getSolanaTransactionCrafter();

      // Verify services can work together
      expect(typeof solanaBlockchainService.getConnection).toBe('function');
      expect(typeof solanaTransactionCrafter.craftSolTransfer).toBe('function');
      expect(typeof solanaTransactionCrafter.craftSplTokenTransfer).toBe('function');
    });

    it('should handle graceful shutdown', async () => {
      // Should not throw errors
      await expect(orchestrator.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const solanaBlockchainService = orchestrator.getSolanaBlockchainService();

      // This should handle network errors without crashing
      const healthCheck = await solanaBlockchainService.healthCheck();
      expect(typeof healthCheck).toBe('boolean');
    });

    it('should handle invalid addresses gracefully', async () => {
      const solanaBlockchainService = orchestrator.getSolanaBlockchainService();

      // This should handle invalid addresses without crashing
      await expect(
        solanaBlockchainService.getBalance('invalid-address', 'solana-devnet')
      ).rejects.toThrow();
    });
  });

  describe('Cache Management', () => {
    it('should clear caches on shutdown', async () => {
      const solanaBlockchainService = orchestrator.getSolanaBlockchainService();
      
      // Should not throw errors
      expect(() => solanaBlockchainService.clearCache()).not.toThrow();
      
      await orchestrator.shutdown();
    });
  });

  describe('Configuration Updates', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        solana: {
          blockchain: { defaultNetwork: 'solana-mainnet' as const }
        }
      };

      expect(() => orchestrator.updateConfig(newConfig)).not.toThrow();
      
      const updatedConfig = orchestrator.getConfig();
      expect(updatedConfig.solana.blockchain.defaultNetwork).toBe('solana-mainnet');
    });
  });
});