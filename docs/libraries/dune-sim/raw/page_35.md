# Listener Features - Sim by Dune

Source: page_35

`chainAbi` `onBurnEvent` `UniswapV3Pool` `UniswapV3Pool$Abi()` `import "./UniswapPoolListener.sol";
contract Triggers is BaseTriggers {
    function triggers() external virtual override {
        UniswapPoolListener listener = new UniswapPoolListener();
        // Trigger on any contract on Ethereum matching the UniswapV3Pool ABI
        addTrigger(chainAbi(Chains.Ethereum, UniswapV3Pool$Abi()), listener.triggerOnBurnEvent());
    }
}
` `contract UniswapPoolListener is UniswapV3Pool$OnBurnEvent {
    event PoolBurn(address indexed poolAddress, address owner, int24 tickLower, int24 tickUpper, uint128 amount);
    function onBurnEvent(EventContext memory ctx, UniswapV3Pool$BurnEventParams memory inputs) external override {
        // Only emit an event if the burn amount is greater than zero
        if (inputs.amount > 0) {
            emit PoolBurn(
                ctx.txn.call.callee(), // The address of the pool that emitted the event
                inputs.owner,
                inputs.tickLower,
                inputs.tickUpper,
                inputs.amount
            );
        }
    }
}
` `chainGlobal` `onBlock` `Raw$OnBlock` `onBlock` `Triggers` `Raw$OnBlock` `import "./MyBlockListener.sol";
contract Triggers is BaseTriggers {
    function triggers() external virtual override {
        MyBlockListener listener = new MyBlockListener();
        addTrigger(chainGlobal(Chains.Ethereum), listener.triggerOnBlock());
    }
}
` `contract MyBlockListener is Raw$OnBlock {
    event BlockProcessed(uint256 blockNumber, uint256 timestamp);
    function onBlock(RawBlockContext memory /*ctx*/) external override {
        emit BlockProcessed(block.number, block.timestamp);
    }
}
` `Raw$OnCall` `Raw$OnLog` `addTriggers` `addTriggers` `Triggers` `addTrigger` `addTrigger` `import "./MyPoolListener.sol";
contract Triggers is BaseTriggers {
    function triggers() external override {
        MyPoolListener listener = new MyPoolListener();
        // Collect every handler we care about for this pool
        Trigger[] memory poolTriggers = [\
            listener.UniswapV3Pool$triggerOnSwapEvent(),\
            listener.UniswapV3Pool$triggerOnMintEvent(),\
            listener.UniswapV3Pool$triggerOnBurnEvent()\
        ];
        // Register all three triggers for the same contract in one call
        addTriggers(
            chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),
            poolTriggers
        );
    }
}
` `addTriggers` `Swap` `slot0` `interfaces` `listeners/src/interfaces/` `.sol` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
interface IUniswapV3Pool {
    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );
    // ... other functions
}
` `import {IUniswapV3Pool} from "./interfaces/IUniswapV3Pool.sol";
contract Listener is UniswapV3Pool$OnSwapEvent {
    // ...
    function onSwapEvent(EventContext memory ctx, ...) external override {
        // Cast the address of the contract that triggered the event
        // to the IUniswapV3Pool interface to call its functions.
        (uint160 sqrtPriceX96, , , , , , ) = IUniswapV3Pool(ctx.txn.call.callee()).slot0();
    }
}
` `Stack too deep` `@custom:index` `event` `/// @custom:index <index_name> <INDEX_TYPE> (<column1>, <column2>, ...);
` `<index_name>` `<INDEX_TYPE>` `BTREE` `HASH` `(<columns>)` `struct SwapData {
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
/// @custom:index swap_pool_time_idx BTREE (poolId, blockNumber, blockTimestamp);
event Swap(SwapData);
` `poolId` `blockNumber` `blockTimestamp` `SwapData` `/// @custom:index position_owner_idx HASH (to_address, token_id);
event PositionOwnerChanges(
    bytes32 txn_hash,
    uint256 block_number,
    uint256 block_timestamp,
    address from_address,
    address to_address,
    uint256 token_id,
    address pool
);
` `@custom:index` `struct LiquidityEventData {
    bytes32 txnHash;
    uint64 blockNumber;
    uint64 blockTimestamp;
    address pool;
    address owner;
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint256 amount0;
    uint256 amount1;
}
/// @custom:index lp_events_by_pool BTREE (pool, blockNumber);
/// @custom:index lp_events_by_owner BRIN (owner, blockTimestamp);
/// @custom:index lp_events_by_tick_range HASH (pool, tickLower, tickUpper);
event LiquidityEvent(LiquidityEventData);
` `BTREE` `BTREE` `=` `>` `<` `BETWEEN` `IN` `HASH` `=` `BRIN` `GIN` `array` `jsonb` `sim build` `Error: Cannot find column(s): 'block_numbr' in event PositionOwnerChanges`

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