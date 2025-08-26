# Solana Web3.js Essential Reference for MCP Development

## Core Classes and Methods

### Connection Class

The `Connection` class is the primary interface for interacting with a Solana cluster.

```typescript
import { Connection, clusterApiUrl, Commitment } from '@solana/web3.js';

// Create connection
const connection = new Connection(
  clusterApiUrl('mainnet-beta'),
  {
    commitment: 'confirmed',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com/',
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 60000,
    httpHeaders: {
      'Content-Type': 'application/json',
    }
  }
);
```

**Key Methods:**

```typescript
// Account Information
const balance = await connection.getBalance(publicKey);
const accountInfo = await connection.getAccountInfo(publicKey);
const programAccounts = await connection.getProgramAccounts(programId);

// Transaction Operations
const signature = await connection.sendTransaction(transaction, signers);
const confirmation = await connection.confirmTransaction(signature);
const transaction = await connection.getTransaction(signature);

// Block and Network Information
const slot = await connection.getSlot();
const blockHeight = await connection.getBlockHeight();
const { blockhash } = await connection.getLatestBlockhash();

// Token Account Operations
const tokenAccounts = await connection.getTokenAccountsByOwner(
  ownerPublicKey,
  { programId: TOKEN_PROGRAM_ID }
);

const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(
  ownerPublicKey,
  { programId: TOKEN_PROGRAM_ID }
);
```

### PublicKey Class

```typescript
import { PublicKey } from '@solana/web3.js';

// Create from base58 string
const pubkey = new PublicKey('11111111111111111111111111111112');

// Validation
const isValid = PublicKey.isOnCurve(pubkey.toBytes());

// Utilities
const base58String = pubkey.toBase58();
const buffer = pubkey.toBuffer();
const bytes = pubkey.toBytes();

// Program Derived Addresses (PDA)
const [pda, bump] = await PublicKey.findProgramAddress(
  [Buffer.from('seed1'), publicKey.toBuffer()],
  programId
);

// Create PDA with specific bump
const pdaWithBump = await PublicKey.createProgramAddress(
  [Buffer.from('seed1'), publicKey.toBuffer(), Buffer.from([bump])],
  programId
);
```

### Transaction Class

```typescript
import { 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';

// Create transaction
const transaction = new Transaction();

// Add instructions
const transferInstruction = SystemProgram.transfer({
  fromPubkey: fromPublicKey,
  toPubkey: toPublicKey,
  lamports: LAMPORTS_PER_SOL, // 1 SOL
});

transaction.add(transferInstruction);

// Set transaction properties
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = payerPublicKey;

// Sign transaction
transaction.sign(payerKeypair);

// Partial signing (for multi-sig)
transaction.partialSign(signer1, signer2);

// Add signature manually
transaction.addSignature(publicKey, signature);

// Serialize
const wireTransaction = transaction.serialize();
const base64Transaction = wireTransaction.toString('base64');
```

### Keypair Class

```typescript
import { Keypair } from '@solana/web3.js';

// Generate new keypair
const keypair = Keypair.generate();

// From secret key
const secretKey = new Uint8Array([/* 64 bytes */]);
const keypairFromSecret = Keypair.fromSecretKey(secretKey);

// From seed (first 32 bytes of secret key)
const seed = new Uint8Array(32);
const keypairFromSeed = Keypair.fromSeed(seed);

// Properties
const publicKey = keypair.publicKey;
const secretKey = keypair.secretKey;

// Export for storage
const secretKeyArray = Array.from(keypair.secretKey);
const secretKeyBase58 = bs58.encode(keypair.secretKey);
```

## System Programs

### System Program

```typescript
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Transfer SOL
const transferInstruction = SystemProgram.transfer({
  fromPubkey: sender,
  toPubkey: receiver,
  lamports: 0.5 * LAMPORTS_PER_SOL,
});

// Create account
const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: payer,
  newAccountPubkey: newAccount.publicKey,
  lamports: await connection.getMinimumBalanceForRentExemption(dataLength),
  space: dataLength,
  programId: ownerProgram,
});

// Allocate space
const allocateInstruction = SystemProgram.allocate({
  accountPubkey: account,
  space: 1000,
});

// Assign account to program
const assignInstruction = SystemProgram.assign({
  accountPubkey: account,
  programId: newOwner,
});
```

### Compute Budget Program

```typescript
import { ComputeBudgetProgram } from '@solana/web3.js';

// Set compute unit limit
const computeLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
  units: 300000,
});

// Set compute unit price (priority fee)
const computePriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 1000,
});

// Set loaded accounts data size limit
const accountsDataSizeInstruction = ComputeBudgetProgram.setLoadedAccountsDataSizeLimit({
  bytes: 32 * 1024, // 32KB
});

// Add to transaction
transaction.add(computeLimitInstruction, computePriceInstruction);
```

## SPL Token Integration

### Token Program Operations

```typescript
import {
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  mintTo,
  transfer,
  approve,
  revoke,
  burn,
  closeAccount,
  freezeAccount,
  thawAccount,
  setAuthority,
  AuthorityType,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Create new token mint
const mint = await createMint(
  connection,
  payer,           // Payer
  mintAuthority,   // Mint authority
  freezeAuthority, // Freeze authority (can be null)
  decimals         // Number of decimals
);

// Create token account
const tokenAccount = await createAccount(
  connection,
  payer,
  mint,
  owner
);

// Create associated token account (recommended)
const associatedTokenAccount = await createAssociatedTokenAccount(
  connection,
  payer,  // Fee payer
  mint,   // Token mint
  owner   // Token account owner
);

// Get ATA address without creating
const ataAddress = await getAssociatedTokenAddress(
  mint,
  owner,
  false, // Allow owner off curve
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
);

// Mint tokens
await mintTo(
  connection,
  payer,         // Fee payer
  mint,          // Token mint
  destination,   // Destination token account
  authority,     // Mint authority
  amount         // Amount in token's base units
);

// Transfer tokens
await transfer(
  connection,
  payer,         // Fee payer
  source,        // Source token account
  destination,   // Destination token account
  owner,         // Source account owner
  amount         // Amount in token's base units
);

// Approve delegate
await approve(
  connection,
  payer,         // Fee payer
  account,       // Token account
  delegate,      // Delegate
  owner,         // Account owner
  amount         // Delegated amount
);

// Revoke delegate
await revoke(
  connection,
  payer,         // Fee payer
  account,       // Token account
  owner          // Account owner
);

// Burn tokens
await burn(
  connection,
  payer,         // Fee payer
  account,       // Token account
  mint,          // Token mint
  owner,         // Account owner
  amount         // Amount to burn
);

// Close token account
await closeAccount(
  connection,
  payer,         // Fee payer
  account,       // Token account to close
  destination,   // Destination for remaining lamports
  owner          // Account owner
);
```

### Token Account Information

```typescript
import { 
  getAccount, 
  getMint, 
  getMultipleAccounts,
  AccountLayout,
  MintLayout
} from '@solana/spl-token';

// Get token account info
const tokenAccountInfo = await getAccount(connection, tokenAccountAddress);
console.log({
  mint: tokenAccountInfo.mint.toBase58(),
  owner: tokenAccountInfo.owner.toBase58(),
  amount: tokenAccountInfo.amount,
  delegate: tokenAccountInfo.delegate?.toBase58(),
  state: tokenAccountInfo.state,
  isNative: tokenAccountInfo.isNative,
  delegatedAmount: tokenAccountInfo.delegatedAmount,
  closeAuthority: tokenAccountInfo.closeAuthority?.toBase58(),
});

// Get mint info
const mintInfo = await getMint(connection, mintAddress);
console.log({
  mintAuthority: mintInfo.mintAuthority?.toBase58(),
  supply: mintInfo.supply,
  decimals: mintInfo.decimals,
  isInitialized: mintInfo.isInitialized,
  freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
});

// Get multiple accounts efficiently
const accountsInfo = await getMultipleAccounts(
  connection,
  [account1, account2, account3]
);
```

## Advanced Transaction Patterns

### Transaction with Lookup Tables

```typescript
import { 
  AddressLookupTableProgram,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js';

// Create lookup table
const [lookupTableInst, lookupTableAddress] = 
  AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot: slot - 1,
  });

// Extend lookup table
const extendInstruction = AddressLookupTableProgram.extendLookupTable({
  payer: payer.publicKey,
  authority: payer.publicKey,
  lookupTable: lookupTableAddress,
  addresses: [address1, address2, address3],
});

// Use lookup table in transaction
const lookupTableAccount = (
  await connection.getAddressLookupTable(lookupTableAddress)
).value;

const messageV0 = new TransactionMessage({
  payerKey: payer.publicKey,
  recentBlockhash: blockhash,
  instructions: [instruction1, instruction2],
}).compileToV0Message([lookupTableAccount]);

const transactionV0 = new VersionedTransaction(messageV0);
transactionV0.sign([payer]);
```

### Batch Transactions

```typescript
// Send multiple transactions in parallel
const transactions = [tx1, tx2, tx3];
const signatures = await Promise.all(
  transactions.map(tx => connection.sendTransaction(tx, [payer]))
);

// Confirm all transactions
const confirmations = await Promise.all(
  signatures.map(sig => connection.confirmTransaction(sig))
);

// Get transaction statuses
const statuses = await connection.getSignatureStatuses(signatures);
```

### Transaction with Retry Logic

```typescript
async function sendTransactionWithRetry(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[],
  maxRetries = 3
): Promise<string> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = 
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Sign and send
      transaction.sign(...signers);
      const signature = await connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 0,
        }
      );

      // Confirm with block height
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      return signature;
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries - 1) break;
      
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError!;
}
```

## Account Monitoring

### Real-time Account Monitoring

```typescript
// Monitor account changes
const subscription = connection.onAccountChange(
  accountPublicKey,
  (accountInfo, context) => {
    console.log('Account changed:', {
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toBase58(),
      slot: context.slot,
    });
  },
  'confirmed'
);

// Monitor token account changes
const tokenSubscription = connection.onAccountChange(
  tokenAccountAddress,
  (accountInfo, context) => {
    if (accountInfo.data.length === AccountLayout.span) {
      const tokenAccount = AccountLayout.decode(accountInfo.data);
      console.log('Token balance:', tokenAccount.amount);
    }
  },
  'confirmed'
);

// Monitor program account changes
const programSubscription = connection.onProgramAccountChange(
  programId,
  (keyedAccountInfo, context) => {
    console.log('Program account changed:', {
      pubkey: keyedAccountInfo.accountId.toBase58(),
      lamports: keyedAccountInfo.accountInfo.lamports,
    });
  },
  'confirmed',
  [
    {
      memcmp: {
        offset: 0,
        bytes: 'filter data',
      },
    },
  ]
);

// Clean up subscriptions
connection.removeAccountChangeListener(subscription);
```

### Polling Account State

```typescript
class AccountMonitor {
  private intervals = new Map<string, NodeJS.Timeout>();

  startPolling(
    publicKey: PublicKey,
    callback: (accountInfo: AccountInfo<Buffer> | null) => void,
    intervalMs = 5000
  ) {
    const key = publicKey.toBase58();
    
    // Clear existing interval
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key)!);
    }

    // Start new interval
    const interval = setInterval(async () => {
      try {
        const accountInfo = await connection.getAccountInfo(publicKey);
        callback(accountInfo);
      } catch (error) {
        console.error('Error polling account:', error);
      }
    }, intervalMs);

    this.intervals.set(key, interval);
  }

  stopPolling(publicKey: PublicKey) {
    const key = publicKey.toBase58();
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  stopAll() {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}
```

## Error Handling

### Common Error Patterns

```typescript
import { SendTransactionError } from '@solana/web3.js';

async function handleTransactionError(error: any) {
  if (error instanceof SendTransactionError) {
    console.error('Transaction simulation failed:', error.message);
    
    // Get transaction logs
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }

    // Handle specific errors
    if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient balance for transaction');
    } else if (error.message.includes('blockhash not found')) {
      throw new Error('Transaction expired, please retry');
    } else if (error.message.includes('invalid account')) {
      throw new Error('Invalid account in transaction');
    }
  }

  // Handle RPC errors
  if (error.code === -32602) {
    throw new Error('Invalid RPC parameters');
  } else if (error.code === -32005) {
    throw new Error('Node is unhealthy');
  }

  throw error;
}

// Usage in async function
try {
  const signature = await connection.sendTransaction(transaction, [payer]);
  await connection.confirmTransaction(signature);
} catch (error) {
  await handleTransactionError(error);
}
```

### Connection Health Monitoring

```typescript
class ConnectionHealthMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy = true;

  constructor(private connection: Connection) {}

  startMonitoring(intervalMs = 30000) {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await this.connection.getSlot();
        const latency = Date.now() - start;

        if (latency > 5000) {
          console.warn('High RPC latency detected:', latency);
        }

        if (!this.isHealthy) {
          console.log('RPC connection restored');
          this.isHealthy = true;
        }
      } catch (error) {
        if (this.isHealthy) {
          console.error('RPC connection unhealthy:', error);
          this.isHealthy = false;
        }
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getHealthStatus(): boolean {
    return this.isHealthy;
  }
}
```

This reference provides the essential Web3.js patterns and methods needed for robust Solana development in an MCP server context, with emphasis on error handling, monitoring, and transaction management.