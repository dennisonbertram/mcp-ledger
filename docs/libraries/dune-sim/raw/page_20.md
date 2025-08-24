# Supported Chains - Sim by Dune

Source: page_20

`curl --request GET \
  --url https://api.sim.dune.com/v1/evm/supported-chains \
  --header 'X-Sim-Api-Key: YOUR_API_KEY'
` `{
"chains": [\
    {\
      "name": "ethereum",\
      "chain_id": 1,\
      "tags": ["default", "mainnet"],\
      "balances": {"supported": true},\
      "transactions": {"supported": true},\
      "activity": {"supported": true},\
      "token_info": {"supported": true},\
      "token_holders": {"supported": true},\
      "collectibles": {"supported": true}\
    },\
    {\
      "name": "polygon",\
      "chain_id": 137,\
      "tags": ["default", "mainnet"],\
      "balances": {"supported": true},\
      "transactions": {"supported": true},\
      "activity": {"supported": true},\
      "token_info": {"supported": true},\
      "token_holders": {"supported": true},\
      "collectibles": {"supported": true}\
    }\
]
}
` `curl --request GET \
  --url https://api.sim.dune.com/v1/evm/supported-chains \
  --header 'X-Sim-Api-Key: YOUR_API_KEY'
` `{
"chains": [\
    {\
      "name": "ethereum",\
      "chain_id": 1,\
      "tags": ["default", "mainnet"],\
      "balances": {"supported": true},\
      "transactions": {"supported": true},\
      "activity": {"supported": true},\
      "token_info": {"supported": true},\
      "token_holders": {"supported": true},\
      "collectibles": {"supported": true}\
    },\
    {\
      "name": "polygon",\
      "chain_id": 137,\
      "tags": ["default", "mainnet"],\
      "balances": {"supported": true},\
      "transactions": {"supported": true},\
      "activity": {"supported": true},\
      "token_info": {"supported": true},\
      "token_holders": {"supported": true},\
      "collectibles": {"supported": true}\
    }\
]
}
` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `katana` `747474` `` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `monad_testnet` `10143` `testnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `monad_testnet` `10143` `testnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `tron` `728126428` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `b3` `8333` `mainnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `flow` `747` `mainnet` `forma` `984122` `` `fraxtal` `252` `mainnet` `funkichain` `33979` `` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hemi` `43111` `mainnet` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `katana` `747474` `` `lens` `232` `mainnet` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `monad_testnet` `10143` `testnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `plume` `98866` `mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `proof_of_play_boss` `70701` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `ronin` `2020` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `somnia` `5031` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `sophon` `50104` `mainnet` `superposition` `55244` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `tac` `239` `` `taiko` `167000` `` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `abstract` `2741` `mainnet` `ancient8` `888888888` `mainnet` `ape_chain` `33139` `mainnet` `arbitrum` `42161` `default, mainnet` `arbitrum_nova` `42170` `default, mainnet` `avalanche_c` `43114` `default, mainnet` `avalanche_fuji` `43113` `testnet` `base` `8453` `default, mainnet` `base_sepolia` `84532` `testnet` `berachain` `80094` `mainnet` `blast` `81457` `default, mainnet` `bnb` `56` `default, mainnet` `bob` `60808` `mainnet` `boba` `288` `mainnet` `celo` `42220` `default, mainnet` `corn` `21000000` `` `cyber` `7560` `mainnet` `degen` `666666666` `mainnet` `ethereum` `1` `default, mainnet` `fantom` `250` `mainnet` `flare` `14` `mainnet` `gnosis` `100` `default, mainnet` `ham` `5112` `` `hychain` `2911` `` `hyper_evm` `999` `default, mainnet` `ink` `57073` `mainnet` `kaia` `8217` `mainnet` `linea` `59144` `mainnet` `lisk` `1135` `mainnet` `mantle` `5000` `mainnet` `metis` `1088` `` `mint` `185` `` `mode` `34443` `mainnet` `omni` `166` `omni` `opbnb` `204` `mainnet` `optimism` `10` `default, mainnet` `polygon` `137` `default, mainnet` `proof_of_play` `70700` `mainnet` `rari` `1380012617` `mainnet` `redstone` `690` `mainnet` `scroll` `534352` `mainnet` `sei` `1329` `mainnet` `sepolia` `11155111` `testnet` `shape` `360` `mainnet` `soneium` `1868` `mainnet` `sonic` `146` `mainnet` `superseed` `5330` `mainnet` `swellchain` `1923` `mainnet` `unichain` `130` `mainnet` `wemix` `1111` `` `world` `480` `mainnet` `xai` `660279` `mainnet` `zero_network` `543210` `mainnet` `zkevm` `1101` `mainnet` `zksync` `324` `default, mainnet` `zora` `7777777` `default, mainnet` `name` `chain_id` `tags` `supported` `tags` `mainnet` `testnet` `default` `chain_ids` `chain_ids` `?chain_ids=mainnet` `mainnet` `?chain_ids=mainnet,testnet` `mainnet` `testnet` `?chain_ids=1,137,42161` `chain_ids` `default` `chain_ids` `?chain_ids=corn,funkichain` ``// Fetch supported chains and build a dropdown for users
async function buildChainSelector() {
const response = await fetch('https://api.sim.dune.com/v1/evm/supported-chains', {
    headers: { 'X-Sim-Api-Key': 'YOUR_API_KEY' }
});

const data = await response.json();

// Filter chains that support balances
const supportedChains = data.chains.filter(chain => chain.balances.supported);

// Build dropdown options
const chainOptions = supportedChains.map(chain => ({
    value: chain.chain_id,
    label: `${chain.name} (${chain.chain_id})`,
    isMainnet: chain.tags.includes('mainnet')
}));

return chainOptions;
}
`` ``async function validateChainSupport(chainId, endpointName) {
// Check if a chain supports a specific endpoint before making requests
try {
    const response = await fetch('https://api.sim.dune.com/v1/evm/supported-chains', {
      headers: { 'X-Sim-Api-Key': 'YOUR_API_KEY' }
    });

    const data = await response.json();

    // Find the chain
    const chain = data.chains.find(c => c.chain_id === chainId);

    if (!chain) {
      return { supported: false, message: `Chain ${chainId} not found` };
    }

    // Check if the endpoint is supported
    if (!chain[endpointName] || !chain[endpointName].supported) {
      return {
        supported: false,
        message: `Endpoint '${endpointName}' not supported on ${chain.name}`
      };
    }

    return {
      supported: true,
      message: `Chain ${chain.name} supports ${endpointName}`
    };

} catch (error) {
    return { supported: false, message: `Error validating chain: ${error.message}` };
}
}
// Usage
const result = await validateChainSupport(1, 'balances');
console.log(result.message); // "Chain ethereum supports balances"
``

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