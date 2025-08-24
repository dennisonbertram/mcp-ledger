# Error Handling - Sim by Dune

Source: page_0

`{
"error": "Description of what went wrong"
}
` `"error"` `"message"` `X-Sim-Api-Key` ``fetch('https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045', {
method: 'GET',
headers: {'X-Sim-Api-Key': 'YOUR_API_KEY'}
})
.then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        const errorMessage = err.error || err.message || response.statusText;
        throw new Error(`API error: ${errorMessage}`);
      });
    }
    return response.json();
})
.then(data => {
    console.log('Success:', data);
    // Process your data here
})
.catch(err => {
    console.error('Error fetching balances:', err);
    // Handle error appropriately in your application
    // e.g., show user-friendly message, retry, or fallback behavior
});
`` `curl -v -X GET "https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045" \
     -H "X-Sim-Api-Key: YOUR_API_KEY"
`

```

```

```

```

```

```