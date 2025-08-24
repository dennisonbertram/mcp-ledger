# Collectibles - Sim by Dune

Source: page_10

`curl --request GET \
  --url https://api.sim.dune.com/v1/evm/collectibles/{address} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
"entries": [\
    {\
      "contract_address": "0x5d28dcf2fbbd3738c0ebe9de03eafcb4ec33015d",\
      "token_standard": "ERC1155",\
      "token_id": "1",\
      "chain": "ethereum",\
      "chain_id": 1,\
      "name": "Beeplfg",\
      "description": "Beeplfg",\
      "symbol": "CRAP",\
      "image_url": "https://api.sim.dune.com/v1/evm/collectible/image/1/0x5d28dcf2fbbd3738c0ebe9de03eafcb4ec33015d/1",\
      "last_sale_price": "0",\
      "metadata": {\
        "uri": "ipfs://QmcnkkMnfL7fugsyrZPEZhPGciLMoo9kwWt1cg4QHLLx3w/0",\
        "attributes": [\
          {\
            "key": "Color",\
            "value": "255, 43, 163"\
          },\
          {\
            "key": "Stance",\
            "value": "Greased"\
          }\
        ]\
      },\
      "balance": "8",\
      "last_acquired": "2025-08-10T03:58:59Z"\
    },\
    {\
      "contract_address": "0x344299dd2af8f81246dcb7b3368c6b9b5ddad4f6",\
      "token_standard": "ERC1155",\
      "token_id": "1",\
      "chain": "bnb",\
      "chain_id": 56,\
      "name": "launchspx org",\
      "balance": "1",\
      "last_acquired": "2025-08-11T04:22:52Z"\
    },\
    {\
      "contract_address": "0x3c020f2124b84bd079985c77f93d4a750512448c",\
      "token_standard": "ERC721",\
      "token_id": "5132",\
      "chain": "ethereum",\
      "chain_id": 1,\
      "name": "Ethereum Puppet #5132",\
      "description": "Ethereum Puppet #5132",\
      "symbol": "PUPPET",\
      "image_url": "https://api.sim.dune.com/v1/evm/collectible/image/1/0x3c020f2124b84bd079985c77f93d4a750512448c/5132",\
      "last_sale_price": "0.00005",\
      "metadata": {\
        "uri": "https://www.ethereumpuppets.com/metadata/5132",\
        "attributes": [\
          {\
            "key": "Background",\
            "value": "Mustard"\
          },\
          {\
            "key": "Shirt",\
            "value": "Gambler"\
          }\
        ]\
      },\
      "balance": "1",\
      "last_acquired": "2025-08-09T23:07:47Z"\
    },\
    {\
      "contract_address": "0xa18cf489cf710759f13ac6c8596823dba85354e2",\
      "token_standard": "ERC721",\
      "token_id": "24",\
      "chain": "optimism",\
      "chain_id": 10,\
      "balance": "1",\
      "last_acquired": "2025-08-07T14:51:57Z"\
    }\
],
"next_offset": "opaque-pagination-token",
"request_time": "2025-08-13T09:40:53Z",
"response_time": "2025-08-13T09:40:53Z"
}` `curl --request GET \
  --url https://api.sim.dune.com/v1/evm/collectibles/{address} \
  --header 'X-Sim-Api-Key: <x-sim-api-key>'` `{
"address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
"entries": [\
    {\
      "contract_address": "0x5d28dcf2fbbd3738c0ebe9de03eafcb4ec33015d",\
      "token_standard": "ERC1155",\
      "token_id": "1",\
      "chain": "ethereum",\
      "chain_id": 1,\
      "name": "Beeplfg",\
      "description": "Beeplfg",\
      "symbol": "CRAP",\
      "image_url": "https://api.sim.dune.com/v1/evm/collectible/image/1/0x5d28dcf2fbbd3738c0ebe9de03eafcb4ec33015d/1",\
      "last_sale_price": "0",\
      "metadata": {\
        "uri": "ipfs://QmcnkkMnfL7fugsyrZPEZhPGciLMoo9kwWt1cg4QHLLx3w/0",\
        "attributes": [\
          {\
            "key": "Color",\
            "value": "255, 43, 163"\
          },\
          {\
            "key": "Stance",\
            "value": "Greased"\
          }\
        ]\
      },\
      "balance": "8",\
      "last_acquired": "2025-08-10T03:58:59Z"\
    },\
    {\
      "contract_address": "0x344299dd2af8f81246dcb7b3368c6b9b5ddad4f6",\
      "token_standard": "ERC1155",\
      "token_id": "1",\
      "chain": "bnb",\
      "chain_id": 56,\
      "name": "launchspx org",\
      "balance": "1",\
      "last_acquired": "2025-08-11T04:22:52Z"\
    },\
    {\
      "contract_address": "0x3c020f2124b84bd079985c77f93d4a750512448c",\
      "token_standard": "ERC721",\
      "token_id": "5132",\
      "chain": "ethereum",\
      "chain_id": 1,\
      "name": "Ethereum Puppet #5132",\
      "description": "Ethereum Puppet #5132",\
      "symbol": "PUPPET",\
      "image_url": "https://api.sim.dune.com/v1/evm/collectible/image/1/0x3c020f2124b84bd079985c77f93d4a750512448c/5132",\
      "last_sale_price": "0.00005",\
      "metadata": {\
        "uri": "https://www.ethereumpuppets.com/metadata/5132",\
        "attributes": [\
          {\
            "key": "Background",\
            "value": "Mustard"\
          },\
          {\
            "key": "Shirt",\
            "value": "Gambler"\
          }\
        ]\
      },\
      "balance": "1",\
      "last_acquired": "2025-08-09T23:07:47Z"\
    },\
    {\
      "contract_address": "0xa18cf489cf710759f13ac6c8596823dba85354e2",\
      "token_standard": "ERC721",\
      "token_id": "24",\
      "chain": "optimism",\
      "chain_id": 10,\
      "balance": "1",\
      "last_acquired": "2025-08-07T14:51:57Z"\
    }\
],
"next_offset": "opaque-pagination-token",
"request_time": "2025-08-13T09:40:53Z",
"response_time": "2025-08-13T09:40:53Z"
}` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `monad_testnet` `10143` `testnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `tron` `728126428` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `Sim API` `?chain_ids=1` `?chain_ids=ethereum` `?chain_ids=1,137` `?chain_ids=ethereum,polygon` `next_offset` `1 <= x <= 2500` `ERC721` `ERC1155` `offset`

```

```

```

```

```

```

```

```