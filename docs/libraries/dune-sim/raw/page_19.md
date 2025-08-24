# Transactions - Sim by Dune

Source: page_19

`curl --request GET \
  --url https://api.sim.dune.com/beta/svm/transactions/{uri} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"next_offset": "eyJibG9ja190aW1lIjoxNjgwMDAwMDAwLCJpbmRleCI6MH0=",
"transactions": [\
    {\
      "address": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",\
      "block_slot": 123456789,\
      "block_time": 1680000000000000,\
      "chain": "solana",\
      "raw_transaction": {\
        "blockTime": 1680000000,\
        "meta": {\
          "err": null,\
          "fee": 5000,\
          "innerInstructions": [],\
          "logMessages": [\
            "Program 11111111111111111111111111111111 invoke [1]",\
            "Program 11111111111111111111111111111111 success"\
          ],\
          "postBalances": [\
            499995000,\
            10000000\
          ],\
          "postTokenBalances": [],\
          "preBalances": [\
            500000000,\
            0\
          ],\
          "preTokenBalances": [],\
          "rewards": [],\
          "status": {\
            "Ok": null\
          }\
        },\
        "slot": 123456789,\
        "transaction": {\
          "message": {\
            "accountKeys": [\
              "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",\
              "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"\
            ],\
            "header": {\
              "numReadonlySignedAccounts": 0,\
              "numReadonlyUnsignedAccounts": 1,\
              "numRequiredSignatures": 1\
            },\
            "instructions": [\
              {\
                "accounts": [\
                  0,\
                  1\
                ],\
                "data": "3Bxs4h24hBtQy9rw",\
                "programIdIndex": 2\
              }\
            ],\
            "recentBlockhash": "11111111111111111111111111111111"\
          },\
          "signatures": [\
            "5SzSbWKM9yZC7cCGMhUhvnYdWQytrk9NBaWwug1gQBKKwNEBvBKqPSfVeYYnZwUuUyvcCHgYhDkTRrB6YBfwzfv8"\
          ]\
        }\
      }\
    }\
]
}` `curl --request GET \
  --url https://api.sim.dune.com/beta/svm/transactions/{uri} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"next_offset": "eyJibG9ja190aW1lIjoxNjgwMDAwMDAwLCJpbmRleCI6MH0=",
"transactions": [\
    {\
      "address": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",\
      "block_slot": 123456789,\
      "block_time": 1680000000000000,\
      "chain": "solana",\
      "raw_transaction": {\
        "blockTime": 1680000000,\
        "meta": {\
          "err": null,\
          "fee": 5000,\
          "innerInstructions": [],\
          "logMessages": [\
            "Program 11111111111111111111111111111111 invoke [1]",\
            "Program 11111111111111111111111111111111 success"\
          ],\
          "postBalances": [\
            499995000,\
            10000000\
          ],\
          "postTokenBalances": [],\
          "preBalances": [\
            500000000,\
            0\
          ],\
          "preTokenBalances": [],\
          "rewards": [],\
          "status": {\
            "Ok": null\
          }\
        },\
        "slot": 123456789,\
        "transaction": {\
          "message": {\
            "accountKeys": [\
              "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",\
              "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"\
            ],\
            "header": {\
              "numReadonlySignedAccounts": 0,\
              "numReadonlyUnsignedAccounts": 1,\
              "numRequiredSignatures": 1\
            },\
            "instructions": [\
              {\
                "accounts": [\
                  0,\
                  1\
                ],\
                "data": "3Bxs4h24hBtQy9rw",\
                "programIdIndex": 2\
              }\
            ],\
            "recentBlockhash": "11111111111111111111111111111111"\
          },\
          "signatures": [\
            "5SzSbWKM9yZC7cCGMhUhvnYdWQytrk9NBaWwug1gQBKKwNEBvBKqPSfVeYYnZwUuUyvcCHgYhDkTRrB6YBfwzfv8"\
          ]\
        }\
      }\
    }\
]
}` `transactions` `raw_transaction` `limit` `next_offset` `offset` `next_offset` `offset` `offset` `1 <= x <= 1000`

```

```

```

```

```

```

```

```