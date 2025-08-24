# Listener Contract Basics - Sim by Dune

Source: page_36

`listeners/` `listeners/src/` `Triggers` `addTrigger` `Triggers` `Main.sol` `listeners/src/Main.sol` `.sol` `listeners/src/` `listeners/src/` `Main.sol` `import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
import "./UniswapV3FactoryListener.sol";
` `Simidx.sol` `Generated.sol` `./UniswapV3FactoryListener.sol` `Triggers` `Triggers` `listeners/src/Main.sol` `chainAbi` `chainGlobal` `contract Triggers is BaseTriggers {
    function triggers() external virtual override {
        UniswapV3FactoryListener listener = new UniswapV3FactoryListener();
        addTrigger(
            chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),
            listener.triggerOnCreatePoolFunction()
        );
        addTrigger(
            chainContract(Chains.Unichain, 0x1F98400000000000000000000000000000000003),
            listener.triggerOnCreatePoolFunction()
        );
        addTrigger(
            chainContract(Chains.Base, 0x33128a8fC17869897dcE68Ed026d694621f6FDfD),
            listener.triggerOnCreatePoolFunction()
        );
    }
}
` `BaseTriggers` `Simidx.sol` `addTrigger` `triggers()` `new UniswapV3FactoryListener()` `chainContract(...)` `Chains` `listeners/src/UniswapV3FactoryListener.sol` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
/// Index calls to the UniswapV3Factory.createPool function on Ethereum
/// To hook on more function calls, specify that this listener should implement that interface and follow the compiler errors.
contract UniswapV3FactoryListener is UniswapV3Factory$OnCreatePoolFunction {
    /// Emitted events are indexed.
    /// To change the data which is indexed, modify the event or add more events.
    event PoolCreated(uint64 chainId, address caller, address pool, address token0, address token1, uint24 fee);
    /// The handler called whenever the UniswapV3Factory.createPool function is called.
    /// Within here you write your indexing specific logic (e.g., call out to other contracts to get more information).
    /// The only requirement for handlers is that they have the correct signature, but usually you will use generated interfaces to help write them.
    function onCreatePoolFunction(
        FunctionContext memory ctx,
        UniswapV3Factory$CreatePoolFunctionInputs memory inputs,
        UniswapV3Factory$CreatePoolFunctionOutputs memory outputs
    ) external override {
        emit PoolCreated(
            uint64(block.chainid), ctx.txn.call.callee(), outputs.pool, inputs.tokenA, inputs.tokenB, inputs.fee
        );
    }
}
` `UniswapV3Factory$OnCreatePoolFunction` `inputs` `outputs` `PoolCreated` `UniswapV3FactoryListener` `.sol` `src/` `snake_case` `PoolCreated` `pool_created` `emit` `blockNumber` `PoolCreated` `Main.sol` `event PoolCreated(
    uint64   chainId,
    address  caller,
    address  pool,
    address  token0,
    address  token1,
    uint24   fee,
    uint256  blockNumber // new field
);
` `onCreatePoolFunction` `function onCreatePoolFunction(...) external override {
    emit PoolCreated(
        uint64(block.chainid),
        ctx.txn.call.callee(),
        outputs.pool,
        inputs.tokenA,
        inputs.tokenB,
        inputs.fee,
        blockNumber() // pass the new value
    );
}
` `pool_created` `block_number` `blockNumber()` `block.number` `addTrigger` `Triggers` `UniswapV3FactoryListener` `Listener` `OwnerChanged` `listeners/lib/sim-idx-generated/UniswapV3Factory.sol` `OwnerChanged` `abstract contract UniswapV3Factory$OnOwnerChangedEvent {
    function onOwnerChangedEvent(EventContext memory ctx, UniswapV3Factory$OwnerChangedEventParams memory inputs) virtual external;
    function triggerOnOwnerChangedEvent() view external returns (Trigger memory);
}
` `UniswapV3Factory$OnOwnerChangedEvent` `UniswapV3FactoryListener` `UniswapV3FactoryListener.sol` `contract UniswapV3FactoryListener is
    UniswapV3Factory$OnCreatePoolFunction, // existing
    UniswapV3Factory$OnOwnerChangedEvent   // new
{
    // ... existing events and handlers
}
` `UniswapV3FactoryListener` `owner_changed` `event OwnerChanged(
    uint64  chainId,
    address oldOwner,
    address newOwner
);
` `onOwnerChangedEvent` `UniswapV3FactoryListener` `function onOwnerChangedEvent(
    EventContext memory /*ctx*/,
    UniswapV3Factory$OwnerChangedEventParams memory inputs
) external override {
    emit OwnerChanged(
        uint64(block.chainid),
        inputs.oldOwner,
        inputs.newOwner
    );
}
` `Triggers` `Main.sol` `// In Triggers.triggers()
UniswapV3FactoryListener listener = new UniswapV3FactoryListener();
addTrigger(
    chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),
    listener.triggerOnCreatePoolFunction() // existing trigger
);
addTrigger(
    chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),
    listener.triggerOnOwnerChangedEvent() // new trigger
);
` `onCreatePoolFunction` `inputs` `outputs` `Pre-` `preCreatePoolFunction` `PreFunctionContext` `inputs` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
contract UniswapV3FactoryPreExecutionListener is UniswapV3Factory$PreCreatePoolFunction {
    // Fires *before* createPool executes
    event PoolWillBeCreated(
        uint64  chainId,
        address token0,
        address token1,
        uint24  fee
    );
    function preCreatePoolFunction(
        PreFunctionContext memory /*ctx*/,
        UniswapV3Factory$CreatePoolFunctionInputs memory inputs
    )
        external
        override
    {
        emit PoolWillBeCreated(
            uint64(block.chainid),
            inputs.tokenA,
            inputs.tokenB,
            inputs.fee
        );
    }
}
` `Triggers` `Main.sol` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "sim-idx-sol/Simidx.sol";
import "./UniswapV3FactoryPreExecutionListener.sol";
contract Triggers is BaseTriggers {
    function triggers() external override {
        UniswapV3FactoryPreExecutionListener listener = new UniswapV3FactoryPreExecutionListener();
        address factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984; // Uniswap V3 Factory (Ethereum)
        addTrigger(chainContract(Chains.Ethereum, factory), listener.triggerPreCreatePoolFunction());
    }
}
` `listeners` `sim test` `forge test` `listeners/test/` `sim listeners evaluate` `sim listeners evaluate \
  --chain-id 1 \
  --start-block 12369662 \
  --end-block 12369670 \
  --listeners=UniswapV3FactoryListener
` `--listeners` `evaluate` `fail_` `sim listeners evaluate`

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

```

```

```

```

```

```

```

```