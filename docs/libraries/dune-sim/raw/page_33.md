# Balances - Sim by Dune

Source: page_33

`curl --request GET \
  --url https://api.sim.dune.com/beta/svm/balances/{uri} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"processing_time_ms": 120,
"wallet_address": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
"next_offset": "eyJibG9ja190aW1lIjoxNjgwMDAwMDAwLCJpbmRleCI6MH0=",
"balances_count": 2,
"balances": [\
    {\
      "chain": "solana",\
      "address": "native",\
      "amount": "1000000000",\
      "balance": "1.0",\
      "value_usd": 20.5,\
      "program_id": null,\
      "decimals": 9,\
      "total_supply": "1000000000000000",\
      "name": "Solana",\
      "symbol": "SOL",\
      "uri": null,\
      "price_usd": 20.5,\
      "liquidity_usd": 500000000,\
      "pool_type": null,\
      "pool_address": null,\
      "mint_authority": null\
    }\
]
}` `curl --request GET \
  --url https://api.sim.dune.com/beta/svm/balances/{uri} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"processing_time_ms": 120,
"wallet_address": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
"next_offset": "eyJibG9ja190aW1lIjoxNjgwMDAwMDAwLCJpbmRleCI6MH0=",
"balances_count": 2,
"balances": [\
    {\
      "chain": "solana",\
      "address": "native",\
      "amount": "1000000000",\
      "balance": "1.0",\
      "value_usd": 20.5,\
      "program_id": null,\
      "decimals": 9,\
      "total_supply": "1000000000000000",\
      "name": "Solana",\
      "symbol": "SOL",\
      "uri": null,\
      "price_usd": 20.5,\
      "liquidity_usd": 500000000,\
      "pool_type": null,\
      "pool_address": null,\
      "mint_authority": null\
    }\
]
}` `?chains=solana,eclipse` `balances` `limit` `next_offset` `offset` `next_offset` `offset` `offset` `1 <= x <= 1000`

```

```

```

```

```

```

```

```