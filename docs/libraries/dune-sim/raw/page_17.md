# Token Filtering - Sim by Dune

Source: page_17

`symbol` `name` `decimals` `price_usd` `pool_size` `low_liquidity` `pool_size` `low_liquidity` `price_usd` `value_usd` `pool_size` `// Filter tokens with at least $10,000 in liquidity
const filterByLiquidity = (tokens, minLiquidity = 10000) => {
return tokens.filter(token => {
    return token.pool_size && token.pool_size >= minLiquidity;
});
};
// Usage
const filteredTokens = filterByLiquidity(tokenData, 10000);
` `address` `chain_id` ``// Allowlist of trusted tokens. Each entry is an object containing
// the specific chainId and the token's contract address.
const ALLOWLIST = [\
// USDC on Ethereum\
{ chainId: 1, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },\
// Wrapped BTC on Ethereum\
{ chainId: 1, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },\
// DEGEN on Base\
{ chainId: 8453, address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed' },\
// Native ETH on Ethereum Mainnet\
{ chainId: 1, address: 'native' },\
// Native ETH on Base\
{ chainId: 8453, address: 'native' },\
];
const filterWithAllowlist = (tokens, minLiquidity = 10000) => {
return tokens.filter(token => {
    // Check if the current token matches any in our allowlist.
    const isAllowlisted = ALLOWLIST.some(allowlistItem => {
      // Note: The Balances API uses `address`, while the Activity API uses `token_address`.
      // We handle both possibilities here. We also convert to lowercase for a reliable match.
      const tokenAddress = (token.address || token.token_address || '').toLowerCase();

      return token.chain_id === allowlistItem.chainId && tokenAddress === allowlistItem.address;
    });
    // 1. If the token is on the allowlist, always include it.
    if (isAllowlisted) {
      return true;
    }

    // 2. For all other tokens, apply a standard liquidity filter.
    return token.pool_size && token.pool_size >= minLiquidity;
});
};
`` `// Denylist of problematic token symbols
const DENYLISTED_SYMBOLS = [\
'SCAM',\
'RUG',\
];
const filterWithDenylist = (tokens) => {
return tokens.filter(token => {
    // Exclude denylisted tokens
    if (token.symbol && DENYLISTED_SYMBOLS.includes(token.symbol.toUpperCase())) {
      return false;
    }
    // Apply other filtering criteria
    return token.pool_size && token.pool_size >= 1000;
});
};
` `const advancedTokenFilter = (tokens, options = {}) => {
const {
    minLiquidity = 1000,
    requireCompleteName = true,
    minPriceUsd = 0.000001,
    allowLowLiquidity = false
} = options;
return tokens.filter(token => {
    // Check if token has complete metadata
    if (requireCompleteName && (!token.name || !token.symbol)) {
      return false;
    }
    // Check minimum price threshold
    if (token.price_usd && token.price_usd < minPriceUsd) {
      return false;
    }
    // Check liquidity requirements
    if (!allowLowLiquidity && token.low_liquidity) {
      return false;
    }
    if (token.pool_size && token.pool_size < minLiquidity) {
      return false;
    }
    return true;
});
};
` `const filterCompleteTokens = (tokens) => {
return tokens.filter(token => {
    // Require all basic metadata to be present
    const hasBasicInfo = token.name &&
                        token.symbol &&
                        token.decimals !== undefined;

    // Optionally require price data
    const hasPriceData = token.price_usd !== undefined;

    return hasBasicInfo && hasPriceData;
});
};
// Or create a more flexible version
const filterTokensByCompleteness = (tokens, strict = false) => {
return tokens.filter(token => {
    if (strict) {
      // Strict mode: require all fields
      return token.name && token.symbol && token.decimals &&
             token.price_usd && token.pool_size;
    } else {
      // Lenient mode: require only basic fields
      return token.symbol && token.decimals !== undefined;
    }
});
};
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