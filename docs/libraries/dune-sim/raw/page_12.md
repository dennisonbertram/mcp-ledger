# Decode Any Smart Contract - Sim by Dune

Source: page_12

`contract-decoder` `--template=contract-decoder` `# Create and enter a new directory for your app
mkdir moonbirds-decoded
cd moonbirds-decoded
# Initialize the app with the contract-decoder template
sim init --template=contract-decoder
` `abis/UniswapV3Factory.json` `rm abis/UniswapV3Factory.json
` `sim abi codegen` `abis/` `sim abi codegen
` `abis/Moonbirds.json` `# Create the new ABI file
touch abis/Moonbirds.json
# Then paste the JSON into the file using your editor.
` `sim abi add` `sim abi add abis/Moonbirds.json
` `Moonbirds.sol` `listeners/lib/sim-idx-generated/` `listeners/src/Main.sol` `Moonbirds.sol` `Moonbirds$EmitAllEvents` `allTriggers()` `snake_case` `RoleGranted` `role_granted` `listeners/src/Main.sol` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
contract Triggers is BaseTriggers {
    function triggers() external virtual override {
        Listener listener = new Listener();
        // The allTriggers() helper registers every event from the ABI.
        addTriggers(
            // Moonbirds contract on Ethereum Mainnet (Chain ID 1)
            chainContract(Chains.Ethereum, 0x23581767a106ae21c074b2276D25e5C3e136a68b),
            listener.allTriggers()
        );
    }
}
// Inherit from Moonbirds$EmitAllEvents to automatically handle all events.
contract Listener is Moonbirds$EmitAllEvents {}
` `Listener` `Triggers` `sim listeners evaluate` `--start-block` `sim listeners evaluate \
  --chain-id=1 \
  --start-block=22830504 \
  --listeners=Listener
` `events` `errors` `sim init` `apis/src/index.ts` `sim build` `apis/src/db/schema/Listener.ts` `apis/src/index.ts` `approval_for_all` `ApprovalForAll` `import { eq } from "drizzle-orm";
import { approvalForAll } from "./db/schema/Listener"; // Import a schema from the new contract
import {types, db, App} from "@duneanalytics/sim-idx";
const app = App.create();
app.get("/*", async (c) => {
try {
    const client = db.client(c);
    // Query one of the new tables generated from the Moonbirds ABI
    const result = await client.select().from(approvalForAll).limit(10);
    return Response.json({
      result: result,
    });
} catch (e) {
    console.error("Database operation failed:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
}
});
export default app;
` `sim build` `sim build
` `contract-decoder`

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```