# Solana Ledger Integration Patterns for MCP Server

## Implementation Patterns for Robust Ledger Integration

### 1. Ledger Connection Management

```typescript
import Solana from "@ledgerhq/hw-app-solana";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

class SolanaLedgerManager {
  private transport: Transport | null = null;
  private solana: Solana | null = null;
  private connectionTimeout = 30000; // 30 seconds

  async connect(): Promise<void> {
    try {
      // Close existing connection
      await this.disconnect();
      
      // Create new transport with timeout
      this.transport = await TransportNodeHid.create(this.connectionTimeout);
      this.solana = new Solana(this.transport);
      
      // Verify connection with app configuration
      const config = await this.solana.getAppConfiguration();
      console.log('Ledger Solana app version:', config.version);
      
    } catch (error) {
      await this.disconnect();
      throw new Error(`Failed to connect to Ledger: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.warn('Error closing transport:', error);
      }
      this.transport = null;
      this.solana = null;
    }
  }

  async withConnection<T>(operation: (solana: Solana) => Promise<T>): Promise<T> {
    if (!this.solana) {
      await this.connect();
    }
    
    try {
      return await operation(this.solana!);
    } catch (error) {
      // Reconnect on transport errors
      if (error.message.includes('device disconnected') || 
          error.message.includes('transport')) {
        await this.connect();
        return await operation(this.solana!);
      }
      throw error;
    }
  }
}
```

### 2. Derivation Path Management

```typescript
interface DerivationConfig {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
}

class SolanaDerivationManager {
  private static readonly SOLANA_COIN_TYPE = 501;
  private static readonly BIP44_PURPOSE = 44;

  static formatPath(config: DerivationConfig): string {
    return `${config.purpose}'/${config.coinType}'/${config.account}'/${config.change}'`;
  }

  static parsePath(path: string): DerivationConfig {
    const parts = path.split('/').map(p => {
      const hardened = p.endsWith("'");
      const value = parseInt(hardened ? p.slice(0, -1) : p);
      return { value, hardened };
    });

    if (parts.length !== 4) {
      throw new Error('Invalid derivation path format');
    }

    return {
      purpose: parts[0].value,
      coinType: parts[1].value,
      account: parts[2].value,
      change: parts[3].value,
    };
  }

  static getStandardPath(account = 0, change = 0): string {
    return this.formatPath({
      purpose: this.BIP44_PURPOSE,
      coinType: this.SOLANA_COIN_TYPE,
      account,
      change,
    });
  }

  static validatePath(path: string): boolean {
    try {
      const config = this.parsePath(path);
      return config.purpose === this.BIP44_PURPOSE && 
             config.coinType === this.SOLANA_COIN_TYPE;
    } catch {
      return false;
    }
  }
}
```

### 3. Transaction Building with Ledger Considerations

```typescript
import {
  Connection,
  Transaction,
  PublicKey,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';

class LedgerTransactionBuilder {
  constructor(
    private connection: Connection,
    private ledgerManager: SolanaLedgerManager
  ) {}

  async buildTransaction(
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    options: {
      priorityFee?: number;
      computeUnitLimit?: number;
      commitment?: Commitment;
    } = {}
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Add compute budget instructions if specified
    if (options.computeUnitLimit) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: options.computeUnitLimit,
        })
      );
    }

    if (options.priorityFee) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: options.priorityFee,
        })
      );
    }

    // Add main instructions
    instructions.forEach(ix => transaction.add(ix));

    // Set transaction properties
    const { blockhash } = await this.connection.getLatestBlockhash(
      options.commitment || 'confirmed'
    );
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = feePayer;

    return transaction;
  }

  async signWithLedger(
    transaction: Transaction,
    derivationPath: string,
    additionalSigners: Keypair[] = []
  ): Promise<Transaction> {
    // Compile message for Ledger
    const message = transaction.compileMessage();
    
    // Validate transaction size (Ledger has limits)
    const messageBytes = message.serialize();
    if (messageBytes.length > 1232) { // Ledger transaction size limit
      throw new Error('Transaction too large for Ledger signing');
    }

    // Sign with Ledger
    const ledgerSignature = await this.ledgerManager.withConnection(
      async (solana) => {
        return await solana.signTransaction(derivationPath, messageBytes);
      }
    );

    // Add Ledger signature
    const signerPublicKey = await this.getLedgerPublicKey(derivationPath);
    transaction.addSignature(signerPublicKey, Buffer.from(ledgerSignature.signature, 'hex'));

    // Sign with additional signers
    if (additionalSigners.length > 0) {
      transaction.partialSign(...additionalSigners);
    }

    return transaction;
  }

  private async getLedgerPublicKey(derivationPath: string): Promise<PublicKey> {
    const result = await this.ledgerManager.withConnection(
      async (solana) => {
        return await solana.getAddress(derivationPath);
      }
    );
    return new PublicKey(result.address);
  }
}
```

### 4. Token Operations with Ledger

```typescript
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

class LedgerTokenManager {
  constructor(
    private connection: Connection,
    private transactionBuilder: LedgerTransactionBuilder
  ) {}

  async transferTokens(
    tokenMint: PublicKey,
    amount: bigint,
    fromPath: string,
    toAddress: PublicKey,
    options: {
      createATA?: boolean;
      memo?: string;
    } = {}
  ): Promise<string> {
    const fromPublicKey = await this.getLedgerAddress(fromPath);
    
    // Get associated token addresses
    const fromATA = await getAssociatedTokenAddress(
      tokenMint,
      fromPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const toATA = await getAssociatedTokenAddress(
      tokenMint,
      toAddress,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const instructions: TransactionInstruction[] = [];

    // Create destination ATA if needed
    if (options.createATA) {
      const toAccountInfo = await this.connection.getAccountInfo(toATA);
      if (!toAccountInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            fromPublicKey, // Fee payer
            toATA,
            toAddress,
            tokenMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }
    }

    // Add transfer instruction
    instructions.push(
      createTransferInstruction(
        fromATA,
        toATA,
        fromPublicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Add memo if provided
    if (options.memo) {
      instructions.push(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(options.memo, 'utf8'),
        })
      );
    }

    // Build and sign transaction
    const transaction = await this.transactionBuilder.buildTransaction(
      instructions,
      fromPublicKey
    );

    const signedTransaction = await this.transactionBuilder.signWithLedger(
      transaction,
      fromPath
    );

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    return signature;
  }

  private async getLedgerAddress(derivationPath: string): Promise<PublicKey> {
    // This would use the LedgerManager to get the address
    const result = await this.ledgerManager.withConnection(
      async (solana) => await solana.getAddress(derivationPath)
    );
    return new PublicKey(result.address);
  }
}
```

### 5. Error Handling and Recovery

```typescript
class LedgerErrorHandler {
  static isRecoverableError(error: Error): boolean {
    const recoverableMessages = [
      'device disconnected',
      'transport error',
      'device locked',
      'app not opened',
      'user rejected',
    ];

    return recoverableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRecoverableError(lastError) || attempt === maxRetries) {
          throw lastError;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError!;
  }
}
```

### 6. Account Monitoring and State Management

```typescript
interface AccountState {
  address: string;
  balance: bigint;
  tokenBalances: Map<string, bigint>;
  lastUpdated: number;
}

class LedgerAccountMonitor {
  private accountStates = new Map<string, AccountState>();
  private subscriptions = new Map<string, number>();

  constructor(private connection: Connection) {}

  async monitorAccount(
    derivationPath: string,
    callback: (state: AccountState) => void
  ): Promise<void> {
    const address = await this.getLedgerAddress(derivationPath);
    
    // Subscribe to account changes
    const subscription = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        const state = await this.updateAccountState(derivationPath, address);
        callback(state);
      },
      'confirmed'
    );

    this.subscriptions.set(derivationPath, subscription);

    // Initial state fetch
    const initialState = await this.updateAccountState(derivationPath, address);
    callback(initialState);
  }

  async stopMonitoring(derivationPath: string): Promise<void> {
    const subscription = this.subscriptions.get(derivationPath);
    if (subscription) {
      await this.connection.removeAccountChangeListener(subscription);
      this.subscriptions.delete(derivationPath);
      this.accountStates.delete(derivationPath);
    }
  }

  private async updateAccountState(
    derivationPath: string,
    address: PublicKey
  ): Promise<AccountState> {
    const balance = await this.connection.getBalance(address);
    const tokenBalances = await this.getTokenBalances(address);

    const state: AccountState = {
      address: address.toBase58(),
      balance: BigInt(balance),
      tokenBalances,
      lastUpdated: Date.now(),
    };

    this.accountStates.set(derivationPath, state);
    return state;
  }

  private async getTokenBalances(owner: PublicKey): Promise<Map<string, bigint>> {
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: TOKEN_PROGRAM_ID }
    );

    const balances = new Map<string, bigint>();
    
    for (const { account } of tokenAccounts.value) {
      const parsedInfo = account.data.parsed.info;
      balances.set(
        parsedInfo.mint,
        BigInt(parsedInfo.tokenAmount.amount)
      );
    }

    return balances;
  }
}
```

### 7. Configuration and Validation

```typescript
interface LedgerConfig {
  derivationPath: string;
  autoReconnect: boolean;
  connectionTimeout: number;
  maxRetries: number;
  blindSigningEnabled: boolean;
}

class LedgerConfigValidator {
  static validateConfig(config: Partial<LedgerConfig>): LedgerConfig {
    const validated: LedgerConfig = {
      derivationPath: config.derivationPath || "44'/501'/0'/0'",
      autoReconnect: config.autoReconnect ?? true,
      connectionTimeout: config.connectionTimeout || 30000,
      maxRetries: config.maxRetries || 3,
      blindSigningEnabled: config.blindSigningEnabled ?? false,
    };

    // Validate derivation path
    if (!SolanaDerivationManager.validatePath(validated.derivationPath)) {
      throw new Error('Invalid Solana derivation path');
    }

    // Validate timeouts and limits
    if (validated.connectionTimeout <= 0) {
      throw new Error('Connection timeout must be positive');
    }

    if (validated.maxRetries < 1) {
      throw new Error('Max retries must be at least 1');
    }

    return validated;
  }

  static getDefaultConfig(): LedgerConfig {
    return this.validateConfig({});
  }
}
```

### 8. Integration with MCP Protocol

```typescript
interface MCPSolanaLedgerTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

class MCPLedgerIntegration {
  private ledgerManager: SolanaLedgerManager;
  private transactionBuilder: LedgerTransactionBuilder;
  private tokenManager: LedgerTokenManager;

  constructor(connection: Connection, config: LedgerConfig) {
    this.ledgerManager = new SolanaLedgerManager();
    this.transactionBuilder = new LedgerTransactionBuilder(connection, this.ledgerManager);
    this.tokenManager = new LedgerTokenManager(connection, this.transactionBuilder);
  }

  getAvailableTools(): MCPSolanaLedgerTool[] {
    return [
      {
        name: "solana_ledger_get_address",
        description: "Get Solana address from Ledger hardware wallet",
        inputSchema: {
          type: "object",
          properties: {
            derivationPath: {
              type: "string",
              description: "BIP44 derivation path (e.g., \"44'/501'/0'/0'\")"
            },
            display: {
              type: "boolean",
              description: "Display address on Ledger screen",
              default: false
            }
          },
          required: ["derivationPath"]
        }
      },
      {
        name: "solana_ledger_sign_transaction",
        description: "Sign Solana transaction with Ledger",
        inputSchema: {
          type: "object",
          properties: {
            transaction: {
              type: "string",
              description: "Base64 encoded transaction"
            },
            derivationPath: {
              type: "string",
              description: "BIP44 derivation path"
            }
          },
          required: ["transaction", "derivationPath"]
        }
      },
      {
        name: "solana_ledger_transfer_tokens",
        description: "Transfer SPL tokens using Ledger",
        inputSchema: {
          type: "object",
          properties: {
            tokenMint: {
              type: "string",
              description: "Token mint address"
            },
            amount: {
              type: "string",
              description: "Amount to transfer (in base units)"
            },
            recipient: {
              type: "string",
              description: "Recipient address"
            },
            derivationPath: {
              type: "string",
              description: "Sender's derivation path"
            },
            createRecipientAccount: {
              type: "boolean",
              description: "Create recipient token account if it doesn't exist",
              default: false
            }
          },
          required: ["tokenMint", "amount", "recipient", "derivationPath"]
        }
      }
    ];
  }

  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "solana_ledger_get_address":
        return await this.getAddress(args);
      case "solana_ledger_sign_transaction":
        return await this.signTransaction(args);
      case "solana_ledger_transfer_tokens":
        return await this.transferTokens(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async getAddress(args: any) {
    const result = await this.ledgerManager.withConnection(
      async (solana) => await solana.getAddress(args.derivationPath, args.display)
    );
    
    return {
      address: result.address,
      publicKey: result.publicKey,
      derivationPath: args.derivationPath
    };
  }

  private async signTransaction(args: any) {
    const transactionBytes = Buffer.from(args.transaction, 'base64');
    
    const signature = await this.ledgerManager.withConnection(
      async (solana) => await solana.signTransaction(args.derivationPath, transactionBytes)
    );

    return {
      signature: signature.signature,
      derivationPath: args.derivationPath
    };
  }

  private async transferTokens(args: any) {
    const signature = await this.tokenManager.transferTokens(
      new PublicKey(args.tokenMint),
      BigInt(args.amount),
      args.derivationPath,
      new PublicKey(args.recipient),
      {
        createATA: args.createRecipientAccount
      }
    );

    return {
      signature,
      tokenMint: args.tokenMint,
      amount: args.amount,
      recipient: args.recipient
    };
  }
}
```

This comprehensive set of patterns provides a robust foundation for integrating Solana Ledger functionality into an MCP server with proper error handling, connection management, and protocol compliance.