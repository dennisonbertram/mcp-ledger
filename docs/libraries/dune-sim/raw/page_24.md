# Balances - Sim by Dune

Source: page_24

`curl --request GET \
  --url https://api.sim.dune.com/v1/evm/balances/{uri} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"wallet_address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
"balances": [\
    {\
      "chain": "ethereum",\
      "chain_id": 1,\
      "address": "0x0e36c45d16585d1801e37cfaa577a9ad39f9343a",\
      "amount": "45787557175393926414790300082",\
      "symbol": "Kendu",\
      "name": "Kendu of Bank",\
      "decimals": 18,\
      "price_usd": 1.233346836175539e+21,\
      "value_usd": 5.647193877847869e+31,\
      "pool_size": 1233.34683617554,\
      "low_liquidity": true\
    },\
    {\
      "chain": "ethereum",\
      "chain_id": 1,\
      "address": "0x113404d2003c4acf4231a3a62374bb503bff03d7",\
      "amount": "432599243131405501735524",\
      "symbol": "ALT",\
      "name": "AltLayer",\
      "decimals": 18,\
      "price_usd": 9388386012000030000,\
      "value_usd": 4.061408683016688e+24,\
      "pool_size": 9.38838601200001,\
      "low_liquidity": true\
    }\
],
"next_offset": "opaque-pagination-token",
"request_time": "2025-08-13T10:31:08Z",
"response_time": "2025-08-13T10:31:08Z"
}` `curl --request GET \
  --url https://api.sim.dune.com/v1/evm/balances/{uri} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"wallet_address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
"balances": [\
    {\
      "chain": "ethereum",\
      "chain_id": 1,\
      "address": "0x0e36c45d16585d1801e37cfaa577a9ad39f9343a",\
      "amount": "45787557175393926414790300082",\
      "symbol": "Kendu",\
      "name": "Kendu of Bank",\
      "decimals": 18,\
      "price_usd": 1.233346836175539e+21,\
      "value_usd": 5.647193877847869e+31,\
      "pool_size": 1233.34683617554,\
      "low_liquidity": true\
    },\
    {\
      "chain": "ethereum",\
      "chain_id": 1,\
      "address": "0x113404d2003c4acf4231a3a62374bb503bff03d7",\
      "amount": "432599243131405501735524",\
      "symbol": "ALT",\
      "name": "AltLayer",\
      "decimals": 18,\
      "price_usd": 9388386012000030000,\
      "value_usd": 4.061408683016688e+24,\
      "pool_size": 9.38838601200001,\
      "low_liquidity": true\
    }\
],
"next_offset": "opaque-pagination-token",
"request_time": "2025-08-13T10:31:08Z",
"response_time": "2025-08-13T10:31:08Z"
}` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `katana` `747474` `` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `monad_testnet` `10143` `testnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `pool_size` `low_liquidity:	true` `historical_prices` `&historical_prices=24` `&historical_prices=1,6,24` `historical_prices` `historical_prices` `{
"balances": [\
    {\
      "symbol": "ETH",\
      "price_usd": 3896.8315,\
      "historical_prices": [\
        { "offset_hours": 24, "price_usd": 3816.476803 },\
        { "offset_hours": 6,  "price_usd": 3910.384068 },\
        { "offset_hours": 1,  "price_usd": 3898.632723 }\
      ]\
    }\
]
}
` `price_usd` `historical_prices[].price_usd` `pool_size` `limit` `next_offset` `offset` `next_offset` `offset` `Sim API` `?chain_ids=1` `?chain_ids=ethereum` `?chain_ids=1,137` `?chain_ids=ethereum,polygon` `erc20` `native` `erc20` `native` `logo` `url` `1 <= x <= 24` `1 <= x <= 1000` `"0xd8da6bf26964af9d7eed9e03e53415d37aa96045"` `offset`

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