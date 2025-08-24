# Changelog - Sim by Dune

Source: page_30

`import "sim-idx-sol/Simidx.sol";` `blockNumber()` `block.number` `blockNumber()` `sim-idx-sol/Simidx.sol` `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
+ import "sim-idx-sol/Simidx.sol";
import "sim-idx-generated/Generated.sol";
contract MyListener is MyContract$OnMyEvent {
    event MyEvent(uint64 chainId, uint256 blockNum);
    function onMyEvent(
        EventContext memory /*ctx*/,
        MyContract$MyEventParams memory /*inputs*/
    ) external override {
        emit MyEvent(
            uint64(block.chainid),
-           block.number
+           blockNumber()
        );
    }
}
` `.withStartBlock()` `.withEndBlock()` `.withBlockRange()` `addTrigger(chainContract(Chains.Ethereum.withStartBlock(10000000), 0x1F98431c8aD98523631AE4a59f267346ea31F984), listener.triggerOnPoolCreatedEvent());
` `withStartBlock()` `BlockRange` `BlockRangeKind.RangeFrom` `addTrigger(chainContract(Chains.Ethereum.withStartBlock(10000000).withEndBlock(10000001), 0x1F98431c8aD98523631AE4a59f267346ea31F984), listener.triggerOnPoolCreatedEvent());
` `withEndBlock()` `BlockRange` `BlockRangeKind.RangeInclusive` `BlockRange memory range = BlockRangeLib.withStartBlock(100000).withEndBlock(10000001);
addTrigger(chainContract(Chains.Ethereum.withBlockRange(range), 0x1F98431c8aD98523631AE4a59f267346ea31F984), listener.triggerOnPoolCreatedEvent());
` `BlockRange` `BlockRangeLib` `BlockRange` `sim-idx-sol` `ctx.txn.call` `CallFrame` `ctx.txn.call.callee` `ctx.txn.call.callee()` `ctx.txn.call.caller` `ctx.txn.call.caller()` `ctx.txn.call.callData` `ctx.txn.call.callData()` `ctx.txn.call.callDepth` `ctx.txn.call.callDepth()` `ctx.txn.call.value` `ctx.txn.call.value()` `ctx.txn.call.callType` `ctx.txn.call.callType()` `ctx.txn.call.delegator()` `ctx.txn.call.delegatee()` `ctx.txn.call.verificationSource` `()` `ctx.txn.call.*` `emit PoolCreated(
-     uint64(block.chainid), ctx.txn.call.callee, outputs.pool, inputs.tokenA, inputs.tokenB, inputs.fee
+     uint64(block.chainid), ctx.txn.call.callee(), outputs.pool, inputs.tokenA, inputs.tokenB, inputs.fee
);
` `event` `/// @custom:index` `BTREE` `HASH` `BRIN` `GIN` `sim build` `GPv2Trade.Data` `GPv2Interaction.Data` `$AbiName$StructName` `$AbiName$ContractName$StructName` `Main.sol` `Main.sol` `Triggers` `sim listeners evaluate` `Main.sol` `Triggers` `Pre-` `preCreatePoolFunction` `PreFunctionContext`

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