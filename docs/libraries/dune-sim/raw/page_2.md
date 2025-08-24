# Replace Sample ABI with Any Contract - Sim by Dune

Source: page_2

`sim init` `abis/UniswapV3Factory.json` `abis/` `rm abis/UniswapV3Factory.json
# Regenerate bindings
sim abi codegen
` `sim abi codegen` `listeners/lib/sim-idx-generated/` `abis/` `abis/USDC.json` `touch abis/USDC.json
# then paste the JSON using your editor or:
cat > abis/USDC.json  # Ctrl-D to save
` `sim abi add` `listeners/lib/sim-idx-generated/` `sim abi add abis/USDC.json
` `listeners/lib/sim-idx-generated/` `listeners/src/USDCListener.sol` `Transfer` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
contract USDCListener is USDC$OnTransferEvent {
    event USDCTransfer(
        uint64  chainId,
        address from,
        address to,
        uint256 value
    );
    function onTransferEvent(
        EventContext memory /* ctx */,
        USDC$TransferEventParams memory inputs
    ) external override {
        emit USDCTransfer(
            uint64(block.chainid),
            inputs.from,
            inputs.to,
            inputs.value
        );
    }
}
` `Main.sol` `USDCListener` `Triggers` `Triggers` `addTrigger` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
import "./USDCListener.sol";
contract Triggers is BaseTriggers {
    function triggers() external virtual override {
        USDCListener listener = new USDCListener();
        addTrigger(
            chainContract(Chains.Ethereum, 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48),
            listener.triggerOnTransferEvent()
        );
    }
}
` `addTrigger` `Chains` `Chains.Base` `sim listeners evaluate` `sim listeners evaluate \
  --chain-id 1 \
  --start-block <BLOCK_NUMBER> \
  --listeners=USDCListener
# --end-block   <BLOCK_NUMBER>   # optional, evaluates a single block if omitted
` `events` `errors` `sim listeners evaluate` `sim build
` `sim build` `apis/src/db/schema/Listener.ts` `apis/src/index.ts` `poolCreated` `apis/src/index.ts` `usdcTransfer` `USDCTransfer` `import { eq } from "drizzle-orm";
import { usdcTransfer } from "./db/schema/Listener"; // adjust path if needed
import { types, db, App } from "@duneanalytics/sim-idx";
const app = App.create();
app.get("/*", async (c) => {
try {
    const result = await db.client(c).select().from(usdcTransfer).limit(10);
    return Response.json({
      result,
    });
} catch (e) {
    console.error("Database operation failed:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
}
});
export default app;
` `sim build`

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