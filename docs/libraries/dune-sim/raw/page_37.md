# CLI Overview - Sim by Dune

Source: page_37

`sim` `curl -L https://simcli.dune.com | bash
` `sim init` `sim.toml` `sim init
` `mkdir new-project` `--template` `sim init --template=contract-decoder
` `--template` `sim build` `forge build` `listeners/` `sim build
` `sim test` `listeners/test/` `sim test
` `sim authenticate` `sim authenticate
` `sim help` `sim help
` `sim --help` `sim -h` `sim --version` `sim v0.0.86 (eaddf2 2025-06-22T18:01:14.000000000Z)
` `sim abi` `sim abi add <file_path>` `sim abi add abis/YourContract.json
` `abis/` `abis/YourContract.json` `sim abi add abis/YourContract.json` `sim abi codegen` `abis/` `sim abi codegen
` `sim abi add` `sim listeners` `sim abi` `listeners` `sim listeners <COMMAND>
` `sim listeners evaluate` `sim listeners evaluate \
  --start-block <START_BLOCK> \
  --chain-id <CHAIN_ID> \
  --end-block <END_BLOCK> \
  --listeners <LISTENER_CONTRACT>
` `evaluate` `--start-block` `--chain-id` `addTrigger` `--end-block` `--listeners` `/listener/src` `INFO deploy: {
"events": [\
    {\
      "name": "PoolCreated",\
      "fields": {\
        "pool": "70307790d81aba6a65de99c18865416e1eefc13e",\
        "caller": "1f98431c8ad98523631ae4a59f267346ea31f984",\
        "fee": "10000",\
        "token1": "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",\
        "chainId": "1",\
        "token0": "593e989f08e8d3ebea0ca5a17c7990d634812bc5"\
      },\
      "metadata": {\
        "block_number": 22757345,\
        "chain_id": 1\
      }\
    }\
],
"errors": []
}
` `sim listeners evaluate` `name` `fail_` `fail_PoolCreated` `fail_` `evaluate` `INFO deploy: {
"events": [\
    {\
      "name": "fail_TracesBase",\
      "fields": {\
        "block_number": 34190545,\
        "block_timestamp": 1755170437,\
        "call_depth": 2,\
        "call_type": 3,\
        "callee": "0x7458bfdc30034eb860b265e6068121d18fa5aa72",\
        "caller": "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",\
        "func_sig": "0x70a08231",\
        "parent_func_sig": "0x70a08231",\
        "success": false,\
        "trace_address": "1,4,0",\
        "tx_from": "0x17288b66bcadf1a3d083eb33e6c9ce772ff4e74f",\
        "tx_to": "0x0000000000000000000000000000000000000000",\
        "txn_hash": "0x9e00c37c073b300294398b2e028dfe58e1daf6ee0df53ef593de891714010fed",\
        "user_op_from": "0x0000000000000000000000000000000000000000"\
      },\
      "metadata": {\
        "blockNumber": 34190545,\
        "chainId": 8453\
      }\
    }\
],
"errors": []
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