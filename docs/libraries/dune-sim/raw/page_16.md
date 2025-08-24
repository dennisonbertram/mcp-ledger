# Uniswap X Swaps - Sim by Dune

Source: page_16

`ChainIdAbi` `Triggers` `execute` `IReactor` `import "sim-idx-sol/Simidx.sol";
contract Triggers is BaseTriggers {
    function triggers() external virtual override {
        Listener listener = new Listener();
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteFunction());
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteBatchFunction());
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteBatchWithCallbackFunction());
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteWithCallbackFunction());
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteFunction());
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteBatchFunction());
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteBatchWithCallbackFunction());
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteWithCallbackFunction());
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteFunction());
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteBatchFunction());
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteBatchWithCallbackFunction());
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteWithCallbackFunction());
    }
}
` `ChainAbi` `order` `OrderQuoter.sol` `Listener` `quote` `executeWithCallback` `try/catch` ``/// @notice Quote the given order, returning the ResolvedOrder object which defines
/// the current input and output token amounts required to satisfy it
/// Also bubbles up any reverts that would occur during the processing of the order
/// @param order abi-encoded order, including `reactor` as the first encoded struct member
/// @param sig The order signature
/// @return result The ResolvedOrder
function quote(bytes memory order, bytes memory sig) external returns (ResolvedOrder memory result) {
    try IReactor(getReactor(order)).executeWithCallback(SignedOrder(order, sig), bytes("")) {}
    catch (bytes memory reason) {
        result = parseRevertReason(reason);
    }
}
`` `reactorCallback` `ResolvedOrder` `revert` `/// @notice Reactor callback function
/// @dev reverts with the resolved order as reason
/// @param resolvedOrders The resolved orders
function reactorCallback(ResolvedOrder[] memory resolvedOrders, bytes memory) external pure {
    if (resolvedOrders.length != 1) {
        revert OrdersLengthIncorrect();
    }
    bytes memory order = abi.encode(resolvedOrders[0]);
    /// @solidity memory-safe-assembly
    assembly {
        revert(add(32, order), mload(order))
    }
}
` `FeeInjector` `ResolvedOrder` `function preExecuteFunction(PreFunctionContext memory ctx, ...) external override {
    // 1. Get the decoded order using the Quoter Pattern.
    ResolvedOrder memory order = this.quote(inputs.order.order, inputs.order.sig);
    // 2. Inject protocol fees for accuracy.
    FeeInjector._injectFees(order, IReactor(order.info.reactor).feeController());
    // 3. Emit the final, perfected event.
    emitTradesFromOrder(order, ctx.txn.call.caller());
}
` `call` `function emitUniswapXTrade(
    address makingToken,
    address takingToken,
    address maker,
    address taker,
    uint256 makingAmount,
    uint256 takingAmount,
    address platformContract
) internal {
    (string memory makingTokenSymbol, string memory makingTokenName, uint256 makingTokenDecimals) =
        makingToken == address(0) ? ("ETH", "Ether", 18) : getMetadata(makingToken);
    (string memory takingTokenSymbol, string memory takingTokenName, uint256 takingTokenDecimals) =
        takingToken == address(0) ? ("ETH", "Ether", 18) : getMetadata(takingToken);
    emit Swap(
        SwapData(
            uint64(block.chainid),
            txnHash,
            blockNumber(),
            uint64(block.timestamp),
            makingToken,
            makingAmount,
            makingTokenSymbol,
            makingTokenName,
            uint64(makingTokenDecimals),
            takingToken,
            takingAmount,
            takingTokenSymbol,
            takingTokenName,
            uint64(takingTokenDecimals),
            tx.origin,
            maker,
            taker,
            platformContract
        )
    );
}
function emitTradesFromOrder(ResolvedOrder memory order, address taker) internal {
    (InputToken memory input, OutputToken memory output) = getIoTokensFromOrder(order);
    emitUniswapXTrade(
        input.token, output.token, output.recipient, taker, input.amount, output.amount, address(order.info.reactor)
    );
}
` `event` `Listener` `SwapData` `Swap` `struct SwapData {
    uint64 chainId;
    bytes32 txnHash;
    uint64 blockNumber;
    uint64 blockTimestamp;
    address makerToken;
    uint256 makerAmt;
    string makerTokenSymbol;
    string makerTokenName;
    uint64 makerTokenDecimals;
    address takerToken;
    uint256 takerAmt;
    string takerTokenSymbol;
    string takerTokenName;
    uint64 takerTokenDecimals;
    address txnOriginator;
    address maker;
    address taker;
    address reactor;
}
event Swap(SwapData);
function emitTradesFromOrder(ResolvedOrder memory order, address taker) internal {
    (InputToken memory input, OutputToken memory output) = getIoTokensFromOrder(order);
    emitUniswapXTrade(
        input.token, output.token, output.recipient, taker, input.amount, output.amount, address(order.info.reactor)
    );
}
` `Swap` `swap` `SwapData` `swap` `import { swap } from "./db/schema/Listener";
import { db, App } from "@duneanalytics/sim-idx";
const app = App.create()
// This endpoint returns the 5 most recent swaps.
app.get("/*", async (c) => {
try {
    const result = await db.client(c).select().from(swap).limit(5);
    return Response.json({ result });
} catch (e) {
    console.error("Database operation failed:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
}
});
export default app;
`

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