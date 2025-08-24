# Listener Errors - Sim by Dune

Source: page_18

`// In Triggers.triggers()
Listener1 listener1 = new Listener1();
Listener2 listener2 = new Listener2();
addTrigger(..., listener1.triggerOnSwapFunction());
addTrigger(..., listener2.triggerOnSwapFunction());
// Separate listener contracts
contract Listener1 is ABI1$OnSwapFunction { /* ... */ }
contract Listener2 is ABI2$OnSwapFunction { /* ... */ }
` `sim.toml` `[listeners]
codegen_naming_convention = "abi_prefix"
` `contract CombinedListener is ABI1$OnSwapFunction, ABI2$OnSwapFunction {
    // Store every recipient that swaps via DEX #1
    address[] public swapRecipients;
    // Emit an alert for large swaps coming through DEX #2
    event LargeSwap(address indexed dex, address indexed recipient, uint256 amountOut);
    // Handler for ABI1 (e.g., Uniswap V2 style router)
    function ABI1$onSwapFunction(
        FunctionContext memory /*ctx*/,
        ABI1$SwapFunctionInputs memory inputs
    )
        external
        override
    {
        // Track who received tokens in this swap
        swapRecipients.push(inputs.to);
    }
    // Handler for ABI2 (e.g., SushiSwap router)
    function ABI2$onSwapFunction(
        FunctionContext memory /*ctx*/,
        ABI2$SwapFunctionInputs memory inputs
    )
        external
        override
    {
        // Fire an event if the swap paid out at least 1 ETH worth of tokens
        if (inputs.amountOut >= 1 ether) {
            emit LargeSwap(msg.sender, inputs.to, inputs.amountOut);
        }
    }
}
contract Triggers is BaseTriggers {
    function triggers() external override {
        CombinedListener listener = new CombinedListener();
        // DEX #1 (ABI1) on Ethereum
        addTrigger(
            chainContract(Chains.Ethereum, 0xAbCDEFabcdefABCdefABcdefaBCDEFabcdefAB),
            listener.ABI1$triggerOnSwapFunction()
        );
        // DEX #2 (ABI2) on Ethereum
        addTrigger(
            chainContract(Chains.Ethereum, 0x1234561234561234561234561234561234561234),
            listener.ABI2$triggerOnSwapFunction()
        );
    }
}
` `codegen_naming_convention` `sim.toml` `Stack too deep` `struct` `listeners/src/` `listeners/lib/sim-idx-generated/` `sim build` `struct EmitSwapData {
    uint64 chainId;
    bytes32 txnHash;
    uint64 blockNumber;
    uint64 blockTimestamp;
    bytes32 poolId;
    address fromToken;
    uint256 fromTokenAmt;
    string fromTokenSymbol;
    string fromTokenName;
    uint64 fromTokenDecimals;
    address toToken;
    uint256 toTokenAmt;
    string toTokenSymbol;
    string toTokenName;
    uint64 toTokenDecimals;
    address txnOriginator;
    address recipient;
    address poolManager;
}
` `listeners/src/` `// Incorrect: event Swap(EmitSwapData emitData);
// Correct:
event Swap(EmitSwapData);
` `function onSwapFunction(...) external override {
    // ...
    EmitSwapData memory emitData;
    emitData.chainId = uint64(block.chainid);
    emitData.txnHash = ctx.txn.hash;
    emitData.blockNumber = blockNumber();
    // ... populate all other fields
    emit Swap(emitData);
}
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