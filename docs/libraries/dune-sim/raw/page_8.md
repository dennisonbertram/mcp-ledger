# Untitled

Source: page_8

`````
# Build with AI for Sim APIs
Source: https://docs.sim.dune.com/build-with-ai

Build faster with Sim APIs using LLMs and AI assistants.

We provide several resources to help you use LLMs and AI coding assistants to build much faster with Sim APIs.

## OpenAPI Specifications

To help AI tools understand our API structure, we provide OpenAPI specifications for each of our endpoints. These files detail available parameters, request bodies, and response schemas, making them ideal for generating client code or for use in custom AI agents.

You can find our OpenAPI specifications in the following directories:

* EVM API specifications: [`/evm/openapi/`](https://github.com/duneanalytics/sim-docs/tree/main/evm/openapi)
* SVM API specifications: [`/svm/openapi/`](https://github.com/duneanalytics/sim-docs/tree/main/svm/openapi)

## Add Docs to Cursor

To integrate our documentation directly into your Cursor editor for easy reference:

1. Go to **Cursor Settings -> Indexing & Docs -> Add Doc**.
2. Enter `docs.sim.dune.com` in the URL field.
3. Provide a name (e.g., "@simdocs").
4. Hit confirm. The documentation will sync automatically.
5. Reference Sim APIs documentation by typing `@simdocs` (or your chosen name) in your Cursor chat window.

<Frame caption="Add our docs to Cursor to use it in your chats">
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/cursor-add-docs.png" />
</Frame>

## AI Search

To ask questions about our documentation, click the **Ask AI** button in the header of the site. This opens a chat interface, powered by Mintlify, that understands natural language queries. Ask questions about endpoints, authentication, or specific data points, and it will answer you with the most relevant, accurate information.

<Frame caption="Click the Ask AI button in the header to start a conversation">
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/mintlify-search.png" />
</Frame>

## Use with LLMs

### Complete Documentation for LLMs

For LLM applications such as custom agents, RAG systems, or any scenario requiring our complete documentation, we provide an optimized text file at [`https://docs.sim.dune.com/llms-full.txt`](https://docs.sim.dune.com/llms-full.txt).

### Per-Page Access

You can get the Markdown version of any documentation page by appending `.md` to its URL. For example, `/evm/activity` becomes [`https://docs.sim.dune.com/evm/activity.md`](https://docs.sim.dune.com/evm/activity.md).

Additionally, in the top-right corner of each page, you will find several options to access the page's content in LLM-friendly formats:

* **Copy Page:** Copies the fully rendered content of the current page.
* **View Markdown:** Provides a URL with the raw Markdown source. This is ideal for direct input into LLMs.
* **Open with ChatGPT:** Instantly loads the page's content into a new session with ChatGPT. Ask questions, summarize, or generate code based on the page's content.

<Frame caption="Copy the page, view raw markdown, or open with ChatGPT">
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/mintlify-open-with-chatgpt.png" />
</Frame>

You can also type `⌘C` or `Ctrl+C` to copy any page's Markdown content.
Try it now.

# Error Handling
Source: https://docs.sim.dune.com/error-handling

How to handle errors when using Sim APIs

This guide explains how to handle errors when using Sim APIs, including common error codes, troubleshooting steps, and code examples for proper error handling.

## Error Response Format

When an error occurs, Sim APIs return a JSON response with error information:

```json
{
"error": "Description of what went wrong"
}
```

<Note>
  The error property can be either `"error"` or `"message"` depending on the type of error.
</Note>

## Common Error Codes

| HTTP Status | Description                | Troubleshooting                                                                              |
| ----------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| 401         | Invalid or missing API key | Check that you're including the correct API key in the `X-Sim-Api-Key` header                |
| 400         | Malformed request          | Verify the address format and other parameters in your request                               |
| 404         | Resource not found         | Verify the endpoint URL and resource identifiers                                             |
| 429         | Too many requests          | Implement backoff strategies and consider upgrading your plan if you consistently hit limits |
| 500         | Server-side error          | Retry the request after a short delay; if persistent, contact support                        |

## Handling Errors in Code

Here are examples of how to properly handle errors in different programming languages:

<Tabs>
  <Tab title="JavaScript">
    ```javascript
    fetch('https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045', {
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
    ```
  </Tab>

  <Tab title="Python">
    ```python
    import requests
    import time

    def get_balances(address, api_key, max_retries=3):
        url = f"https://api.sim.dune.com/v1/evm/balances/{address}"
        headers = {"X-Sim-Api-Key": api_key}

        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=headers)
                response.raise_for_status()  # Raises an exception for 4XX/5XX responses
                return response.json()

            except requests.exceptions.HTTPError as err:
                status_code = err.response.status_code
                error_data = {}

                try:
                    error_data = err.response.json()
                except:
                    pass

                # Get error message from either 'error' or 'message' property
                error_message = error_data.get('error') or error_data.get('message', 'Unknown error')

                print(f"HTTP Error {status_code}: {error_message}")

                # Handle specific error codes
                if status_code == 429:  # Rate limit exceeded
                    wait_time = min(2 ** attempt, 60)  # Exponential backoff
                    print(f"Rate limit exceeded. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                elif status_code == 500:  # Server error
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt
                        print(f"Server error. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue

                # For other errors or if we've exhausted retries
                return {"error": error_message, "status_code": status_code}

            except requests.exceptions.RequestException as err:
                print(f"Request error: {err}")
                return {"error": "Network or connection error", "details": str(err)}

        return {"error": "Max retries exceeded"}

    # Usage
    result = get_balances("0xd8da6bf26964af9d7eed9e03e53415d37aa96045", "YOUR_API_KEY")
    if "error" in result:
        print(f"Failed to get balances: {result['error']}")
    else:
        print(f"Found {len(result['balances'])} token balances")
    ```
  </Tab>
</Tabs>

## Best Practices for Error Handling

1. **Always check for errors**: Don't assume API calls will succeed.

2. **Use HTTP status codes**: Rely on HTTP status codes rather than parsing error message strings for programmatic decisions.

3. **Implement retry logic with backoff**: For transient errors (like rate limits or server errors), implement exponential backoff.

4. **Provide meaningful error messages**: Transform API error responses into user-friendly messages.

5. **Log errors for debugging**: Maintain detailed logs of API errors for troubleshooting.

6. **Implement fallbacks**: When possible, have fallback behavior when API calls fail.

## Debugging Tips

If you're experiencing persistent errors:

1. **Verify your API key**: Ensure it's valid and has the necessary permissions.

2. **Check request format**: Validate that your request parameters match the API specifications.

3. **Inspect full error responses**: The error message often contains specific details about what went wrong.

4. **Monitor your usage**: Check if you're approaching or exceeding rate limits.

5. **Test with cURL**: Isolate issues by testing the API directly with cURL:
   ```bash
   curl -v -X GET "https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045" \
        -H "X-Sim-Api-Key: YOUR_API_KEY"
   ```

## Need More Help?

If you're still experiencing issues after following these guidelines, please reach out through our [support channels](/support).

# Activity
Source: https://docs.sim.dune.com/evm/activity

evm/openapi/activity.json get /v1/evm/activity/{uri}
View chronologically ordered transactions including native transfers, ERC20 movements, NFT transfers, and decoded contract interactions.

export const SupportedChains = ({endpoint}) => {
  const dataState = useState(null);
  const data = dataState[0];
  const setData = dataState[1];
  useEffect(function () {
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {
      method: "GET"
    }).then(function (response) {
      return response.json();
    }).then(function (responseData) {
      setData(responseData);
    });
  }, []);
  if (data === null) {
    return <div>Loading chain information...</div>;
  }
  if (!data.chains) {
    return <div>No chain data available</div>;
  }
  var supportedChains = [];
  var totalChains = data.chains.length;
  if (endpoint !== undefined) {
    for (var i = 0; i < data.chains.length; i++) {
      var chain = data.chains[i];
      if (chain[endpoint] && chain[endpoint].supported) {
        supportedChains.push(chain);
      }
    }
  } else {
    supportedChains = data.chains;
  }
  var count = supportedChains.length;
  var endpointName = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1).replace(/_/g, " ") : "All";
  var accordionTitle = "Supported Chains (" + count + ")";
  return <Accordion title={accordionTitle}>
      <table>
        <thead>
          <tr>
            <th>name</th>
            <th>chain_id</th>
            <th>tags</th>
          </tr>
        </thead>
        <tbody>
          {supportedChains.map(function (chain) {
    return <tr key={chain.name}>
                <td><code>{chain.name}</code></td>
                <td><code>{chain.chain_id}</code></td>
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>
              </tr>;
  })}
        </tbody>
      </table>
    </Accordion>;
};

![Activity Sv](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/activity.svg)

The Activity API provides a realtime feed of onchain activity for any EVM address.
The newest activity is returned first and includes the following activity types:

* **send** - Outgoing transfers of tokens or native assets
* **receive** - Incoming transfers of tokens or native assets
* **mint** - Token minting activities
* **burn** - Token burning activities
* **swap** - Token swaps and exchanges
* **approve** - Token approval transactions
* **call** - Generic contract interactions that don't fall into the above categories

Each activity includes detailed information such as:

* Native token transfers
* ERC20 token transfers with metadata (symbol, decimals)
* ERC721 (NFT) transfers with token IDs
* Contract interactions with decoded function calls

<SupportedChains endpoint="activity" />

<Callout type="info">
  Activities are mostly indexed events. There are, of course, no events for native token transfers (wen [7708](https://ethereum-magicians.org/t/eip-7708-eth-transfers-emit-a-log/20034)?). We do have a heuristic to catch very simple native token transfers, where the native token transfer is the entirety of the transaction, but unfortunately we don't currently catch native token transfers that happen within internal txns.
</Callout>

## Data Finality & Re-orgs

Sim APIs are designed to automatically detect and handle blockchain re-organizations.
We detect any potentially broken parent-child block relationships as soon as they arise and update our internal state to match the onchain state, typically within a few hundred milliseconds.
This re-org handling is an automatic, non-configurable feature designed to provide the most reliable data.

## Token Filtering

We include all the data needed for custom filtering in the responses, allowing you to implement your own filtering logic. For a detailed explanation of our approach, see our [Token Filtering](/token-filtering) guide.

# Add Account Activity
Source: https://docs.sim.dune.com/evm/add-account-activity

Expand your realtime crypto wallet by integrating a dynamic feed of onchain activity.

<Frame caption="Show all onchain activity for a wallet address in the 'Activity' tab of our app.">
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/apis/Activity.webp" className="mx-auto" style={{ width:"100%" }} alt="" title="" />
</Frame>

Now that you have a wallet capable of showing realtime token balances and total portfolio value, let's enhance it by adding an *Activity* tab.

A key feature for any wallet is the ability to view past transaction activity.
This includes native currency transfers, ERC20 token movements, NFT transfers, and decoded interactions with smart contracts.
The [Activity API](/evm/activity) provides a comprehensive, realtime feed of this onchain activity, letting you implement this functionality with a single API request across 60+ EVM chains.

<Columns cols={2}>
  <Card title="View Source Code" icon="github" href="https://github.com/duneanalytics/sim-guides/tree/main/wallet-ui" horizontal>
    Access the complete source code for this wallet on GitHub
  </Card>

  <Card title="Try Live Demo" icon="globe" href="https://sim-guides.vercel.app/?walletAddress=0x48D004a6C175dB331E99BeAf64423b3098357Ae7" horizontal>
    Interact with the finished wallet app
  </Card>
</Columns>

<Note>
  This guide assumes you've completed the first guide, [Build a Realtime Wallet](/evm/build-a-realtime-wallet).
  Your project should already be set up to fetch and display token balances.
</Note>

## See It in Action

You can see the activity feed in action by trying the live demo below. Click on the "Activity" tab to explore transaction history for the sample wallet:

<iframe src="https://sim-guides.vercel.app/?walletAddress=0x48D004a6C175dB331E99BeAf64423b3098357Ae7&tab=activity" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" style={{ height: "800px" }} title="Live Wallet Demo - Activity Tab" frameBorder="0" allow="clipboard-write; encrypted-media" allowFullScreen />

## Fetch Wallet Activity

Let's start by adding a new `getWalletActivity` async function to our `server.js` file to fetch activity data from Sim APIs.

```javascript server.js (getWalletActivity)
async function getWalletActivity(walletAddress, limit = 25) { // Default to fetching 25 activities
    if (!walletAddress) return [];

    // The Activity API is currently in beta.
    // We add a 'limit' query parameter to control how many activities are returned.
    const url = `https://api.sim.dune.com/v1/evm/activity/${walletAddress}?limit=${limit}`;

    try {
        const response = await fetch(url, {
            headers: {
                'X-Sim-Api-Key': SIM_API_KEY, // Your API key from .env
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Activity API request failed with status ${response.status}: ${response.statusText}`, errorBody);
            throw new Error(`Activity API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        // The API returns activity items in the 'activity' key of the JSON response.
        return data.activity || [];
    } catch (error) {
        console.error("Error fetching wallet activity:", error.message);
        return []; // Return empty array on error
    }
}
```

The function creates the request URL for the `/v1/evm/activity/{address}` endpoint, adding the `limit` as a query parameter.
The [Activity API](/evm/activity) conveniently packages the transaction data within an `activity` array in the response.
The array provides rich context for each event, such as `block_time`, `transaction_hash`, `from` and `to` addresses, `value`, `value_usd`, and more.

<Note>
  The [Activity API](/evm/activity) supports pagination via `offset` and `limit` query parameters. For a production wallet, you might implement infinite scrolling or "Load More" buttons to fetch subsequent pages of activity.
</Note>

## Add Activity into the Server Route

Next, modify the `app.get('/')` route handler, add a call to `getWalletActivity`, and include its results in the data passed to `res.render`.

```javascript server.js (app.get('/') updated for activity) {16, 18, 45}
app.get('/', async (req, res) => {
    const {
        walletAddress = '',
        tab = 'tokens'
    } = req.query;

    let tokens = [];
    let activities = [];
    let collectibles = [];
    let totalWalletUSDValue = 0;
    let errorMessage = null;

    if (walletAddress) {
        try {

            [tokens, activities] = await Promise.all([\
                getWalletBalances(walletAddress),\
                getWalletActivity(walletAddress, 25) // Fetching 25 recent activities\
            ]);

            // Calculate the total USD value from the fetched tokens
            if (tokens && tokens.length > 0) {
                tokens.forEach(token => {
                    let individualValue = parseFloat(token.value_usd);
                    if (!isNaN(individualValue)) {
                        totalWalletUSDValue += individualValue;
                    }
                });
            }

            totalWalletUSDValue = numbro(totalWalletUSDValue).format('$0,0.00');

        } catch (error) {
            console.error("Error in route handler:", error);
            errorMessage = "Failed to fetch wallet data. Please try again.";
            // tokens will remain empty, totalWalletUSDValue will be 0
        }
    }

    res.render('wallet', {
        walletAddress: walletAddress,
        currentTab: tab,
        totalWalletUSDValue: totalWalletUSDValue, // We'll calculate this in the next section
        tokens: tokens,
        activities: activities, // Placeholder for Guide 2
        collectibles: [], // Placeholder for Guide 3
        errorMessage: errorMessage
    });
});
```

Our updated `app.get('/')` route handler now handles fetching of both token balances and wallet activity.
Both the `tokens` and the newly fetched `activities` arrays are then passed to the `res.render` method.
This makes the complete dataset available to our `wallet.ejs` template, enabling it to populate both the "Tokens" and "Activity" tabs with relevant, realtime onchain information.

## Show Activity in the Frontend

The final step is to update our `views/wallet.ejs` template to render the fetched activity data within the "Activity" tab.

CTRL+F for `id="activity"` and locate the section for the *Activity* tab.
It currently contains a placeholder paragraph.
Replace that entire `div` with the following EJS code:

```ejs views/wallet.ejs (Activity tab content) [expandable]
<!-- Activity Tab Pane (for Guide 2) -->
<div id="activity" class="tab-pane <%= currentTab === 'activity' ? 'active' : '' %>">
<% if (activities && activities.length > 0) { %>
    <% activities.forEach(activity => { %>
        <div class="list-item">
            <div class="item-icon-placeholder">
                <% if (activity.type === 'receive') { %>
                    ↓
                <% } else if (activity.type === 'send') { %>
                    ↑
                <% } else if (activity.type === 'call') { %>
                    ⇆ <!-- Icon for contract call -->
                <% } else { %>
                    ✓ <!-- Generic icon for other types -->
                <% } %>
            </div>
            <div class="item-info">
                <%
                    let activityTitle = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
                    let activityColorClass = activity.type; // Used for potential CSS styling

                    if (activity.type === 'call' && activity.function && activity.function.name) {
                        activityTitle = `Call: ${activity.function.name}`;
                        activityColorClass = 'call';
                    } else if (activity.type === 'receive' || activity.type === 'send') {
                        const tokenSymbol = activity.token_metadata?.symbol ||
                                            (activity.asset_type === 'native' ?
                                                (activity.chain_id === 1 || activity.chain_id === 8453 || activity.chain_id === 10 ? 'ETH' : 'Native') :
                                                'Token');
                        activityTitle = `${activity.type === 'receive' ? 'Received' : 'Sent'} ${tokenSymbol}`;
                    }
                %>
                <p class="item-name activity-direction <%= activityColorClass %>"><%= activityTitle %></p>

                <p class="activity-address">
                    <%
                        let partyLabel = '', partyAddress = '';
                        if (activity.type === 'receive') {
                            partyLabel = 'From';
                            partyAddress = activity.from;
                        } else if (activity.type === 'send') {
                            partyLabel = 'To';
                            partyAddress = activity.to;
                        } else if (activity.type === 'call') {
                            partyLabel = 'Contract';
                            partyAddress = activity.to;
                        } else {
                            partyLabel = 'With';
                            partyAddress = activity.to || activity.from || 'Unknown';
                        }
                    %>

                    <% if (partyAddress && partyAddress !== 'Unknown') { %>
                        <%= partyLabel %>
                        <span class="mono">
                            <%= partyAddress.substring(0, 6) %>...<%= partyAddress.substring(partyAddress.length - 4) %>
                        </span>
                    <% } else { %>
                        Interaction
                    <% } %>
                </p>

                <p class="activity-timestamp">
                    <span class="mono"><%= new Date(activity.block_time).toLocaleDateString(); %></span>
                </p>
            </div>
            <div class="item-value-right">
                <% if (activity.type === 'call') { %>
                    <p class="activity-amount-right <%= activityColorClass %>" style="font-family: var(--font-primary);">
                        Interaction
                    </p>
                <% } else if (activity.value) { %>
                    <p class="activity-amount-right <%= activityColorClass %>">
                        <%
                        let amountDisplay = '0';
                        const decimals = typeof activity.token_metadata?.decimals === 'number' ? activity.token_metadata.decimals : 18;
                        if (decimals !== null) {
                            const valueStr = activity.value.toString();
                            const padded = valueStr.padStart(decimals + 1, '0');
                            let intPart = padded.slice(0, -decimals);
                            let fracPart = padded.slice(-decimals).replace(/0+$/, '');
                            if (!intPart) intPart = '0';
                            if (fracPart) {
                                amountDisplay = `${intPart}.${fracPart}`;
                            } else {
                                amountDisplay = intPart;
                            }
                            const amountNum = parseFloat(amountDisplay);
                            if (amountNum > 0 && amountNum < 0.0001) {
                                amountDisplay = '<0.0001';
                            }
                            if (amountNum > 1e12 || amountDisplay.length > 12) {
                                amountDisplay = amountNum.toExponential(2);
                            }
                        } else {
                            amountDisplay = activity.id || String(activity.value);
                        }
                        // Clean up the symbol: remove $ and anything after space/dash/bracket, and limit length
                        let symbol = activity.token_metadata?.symbol || (activity.asset_type === 'native'
                            ? (activity.chain_id === 1 || activity.chain_id === 8453 || activity.chain_id === 10 ? 'ETH' : 'NTV')
                            : (activity.id ? '' : 'Tokens'));
                        if (symbol) {
                            symbol = symbol.replace('$', '').split(/[\s\-\[]/)[0].substring(0, 8);\
                        }\
                        %>\
                        <% if (activity.type === 'receive') { %>+<% } else if (activity.type === 'send') { %>-<% } %><%= amountDisplay %> <span class="mono"><%= symbol %></span>\
                    </p>\
                <% } %>\
            </div>\
        </div>\
    <% }); %>\
<% } else if (walletAddress) { %>\
    <p style="text-align: center; padding-top: 30px; color: var(--color-text-muted);">No activity found for this wallet.</p>\
<% } else { %>\
    <p style="text-align: center; padding-top: 30px; color: var(--color-text-muted);">Enter a wallet address to see activity.</p>\
<% } %>\
</div>\
```\
\
This EJS transforms the raw data from the Activity API into an intuitive and visual transaction history.\
Here's a breakdown of how it processes each activity item:\
\
* A **list entry** is generated for each transaction.\
* An **icon** visually indicates the transaction's nature: receive (↓), send (↑), or contract call (⇆).\
* A **descriptive title** is dynamically constructed using the `activity.type` (and `activity.function.name` for contract calls).\
* The transaction's **timestamp** (`block_time`) is converted to a readable local date/time string.\
* The **chain ID** (`chain_id`) is displayed, providing important multichain context.\
\
Beyond these descriptive elements, the template also focuses on presenting the value and financial aspects of each transaction:\
\
* The **transaction amount** (raw `value`) is converted into a user-friendly decimal format (e.g., "1.5 ETH"). This conversion utilizes the `decimals` property from `token_metadata`.\
* For **NFTs**, if a standard decimal value isn't applicable, the template displays the `token_id`.\
* The **USD value** (`value_usd`), if provided by the API, is formatted to two decimal places and shown, giving a sense of the transaction's monetary worth.\
\
***\
\
Restart your server by running `node server.js` and refresh the app in the browser.\
When you click on the *Activity* tab, you should now see a list of the latest transactions, similar to the screenshot at the beginning of this guide.\
\
## Conclusion\
\
You successfully added a realtime, fully functional activity feed to your multichain wallet with a single API request.\
In the next and final guide of this series, [Display NFTs & Collectibles](/evm/show-nfts-collectibles), we will complete the wallet by adding support for viewing NFT collections.\
\
# Balances\
Source: https://docs.sim.dune.com/evm/balances\
\
evm/openapi/balances.json get /v1/evm/balances/{uri}\
Access realtime token balances. Get comprehensive details about native and ERC20 tokens, including token metadata and USD valuations.\
\
export const SupportedChains = ({endpoint}) => {\
  const dataState = useState(null);\
  const data = dataState[0];\
  const setData = dataState[1];\
  useEffect(function () {\
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {\
      method: "GET"\
    }).then(function (response) {\
      return response.json();\
    }).then(function (responseData) {\
      setData(responseData);\
    });\
  }, []);\
  if (data === null) {\
    return <div>Loading chain information...</div>;\
  }\
  if (!data.chains) {\
    return <div>No chain data available</div>;\
  }\
  var supportedChains = [];\
  var totalChains = data.chains.length;\
  if (endpoint !== undefined) {\
    for (var i = 0; i < data.chains.length; i++) {\
      var chain = data.chains[i];\
      if (chain[endpoint] && chain[endpoint].supported) {\
        supportedChains.push(chain);\
      }\
    }\
  } else {\
    supportedChains = data.chains;\
  }\
  var count = supportedChains.length;\
  var endpointName = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1).replace(/_/g, " ") : "All";\
  var accordionTitle = "Supported Chains (" + count + ")";\
  return <Accordion title={accordionTitle}>\
      <table>\
        <thead>\
          <tr>\
            <th>name</th>\
            <th>chain_id</th>\
            <th>tags</th>\
          </tr>\
        </thead>\
        <tbody>\
          {supportedChains.map(function (chain) {\
    return <tr key={chain.name}>\
                <td><code>{chain.name}</code></td>\
                <td><code>{chain.chain_id}</code></td>\
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>\
              </tr>;\
  })}\
        </tbody>\
      </table>\
    </Accordion>;\
};\
\
![Balance Sv](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/balance.svg)\
\
The Token Balances API provides accurate and fast real time balances of the native and ERC20 tokens of accounts on supported EVM blockchains.\
\
<Note>\
  The Balances API only returns balances for certain low latency chains by default.\
  To learn more see the tags section of the [Supported Chains](/evm/supported-chains#tags) page.\
</Note>\
\
<SupportedChains endpoint="balances" />\
\
## Token Prices\
\
Sim looks up prices onchain. We use the most liquid onchain pair to determine a USD price. We return the available liquidity in `pool_size` as part of the response, and show a warning `low_liquidity:	true` if this value is less than \$10k.\
\
## Historical prices\
\
You can request 24 hour point-in-time prices by adding the `historical_prices` query parameter. Use whole numbers only, from 1 to 24. You can request up to three offsets. For example, `&historical_prices=24` returns the price 24 hours ago. `&historical_prices=1,6,24` returns prices 1 hour ago, 6 hours ago, and 24 hours ago.\
\
<Note>\
  The `historical_prices` parameter is currently supported only on the EVM Balances and EVM Token Info endpoints.\
</Note>\
\
When set, each balance includes a `historical_prices` array with one entry per offset:\
\
```json\
{\
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
]\
}\
```\
\
**Percent changes are not returned**. You can compute your own differences using the `price_usd` on the balance and the values in `historical_prices[].price_usd`.\
\
<Warning>\
  The maximum number of historical price offsets is 3. Only whole numbers 1–24 are accepted. If more than 3 are provided, the API returns an error.\
</Warning>\
\
## Token Filtering\
\
We also include the `pool_size` field in all responses, allowing you to implement custom filtering logic based on your specific requirements. For a detailed explanation of our approach, see our [Token Filtering](/token-filtering) guide.\
\
## Pagination\
\
This endpoint is using cursor based pagination. You can use the `limit` query parameter to define the maximum page size.\
Results might at times be less than the maximum page size.\
The `next_offset` value is passed back by the initial response and can be used to fetch the next page of results, by passing it as the `offset` query parameter in the next request.\
\
<Warning>\
  You can only use the value from `next_offset` to set the `offset` query parameter of the next page of results.\
</Warning>\
\
# Build a Realtime Chat Agent\
Source: https://docs.sim.dune.com/evm/build-a-realtime-chat-agent\
\
Create an AI-powered chat app that can answer questions about blockchain data using Dune's Sim APIs and OpenAI's function calling feature.\
\
<Frame caption="The Simchat interface we'll build - a conversational assistant for blockchain data">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/simchat/simchat-final.png" className="mx-auto" style={{ width:"100%" }} alt="Simchat Demo Interface" />\
</Frame>\
\
In this guide, you'll learn how to build **Simchat**, an AI chat agent that can provide realtime blockchain insights through natural conversation.\
Users can ask questions about wallet balances, transaction history, NFT collections, and token information across 60+ EVM chains and Solana, and the agent will fetch and explain the data in a friendly way.\
\
By combining OpenAI's LLMs with the realtime blockchain data provided by Sim APIs, you'll create a chat agent that makes onchain data accessible to everyone, regardless of their technical expertise.\
\
<Columns cols={2}>\
  <Card title="View Source Code" icon="github" href="https://github.com/duneanalytics/sim-guides/tree/main/simchat" horizontal>\
    Access the complete source code for Simchat on GitHub\
  </Card>\
\
  <Card title="Try Live Demo" icon="globe" href="https://simchat-psi.vercel.app/" horizontal>\
    Chat with the finished assistant\
  </Card>\
</Columns>\
\
## Prerequisites\
\
Before we begin, ensure you have:\
\
* Node.js >= 18.0.0\
* A [Sim API key](/#authentication)\
* An [OpenAI API key](https://platform.openai.com/docs/api-reference/introduction)\
\
<Card title="Get your Sim API Key" icon="key" horizontal href="/#authentication">\
  Learn how to obtain your Sim API key\
</Card>\
\
## Features\
\
When you complete this guide, your chat agent will have these capabilities:\
\
<Columns cols={3}>\
  <Card title="OpenAI Function Calling">\
    Automatically triggers API requests based on user queries using OpenAI's function calling feature\
  </Card>\
\
  <Card title="Multichain Token Balances">\
    Retrieves native and ERC20/SPL token balances with USD values for any wallet address across EVM chains and Solana\
  </Card>\
\
  <Card title="Transaction History">\
    Displays chronological wallet activity including transfers and contract interactions on EVM networks\
  </Card>\
\
  <Card title="NFT Collection Data">\
    Shows ERC721 and ERC1155 collectibles owned by wallet addresses across supported EVM chains\
  </Card>\
\
  <Card title="Token Metadata">\
    Provides detailed token information, pricing, and holder distributions for EVM and Solana tokens\
  </Card>\
\
  <Card title="Chat Interface">\
    Users ask questions in plain English about blockchain data, no technical knowledge required\
  </Card>\
</Columns>\
\
## Try the Live Demo\
\
Before diving into building, you can interact with the live chat agent app below.\
Try these example questions:\
\
* What tokens does vitalik.eth have?\
* Show me the NFTs in wallet `0xd8da6bf26964af9d7eed9e03e53415d37aa96045`\
* What's the price of USDC?\
* Get token balances for `DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK` on Solana\
\
<iframe src="https://simchat-psi.vercel.app/" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" style={{ height: "800px" }} title="Live Wallet Demo" frameBorder="0" allow="clipboard-write; encrypted-media" allowFullScreen />\
\
## Project Setup\
\
Let's start by creating the project structure and installing dependencies.\
\
<Steps>\
  <Step title="Create Project Directory">\
    Open your terminal and create a new directory:\
\
    ```bash\
    mkdir simchat\
    cd simchat\
    ```\
\
    Initialize a new Node.js project:\
\
    ```bash\
    npm init -y\
    npm pkg set type="module"\
    ```\
  </Step>\
\
  <Step title="Install Dependencies">\
    Install the required packages:\
\
    ```bash\
    npm install express openai dotenv\
    ```\
\
    These packages provide:\
\
    * **express**: Web server framework\
    * **openai**: Official OpenAI client library\
    * **dotenv**: Environment variable management\
  </Step>\
\
  <Step title="Configure Environment Variables">\
    Create a `.env` file in your project root:\
\
    ```bash\
    touch .env\
    ```\
\
    Add your API keys:\
\
    ```plaintext .env\
    # Required API keys\
    OPENAI_API_KEY=your_openai_api_key_here\
    SIM_API_KEY=your_sim_api_key_here\
    ```\
\
    <Warning>\
      Never commit your `.env` file to version control. Add it to `.gitignore` to keep your API keys secure.\
    </Warning>\
  </Step>\
\
  <Step title="Add Starter Code">\
    Create the main app files:\
\
    ```bash\
    touch server.js\
    touch chat.html\
    ```\
\
    The `server.js` file will handle our backend Express server and API logic, while `chat.html` contains our frontend chat interface.\
\
    Populate the `server.js` with this basic Express code:\
\
    ```javascript [expandable]\
    import express from 'express';\
    import { OpenAI } from 'openai';\
    import path from 'path';\
    import { fileURLToPath } from 'url';\
    import dotenv from 'dotenv';\
\
    dotenv.config();\
\
    // Set up __dirname for ES modules\
    const __filename = fileURLToPath(import.meta.url);\
    const __dirname = path.dirname(__filename);\
\
    // Initialize Express\
    const app = express();\
    app.use(express.json());\
\
    // Initialize OpenAI client\
    const openai = new OpenAI({\
        apiKey: process.env.OPENAI_API_KEY\
    });\
\
    // Sim API key\
    const SIM_API_KEY = process.env.SIM_API_KEY;\
\
    // Serve the HTML file\
    app.get('/', (req, res) => {\
        res.sendFile(path.join(__dirname, 'chat.html'));\
    });\
\
    // Start server\
    const PORT = process.env.PORT || 3001;\
    app.listen(PORT, () => {\
        console.log(`Server running on http://localhost:${PORT}`);\
    });\
    ```\
\
    Add the initial frontend template to `chat.html`:\
\
    ```html [expandable]\
    <!DOCTYPE html>\
    <html lang="en">\
    <head>\
        <meta charset="UTF-8">\
        <meta name="viewport" content="width=device-width, initial-scale=1.0">\
        <title>Sim APIs Chat</title>\
        <style>\
            :root {\
                --font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\
                --color-bg-deep: #e0e0e0; /* Light gray page background */\
                --color-text-primary: #333333;\
                --color-text-secondary: #555555;\
                --color-bg-container: #ffffff;\
                --color-user-message-bg: #222222; /* Black for user messages */\
                --color-user-message-text: #ffffff;\
                --color-system-message-bg: #f1f1f1; /* Light gray for system messages */\
                --color-system-message-text: #333333;\
                --color-input-border: #dddddd;\
                --color-send-button-bg: #8a8a8a;\
                --color-send-button-icon: #ffffff;\
                --color-plus-button-border: #e0e0e0;\
                --color-plus-button-text: #555555;\
                --border-radius-bubble: 18px;\
                --border-radius-container: 20px;\
                --border-radius-input: 10px;\
            }\
\
            body {\
                font-family: var(--font-primary);\
                background-color: var(--color-bg-deep);\
                color: var(--color-text-secondary);\
                margin: 0;\
                padding: 0;\
                display: flex;\
                justify-content: center;\
                align-items: center;\
                min-height: 100vh;\
                padding-top: 0;\
                padding-bottom: 0;\
                height: 100vh;\
                box-sizing: border-box;\
            }\
\
            .mobile-container {\
                width: 100%;\
                max-width: 420px;\
                height: 90vh;\
                max-height: 800px;\
                min-height: 600px;\
                background-color: var(--color-bg-container);\
                border-radius: var(--border-radius-container);\
                display: flex;\
                flex-direction: column;\
                overflow: hidden;\
                align-self: center;\
                box-shadow: 0 8px 32px rgba(20, 24, 41, 0.18), 0 1.5px 6px rgba(20, 24, 41, 0.10);\
            }\
\
            .chat-header {\
                display: flex;\
                align-items: center;\
                justify-content: space-between;\
                padding: 15px 20px;\
                border-bottom: 1px solid var(--color-input-border);\
                background-color: var(--color-bg-container); /* Ensure it's on top */\
                z-index: 10;\
            }\
\
            .avatar-info {\
                display: flex;\
                align-items: center;\
            }\
\
            .avatar {\
                width: 40px;\
                height: 40px;\
                border-radius: 50%;\
                margin-right: 12px;\
                object-fit: cover;\
            }\
\
            .user-details {\
                display: flex;\
                flex-direction: column;\
            }\
\
            .user-name {\
                font-weight: bold;\
                color: var(--color-text-primary);\
                font-size: 1rem;\
            }\
\
            .user-email {\
                font-size: 0.8rem;\
                color: var(--color-text-secondary);\
            }\
\
            .add-button {\
                width: 36px;\
                height: 36px;\
                border-radius: 50%;\
                border: 1px solid var(--color-plus-button-border);\
                background-color: var(--color-bg-container);\
                color: var(--color-plus-button-text);\
                font-size: 1.5rem;\
                line-height: 1;\
                display: flex;\
                justify-content: center;\
                align-items: center;\
                cursor: pointer;\
            }\
            .add-button:hover {\
                background-color: #f9f9f9;\
            }\
\
            .chat-messages {\
                flex-grow: 1;\
                padding: 20px;\
                overflow-y: auto;\
                display: flex;\
                flex-direction: column;\
                gap: 10px;\
            }\
\
            .message {\
                padding: 10px 15px;\
                border-radius: var(--border-radius-bubble);\
                max-width: 75%;\
                line-height: 1.4;\
                word-wrap: break-word;\
            }\
\
            .user-message {\
                background-color: var(--color-user-message-bg);\
                color: var(--color-user-message-text);\
                align-self: flex-end;\
                border-bottom-right-radius: 5px; /* To match the image's style */\
            }\
\
            .system-message {\
                background-color: var(--color-system-message-bg);\
                color: var(--color-system-message-text);\
                align-self: flex-start;\
                border-bottom-left-radius: 5px; /* To match the image's style */\
            }\
\
            .loading-dots {\
                display: flex;\
                align-items: center;\
            }\
\
            .loading-dots span {\
                width: 8px;\
                height: 8px;\
                margin: 0 2px;\
                background-color: var(--color-system-message-text);\
                opacity: 0.6;\
                border-radius: 50%;\
                animation: bounce 1.4s infinite ease-in-out both;\
            }\
\
            .loading-dots span:nth-child(1) { animation-delay: -0.32s; }\
            .loading-dots span:nth-child(2) { animation-delay: -0.16s; }\
\
            @keyframes bounce {\
                0%, 80%, 100% { transform: scale(0); }\
                40% { transform: scale(1.0); }\
            }\
\
            .chat-input-area {\
                display: flex;\
                padding: 15px 20px;\
                border-top: 1px solid var(--color-input-border);\
                background-color: var(--color-bg-container); /* Ensure it's on top */\
                gap: 10px;\
            }\
\
            #messageInput {\
                flex-grow: 1;\
                padding: 10px 15px;\
                border: 1px solid var(--color-input-border);\
                border-radius: var(--border-radius-input);\
                font-size: 0.9rem;\
                outline: none;\
            }\
            #messageInput:focus {\
                border-color: #a0a0a0;\
            }\
\
            #sendButton {\
                background-color: var(--color-send-button-bg);\
                color: var(--color-send-button-icon);\
                border: none;\
                width: 45px;\
                height: 45px;\
                border-radius: var(--border-radius-input);\
                font-size: 1.5rem; /* Larger for the icon */\
                cursor: pointer;\
                display: flex;\
                justify-content: center;\
                align-items: center;\
            }\
            #sendButton:hover {\
                background-color: #757575;\
            }\
\
            #sendButton:disabled {\
                background-color: #cccccc;\
                cursor: not-allowed;\
            }\
\
            .error-message {\
                background-color: #ffebee;\
                color: #c62828;\
                border: 1px solid #ffcdd2;\
                padding: 10px 15px;\
                border-radius: var(--border-radius-bubble);\
                align-self: flex-start;\
                max-width: 75%;\
            }\
        </style>\
    </head>\
    <body>\
        <div class="mobile-container">\
            <div class="chat-header">\
                <div class="avatar-info">\
                    <svg xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 0 95 40" fill="none"><path d="M19.9892 39.9686C31.0277 39.9686 39.9762 31.0213 39.9762 19.9843C39.9762 8.94728 31.0277 0 19.9892 0C8.95059 0 0.0020752 8.94728 0.0020752 19.9843C0.0020752 31.0213 8.95059 39.9686 19.9892 39.9686Z" fill="#F4603E"></path><path d="M3.47949 31.257C3.47949 31.257 16.6871 26.9308 39.9651 19.3408C39.9651 19.3408 41.2401 31.7705 28.3541 38.2539C28.3541 38.2539 21.9997 41.2994 15.0284 39.3458C15.0284 39.3458 8.08667 38.0355 3.47949 31.257Z" fill="#1E1870"></path><path d="M58.8644 30.006C57.2803 30.006 55.9338 29.7244 54.825 29.1611C53.7337 28.5979 52.792 27.8587 52 26.9434L54.3497 24.6729C54.9834 25.4121 55.6874 25.9754 56.4619 26.3626C57.2539 26.7498 58.1251 26.9434 59.0756 26.9434C60.1493 26.9434 60.9589 26.7146 61.5045 26.257C62.0502 25.7818 62.323 25.1481 62.323 24.3561C62.323 23.74 62.147 23.2384 61.795 22.8512C61.4429 22.464 60.7829 22.1823 59.8148 22.0063L58.0723 21.7423C54.3937 21.1615 52.5544 19.375 52.5544 16.3828C52.5544 15.5556 52.704 14.8075 53.0033 14.1387C53.3201 13.4699 53.7689 12.8978 54.3497 12.4226C54.9306 11.9474 55.6258 11.5865 56.4355 11.3401C57.2627 11.0761 58.1956 10.9441 59.234 10.9441C60.6245 10.9441 61.839 11.1729 62.8774 11.6305C63.9159 12.0882 64.8047 12.7658 65.544 13.6635L63.1678 15.9076C62.7102 15.3444 62.1558 14.8867 61.5045 14.5347C60.8533 14.1827 60.0349 14.0067 59.0492 14.0067C58.0459 14.0067 57.2891 14.2003 56.7787 14.5875C56.2858 14.9571 56.0394 15.4852 56.0394 16.1716C56.0394 16.8756 56.2418 17.3949 56.6467 17.7293C57.0515 18.0637 57.7027 18.3101 58.6004 18.4685L60.3165 18.7854C62.1822 19.1198 63.5551 19.7182 64.4351 20.5807C65.3328 21.4255 65.7816 22.6136 65.7816 24.1449C65.7816 25.0249 65.6232 25.8258 65.3064 26.5474C65.0071 27.2514 64.5583 27.8675 63.9599 28.3955C63.379 28.9059 62.6574 29.302 61.795 29.5836C60.9501 29.8652 59.9733 30.006 58.8644 30.006Z" fill="var(--color-text-primary)"></path><path d="M70.2257 13.9011C69.5217 13.9011 69.0112 13.7427 68.6944 13.4258C68.3952 13.109 68.2456 12.7042 68.2456 12.2114V11.6833C68.2456 11.1905 68.3952 10.7857 68.6944 10.4689C69.0112 10.1521 69.5217 9.99365 70.2257 9.99365C70.9121 9.99365 71.4138 10.1521 71.7306 10.4689C72.0474 10.7857 72.2058 11.1905 72.2058 11.6833V12.2114C72.2058 12.7042 72.0474 13.109 71.7306 13.4258C71.4138 13.7427 70.9121 13.9011 70.2257 13.9011ZM68.536 15.9076H71.9154V29.6892H68.536V15.9076Z" fill="var(--color-text-primary)"></path><path d="M75.3045 29.6892V15.9076H78.6839V18.2045H78.8159C79.0799 17.4829 79.5023 16.8668 80.0832 16.3564C80.664 15.846 81.4736 15.5908 82.5121 15.5908C83.4625 15.5908 84.281 15.8196 84.9674 16.2772C85.6539 16.7348 86.1643 17.4301 86.4987 18.3629H86.5515C86.7979 17.5885 87.282 16.9372 88.0036 16.4092C88.7428 15.8636 89.6669 15.5908 90.7758 15.5908C92.131 15.5908 93.1695 16.0572 93.8911 16.9901C94.6304 17.9229 95 19.2518 95 20.9767V29.6892H91.6206V21.3199C91.6206 19.3486 90.8814 18.3629 89.4029 18.3629C89.0685 18.3629 88.7428 18.4157 88.426 18.5213C88.1268 18.6093 87.854 18.7502 87.6076 18.9438C87.3788 19.1198 87.194 19.3486 87.0532 19.6302C86.9123 19.8942 86.8419 20.211 86.8419 20.5807V29.6892H83.4625V21.3199C83.4625 19.3486 82.7233 18.3629 81.2448 18.3629C80.928 18.3629 80.6112 18.4157 80.2944 18.5213C79.9951 18.6093 79.7223 18.7502 79.4759 18.9438C79.2471 19.1198 79.0535 19.3486 78.8951 19.6302C78.7543 19.8942 78.6839 20.211 78.6839 20.5807V29.6892H75.3045Z" fill="var(--color-text-primary)"></path></svg>\
                </div>\
                <button class="add-button" aria-label="Clear chat" onclick="clearChat()">\
                    <svg fill="#000000" width="32px" height="32px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M27.1 14.313V5.396L24.158 8.34c-2.33-2.325-5.033-3.503-8.11-3.503C9.902 4.837 4.901 9.847 4.899 16c.001 6.152 5.003 11.158 11.15 11.16 4.276 0 9.369-2.227 10.836-8.478l.028-.122h-3.23l-.022.068c-1.078 3.242-4.138 5.421-7.613 5.421a8 8 0 0 1-5.691-2.359A7.993 7.993 0 0 1 8 16.001c0-4.438 3.611-8.049 8.05-8.049 2.069 0 3.638.58 5.924 2.573l-3.792 3.789H27.1z"></path></svg>\
                </button>\
            </div>\
\
            <div class="chat-messages" id="chatMessages">\
                <!-- Messages will be added here by JavaScript -->\
            </div>\
\
            <div class="chat-input-area">\
                <input type="text" id="messageInput" placeholder="Ask about wallet balances, transactions, NFTs, or token info...">\
                <button id="sendButton" aria-label="Send message">➤</button>\
            </div>\
        </div>\
\
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>\
        <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>\
        <script>\
            const chatMessagesContainer = document.getElementById('chatMessages');\
            const messageInput = document.getElementById('messageInput');\
            const sendButton = document.getElementById('sendButton');\
\
            function addMessage(text, sender, isHtml = false) {\
                const messageElement = document.createElement('div');\
                messageElement.classList.add('message');\
                messageElement.classList.add(sender === 'user' ? 'user-message' : 'system-message');\
\
                if (isHtml) {\
                    messageElement.innerHTML = text;\
                } else if (sender === 'system') {\
                    // Parse markdown for system messages\
                    const html = marked.parse(text);\
                    messageElement.innerHTML = DOMPurify.sanitize(html);\
                } else {\
                    messageElement.textContent = text;\
                }\
\
                chatMessagesContainer.appendChild(messageElement);\
                scrollToBottom();\
                return messageElement;\
            }\
\
            function scrollToBottom() {\
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;\
            }\
\
            function showLoadingIndicator() {\
                const loadingHtml = `\
                    <div class="loading-dots">\
                        <span></span>\
                        <span></span>\
                        <span></span>\
                    </div>\
                `;\
                return addMessage(loadingHtml, 'system', true);\
            }\
\
            function clearChat() {\
                chatMessagesContainer.innerHTML = '';\
                loadInitialMessages();\
            }\
\
            async function sendMessage() {\
                const messageText = messageInput.value.trim();\
                if (messageText === '') return;\
\
                // Disable input during processing\
                messageInput.disabled = true;\
                sendButton.disabled = true;\
\
                // Add user message\
                addMessage(messageText, 'user');\
                messageInput.value = '';\
\
                // Show loading indicator\
                const loadingElement = showLoadingIndicator();\
\
                try {\
                    // Send to server\
                    const response = await fetch('/chat', {\
                        method: 'POST',\
                        headers: {\
                            'Content-Type': 'application/json',\
                        },\
                        body: JSON.stringify({ message: messageText })\
                    });\
\
                    // Remove loading indicator\
                    chatMessagesContainer.removeChild(loadingElement);\
\
                    if (!response.ok) {\
                        const errorData = await response.json();\
                        throw new Error(errorData.error || 'Server error');\
                    }\
\
                    const data = await response.json();\
\
                    // Display assistant response\
                    if (data.message) {\
                        addMessage(data.message, 'system');\
                    }\
\
        } catch (error) {\
                    if (loadingElement.parentNode) {\
                        chatMessagesContainer.removeChild(loadingElement);\
                    }\
\
                    console.error('Error:', error);\
                    addMessage(`Error: ${error.message}`, 'error');\
                } finally {\
                    messageInput.disabled = false;\
                    sendButton.disabled = false;\
                    messageInput.focus();\
                }\
            }\
\
            // Event listeners\
            sendButton.addEventListener('click', sendMessage);\
            messageInput.addEventListener('keypress', function(event) {\
                if (event.key === 'Enter' && !messageInput.disabled) {\
                    sendMessage();\
                }\
            });\
\
            // Initial welcome messages\
            function loadInitialMessages() {\
                addMessage("Hi! I'm your Sim APIs assistant. I can help you explore blockchain data across 60+ EVM chains and Solana.", "system");\
\
                setTimeout(() => {\
                    addMessage("Try asking me about:\n\n- Token balances for any wallet\n- Transaction history\n- NFT collections\n- Token information and pricing\n- Solana token data", "system");\
                }, 500);\
            }\
\
            // Load initial messages on page load\
            document.addEventListener('DOMContentLoaded', loadInitialMessages);\
        </script>\
    </body>\
    </html>\
    ```\
  </Step>\
\
  <Step title="Verify Project Structure">\
    Your project structure should now look like:\
\
    ```\
    simchat/\
    ├── server.js          # Express server with OpenAI integration\
    ├── chat.html          # Chat interface\
    ├── package.json       # Project configuration\
    ├── .env               # API keys (keep private)\
    └── node_modules/      # Dependencies\
    ```\
  </Step>\
</Steps>\
\
Run `node server.js` in the terminal to start the server.\
Visit `http://localhost:3001` to see the newly scaffolded chat app.\
\
<Frame caption="Our newly created chat front-end UI is ready.">\
  ![](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/simchat/simchat-app-blank.png)\
</Frame>\
\
If you try to send a message at this point, you'll get a server error since we haven't implemented the back-end functionality yet.\
\
<Warning>\
  If you encounter errors, make sure your `.env` file contains the correct `OPENAI_API_KEY` and `SIM_API_KEY`.\
  Check your terminal for any error messages from `server.js`.\
</Warning>\
\
## Add OpenAI LLM Chat\
\
Now let's add the core chat functionality to our Express server using OpenAI's GPT-4o-mini.\
We'll start by defining a system prompt that instructs the LLM on its role and capabilities.\
\
Add this `SYSTEM_PROMPT` variable to your `server.js` file:\
\
```javascript (server.js)\
// System prompt that instructs the AI assistant\
const SYSTEM_PROMPT = `You are a helpful assistant that can answer questions about blockchain data using Dune's Sim APIs. You have access to various functions that can fetch realtime blockchain data including:\
\
- Token balances for wallets across 60+ EVM chains\
- Transaction activity and history\
- NFT collections and collectibles\
- Token metadata and pricing information\
- Token holder distributions\
- Supported blockchain networks\
\
When users ask about blockchain data, wallet information, token details, or transaction history, use the appropriate functions to fetch realtime data. Always provide clear, helpful explanations of the data you retrieve.\
\
Keep your responses concise and focused. When presenting large datasets, summarize the key findings rather than listing every detail.`;\
```\
\
This system prompt sets the context for the LLM, explaining its capabilities and how it should behave when interacting with users.\
\
Now let's implement the basic chat endpoint with Express.js that uses this system prompt.\
The `/chat` endpoint will receive POST requests from our frontend chat interface, process them through the LLM, and return responses to display in the chat:\
\
```javascript\
// Basic chat endpoint\
app.post('/chat', async (req, res) => {\
    try {\
        const { message } = req.body;\
        if (!message) return res.status(400).json({ error: 'Message is required' });\
\
        // Create conversation with system prompt\
        const messages = [\
            { role: "system", content: SYSTEM_PROMPT },\
            { role: "user", content: message }\
        ];\
\
        // Call OpenAI\
        const response = await openai.chat.completions.create({\
            model: "gpt-4o-mini",\
            messages: messages,\
            max_tokens: 2048\
        });\
\
        const assistantMessage = response.choices[0].message.content;\
\
        res.json({\
            message: assistantMessage\
        });\
\
    } catch (error) {\
        console.error('Chat error:', error);\
        res.status(500).json({\
            error: 'An error occurred while processing your request',\
            details: error.message\
        });\
    }\
});\
```\
\
Run `node server.js` again and visit `http://localhost:3001`.\
You'll have a working chat interface powered by OpenAI's `gpt-4o-mini` model with a custom system prompt, but it won't be able to fetch realtime blockchain data yet.\
\
<Frame caption="The chat is now working with OpenAI responses, but not yet fetching blockchain data">\
  ![](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/simchat/simchat-with-llm-responses.png)\
</Frame>\
\
## Define OpenAI Functions\
\
To make our chatbot fetch realtime blockchain data, we need to use OpenAI's [function calling](https://platform.openai.com/docs/guides/function-calling?api-mode=responses) feature.\
When the model determines it needs external data, it will call one of these functions with appropriate parameters, and we can then execute the actual API call and provide the results back to the model.\
\
Add this `functions` array to your `server.js` file:\
\
```javascript [expandable]\
// Function definitions for OpenAI function calling\
const functions = [\
    {\
        type: "function",\
        function: {\
            name: "get_token_balances",\
            description: "Get realtime token balances for an EVM wallet address across multiple chains. Returns native and ERC20 token balances with USD values.",\
            parameters: {\
                type: "object",\
                properties: {\
                    address: {\
                        type: "string",\
                        description: "The wallet address to get balances for (e.g., 0xd8da6bf26964af9d7eed9e03e53415d37aa96045)"\
                    },\
                        description: "Whether to exclude spam tokens from results",\
                        default: true\
                    }\
                },\
                required: ["address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_wallet_activity",\
            description: "Get chronologically ordered transaction activity for an EVM wallet including transfers, contract interactions, and decoded function calls.",\
            parameters: {\
                type: "object",\
                properties: {\
                    address: {\
                        type: "string",\
                        description: "The wallet address to get activity for"\
                    },\
                    limit: {\
                        type: "number",\
                        description: "Maximum number of activities to return (default: 25)",\
                        default: 25\
                    }\
                },\
                required: ["address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_nft_collectibles",\
            description: "Get NFT collectibles (ERC721 and ERC1155) owned by an EVM wallet address.",\
            parameters: {\
                type: "object",\
                properties: {\
                    address: {\
                        type: "string",\
                        description: "The wallet address to get NFTs for"\
                    },\
                    limit: {\
                        type: "number",\
                        description: "Maximum number of collectibles to return (default: 50)",\
                        default: 50\
                    }\
                },\
                required: ["address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_token_info",\
            description: "Get detailed metadata and pricing information for a specific token on EVM chains.",\
            parameters: {\
                type: "object",\
                properties: {\
                    token_address: {\
                        type: "string",\
                        description: "The token contract address or 'native' for native tokens"\
                    },\
                    chain_ids: {\
                        type: "string",\
                        description: "Chain IDs to search on (e.g., '1,137,8453' or 'all')",\
                        default: "all"\
                    }\
                },\
                required: ["token_address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_token_holders",\
            description: "Get token holders for a specific ERC20 or ERC721 token, ranked by wallet value.",\
            parameters: {\
                type: "object",\
                properties: {\
                    chain_id: {\
                        type: "number",\
                        description: "The chain ID where the token exists (e.g., 1 for Ethereum)"\
                    },\
                    token_address: {\
                        type: "string",\
                        description: "The token contract address"\
                    },\
                    limit: {\
                        type: "number",\
                        description: "Maximum number of holders to return (default: 100)",\
                        default: 100\
                    }\
                },\
                required: ["chain_id", "token_address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_transactions",\
            description: "Get detailed transaction information for an EVM wallet address.",\
            parameters: {\
                type: "object",\
                properties: {\
                    address: {\
                        type: "string",\
                        description: "The wallet address to get transactions for"\
                    },\
                    limit: {\
                        type: "number",\
                        description: "Maximum number of transactions to return (default: 25)",\
                        default: 25\
                    }\
                },\
                required: ["address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_supported_chains",\
            description: "Get list of all supported EVM chains and their capabilities.",\
            parameters: {\
                type: "object",\
                properties: {},\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_svm_token_balances",\
            description: "Get token balances for a Solana (SVM) address. Returns native and SPL token balances with USD values.",\
            parameters: {\
                type: "object",\
                properties: {\
                    address: {\
                        type: "string",\
                        description: "The Solana wallet address to get balances for (e.g., DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK)"\
                    },\
                    limit: {\
                        type: "number",\
                        description: "Maximum number of balances to return (default: 100)",\
                        default: 100\
                    },\
                    chains: {\
                        type: "string",\
                        description: "Comma-separated list of chains to include",\
                        default: "all"\
                    }\
                },\
                required: ["address"],\
                additionalProperties: false\
            }\
        }\
    },\
    {\
        type: "function",\
        function: {\
            name: "get_svm_token_metadata",\
            description: "Get metadata for a Solana token mint address.",\
            parameters: {\
                type: "object",\
                properties: {\
                    mint: {\
                        type: "string",\
                        description: "The Solana token mint address (e.g., So11111111111111111111111111111111111111112)"\
                    }\
                },\
                required: ["mint"],\
                additionalProperties: false\
            }\
        }\
    }\
];\
```\
\
Each function corresponds to a different Sim API endpoint that we'll implement next.\
\
## Integrate Sim APIs\
\
Now we need to connect OpenAI's function calls to actual Sim API requests. When the model calls a function like `get_token_balances`, we need to:\
\
1. Map that OpenAI function call to the correct Sim API endpoint\
2. Make the HTTP request with proper authentication\
3. Return the data back to the model\
\
We'll implement this with three components: a generic API caller, endpoint configurations, and an execution function that ties them together.\
\
### Build the Generic API Caller\
\
First, let's create a reusable function that handles all HTTP requests to Sim APIs:\
\
```javascript\
// Generic API call function for Sim APIs\
async function apiCall(endpoint, params = {}) {\
    try {\
        const queryString = Object.keys(params).length\
            ? '?' + new URLSearchParams(params).toString()\
            : '';\
\
        const response = await fetch(`https://api.sim.dune.com${endpoint}${queryString}`, {\
            headers: {\
                'X-Sim-Api-Key': SIM_API_KEY,\
                'Content-Type': 'application/json'\
            }\
        });\
\
        if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);\
        return await response.json();\
    } catch (error) {\
        return { error: error.message };\
    }\
}\
```\
\
This function handles all the common functionality needed for Sim API requests:\
\
* URL construction with query parameters\
* Authentication headers\
* Error handling\
* JSON parsing\
\
By centralizing this logic, we avoid code duplication and ensure consistent error handling across all API calls.\
\
### Configure API Endpoints\
\
Next, we'll create a more comprehensive configuration object that handles all the different parameter patterns used by Sim APIs:\
\
```javascript\
// API endpoint configurations\
const API_CONFIGS = {\
    get_token_balances: (address) => {\
        const queryParams = new URLSearchParams({ metadata: 'url,logo' });\
        return [`/v1/evm/balances/${address}`, queryParams];\
    },\
\
    get_wallet_activity: (address, limit = 25) =>\
        [`/v1/evm/activity/${address}`, { limit: Math.min(limit, 10) }],\
\
    get_nft_collectibles: (address, limit = 50) =>\
        [`/v1/evm/collectibles/${address}`, { limit: Math.min(limit, 10) }],\
\
    get_token_info: (token_address, chain_ids = 'all') =>\
        [`/v1/evm/token-info/${token_address}`, { chain_ids }],\
\
    get_token_holders: (chain_id, token_address, limit = 100) =>\
        [`/v1/evm/token-holders/${chain_id}/${token_address}`, { limit: Math.min(limit, 10) }],\
\
    get_transactions: (address, limit = 25) =>\
        [`/v1/evm/transactions/${address}`, { limit: Math.min(limit, 10) }],\
\
    get_supported_chains: () =>\
        ['/v1/evm/supported-chains', {}],\
\
    get_svm_token_balances: (address, limit = 100, chains = 'all') => {\
        const queryParams = new URLSearchParams();\
        if (chains) queryParams.append('chains', chains);\
        if (limit) queryParams.append('limit', Math.min(limit, 20));\
        return [`/beta/svm/balances/${address}`, queryParams];\
    },\
\
    get_svm_token_metadata: (mint) =>\
        [`/beta/svm/token-metadata/${mint}`, {}]\
};\
```\
\
This configuration handles all the different patterns of Sim APIs: simple objects for basic query parameters, `URLSearchParams` for complex query strings, multiple path parameters, and endpoints with no parameters.\
\
### Execute Function Calls\
\
Now we need an enhanced `callFunction` that can handle both regular objects and `URLSearchParams`:\
\
```javascript\
// Function to execute API calls based on function name\
async function callFunction(name, args) {\
    if (!API_CONFIGS[name]) return JSON.stringify({ error: `Unknown function: ${name}` });\
\
    const [endpoint, params] = API_CONFIGS[name](...Object.values(args));\
    const result = await apiCall(endpoint, params);\
    return JSON.stringify(result);\
}\
```\
\
This approach maintains the streamlined `API_CONFIGS` pattern while properly handling all the different parameter types and patterns used by the various Sim API endpoints.\
The `apiCall` function can handle both `URLSearchParams` objects (for complex queries) and regular objects (for simple query parameters).\
\
### Update the Chat Endpoint\
\
Finally, we need to update our chat endpoint to handle function calls.\
Replace your existing `/chat` endpoint with this version that includes function calling support:\
\
```javascript [expandable]\
// Enhanced chat endpoint with function calling\
app.post('/chat', async (req, res) => {\
    try {\
        const { message } = req.body;\
        if (!message) return res.status(400).json({ error: 'Message is required' });\
\
        // Create conversation with system prompt\
        const messages = [\
            { role: "system", content: SYSTEM_PROMPT },\
            { role: "user", content: message }\
        ];\
\
        // Call OpenAI with function definitions\
        const response = await openai.chat.completions.create({\
            model: "gpt-4o-mini",\
            messages: messages,\
            tools: functions,\
            tool_choice: "auto",\
            max_tokens: 2048\
        });\
\
        let assistantMessage = response.choices[0].message;\
\
        // Handle function calls if present\
        if (assistantMessage.tool_calls) {\
            messages.push(assistantMessage);\
\
            // Execute each function call\
            for (const toolCall of assistantMessage.tool_calls) {\
                const functionResult = await callFunction(\
                    toolCall.function.name,\
                    JSON.parse(toolCall.function.arguments)\
                );\
\
                messages.push({\
                    role: "tool",\
                    tool_call_id: toolCall.id,\
                    content: functionResult\
                });\
            }\
\
            // Get final response with function results\
            const finalResponse = await openai.chat.completions.create({\
                model: "gpt-4o-mini",\
                messages: messages,\
                tools: functions,\
                tool_choice: "auto",\
                max_tokens: 2048\
            });\
\
            assistantMessage = finalResponse.choices[0].message;\
        }\
\
        res.json({\
            message: assistantMessage.content,\
            function_calls: assistantMessage.tool_calls || []\
        });\
\
    } catch (error) {\
        console.error('Chat error:', error);\
        res.status(500).json({\
            error: 'An error occurred while processing your request',\
            details: error.message\
        });\
    }\
});\
```\
\
This enhanced endpoint now supports the full function calling workflow: it sends the user's message to OpenAI with the available functions, executes any function calls that the model makes, and then sends the function results back to get the final conversational response.\
\
Restart your server and test the function calling functionality. Try asking questions like *What tokens does vitalik.eth have?* and watch as your chat agent fetches realtime data from Sim APIs to provide accurate, up-to-date responses.\
\
## Conclusion\
\
You've successfully built a realtime chat agent that makes blockchain data accessible through natural conversation.\
By combining OpenAI's LLMs with Sim APIs' comprehensive blockchain data, you've created a tool that can instantly fetch and explain complex onchain information across 60+ EVM chains and Solana.\
\
This foundation provides everything you need to build your own specialized blockchain chat assistants.\
Consider extending it for specific use cases like:\
\
* **NFT Discovery Bot**: Integrate marketplace data, rarity rankings, and collection insights\
* **Portfolio Manager**: Include transaction categorization, P\&L tracking, and tax reporting features\
* **Trading Assistant**: Add price alerts, technical indicators, and market sentiment analysis\
\
<Note>\
  The [complete source code on GitHub](https://github.com/duneanalytics/sim-guides/tree/main/simchat) includes additional features like full session management and enhanced error handling that weren't covered in this guide\
  Explore the repository to see the additional features in action.\
</Note>\
\
# Build a Realtime Wallet\
Source: https://docs.sim.dune.com/evm/build-a-realtime-wallet\
\
Create a multichain wallet that displays realtime balances, transactions, and NFTs using Sim APIs and Express.js\
\
<Frame caption="The final UI we'll build together in this guide">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/apis/Tokens.webp" className="mx-auto" style={{ width:"100%" }} alt="" title="" />\
</Frame>\
\
This is the first guide in our series on building a realtime, multichain wallet using Sim APIs.\
In this one, we will lay the foundation for our wallet.\
You will set up a Node project with Express.js, fetch and display token balances from 60+ EVM chains using the Balances API, and calculate the wallet's total portfolio value in USD.\
\
<Columns cols={2}>\
  <Card title="View Source Code" icon="github" href="https://github.com/duneanalytics/sim-guides/tree/main/wallet-ui" horizontal>\
    Access the complete source code for this wallet on GitHub\
  </Card>\
\
  <Card title="Try Live Demo" icon="globe" href="https://sim-guides.vercel.app/?walletAddress=0x48D004a6C175dB331E99BeAf64423b3098357Ae7" horizontal>\
    Interact with the finished wallet app\
  </Card>\
</Columns>\
\
## Prerequisites\
\
Before we begin, make sure you have:\
\
* Node.js >= 18.0.0\
* A Sim API key\
\
<Card title="Get your API Key" icon="key" horizontal href="/#authentication">\
  Learn how to obtain your API key to properly authenticate requests.\
</Card>\
\
## Features\
\
By the end of this series, our wallet will have four main features:\
\
1. **Token Balances**: Realtime balance tracking with USD values using the [Balances API](/evm/balances).\
2. **Total Portfolio Value**: Aggregated USD value across all chains.\
3. **Wallet Activity**: Comprehensive transaction history showing transfers and contract interactions using the [Activity API](/evm/activity)\
4. **NFTs**: A display of owned NFTs using the [Collectibles API](/evm/collectibles)\
\
<Note>\
  In this first guide, we will focus on implementing the first two: **Token Balances** and **Total Portfolio Value**.\
</Note>\
\
## Try the Live Demo\
\
Before diving into building, you can interact with the finished wallet app below.\
Enter any Ethereum wallet address to explore its token balances, transaction history, and NFT collection across multiple chains.\
\
<iframe src="https://sim-guides.vercel.app/?walletAddress=0x48D004a6C175dB331E99BeAf64423b3098357Ae7" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" style={{ height: "800px" }} title="Live Wallet Demo" frameBorder="0" allow="clipboard-write; encrypted-media" allowFullScreen />\
\
## Project Setup\
\
Let's start by scaffolding our project.\
This initial setup will provide a basic Express.js server and frontend templates, allowing us to focus on integrating Sim APIs.\
\
<Steps>\
  <Step title="Create Your Project Structure">\
    Open your terminal and create a new directory for the project:\
\
    ```bash\
    mkdir wallet-ui\
    cd wallet-ui\
    ```\
\
    Now you are in the `wallet-ui` directory.\
    Next, initialize a new Node.js project with npm:\
\
    ```bash\
    npm init -y\
    npm pkg set type="module"\
    ```\
\
    These commands create a `package.json` file with default values and configure it to use ES modules.\
    Afterward, install the required packages:\
\
    ```bash\
    npm install express ejs dotenv numbro\
    ```\
\
    We are using three packages for our wallet:\
\
    * **Express.js**: A popular Node.js web framework for creating our server.\
    * **EJS**: A simple templating engine that lets us generate dynamic HTML.\
    * **dotenv**: A package to load environment variables from a `.env` file.\
    * **numbro**: For formatting numbers and currency.\
  </Step>\
\
  <Step title="Configure Environment Variables">\
    Create a new `.env` file in your project root:\
\
    ```bash\
    touch .env\
    ```\
\
    Open the `.env` file in your code editor and add your Sim API key:\
\
    ```plaintext .env\
    # Your Sim API key (required)\
    SIM_API_KEY=your_api_key_here\
    ```\
\
    <Warning>\
      Never commit your `.env` file to version control. If you are using Git, add `.env` to your `.gitignore` file.\
    </Warning>\
  </Step>\
\
  <Step title="Add Starter Code">\
    Create the necessary directories for views and public assets:\
\
    ```bash\
    mkdir views\
    mkdir public\
    ```\
\
    `views` will hold our EJS templates, and `public` will serve static assets like CSS.\
    Now, create the core files:\
\
    ```bash\
    touch server.js\
    touch views/wallet.ejs\
    touch public/styles.css\
    ```\
\
    Populate `server.js` with this basic Express server code:\
\
    ```javascript server.js [expandable]\
    import express from 'express';\
    import numbro from 'numbro';\
    import dotenv from 'dotenv';\
    import path from 'path';\
    import { fileURLToPath } from 'url';\
\
    // Load environment variables\
    dotenv.config();\
    const SIM_API_KEY = process.env.SIM_API_KEY;\
\
    if (!SIM_API_KEY) {\
        console.error("FATAL ERROR: SIM_API_KEY is not set in your environment variables.");\
        process.exit(1);\
    }\
\
    // Set up __dirname for ES modules\
    const __filename = fileURLToPath(import.meta.url);\
    const __dirname = path.dirname(__filename);\
\
    // Initialize Express\
    const app = express();\
\
    // Configure Express settings\
    app.set('view engine', 'ejs');\
    app.set('views', path.join(__dirname, 'views'));\
    app.use(express.static(path.join(__dirname, 'public')));\
\
    // Add our home route\
    app.get('/', async (req, res) => {\
        const {\
            walletAddress = '',\
            tab = 'tokens' // Default to tokens tab\
        } = req.query;\
\
        let tokens = [];\
        let totalWalletUSDValue = 0;\
        let activities = []; // For Guide 2\
        let collectibles = []; // For Guide 3\
\
        // In later steps, these arrays will be populated with API data.\
        res.render('wallet', {\
            walletAddress: walletAddress,\
            currentTab: tab,\
            totalWalletUSDValue: '$0.00', // Will be calculated later in this guide.\
            tokens: tokens,\
            activities: activities,\
            collectibles: collectibles\
        });\
    });\
\
    // Start the server\
    app.listen(3001, () => {\
        console.log(`Server running at http://localhost:3001`);\
    });\
    ```\
\
    Add the initial frontend template to `views/wallet.ejs`:\
\
    ```ejs views/wallet.ejs [expandable]\
    <!DOCTYPE html>\
    <html lang="en">\
    <head>\
        <meta charset="UTF-8">\
        <meta name="viewport" content="width=device-width, initial-scale=1.0">\
        <meta name="description" content="Sim APIs Wallet UI - A simple and elegant wallet interface for viewing crypto assets and transactions">\
        <meta name="theme-color" content="#0b0e1f">\
        <title>Sim APIs Wallet UI</title>\
        <link rel="preconnect" href="https://fonts.googleapis.com">\
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">\
        <link rel="stylesheet" href="/styles.css">\
    </head>\
    <body>\
    <div class="mobile-container">\
        <header class="app-header">\
            <div class="profile-pic-placeholder"></div>\
            <div class="header-title">Wallet</div>\
            <div class="settings-icon"></div>\
        </header>\
\
        <section class="total-balance-section">\
            <p class="total-balance-amount"><%= totalWalletUSDValue %></p>\
            <p class="total-balance-label js-wallet-address-display"><%= walletAddress || 'Enter wallet address...' %></p>\
        </section>\
\
        <nav class="tabs">\
            <button class="tab-button <%= currentTab === 'tokens' ? 'active' : '' %>" data-tab="tokens">Tokens</button>\
            <button class="tab-button <%= currentTab === 'activity' ? 'active' : '' %>" data-tab="activity">Activity</button>\
            <button class="tab-button <%= currentTab === 'collectibles' ? 'active' : '' %>" data-tab="collectibles">Collectibles</button>\
        </nav>\
\
        <main class="tab-content">\
            <!-- Tokens Tab Pane -->\
            <div id="tokens" class="tab-pane <%= currentTab === 'tokens' ? 'active' : '' %>">\
                <% if (tokens && tokens.length > 0) { %>\
                    <% tokens.forEach(token => { %>\
                        <div class="list-item">\
                            <% if (token.token_metadata && token.token_metadata.logo) { %>\
                                <img src="<%= token.token_metadata.logo %>" alt="<%= token.symbol || 'Token' %> Logo" class="item-icon-placeholder" style="object-fit: contain; padding: 6px;">\
                            <% } else { %>\
                                <div class="item-icon-placeholder"><%= token.symbol ? token.symbol.substring(0, 4) : '?' %></div>\
                            <% } %>\
                            <div class="item-info">\
                                <% if (token.token_metadata && token.token_metadata.url) { %>\
                                    <p class="item-name"><a href="<%= token.token_metadata.url %>" target="_blank" style="color: inherit; text-decoration: none;"><%= token.name || token.symbol %></a></p>\
                                <% } else { %>\
                                    <p class="item-name"><%= token.name || token.symbol %></p>\
                                <% } %>\
                            </div>\
                            <div class="item-value-right">\
                                <p class="item-usd-value">\
                                    <strong>\
                                        <%= token.valueUSDFormatted || (token.value_usd != null ? token.value_usd : 'N/A') %>\
                                    </strong>\
                                </p>\
                                <p class="item-sub-info">\
                                    <%= token.amountFormatted || token.amount %> <%= token.symbol %>\
                                </p>\
                            </div>\
                        </div>\
                    <% }); %>\
                <% } else if (walletAddress) { %>\
                    <p style="text-align: center; padding-top: 30px; color: var(--color-text-muted);">No tokens found for this wallet.</p>\
                <% } else { %>\
                    <p style="text-align: center; padding-top: 30px; color: var(--color-text-muted);">Enter a wallet address above to see token balances.</p>\
                <% } %>\
            </div>\
\
           <!-- Activity Tab Pane (for Guide 2) -->\
            <div id="activity" class="tab-pane <%= currentTab === 'activity' ? 'active' : '' %>">\
                <p style="font-family: var(--font-primary); text-align: center; padding-top: 30px; color: var(--color-text-muted);">Activity feature will be added in the next guide.</p>\
            </div>\
\
            <!-- Collectibles Tab Pane (for Guide 3) -->\
            <div id="collectibles" class="tab-pane <%= currentTab === 'collectibles' ? 'active' : '' %>">\
                <p style="font-family: var(--font-primary); text-align: center; padding-top: 30px; color: var(--color-text-muted);">Collectibles feature will be added in a future guide.</p>\
            </div>\
        </main>\
    </div>\
\
    <script>\
        const tabButtons = document.querySelectorAll('.tab-button');\
        const tabPanes = document.querySelectorAll('.tab-pane');\
        const walletAddressDisplay = document.querySelector(".js-wallet-address-display");\
\
        tabButtons.forEach(button => {\
            button.addEventListener('click', () => {\
                const tab = button.dataset.tab;\
                const currentWalletAddress = new URLSearchParams(window.location.search).get('walletAddress');\
                if (currentWalletAddress) {\
                    window.location.search = `?walletAddress=${currentWalletAddress}&tab=${tab}`;\
                } else {\
                    // If no wallet address, just switch tab visually without reload, or prompt\
                    tabButtons.forEach(btn => btn.classList.remove('active'));\
                    tabPanes.forEach(pane => pane.classList.remove('active'));\
                    button.classList.add('active');\
                    document.getElementById(tab).classList.add('active');\
                }\
            });\
        });\
\
        walletAddressDisplay.addEventListener('click', () => {\
            let newWalletAddress = prompt("Enter wallet address:", new URLSearchParams(window.location.search).get('walletAddress') || '');\
            if (newWalletAddress !== null && newWalletAddress.trim() !== "") {\
                 const currentTab = new URLSearchParams(window.location.search).get('tab') || 'tokens';\
                 window.location.search = `?walletAddress=${newWalletAddress.trim()}&tab=${currentTab}`;\
            } else if (newWalletAddress !== null) { // Empty input, clear address\
                 const currentTab = new URLSearchParams(window.location.search).get('tab') || 'tokens';\
                 window.location.search = `?tab=${currentTab}`;\
            }\
        });\
\
        // Set active tab based on URL param on page load\
        document.addEventListener('DOMContentLoaded', () => {\
            const params = new URLSearchParams(window.location.search);\
            const tab = params.get('tab') || 'tokens';\
\
            tabButtons.forEach(btn => btn.classList.remove('active'));\
            tabPanes.forEach(pane => pane.classList.remove('active'));\
\
            const activeButton = document.querySelector(`.tab-button[data-tab="${tab}"]`);\
            const activePane = document.getElementById(tab);\
\
            if (activeButton) activeButton.classList.add('active');\
            if (activePane) activePane.classList.add('active');\
        });\
    </script>\
    </body>\
    </html>\
    ```\
\
    Add basic styles to `public/styles.css`:\
\
    ```css public/styles.css [expandable]\
    :root {\
    --font-primary: 'IBM Plex Sans', sans-serif;\
    --font-mono: 'IBM Plex Mono', monospace;\
\
    --color-bg-deep: #e1e2f9;\
    --color-bg-container: #141829;\
    --color-border-primary: #2c3040;\
    --color-border-secondary: #222636;\
    --color-text-primary: #ffffff;\
    --color-text-secondary: #e0e0e0;\
    --color-text-muted: #a0a3b1;\
    --color-text-subtle: #808391;\
    --color-accent-green: #50e3c2;\
    --color-accent-purple: #7e87ef;\
    --color-accent-red: #ff7875;\
    --color-placeholder-bg: #3a3f58;\
    }\
\
    body {\
    font-family: var(--font-primary);\
    background-color: var(--color-bg-deep);\
    color: var(--color-text-secondary);\
    margin: 0;\
    padding: 0;\
    display: flex;\
    justify-content: center;\
    align-items: center;\
    min-height: 100vh;\
    padding-top: 0;\
    padding-bottom: 0;\
    height: 100vh;\
    }\
\
    .mobile-container {\
    width: 100%;\
    max-width: 420px;\
    height: 90vh;\
    max-height: 800px;\
    min-height: 600px;\
    background-color: var(--color-bg-container);\
    border-radius: 20px;\
    display: flex;\
    flex-direction: column;\
    overflow: hidden;\
    align-self: center;\
    box-shadow: 0 8px 32px rgba(20, 24, 41, 0.18), 0 1.5px 6px rgba(20, 24, 41, 0.10);\
    }\
\
    /* Header Styles */\
    .app-header {\
    display: flex;\
    justify-content: space-between;\
    align-items: center;\
    padding: 20px;\
    border-bottom: 1px solid var(--color-border-primary);\
    flex-shrink: 0;\
    }\
\
    .profile-pic-placeholder {\
    width: 36px;\
    height: 36px;\
    background-color: var(--color-placeholder-bg);\
    border-radius: 50%;\
    }\
\
    .header-title {\
    font-family: var(--font-primary);\
    font-size: 1.4em;\
    font-weight: 600; /* IBM Plex Sans SemiBold */\
    color: var(--color-text-primary);\
    }\
\
    .settings-icon {\
    width: 22px;\
    height: 22px;\
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e0e0e0'%3E%3Cpath d='M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z'/%3E%3C/svg%3E");\
    background-repeat: no-repeat;\
    background-size: contain;\
    cursor: pointer;\
    opacity: 0.8;\
    }\
\
    /* Total Balance Section */\
    .total-balance-section {\
    padding: 25px 20px;\
    text-align: center;\
    border-bottom: 1px solid var(--color-border-primary);\
    flex-shrink: 0;\
    }\
\
    .total-balance-amount {\
    font-family: var(--font-mono); /* Mono for large number */\
    font-size: 2.3em;\
    font-weight: 700;\
    margin: 0;\
    color: var(--color-accent-green);\
    }\
    .total-balance-label {\
    font-family: var(--font-primary);\
    font-size: 0.85em;\
    color: var(--color-text-muted);\
    margin-top: 2px;\
    cursor: pointer; /* Make it look clickable */\
    }\
    .total-balance-label:hover {\
        color: var(--color-text-primary);\
    }\
\
    /* Tabs Section */\
    .tabs {\
    display: flex;\
    border-bottom: 1px solid var(--color-border-primary);\
    flex-shrink: 0;\
    position: relative;\
    z-index: 1;\
    }\
\
    .tab-button {\
    font-family: var(--font-primary);\
    flex-grow: 1;\
    padding: 14px;\
    text-align: center;\
    cursor: pointer;\
    background-color: transparent;\
    border: none;\
    color: var(--color-text-muted);\
    font-size: 0.95em;\
    font-weight: 500; /* IBM Plex Sans Medium */\
    border-bottom: 3px solid transparent;\
    transition: color 0.2s ease, border-bottom-color 0.2s ease;\
    }\
    .tab-button:hover {\
    color: var(--color-text-primary);\
    }\
    .tab-button.active {\
    color: var(--color-text-primary);\
    border-bottom: 3px solid var(--color-accent-purple);\
    }\
\
    .tab-content {\
    padding: 0px 20px 20px 20px;\
    flex-grow: 1;\
    min-height: 0;\
    max-height: calc(100vh - 220px);\
    overflow-y: auto;\
    }\
    .tab-pane { display: none; }\
    .tab-pane.active { display: block; }\
\
    /* Tokens Tab & Activity Tab Styles */\
    .list-item {\
    display: flex;\
    align-items: center;\
    padding: 16px 0;\
    border-bottom: 1px solid var(--color-border-secondary);\
    }\
    .list-item:last-child { border-bottom: none; }\
\
    .item-icon-placeholder {\
    width: 38px;\
    height: 38px;\
    background-color: #2c3040; /* Using a specific color, not var for contrast */\
    border-radius: 50%;\
    margin-right: 15px;\
    display: flex;\
    justify-content: center;\
    align-items: center;\
    font-family: var(--font-mono); /* Mono for symbols like ETH */\
    font-weight: 500;\
    font-size: 0.9em;\
    color: #c0c3d1; /* Using specific color */\
    flex-shrink: 0;\
    overflow: hidden; /* Prevents text overflow if symbol is too long */\
    }\
\
    .item-info {\
    flex-grow: 1;\
    min-width: 0; /* Prevents text overflow issues in flex children */\
    }\
    .item-name { /* Token Name, Activity Type like "Received", "Sent" */\
    font-family: var(--font-primary);\
    font-size: 1.05em;\
    font-weight: 500; /* IBM Plex Sans Medium */\
    margin: 0 0 3px 0;\
    color: var(--color-text-primary);\
    white-space: nowrap;\
    overflow: hidden;\
    text-overflow: ellipsis;\
    }\
    .item-sub-info { /* "1.2345 ETH on Ethereum", "Price: $800.00" */\
    font-family: var(--font-primary); /* Sans for descriptive part */\
    font-size: 0.85em;\
    color: var(--color-text-muted);\
    margin: 0;\
    white-space: nowrap;\
    overflow: hidden;\
    text-overflow: ellipsis;\
    }\
    .item-sub-info .mono { /* Span class for monospaced parts within sub-info */\
    font-family: var(--font-mono);\
    }\
\
    .item-value-right {\
    text-align: right;\
    flex-shrink: 0;\
    padding-left: 10px;\
    }\
    .item-usd-value { /* USD value of holding */\
    font-family: var(--font-mono); /* Mono for numerical USD value */\
    font-size: 1.05em;\
    font-weight: 500;\
    margin: 0 0 3px 0;\
    color: var(--color-text-primary);\
    }\
\
    /* Activity Tab Specifics */\
    .activity-direction { /* "Received ETH", "Sent USDC" */\
    font-family: var(--font-primary);\
    font-size: 1.05em;\
    font-weight: 500; /* IBM Plex Sans Medium */\
    margin: 0 0 3px 0;\
    }\
    .activity-direction.sent { color: var(--color-accent-red); }\
    .activity-direction.receive { color: var(--color-accent-green); } /* Ensure class name consistency with JS */\
\
    .activity-address, .activity-timestamp {\
    font-family: var(--font-primary); /* Sans for "From:", "To:" */\
    font-size: 0.8em;\
    color: var(--color-text-subtle);\
    margin: 0;\
    }\
    .activity-address .mono, .activity-timestamp .mono { /* For address itself and timestamp value */\
     font-family: var(--font-mono);\
    }\
    .activity-amount-right { /* "+0.5 ETH" */\
    font-family: var(--font-mono); /* Mono for amount + symbol */\
    font-size: 1.05em;\
    font-weight: 500;\
    }\
    .activity-amount-right.sent { color: var(--color-accent-red); }\
    .activity-amount-right.receive { color: var(--color-accent-green); }\
\
    /* NFT Grid Container */\
    .collectibles-grid {\
        display: grid;\
        grid-template-columns: repeat(1, 1fr);\
        gap: 1rem;\
        padding-top: 20px;\
        width: 100%;\
    }\
\
    /* NFT Item Container */\
    .collectible-item-link {\
        text-decoration: none;\
        color: inherit;\
        display: block;\
        transition: transform 0.2s ease;\
    }\
\
    .collectible-item-link:hover {\
        transform: translateY(-2px);\
    }\
\
    .collectible-item {\
        position: relative;\
        border-radius: 12px;\
        overflow: hidden;\
        background: var(--color-bg-container);\
        border: 1px solid var(--color-border-secondary);\
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\
    }\
\
    /* Image Container */\
    .collectible-image-container {\
        position: relative;\
        width: 100%;\
        padding-bottom: 100%; /* Creates a square aspect ratio */\
        background: var(--color-placeholder-bg);\
    }\
\
    .collectible-image {\
        position: absolute;\
        top: 0;\
        left: 0;\
        width: 100%;\
        height: 100%;\
        object-fit: cover;\
    }\
\
    /* Image Placeholder */\
    .collectible-image-placeholder {\
        position: absolute;\
        top: 0;\
        left: 0;\
        width: 100%;\
        height: 100%;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\
        color: white;\
        font-family: var(--font-primary);\
        font-weight: 600;\
        font-size: 0.875rem;\
    }\
\
    /* NFT Info Container - Static (always visible) */\
    .collectible-info-static {\
        padding: 0.75rem;\
        background: var(--color-bg-container);\
        border-top: 1px solid var(--color-border-secondary);\
    }\
\
    /* NFT Info Container - Hover (keep for backwards compatibility but not used) */\
    .collectible-info {\
        position: absolute;\
        bottom: 0;\
        left: 0;\
        right: 0;\
        padding: 0.75rem;\
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));\
        color: white;\
        opacity: 0;\
        transition: opacity 0.3s ease;\
    }\
\
    .collectible-item-link:hover .collectible-info {\
        opacity: 1;\
    }\
\
    /* NFT Text Styles */\
    .collectible-name {\
        font-family: var(--font-primary);\
        font-size: 0.9rem;\
        font-weight: 600;\
        margin-bottom: 0.25rem;\
        white-space: nowrap;\
        overflow: hidden;\
        text-overflow: ellipsis;\
        color: var(--color-text-primary);\
    }\
\
    .collectible-collection {\
        font-family: var(--font-mono);\
        font-size: 0.8rem;\
        margin-bottom: 0;\
        opacity: 0.9;\
        white-space: nowrap;\
        overflow: hidden;\
        text-overflow: ellipsis;\
        color: var(--color-text-muted);\
    }\
\
    .collectible-chain {\
        font-family: var(--font-primary);\
        font-size: 0.7rem;\
        opacity: 0.8;\
        color: white;\
    }\
    ```\
  </Step>\
\
  <Step title="Verify Project Structure">\
    Run `ls` in your terminal. Your project directory `wallet-ui/` should now contain:\
\
    ```bash\
    wallet-ui/\
    ├── server.js             # Main application file with Express server\
    ├── views/                # Directory for EJS templates\
    │   └── wallet.ejs        # Main wallet UI template\
    ├── public/               # Directory for static assets\
    │   └── styles.css        # CSS styling for the wallet UI\
    ├── package.json          # Project configuration\
    ├── package-lock.json     # Dependency lock file (if `npm install` was run)\
    ├── node_modules/         # Installed packages (if `npm install` was run)\
    └── .env                  # Your environment variables\
    ```\
  </Step>\
</Steps>\
\
Run `node server.js` in the terminal to start the server.\
Visit `http://localhost:3001` to see the blank wallet.\
\
<Frame caption="Our scaffolded wallet UI without any data.">\
  ![](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/wallet-ui/wallet-balances-blank.png)\
</Frame>\
\
<Warning>\
  If you encounter errors, ensure your `.env` file contains the correct `SIM_API_KEY` and that it is loaded correctly.\
  Also, verify the `walletAddress` in the URL is a valid EVM wallet address.\
  Check your terminal for any error messages from `server.js`.\
</Warning>\
\
Now, let's integrate the Sim API to fetch real data.\
\
## Fetch and Show Token Balances\
\
We will use the [Balances API](/evm/balances) to get realtime token balances for a given wallet address.\
This endpoint provides comprehensive details about native and ERC20 tokens, including metadata and USD values across more than 60+ EVM chains.\
\
First, let's create an async function in `server.js` to fetch these balances. Add this function before your `app.get('/')` route handler:\
\
```javascript server.js (getWalletBalances) {7,9,14,28}\
async function getWalletBalances(walletAddress) {\
    if (!walletAddress) return []; // Return empty if no address\
\
    // Construct the query parameters\
    // metadata=url,logo fetches token URLs and logo images\
    const queryParams = `metadata=url,logo`;\
\
    const url = `https://api.sim.dune.com/v1/evm/balances/${walletAddress}?${queryParams}`;\
\
    try {\
        const response = await fetch(url, {\
            headers: {\
                'X-Sim-Api-Key': SIM_API_KEY, // Your API key from .env\
                'Content-Type': 'application/json'\
            }\
        });\
\
        if (!response.ok) {\
            const errorBody = await response.text();\
            console.error(`API request failed with status ${response.status}: ${response.statusText}`, errorBody);\
            throw new Error(`API request failed: ${response.statusText}`);\
        }\
\
        const data = await response.json();\
\
        // The API returns JSON with a "balances" key. We return that directly.\
        return data.balances;\
\
    } catch (error) {\
        console.error("Error fetching wallet balances:", error.message);\
        return []; // Return empty array on error\
    }\
}\
```\
\
This function creates the API request using Node's `fetch`.\
It includes your `SIM_API_KEY` in the headers and sends a GET request to the `/v1/evm/balances/{address}` endpoint.\
\
The Balances API gives you access to various [*URL query parameters*](/evm/balances#parameter-uri) that you can include to modify the response.\
We have included `metadata=url,logo` to include a token's URL and logo.\
\
Next, modify your `app.get('/')` route handler in `server.js` to call `getWalletBalances` and pass the fetched tokens to your template:\
\
```javascript server.js {13}\
app.get('/', async (req, res) => {\
    const {\
        walletAddress = '',\
        tab = 'tokens'\
    } = req.query;\
\
    let tokens = [];\
    let totalWalletUSDValue = 0;\
    let errorMessage = null;\
\
    if (walletAddress) {\
        try {\
            tokens = await getWalletBalances(walletAddress);\
        } catch (error) {\
            console.error("Error in route handler:", error);\
            errorMessage = "Failed to fetch wallet data. Please try again.";\
            // tokens will remain empty, totalWalletUSDValue will be 0\
        }\
    }\
\
    res.render('wallet', {\
        walletAddress: walletAddress,\
        currentTab: tab,\
        totalWalletUSDValue: `$0.00`, // We'll calculate this in the next section\
        tokens: tokens,\
        activities: [], // Placeholder for Guide 2\
        collectibles: [], // Placeholder for Guide 3\
        errorMessage: errorMessage\
    });\
});\
```\
\
We've updated the route to:\
\
1. Call `getWalletBalances` if a `walletAddress` is provided.\
2. Pass the retrieved `balances` to the `wallet.ejs` template.\
\
The `views/wallet.ejs` file you created earlier is already set up to display these tokens.\
Restart your server with `node server.js` and refresh your browser, providing a `walletAddress` in the URL.\
For example: [`http://localhost:3001/?walletAddress=0xd8da6bf26964af9d7eed9e03e53415d37aa96045`](http://localhost:3001/?walletAddress=0xd8da6bf26964af9d7eed9e03e53415d37aa96045)\
\
You should now see the wallet populated with token balances, logos, prices for each token, and how much of that token the wallet holds.\
\
<Frame caption="Wallet displaying token balances (in wei) with logos and prices.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/wallet-ui/wallet-balances-without-formatting.png" className="mx-auto" style={{ width:"100%" }} />\
</Frame>\
\
## Format Balances\
\
The Balances API returns token amounts in their smallest denomination. This will be in wei for ETH-like tokens.\
To display these amounts in a user-friendly way, like `1.23` ETH instead of `1230000000000000000` wei, we need to adjust the amount using the token's `decimals` property, which is also returned from the Balances API.\
We can add a new property, `balanceFormatted`, to each token object.\
\
Modify your `getWalletBalances` function in `server.js` as follows. The main change is mapping over `data.balances` to add the `balanceFormatted` property:\
\
```javascript server.js (getWalletBalances with formatting) {24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38}\
async function getWalletBalances(walletAddress) {\
    if (!walletAddress) return [];\
\
    const queryParams = `metadata=url,logo`;\
    const url = `https://api.sim.dune.com/v1/evm/balances/${walletAddress}?${queryParams}`;\
\
    try {\
        const response = await fetch(url, {\
            headers: {\
                'X-Sim-Api-Key': SIM_API_KEY,\
                'Content-Type': 'application/json'\
            }\
        });\
\
        if (!response.ok) {\
            const errorBody = await response.text();\
            console.error(`API request failed with status ${response.status}: ${response.statusText}`, errorBody);\
            throw new Error(`API request failed: ${response.statusText}`);\
        }\
\
        const data = await response.json();\
\
        // Return formatted values and amounts\
        return (data.balances || []).map(token => {\
            // 1. Calculate human-readable token amount\
            const numericAmount = parseFloat(token.amount) / Math.pow(10, parseInt(token.decimals));\
            // 2. Get numeric USD value\
            const numericValueUSD = parseFloat(token.value_usd);\
            // 3. Format using numbro\
            const valueUSDFormatted = numbro(numericValueUSD).format('$0,0.00');\
            const amountFormatted = numbro(numericAmount).format('0,0.[00]A');\
\
            return {\
                ...token,\
                valueUSDFormatted,\
                amountFormatted\
            };\
        }).filter(token => token.symbol !== 'RTFKT'); // Removing Spam Tokens. Add more if you like.\
\
    } catch (error) {\
        console.error("Error fetching wallet balances:", error.message);\
        return [];\
    }\
}\
```\
\
Now, each token object returned by `getWalletBalances` will include a `balanceFormatted` string, which our EJS template (`views/wallet.ejs`) already uses: `<%= token.balanceFormatted || token.amount %>`.\
\
Restart the server and refresh the browser. You will now see formatted balances.\
\
<Frame caption="Wallet displaying properly formatted token balances with logos.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/wallet-ui/wallet-balances-formatted.png" className="mx-auto" style={{ width:"100%" }} />\
</Frame>\
\
## Calculate Total Portfolio Value\
\
The wallet's total value at the top of the UI still says `$0.00`.\
Let's calculate the total USD value of the wallet and properly show it.\
\
The Balances API provides a `value_usd` field with each token.\
This field represents the total U.S. dollar value of the wallet's entire holding for that specific token.\
\
Let's modify the `app.get('/')` route handler to iterate through the fetched tokens and sum their individual `value_usd` to calculate the `totalWalletUSDValue`.\
\
```javascript server.js (app.get('/') with total value calculation) {16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 37}\
app.get('/', async (req, res) => {\
    const {\
        walletAddress = '',\
        tab = 'tokens'\
    } = req.query;\
\
    let tokens = [];\
    let totalWalletUSDValue = 0; // Will be updated\
    let errorMessage = null;\
\
    if (walletAddress) {\
        try {\
            tokens = await getWalletBalances(walletAddress);\
\
            // Calculate the total USD value from the fetched tokens\
            if (tokens && tokens.length > 0) {\
                tokens.forEach(token => {\
                    let individualValue = parseFloat(token.value_usd);\
                    if (!isNaN(individualValue)) {\
                        totalWalletUSDValue += individualValue;\
                    }\
                });\
            }\
\
            totalWalletUSDValue = numbro(totalWalletUSDValue).format('$0,0.00');\
\
        } catch (error) {\
            console.error("Error in route handler:", error);\
            errorMessage = "Failed to fetch wallet data. Please try again.";\
            // tokens will remain empty, totalWalletUSDValue will be 0\
        }\
    }\
\
    res.render('wallet', {\
        walletAddress: walletAddress,\
        currentTab: tab,\
        totalWalletUSDValue: totalWalletUSDValue, // Pass the calculated total\
        tokens: tokens,\
        activities: [], // Placeholder for Guide 2\
        collectibles: [], // Placeholder for Guide 3\
        errorMessage: errorMessage\
    });\
});\
```\
\
We use the `reduce` method to iterate over the `tokens` array.\
For each `token`, we access its `value_usd` property, parse it as a float, and add it to the running `sum`.\
The calculated `totalWalletUSDValue` is then formatted to two decimal places and passed to the template.\
\
The `views/wallet.ejs` template already has `<p class="total-balance-amount"><%= totalWalletUSDValue %></p>`, so it will display the calculated total correctly.\
\
Restart your server and refresh the browser page with a wallet address.\
You should now see the total wallet value at the top of the UI accurately reflecting the sum of all token balance USD values.\
\
<Frame caption="Wallet showing the correctly calculated total USD value.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/wallet-ui/wallet-balances-total-wallet-value.png" className="mx-auto" style={{ width:"100%" }} />\
</Frame>\
\
## Conclusion\
\
You have successfully set up the basic structure of your multichain wallet and integrated Sim APIs `Balances API` endpoint to display realtime token balances and total portfolio value.\
In the next guide, [Add Account Activity](/evm/add-account-activity), we will enhance this wallet by adding a transaction history feature in the UI using the [Activity API](/evm/activity).\
\
# Collectibles\
Source: https://docs.sim.dune.com/evm/collectibles\
\
evm/openapi/collectibles.json get /v1/evm/collectibles/{address}\
Retrieve EVM compatiable NFTs (ERC721 and ERC1155) that include token identifiers, token standard, chain information, balance, and basic token attributes.\
\
export const SupportedChains = ({endpoint}) => {\
  const dataState = useState(null);\
  const data = dataState[0];\
  const setData = dataState[1];\
  useEffect(function () {\
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {\
      method: "GET"\
    }).then(function (response) {\
      return response.json();\
    }).then(function (responseData) {\
      setData(responseData);\
    });\
  }, []);\
  if (data === null) {\
    return <div>Loading chain information...</div>;\
  }\
  if (!data.chains) {\
    return <div>No chain data available</div>;\
  }\
  var supportedChains = [];\
  var totalChains = data.chains.length;\
  if (endpoint !== undefined) {\
    for (var i = 0; i < data.chains.length; i++) {\
      var chain = data.chains[i];\
      if (chain[endpoint] && chain[endpoint].supported) {\
        supportedChains.push(chain);\
      }\
    }\
  } else {\
    supportedChains = data.chains;\
  }\
  var count = supportedChains.length;\
  var endpointName = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1).replace(/_/g, " ") : "All";\
  var accordionTitle = "Supported Chains (" + count + ")";\
  return <Accordion title={accordionTitle}>\
      <table>\
        <thead>\
          <tr>\
            <th>name</th>\
            <th>chain_id</th>\
            <th>tags</th>\
          </tr>\
        </thead>\
        <tbody>\
          {supportedChains.map(function (chain) {\
    return <tr key={chain.name}>\
                <td><code>{chain.name}</code></td>\
                <td><code>{chain.chain_id}</code></td>\
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>\
              </tr>;\
  })}\
        </tbody>\
      </table>\
    </Accordion>;\
};\
\
![Type=collectibles Web](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/type=collectibles.webp)\
\
The Collectibles API provides information about NFTs (ERC721 and ERC1155 tokens) owned by a specific address on supported EVM blockchains.\
\
<SupportedChains endpoint="collectibles" />\
\
# EVM Overview\
Source: https://docs.sim.dune.com/evm/overview\
\
<CardGroup cols={3}>\
  <Card title="Balances" href="/evm/balances">\
    Access realtime token balances. Get comprehensive details about native and ERC20 tokens, including token metadata and USD valuations.\
  </Card>\
\
  <Card title="Activity" href="/evm/activity">\
    View chronologically ordered transactions including native transfers, ERC20 movements, NFT transfers, and decoded contract interactions.\
  </Card>\
\
  <Card title="Collectibles" href="/evm/collectibles">\
    All NFT (ERC721 and ERC1155) balances, including IDs and metadata\
  </Card>\
\
  <Card title="Transactions" href="/evm/transactions">\
    Retrieve granular transaction details including block information, gas data, transaction types, and raw transaction values.\
  </Card>\
\
  <Card title="Token Info" href="/evm/token-info">\
    Get detailed metadata and realtime price information for any native asset or ERC20 token including symbol, name, decimals, supply information, USD pricing, and logo URLs.\
  </Card>\
\
  <Card title="Token Holders" href="/evm/token-holders">\
    Discover token distribution across ERC20 or ERC721 holders, ranked by wallet value.\
  </Card>\
</CardGroup>\
\
# Show NFT Collectibles in Your Wallet\
Source: https://docs.sim.dune.com/evm/show-nfts-collectibles\
\
Complete your realtime crypto wallet by adding a visual display of a user's NFT collection.\
\
<Frame caption="The user's full NFT collection, with artwork and details, displayed in the 'Collectibles' tab.">\
  ![](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/apis/Collectibles.webp)\
</Frame>\
\
Your wallet now displays token balances, calculates total portfolio value, and tracks detailed account activity.\
To give users a holistic view of their onchain assets, the final piece is to **showcase their NFT collections**.\
In this third and final guide of our wallet series, we will focus on implementing the *Collectibles* tab.\
\
<Columns cols={2}>\
  <Card title="View Source Code" icon="github" href="https://github.com/duneanalytics/sim-guides" horizontal>\
    Access the complete source code for this wallet on GitHub\
  </Card>\
\
  <Card title="Try Live Demo" icon="globe" href="https://sim-guides.vercel.app/?walletAddress=0x48D004a6C175dB331E99BeAf64423b3098357Ae7" horizontal>\
    Interact with the finished wallet app\
  </Card>\
</Columns>\
\
<Note>\
  This guide assumes you have completed the previous guides:\
\
  1. [Build a Realtime Wallet](/evm/build-a-realtime-wallet)\
  2. [Add Account Activity](/evm/add-account-activity)\
</Note>\
\
## Explore the NFT Collection\
\
See the collectibles feature in action with the live demo below. Click on the "Collectibles" tab to browse the sample wallet's NFT collection:\
\
<iframe src="https://sim-guides.vercel.app/?walletAddress=0x48D004a6C175dB331E99BeAf64423b3098357Ae7&tab=collectibles" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" style={{ height: "800px" }} title="Live Wallet Demo - Collectibles Tab" frameBorder="0" allow="clipboard-write; encrypted-media" allowFullScreen />\
\
## Fetch NFT Collectibles\
\
Let's add a new asynchronous `getWalletCollectibles` function to `server.js` to fetch a user's NFT collection using the [Collectibles API](/evm/collectibles).\
\
```javascript server.js (getWalletCollectibles - Sim API portion) {4}\
async function getWalletCollectibles(walletAddress, limit = 50) {\
    if (!walletAddress) return [];\
\
    const url = `https://api.sim.dune.com/v1/evm/collectibles/${walletAddress}?limit=${limit}`;\
\
    try {\
        const response = await fetch(url, {\
            headers: {\
                'X-Sim-Api-Key': SIM_API_KEY,\
                'Content-Type': 'application/json'\
            }\
        });\
\
        if (!response.ok) {\
            const errorBody = await response.text();\
            console.error(`Collectibles API request failed with status ${response.status}: ${response.statusText}`, errorBody);\
            throw new Error(`Collectibles API request failed: ${response.statusText}`);\
        }\
\
        const data = await response.json();\
        const collectibles = data.entries || [];\
\
        // ... (OpenSea enrichment will be added in the next section)\
\
    } catch (error) {\
        console.error("Error fetching wallet collectibles:", error.message);\
        return [];\
    }\
}\
```\
\
The NFT data is extracted from the `entries` array within this response, providing information like contract addresses, token IDs, and chain data.\
\
<Note>\
  The [Collectibles API](/evm/collectibles) supports pagination using `limit` and `offset` query parameters.\
  For wallets with many NFTs, you can implement logic to fetch subsequent pages using the `next_offset` value returned by the API to provide a complete view of the user's collection.\
</Note>\
\
## Fetch NFT Images\
\
Sim APIs provide comprehensive blockchain metadata for NFTs, but we images to create a rich visual experience.\
We'll integrate with OpenSea's API to enrich our NFT data with image URLs.\
\
<Note>\
  NFT image data and enhanced metadata might be coming soon to the Sim APIs, but for now you can use OpenSea APIs to grab image URLs and provide a visual NFT display for users.\
</Note>\
\
### Get an OpenSea API Key\
\
Before we can fetch NFT images from OpenSea, you'll need to obtain an [OpenSea API key](https://docs.opensea.io/reference/api-keys).\
Once you receive your API key, add it to your `.env` file:\
\
```bash .env (Add OpenSea API Key)\
SIM_API_KEY=your_sim_api_key_here\
OPENSEA_API_KEY=your_opensea_api_key_here\
```\
\
### Update getWalletCollectibles\
\
Let's complete the `getWalletCollectibles` function by adding OpenSea API integration to fetch images:\
\
```javascript server.js (getWalletCollectibles - Complete function) {4, 24}\
async function getWalletCollectibles(walletAddress, limit = 50) {\
    if (!walletAddress) return [];\
\
    const url = `https://api.sim.dune.com/v1/evm/collectibles/${walletAddress}?limit=${limit}`;\
\
    try {\
        const response = await fetch(url, {\
            headers: {\
                'X-Sim-Api-Key': SIM_API_KEY,\
                'Content-Type': 'application/json'\
            }\
        });\
\
        if (!response.ok) {\
            const errorBody = await response.text();\
            console.error(`Collectibles API request failed with status ${response.status}: ${response.statusText}`, errorBody);\
            throw new Error(`Collectibles API request failed: ${response.statusText}`);\
        }\
\
        const data = await response.json();\
        const collectibles = data.entries || [];\
\
        // Enrich collectibles with OpenSea image data\
        const enrichedCollectibles = await Promise.all(\
            collectibles.map(async (collectible) => {\
                try {\
                    // Use the chain value directly from Sim APIs\
                    if (collectible.chain) {\
                        const openSeaUrl = `https://api.opensea.io/api/v2/chain/${collectible.chain}/contract/${collectible.contract_address}/nfts/${collectible.token_id}`;\
\
                        const openSeaResponse = await fetch(openSeaUrl, {\
                            headers: {\
                                'Accept': 'application/json',\
                                'x-api-key': process.env.OPENSEA_API_KEY\
                            }\
                        });\
\
                        if (openSeaResponse.ok) {\
                            const openSeaData = await openSeaResponse.json();\
                            return {\
                                ...collectible,\
                                image_url: openSeaData.nft?.image_url || null,\
                                opensea_url: openSeaData.nft?.opensea_url || null,\
                                description: openSeaData.nft?.description || null,\
                                collection_name: openSeaData.nft?.collection || collectible.name\
                            };\
                        }\
                    }\
\
                    // Return original collectible if OpenSea fetch fails or no chain info\
                    return {\
                        ...collectible,\
                        image_url: null,\
                        opensea_url: null,\
                        description: null,\
                        collection_name: collectible.name\
                    };\
                } catch (error) {\
                    console.error(`Error fetching OpenSea data for ${collectible.chain}:${collectible.contract_address}:${collectible.token_id}:`, error.message);\
                    return {\
                        ...collectible,\
                        image_url: null,\
                        opensea_url: null,\
                        description: null,\
                        collection_name: collectible.name\
                    };\
                }\
            })\
        );\
\
        // Filter out collectibles without images\
        return enrichedCollectibles.filter(collectible => collectible.image_url !== null);\
\
    } catch (error) {\
        console.error("Error fetching wallet collectibles:", error.message);\
        return [];\
    }\
}\
```\
\
This enhanced function combines blockchain data from Sim APIs with rich metadata from OpenSea.\
For each NFT, we make an additional API call to OpenSea using the chain and contract information provided by Sim APIs.\
The function enriches each collectible with `image_url`, `opensea_url`, `description`, and `collection_name` fields, then filters to only return NFTs that have available images for display.\
\
## Add Collectibles into the Server Route\
\
Next, we update our main `app.get('/')` route handler in `server.js` to call this new function:\
\
```javascript server.js (app.get('/') updated for collectibles) {16, 19, 41}\
app.get('/', async (req, res) => {\
    const {\
        walletAddress = '',\
        tab = 'tokens'\
    } = req.query;\
\
    let tokens = [];\
    let activities = [];\
    let collectibles = []; // Initialize collectibles array\
    let totalWalletUSDValue = 0;\
    let errorMessage = null;\
\
    if (walletAddress) {\
        try {\
            // Fetch balances, activities, and collectibles concurrently for better performance\
            [tokens, activities, collectibles] = await Promise.all([\
                getWalletBalances(walletAddress),\
                getWalletActivity(walletAddress, 25), // Fetching 25 recent activities\
                getWalletCollectibles(walletAddress, 50) // Fetching up to 50 collectibles\
            ]);\
\
            // Calculate total portfolio value from token balances (Guide 1)\
            if (tokens && tokens.length > 0) {\
                totalWalletUSDValue = tokens.reduce((sum, token) => {\
                    const value = parseFloat(token.value_usd);\
                    return sum + (isNaN(value) ? 0 : value);\
                }, 0);\
            }\
        } catch (error) {\
            console.error("Error in route handler fetching all data:", error);\
            errorMessage = "Failed to fetch wallet data. Please try again.";\
        }\
    }\
\
    res.render('wallet', {\
        walletAddress: walletAddress,\
        currentTab: tab,\
        totalWalletUSDValue: `$${totalWalletUSDValue.toFixed(2)}`,\
        tokens: tokens,\
        activities: activities,\
        collectibles: collectibles, // Pass collectibles to the template\
        errorMessage: errorMessage\
    });\
});\
```\
\
The route handler now fetches balances, activities, and the enriched NFT collectibles data concurrently for optimal performance.\
The `collectibles` array, now containing both blockchain data and image URLs, is passed to the `wallet.ejs` template.\
\
## Display Collectibles in the Frontend\
\
The final step is to modify `views/wallet.ejs` to render the fetched collectibles within the "Collectibles" tab.\
We will use a grid layout to display NFT images with their collection names and token IDs.\
\
In `views/wallet.ejs`, find the section for the "Collectibles" tab (you can search for `id="collectibles"`).\
It currently contains a placeholder paragraph.\
Replace that entire `div` with the following EJS:\
\
```ejs views/wallet.ejs (Collectibles tab content) [expandable]\
<!-- Collectibles Tab Pane -->\
<div id="collectibles" class="tab-pane <%= currentTab === 'collectibles' ? 'active' : '' %>">\
    <% if (collectibles && collectibles.length > 0) { %>\
        <div class="collectibles-grid">\
            <% collectibles.forEach(collectible => { %>\
                <% if (collectible.opensea_url) { %>\
                    <a href="<%= collectible.opensea_url %>" target="_blank" class="collectible-item-link">\
                <% } else { %>\
                    <div class="collectible-item-link">\
                <% } %>\
                    <div class="collectible-item">\
                        <div class="collectible-image-container">\
                            <% if (collectible.image_url) { %>\
                                <img src="<%= collectible.image_url %>" alt="<%= collectible.collection_name || collectible.name || 'NFT' %>" class="collectible-image">\
                            <% } else { %>\
                                <div class="collectible-image-placeholder">\
                                    NFT\
                                </div>\
                            <% } %>\
                        </div>\
                        <div class="collectible-info-static">\
                            <div class="collectible-name">\
                                <%= collectible.collection_name || collectible.name || `Token #${collectible.token_id}` %>\
                            </div>\
                            <div class="collectible-collection">\
                                #<%= collectible.token_id.length > 10 ? collectible.token_id.substring(0, 8) + '...' : collectible.token_id %>\
                            </div>\
                        </div>\
                    </div>\
                <% if (collectible.opensea_url) { %>\
                    </a>\
                <% } else { %>\
                    </div>\
                <% } %>\
            <% }); %>\
        </div>\
    <% } else if (walletAddress) { %>\
        <p style="text-align: center; padding-top: 30px; color: var(--color-text-muted);">No collectibles found for this wallet.</p>\
    <% } else { %>\
        <p style="text-align: center; padding-top: 30px; color: var(--color-text-muted);">Enter a wallet address to see collectibles.</p>\
    <% } %>\
</div>\
```\
\
The EJS template iterates through the `collectibles` array and displays each NFT with its enriched metadata.\
Each collectible shows the `image_url` from OpenSea, the `collection_name` or fallback name, and a truncated `token_id` for identification.\
If an `opensea_url` is available, the entire NFT card becomes a clickable link that opens the NFT's OpenSea page in a new tab.\
\
***\
\
Restart your server using `node server.js` and navigate to your wallet app in the browser.\
When you click on the "Collectibles" tab, and if the wallet has NFTs, you should see the NFT collection displayed with rich visual metadata.\
\
## Conclusion\
\
That concludes this three-part series!\
With just three API requests - [Balances](/evm/balances), [Activity](/evm/activity), and [Collectibles](/evm/collectibles) - enhanced with OpenSea metadata, you've built a fully functional, multichain wallet that displays token balances, calculates portfolio value, tracks detailed transaction activity, and showcases NFT collections with rich visual displays.\
\
**This project serves as a solid foundation for a wallet**.\
You can now expand upon it by exploring other Sim API features.\
Whether you want to add more sophisticated analytics, deeper NFT insights, or advanced transaction tracking, Sim APIs provides the blockchain data you need to build the next generation of onchain apps.\
\
# Supported Chains\
Source: https://docs.sim.dune.com/evm/supported-chains\
\
/evm/openapi/supported-chains.json\
Explore chains supported by Sim's EVM API endpoints.\
\
export const SupportedChainsAccordion = () => {\
  const dataState = useState(null);\
  const data = dataState[0];\
  const setData = dataState[1];\
  const countsState = useState({});\
  const counts = countsState[0];\
  const setCounts = countsState[1];\
  const loadingState = useState(true);\
  const isLoading = loadingState[0];\
  const setIsLoading = loadingState[1];\
  useEffect(function () {\
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {\
      method: "GET"\
    }).then(function (response) {\
      return response.json();\
    }).then(function (responseData) {\
      setData(responseData);\
      var balancesCount = 0;\
      var activityCount = 0;\
      var collectiblesCount = 0;\
      var transactionsCount = 0;\
      var tokenInfoCount = 0;\
      var tokenHoldersCount = 0;\
      for (var i = 0; i < responseData.chains.length; i++) {\
        var chain = responseData.chains[i];\
        if (chain.balances && chain.balances.supported) balancesCount++;\
        if (chain.activity && chain.activity.supported) activityCount++;\
        if (chain.collectibles && chain.collectibles.supported) collectiblesCount++;\
        if (chain.transactions && chain.transactions.supported) transactionsCount++;\
        if (chain.token_info && chain.token_info.supported) tokenInfoCount++;\
        if (chain.token_holders && chain.token_holders.supported) tokenHoldersCount++;\
      }\
      setCounts({\
        balances: balancesCount,\
        activity: activityCount,\
        collectibles: collectiblesCount,\
        transactions: transactionsCount,\
        token_info: tokenInfoCount,\
        token_holders: tokenHoldersCount\
      });\
      setIsLoading(false);\
    });\
  }, []);\
  function renderChainsTable(endpoint) {\
    if (!data || !data.chains) {\
      return <p>No data available</p>;\
    }\
    var supportedChains = [];\
    for (var i = 0; i < data.chains.length; i++) {\
      var chain = data.chains[i];\
      if (chain[endpoint] && chain[endpoint].supported) {\
        supportedChains.push(chain);\
      }\
    }\
    return <table>\
        <thead>\
          <tr>\
            <th>name</th>\
            <th>chain_id</th>\
            <th>tags</th>\
          </tr>\
        </thead>\
        <tbody>\
          {supportedChains.map(function (chain) {\
      return <tr key={chain.name}>\
                <td><code>{chain.name}</code></td>\
                <td><code>{chain.chain_id}</code></td>\
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>\
              </tr>;\
    })}\
        </tbody>\
      </table>;\
  }\
  if (isLoading) {\
    return <div>Loading chain information...</div>;\
  }\
  if (!data) {\
    return <div>No data available</div>;\
  }\
  return <AccordionGroup>\
      <Accordion title={"Balances API (" + (counts.balances || 0) + ")"}>\
        <p>The <a href="/evm/balances">Balances API</a> supports {counts.balances || 0} chains.</p>\
        {renderChainsTable("balances")}\
      </Accordion>\
      <Accordion title={"Activity API (" + (counts.activity || 0) + ")"}>\
        <p>The <a href="/evm/activity">Activity API</a> supports {counts.activity || 0} chains.</p>\
        {renderChainsTable("activity")}\
      </Accordion>\
      <Accordion title={"Collectibles API (" + (counts.collectibles || 0) + ")"}>\
        <p>The <a href="/evm/collectibles">Collectibles API</a> supports {counts.collectibles || 0} chains.</p>\
        {renderChainsTable("collectibles")}\
      </Accordion>\
      <Accordion title={"Transactions API (" + (counts.transactions || 0) + ")"}>\
        <p>The <a href="/evm/transactions">Transactions API</a> supports {counts.transactions || 0} chains.</p>\
        {renderChainsTable("transactions")}\
      </Accordion>\
      <Accordion title={"Token Info API (" + (counts.token_info || 0) + ")"}>\
        <p>The <a href="/evm/token-info">Token Info API</a> supports {counts.token_info || 0} chains.</p>\
        {renderChainsTable("token_info")}\
      </Accordion>\
      <Accordion title={"Token Holders API (" + (counts.token_holders || 0) + ")"}>\
        <p>The <a href="/evm/token-holders">Token Holders API</a> supports {counts.token_holders || 0} chains.</p>\
        {renderChainsTable("token_holders")}\
      </Accordion>\
    </AccordionGroup>;\
};\
\
<Frame>\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/evm/Chains.svg" alt="Chains" title="Chains" className="mx-auto" style={{ width:"100%" }} />\
</Frame>\
\
The Supported Chains endpoint provides realtime information about which blockchains are supported by Sim's EVM API endpoints.\
Chain support varies by API endpoint. Use the dropdown below to check which chains are available for each API:\
\
<SupportedChainsAccordion />\
\
## Using the API Endpoint\
\
You can programmatically retrieve the list of supported chains to adapt to newly supported networks.\
\
The response includes an array of supported chains.\
Each item in the array includes the chain's `name`, `chain_id`, an array of `tags`, and support for each endpoint.\
Each endpoint (balances, transactions, activity, etc.) has a `supported` boolean value\
\
<RequestExample>\
  ```bash cURL\
  curl --request GET \\
    --url https://api.sim.dune.com/v1/evm/supported-chains \\
    --header 'X-Sim-Api-Key: YOUR_API_KEY'\
  ```\
\
  ```javascript JavaScript\
  const response = await fetch('https://api.sim.dune.com/v1/evm/supported-chains', {\
    method: 'GET',\
    headers: {\
      'X-Sim-Api-Key': 'YOUR_API_KEY'\
    }\
  });\
\
  const data = await response.json();\
  console.log(data);\
  ```\
\
  ```python Python\
  import requests\
\
  url = "https://api.sim.dune.com/v1/evm/supported-chains"\
  headers = {"X-Sim-Api-Key": "YOUR_API_KEY"}\
\
  response = requests.get(url, headers=headers)\
  data = response.json()\
  print(data)\
  ```\
</RequestExample>\
\
<ResponseExample>\
  ```json 200\
  {\
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
    ]\
  }\
  ```\
\
  ```json 400\
  {\
    "error": "Bad Request"\
  }\
  ```\
\
  ```json 401\
  {\
    "error": "Unauthorized"\
  }\
  ```\
\
  ```json 404\
  {\
    "error": "Not Found"\
  }\
  ```\
\
  ```json 429\
  {\
    "error": "Too many requests"\
  }\
  ```\
\
  ```json 500\
  {\
    "error": "Internal Server Error"\
  }\
  ```\
</ResponseExample>\
\
## Tags\
\
The `tags` property groups chains by category, such as `mainnet`, `testnet`, or `default`.\
You can use these tags to filter or select chains in API requests.\
Any endpoint that supports the `chain_ids` query parameter accepts a tag in place of explicit IDs, letting you fetch data for an entire group of chains in a single request.\
\
When using `chain_ids`, you can request chains in several ways:\
\
* **By tags**: `?chain_ids=mainnet` returns all chains tagged with `mainnet`. Using `?chain_ids=mainnet,testnet` returns all chains that are tagged with `mainnet` *or* `testnet`.\
* **Specific chain IDs**: `?chain_ids=1,137,42161` (Ethereum, Polygon, Arbitrum)\
* **Default behavior**: Omitting `chain_ids` returns only chains tagged `default`.\
\
Some supported chains have **no tag assigned**.\
A chain may be untagged due to higher latency, restrictive rate limits, RPC cost, or a temporary incident.\
Untagged chains stay out of default requests to keep them fast, but you can still query them with `chain_ids` by passing the chain name (e.g. `?chain_ids=corn,funkichain`).\
\
Open the accordion above and scan the table to see which chains carry tags and which are untagged.\
\
## Examples\
\
Here are two practical examples of how you might use this endpoint:\
\
### 1. Building a Dynamic Chain Selector\
\
This example shows how to fetch supported chains and create a user-friendly dropdown menu that filters chains based on their capabilities.\
It can be useful for wallet UIs or dApp chain selection.\
\
```javascript [expandable]\
// Fetch supported chains and build a dropdown for users\
async function buildChainSelector() {\
const response = await fetch('https://api.sim.dune.com/v1/evm/supported-chains', {\
    headers: { 'X-Sim-Api-Key': 'YOUR_API_KEY' }\
});\
\
const data = await response.json();\
\
// Filter chains that support balances\
const supportedChains = data.chains.filter(chain => chain.balances.supported);\
\
// Build dropdown options\
const chainOptions = supportedChains.map(chain => ({\
    value: chain.chain_id,\
    label: `${chain.name} (${chain.chain_id})`,\
    isMainnet: chain.tags.includes('mainnet')\
}));\
\
return chainOptions;\
}\
```\
\
### 2. Validating Chain Support\
\
This example demonstrates how to validate whether a specific chain supports a particular endpoint before making API calls.\
This helps prevent errors and improves user experience by showing appropriate messages.\
\
```javascript [expandable]\
async function validateChainSupport(chainId, endpointName) {\
// Check if a chain supports a specific endpoint before making requests\
try {\
    const response = await fetch('https://api.sim.dune.com/v1/evm/supported-chains', {\
      headers: { 'X-Sim-Api-Key': 'YOUR_API_KEY' }\
    });\
\
    const data = await response.json();\
\
    // Find the chain\
    const chain = data.chains.find(c => c.chain_id === chainId);\
\
    if (!chain) {\
      return { supported: false, message: `Chain ${chainId} not found` };\
    }\
\
    // Check if the endpoint is supported\
    if (!chain[endpointName] || !chain[endpointName].supported) {\
      return {\
        supported: false,\
        message: `Endpoint '${endpointName}' not supported on ${chain.name}`\
      };\
    }\
\
    return {\
      supported: true,\
      message: `Chain ${chain.name} supports ${endpointName}`\
    };\
\
} catch (error) {\
    return { supported: false, message: `Error validating chain: ${error.message}` };\
}\
}\
\
// Usage\
const result = await validateChainSupport(1, 'balances');\
console.log(result.message); // "Chain ethereum supports balances"\
```\
\
# Token Holders\
Source: https://docs.sim.dune.com/evm/token-holders\
\
evm/openapi/token-holders.json get /v1/evm/token-holders/{chain_id}/{token_address}\
Discover token distribution across ERC20 or ERC721 holders, ranked by wallet value.\
\
export const SupportedChains = ({endpoint}) => {\
  const dataState = useState(null);\
  const data = dataState[0];\
  const setData = dataState[1];\
  useEffect(function () {\
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {\
      method: "GET"\
    }).then(function (response) {\
      return response.json();\
    }).then(function (responseData) {\
      setData(responseData);\
    });\
  }, []);\
  if (data === null) {\
    return <div>Loading chain information...</div>;\
  }\
  if (!data.chains) {\
    return <div>No chain data available</div>;\
  }\
  var supportedChains = [];\
  var totalChains = data.chains.length;\
  if (endpoint !== undefined) {\
    for (var i = 0; i < data.chains.length; i++) {\
      var chain = data.chains[i];\
      if (chain[endpoint] && chain[endpoint].supported) {\
        supportedChains.push(chain);\
      }\
    }\
  } else {\
    supportedChains = data.chains;\
  }\
  var count = supportedChains.length;\
  var endpointName = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1).replace(/_/g, " ") : "All";\
  var accordionTitle = "Supported Chains (" + count + ")";\
  return <Accordion title={accordionTitle}>\
      <table>\
        <thead>\
          <tr>\
            <th>name</th>\
            <th>chain_id</th>\
            <th>tags</th>\
          </tr>\
        </thead>\
        <tbody>\
          {supportedChains.map(function (chain) {\
    return <tr key={chain.name}>\
                <td><code>{chain.name}</code></td>\
                <td><code>{chain.chain_id}</code></td>\
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>\
              </tr>;\
  })}\
        </tbody>\
      </table>\
    </Accordion>;\
};\
\
![Type=holders Sv](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/type=holders.svg)\
\
The Token Holders API provides information about accounts holding a specific ERC20 or ERC721 token on supported EVM blockchains.\
\
<SupportedChains endpoint="token_holders" />\
\
## Pagination\
\
This endpoint uses cursor-based pagination.\
You can use the `limit` query parameter to define the maximum page size.\
Results might at times be less than the maximum page size.\
The `next_offset` value is included in the initial response and can be used to fetch the next page of results by passing it as the `offset` query parameter in the next request.\
\
<Warning>\
  You can only use the value from `next_offset` to set the `offset` query parameter of the next page of results.\
</Warning>\
\
# Token Info\
Source: https://docs.sim.dune.com/evm/token-info\
\
evm/openapi/token-info.json get /v1/evm/token-info/{uri}\
Get detailed metadata and realtime price information for any native asset or ERC20 token including symbol, name, decimals, supply information, USD pricing, and logo URLs.\
\
export const SupportedChains = ({endpoint}) => {\
  const dataState = useState(null);\
  const data = dataState[0];\
  const setData = dataState[1];\
  useEffect(function () {\
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {\
      method: "GET"\
    }).then(function (response) {\
      return response.json();\
    }).then(function (responseData) {\
      setData(responseData);\
    });\
  }, []);\
  if (data === null) {\
    return <div>Loading chain information...</div>;\
  }\
  if (!data.chains) {\
    return <div>No chain data available</div>;\
  }\
  var supportedChains = [];\
  var totalChains = data.chains.length;\
  if (endpoint !== undefined) {\
    for (var i = 0; i < data.chains.length; i++) {\
      var chain = data.chains[i];\
      if (chain[endpoint] && chain[endpoint].supported) {\
        supportedChains.push(chain);\
      }\
    }\
  } else {\
    supportedChains = data.chains;\
  }\
  var count = supportedChains.length;\
  var endpointName = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1).replace(/_/g, " ") : "All";\
  var accordionTitle = "Supported Chains (" + count + ")";\
  return <Accordion title={accordionTitle}>\
      <table>\
        <thead>\
          <tr>\
            <th>name</th>\
            <th>chain_id</th>\
            <th>tags</th>\
          </tr>\
        </thead>\
        <tbody>\
          {supportedChains.map(function (chain) {\
    return <tr key={chain.name}>\
                <td><code>{chain.name}</code></td>\
                <td><code>{chain.chain_id}</code></td>\
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>\
              </tr>;\
  })}\
        </tbody>\
      </table>\
    </Accordion>;\
};\
\
![Tokeninfo Sv](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/tokeninfo.svg)\
\
The Tokens API provides metadata and realtime pricing information for native and ERC20 tokens on supported EVM blockchains. The API returns:\
\
* Token metadata (symbol, name, decimals)\
* Current USD pricing information\
* Supply information\
* Logo URLs when available\
\
<Note>\
  The `?chain_ids` query parameter is mandatory.\
  To learn more about this query parameter, see the [Supported Chains](/evm/supported-chains#tags) page.\
</Note>\
\
<SupportedChains endpoint="token_info" />\
\
## Token Prices\
\
Sim looks up prices onchain. We use the most liquid onchain pair to determine a usd price. We return the available liquidity in `pool_size` as part of the response.\
\
## Historical prices\
\
You can request 24 hour point-in-time prices by adding the optional `historical_prices` query parameter. Use whole numbers only, from 1 to 24. You can request up to three offsets. For example, `historical_prices=24` returns the price 24 hours ago. `historical_prices=1,6,24` returns prices 1 hour ago, 6 hours ago, and 24 hours ago.\
\
<Note>\
  The `historical_prices` query parameter is currently supported only on the EVM Token Info and EVM Balances endpoints.\
</Note>\
\
When set, each token object includes a `historical_prices` array with one entry per offset:\
\
```json\
{\
"tokens": [\
    {\
      "chain": "base",\
      "symbol": "ETH",\
      "price_usd": 3897.492219,\
      "historical_prices": [\
        { "offset_hours": 24, "price_usd": 3816.557286 },\
        { "offset_hours": 6,  "price_usd": 3914.205613 },\
        { "offset_hours": 1,  "price_usd": 3898.926195 }\
      ]\
    }\
]\
}\
```\
\
Percent changes are not returned. You can compute your own percentage differences using the current `price_usd` and the values in `historical_prices[].price_usd`.\
\
## Pagination\
\
This endpoint uses cursor-based pagination. You can use the `limit` parameter to define the maximum page size.\
Results might at times be less than the maximum page size.\
The `next_offset` value is included in the initial response and can be utilized to fetch the next page of results by passing it as the `offset` query parameter in the next request.\
\
<Warning>\
  You can only use the value from `next_offset` to set the `offset` parameter of the next page of results. Using your own `offset` value will not have any effect.\
</Warning>\
\
# Transactions\
Source: https://docs.sim.dune.com/evm/transactions\
\
evm/openapi/transactions.json get /v1/evm/transactions/{uri}\
Retrieve granular transaction details including block information, gas data, transaction types, and raw transaction values.\
\
export const SupportedChains = ({endpoint}) => {\
  const dataState = useState(null);\
  const data = dataState[0];\
  const setData = dataState[1];\
  useEffect(function () {\
    fetch("https://sim-proxy.dune-d2f.workers.dev/v1/evm/supported-chains", {\
      method: "GET"\
    }).then(function (response) {\
      return response.json();\
    }).then(function (responseData) {\
      setData(responseData);\
    });\
  }, []);\
  if (data === null) {\
    return <div>Loading chain information...</div>;\
  }\
  if (!data.chains) {\
    return <div>No chain data available</div>;\
  }\
  var supportedChains = [];\
  var totalChains = data.chains.length;\
  if (endpoint !== undefined) {\
    for (var i = 0; i < data.chains.length; i++) {\
      var chain = data.chains[i];\
      if (chain[endpoint] && chain[endpoint].supported) {\
        supportedChains.push(chain);\
      }\
    }\
  } else {\
    supportedChains = data.chains;\
  }\
  var count = supportedChains.length;\
  var endpointName = endpoint ? endpoint.charAt(0).toUpperCase() + endpoint.slice(1).replace(/_/g, " ") : "All";\
  var accordionTitle = "Supported Chains (" + count + ")";\
  return <Accordion title={accordionTitle}>\
      <table>\
        <thead>\
          <tr>\
            <th>name</th>\
            <th>chain_id</th>\
            <th>tags</th>\
          </tr>\
        </thead>\
        <tbody>\
          {supportedChains.map(function (chain) {\
    return <tr key={chain.name}>\
                <td><code>{chain.name}</code></td>\
                <td><code>{chain.chain_id}</code></td>\
                <td><code>{chain.tags ? chain.tags.join(", ") : ""}</code></td>\
              </tr>;\
  })}\
        </tbody>\
      </table>\
    </Accordion>;\
};\
\
![Transaction Sv](https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/transaction.svg)\
\
The Transactions API allows for quick and accurate lookup of transactions associated with an address.\
Transactions are ordered by descending block time, so the most recent transactions appear first.\
\
<SupportedChains endpoint="transactions" />\
\
## Pagination\
\
This endpoint is using cursor based pagination.\
You can use the `limit` parameter to define the maximum page size.\
Results might at times be less than the maximum page size.\
The `next_offset` value is included in the initial response and can be utilized to fetch the next page of results by passing it as the `offset` query parameter in the next request.\
\
<Warning>\
  You can only use the value from `next_offset` to set the `offset` parameter of the next page of results. Using your own `offset` value will not have any effect.\
</Warning>\
\
# Sim IDX Quickstart\
Source: https://docs.sim.dune.com/idx\
\
Get started and set up your first blockchain data indexer in minutes.\
\
Sim IDX is a framework that radically simplifies the process of indexing blockchain data.\
This guide will walk you through installing the CLI, initializing a sample project, and running your first listener test.\
\
<video id="sim-idx-hero-video" className="w-full aspect-video rounded-xl cursor-pointer" autoPlay muted loop playsInline noZoom controls src="https://dby10v016ygc2zna.public.blob.vercel-storage.com/Sim_IDX_Overview_01-f59KA9bRJG48nHIyC9STP7YZ2a356S.mp4" />\
\
## Install CLI\
\
<Steps>\
  <Step title="Download & Install Dependencies">\
    First, ensure you have **Node.js v20.x or later** installed.\
    You can download it from [Nodejs.org](https://nodejs.org).\
\
    ```bash\
    # Check your node version\
    node -v\
    ```\
  </Step>\
\
  <Step title="Install the CLI">\
    ```bash\
    curl -L https://simcli.dune.com | bash\
    ```\
\
    You'll see the following output:\
\
    ```text\
    [INFO] Installing sim CLI v0.0.86\
    [INFO] Installing sim to /root/.local/bin/sim\
    [INFO] sim CLI installed successfully!\
    [INFO] Added sim CLI to PATH in /root/.bashrc\
    ```\
\
    <Info>\
      After the installer finishes, run `source ~/.bashrc` (or the appropriate profile file) so the `sim` executable is available in your `PATH`.\
    </Info>\
  </Step>\
\
  <Step title="Verify Installation">\
    Verify that the CLI is working:\
\
    ```bash\
    sim --version\
    ```\
\
    You'll see:\
\
    ```\
    sim v0.0.86 (eaddf2 2025-06-22T18:01:14.000000000Z)\
    ```\
  </Step>\
</Steps>\
\
<Tip>For a full reference of the CLI, see the [CLI Overview](/idx/cli).</Tip>\
\
## Initialize Sample App\
\
First, create a new folder.\
\
```bash\
mkdir my-first-idx-app\
cd my-first-idx-app\
```\
\
Next, initialize your new Sim IDX app.\
\
```bash\
sim init\
```\
\
This command initializes **a pre-configured sample app that indexes every new Uniswap V3 trading pool created across multiple chains including Ethereum, Base, and Unichain**.\
It sets up a complete app structure for you, including a listener contract, tests, and a boilerplate API.\
\
<Info>\
  `sim init` also initializes a new Git repository and makes the first commit.\
  Make sure Git is installed and configured. Otherwise the command might fail.\
</Info>\
\
After successfully running init, you'll see:\
\
```text\
INFO sim::init: Successfully initialized a new Sim IDX app\
```\
\
## Authentication\
\
Create a new API key in the [Sim dashboard](https://sim.dune.com/) so you can authenticate in the CLI and test your new sample app.\
\
<Frame caption="To generate a new API key, visit the Keys page and click the New button.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/sim-idx-authentication.png" />\
</Frame>\
\
Give your new API key a unique name and select **Sim IDX CLI** for the key's purpose.\
After you've created your key, copy its value, go back to the CLI, and run:\
\
```bash\
sim authenticate\
```\
\
Paste the API key you created and press Enter.\
Once you've successfully authenticated, you'll see the following:\
\
```\
INFO sim::authenticate: Verifying API Key...\
INFO sim::authenticate: API Key verified successfully.\
INFO sim::authenticate: API Key successfully saved.\
```\
\
## Test Your Listener\
\
Now you can test to make sure your sample app's listener is working correctly:\
\
```bash\
sim listeners evaluate \\
  --start-block 22757345 \\
  --chain-id 1\
```\
\
<Note>\
  In this case, `sim listeners evaluate` processes only a single block.\
  See the [CLI Overview](/idx/cli#sim-listeners-evaluate) for details.\
</Note>\
\
After the command finishes, you'll see a summary of indexed events.\
If everything succeeds, your listener is working correctly.\
\
## Next Steps\
\
You've now got a working contract listener.\
Next, you'll deploy your app so it can index data continuously.\
If you'd like to go further, you can refine and extend your listener to capture even more onchain data.\
\
<Columns cols={2}>\
  <Card title="App Deployment" href="/idx/deployment">\
    Learn how to deploy your Sim IDX app to production\
  </Card>\
\
  <Card title="Listener Contracts" href="/idx/listener">\
    Dive deeper into writing and testing listener contracts\
  </Card>\
</Columns>\
\
# API Development\
Source: https://docs.sim.dune.com/idx/apis\
\
Sim IDX provides a complete serverless API development environment with built-in database connectivity, automatic scaling, and edge deployment.\
Whether you're building simple data endpoints or advanced features, the platform handles infrastructure concerns so you can focus on your business logic.\
\
This guide walks you through the complete API development lifecycle on the platform.\
\
## Infrastructure & Scalability\
\
Your API runs on **Cloudflare Workers** with the **Hono** framework.\
Anything you can do in Hono will also work here.\
Your data is stored in a **Neon** Postgres accessed through Cloudflare **Hyperdrive**.\
Requests execute at the edge close to users, and database connections are pooled automatically, so you don’t have to manage servers or connection limits.\
\
<Note>\
  The setup scales with your traffic, but there are sensible platform limits. If you anticipate sustained very high volume, please [contact us](/support) so we can make sure everything runs smoothly.\
</Note>\
\
## Local Development Setup\
\
Building APIs on Sim IDX follows a streamlined workflow: develop locally, write endpoints to query your indexed data, and deploy with a simple git push.\
The boilerplate API in the `apis/` directory gives you a starting point with common patterns for querying your indexed blockchain data and serving it through HTTP endpoints.\
\
Before deploying, you can run and test your API locally.\
\
<Steps>\
  <Step title="Navigate to the API directory">\
    ```bash\
    cd apis\
    ```\
  </Step>\
\
  <Step title="Set Up Environment Variable">\
    Create a file named `.dev.vars` in the `apis/` directory. Add the database connection string, which you can find on the [App Page](/idx/app-page#db-connection) after deploying your app for the first time.\
\
    ```plaintext .dev.vars\
    DB_CONNECTION_STRING="your_database_connection_string_from_app_page"\
    ```\
  </Step>\
\
  <Step title="Install Dependencies">\
    ```bash\
    npm install\
    ```\
  </Step>\
\
  <Step title="Start the Development Server">\
    ```bash\
    npm run dev\
    ```\
\
    Your API is now running locally at `http://localhost:8787`.\
  </Step>\
</Steps>\
\
## Understand the API Code\
\
The boilerplate API in `apis/src/index.ts` is a TypeScript application that runs on Cloudflare Workers. It connects to your indexed database and exposes HTTP endpoints to query your data. Let's understand how this works:\
\
### Framework Setup\
\
The API uses the `sim-idx` helper library, which wraps **Hono** and **Drizzle** to simplify setup:\
\
```typescript\
import { App, db, types } from "sim-idx";\
import { eq, sql } from "drizzle-orm";\
import { poolCreated, ownerQueried } from "./db/schema/Listener";\
```\
\
**Hono** handles HTTP requests and routing, while **Drizzle** provides a type-safe way to query your PostgreSQL database.\
\
### Environment Configuration\
\
`sim-idx` handles database credentials for you in both local development and deployed environments, so no additional environment variables are required.\
\
### Application Instance\
\
Create the web application with a single call:\
\
```typescript\
const app = App.create();\
```\
\
### Database Connection Management\
\
Instead of managing your own connection pool, call `db.client(c)` inside a request handler to reuse the shared Drizzle client:\
\
```typescript\
const rows = await db.client(c)\
.select()\
.from(poolCreated)\
.limit(10);\
```\
\
## Add a New Endpoint\
\
Let's build three endpoints to serve our indexed data:\
\
* `/api/pools` - Get recent Uniswap V3 pools\
* `/api/owner-changed` - Get recent owner changed events\
* `/api/pools/count` - Get total number of pools\
\
### Creating the Pools Endpoint\
\
Let's create our first endpoint to fetch the 10 most recent Uniswap V3 pools. This endpoint will query the `pool_created` table we created in our listener:\
\
```typescript\
// Endpoint to get the 10 most recent Uniswap V3 pools\
app.get("/api/pools", async (c) => {\
try {\
    const rows = await db.client(c)\
      .select()\
      .from(poolCreated)\
      .limit(10);\
\
    return Response.json({ data: rows });\
} catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: (e as Error).message }, { status: 500 });\
}\
});\
```\
\
This endpoint uses a simple SQL query to fetch the most recent pools. The `LIMIT 10` clause ensures we don't return too much data at once. In a production environment, you might want to add pagination and filtering options.\
\
### Adding the Owner Changed Endpoint\
\
<Note>\
  Before continuing, make sure you've added support for the `OwnerChanged` event in your listener contract by following the ["Triggering more functions and events"](/idx/listener#trigger-onchain-activity) section of the Listener guide and then running:\
\
  ```bash\
  sim build\
  ```\
\
  Running `sim build` regenerates `apis/src/db/schema/Listener.ts` with a new `ownerChanged` table binding that we import below.\
</Note>\
\
Now let's add an endpoint to fetch the 10 most recent owner changed events. This will query the `owner_changed` table:\
\
```typescript\
// Endpoint to get the 10 most recent owner changed events\
app.get("/api/owner-changed", async (c) => {\
try {\
    const rows = await db.client(c)\
      .select()\
      .from(ownerChanged)\
      .limit(10);\
\
    return Response.json({ data: rows });\
} catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: (e as Error).message }, { status: 500 });\
}\
});\
```\
\
### Creating the Pool Count Endpoint\
\
Finally, let's add an endpoint to get the total number of pools. This will be useful for pagination and analytics:\
\
```typescript\
// Endpoint to get the total number of pools\
app.get("/api/pools/count", async (c) => {\
try {\
    const [{ total }] = await db.client(c)\
      .select({ total: sql<number>`COUNT(*)` })\
      .from(poolCreated);\
\
    return Response.json({ data: total });\
} catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: (e as Error).message }, { status: 500 });\
}\
});\
```\
\
This endpoint uses an aggregate query to efficiently count pools without fetching every row.\
\
### Testing Your Endpoints\
\
After adding all three endpoints, you can test them locally:\
\
* `http://localhost:8787/api/pools` - Get recent pools\
* `http://localhost:8787/api/owner-changed` - Get recent owner changed events\
* `http://localhost:8787/api/pools/count` - Get total pool count\
\
## Authenticate API Endpoints\
\
Sim IDX provides built-in authentication middleware that integrates seamlessly with your app and the platform.\
\
When deployed to production, the authentication middleware requires a valid Sim IDX App Endpoints API key to be passed with each request. Sim's infrastructure validates the key and, if successful, allows the request to proceed. Unauthenticated requests will be rejected with a `401 Unauthorized` error.\
\
During local development, the authentication middleware automatically disables authentication checks when your API is running locally (i.e., when `NODE_ENV` is not `production`). This allows for a frictionless development experience without needing to manage API keys while testing your endpoints.\
\
### Create a Sim IDX App Endpoints API Key\
\
Your API will need a Sim IDX App Endpoints API key to access your authenticated endpoints. They can generate a new key from the [Sim dashboard](https://sim.dune.com/).\
\
<Frame caption="To generate a new API key, visit the Keys page and click the New button.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/sim-idx-app-endpoints-api-key.png" />\
</Frame>\
\
When creating the key, its purpose should be set to **Sim IDX App Endpoints**. This key must be kept secure and should not be exposed in client-side code.\
\
### Understanding the Authentication Middleware\
\
The authentication middleware is enabled by default in your API. When you create a new Sim IDX app, the boilerplate code in `apis/src/index.ts` already includes the necessary authentication setup:\
\
```typescript apis/src/index.ts\
import { App, db, types, middlewares } from "@duneanalytics/sim-idx";\
import { eq, sql } from "drizzle-orm";\
import { poolCreated, ownerChanged } from "./db/schema/Listener";\
\
const app = App.create();\
\
// Authentication middleware is applied to all routes by default\
app.use("*", middlewares.authentication);\
\
// Your endpoints...\
app.get("/api/pools", async (c) => {\
// ...\
});\
\
export default app;\
```\
\
The `middlewares.authentication` is applied to all routes using the `app.use("*", middlewares.authentication)` line. This ensures that every endpoint in your API requires authentication when deployed.\
\
### Calling Your Authenticated API\
\
Once your API is deployed, you must include their Sim IDX App Endpoints API key in the `Authorization` header with every request.\
\
Here's an example using cURL:\
\
```bash\
curl --request GET \\
  --url https://<your-api-url>/api/pools \\
  --header 'Authorization: Bearer YOUR_SIM_IDX_APP_ENDPOINTS_API_KEY'\
```\
\
Replace `<your-api-url>` with your deployment's base URL and `YOUR_SIM_IDX_APP_ENDPOINTS_API_KEY` with a valid Sim IDX App Endpoints API key.\
\
## Deploy Your API\
\
<Columns cols={1}>\
  <Card title="App Deployment Guide" href="/idx/deployment">\
    Haven't connected your GitHub repo to Sim yet? Follow the App Deployment guide to link your project and trigger the first build.\
  </Card>\
</Columns>\
\
Once your repository is connected, shipping updates is as simple as pushing code:\
\
* Push commits to the `main` branch to roll out a new **production** deployment.\
* Push to any other branch to spin up a **preview** deployment with its own URL — perfect for staging and pull-request reviews.\
\
Sim IDX automatically builds your Cloudflare Worker and updates the deployment status in the dashboard. No CLI command is required.\
\
# App Page for Live Monitoring\
Source: https://docs.sim.dune.com/idx/app-page\
\
Monitor your deployed Sim IDX app with high-level metrics, build health, database access and automatically generated APIs.\
\
The **App Page** is the central place to monitor your IDX app after it has been deployed.\
Here you can track ingestion progress, inspect generated endpoints, check build health and grab the database connection string.\
\
<Info>\
  If you have not deployed your IDX app yet, follow the [Deployment guide](/idx/deployment) first.\
</Info>\
\
<Frame caption="Your app's individual deployment page">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/individual-app.png" />\
</Frame>\
\
## Overview metrics\
\
At the very top you will see a stats bar that summarises your app's activity: the chains it indexes, the connected GitHub repository and API metrics such as total requests, peak RPS and success rate over the last 24 hours. The numbers update live so you can leave the tab open while you ship new endpoints.\
\
## Current deployment\
\
This card shows the build that is currently serving traffic.\
\
It displays the **Deployment ID** (unique UUID for this deployment), **Environment** (Production points to the `main` branch while Preview builds are generated for branches other than `main`), **Commit** (Git SHA together with the GitHub author), and **Last deployed** (relative timestamp).\
\
When a build is running the status badge moves from **Building → Ingesting → Ready**. Previous builds stay available in the [**Other deployments**](#other-deployments).\
\
<Note>\
  During **Ingesting**, real-time indexing is live and historical backfill runs to completion. The backfill re-triggers only when you change your Listener Contract. See the full details in [Build and Ingestion Lifecycle](/idx/deployment-environments#build-and-ingestion-lifecycle).\
</Note>\
\
### DB connection\
\
A Postgres **DB connection** string is issued for every deployment.\
It follows the pattern\
\
```text\
postgres://<user>:<password>@<host>:<port>/<database>\
```\
\
Paste it into `psql`, Supabase Studio, DBeaver or any other SQL client to explore your tables directly.\
\
### API base routes\
\
Two base URLs are generated:\
\
1. **Latest**: always points at the newest deployment, be it preview or production.\
2. **Production**: permanently mapped to the most recent production build in the `/main` branch.\
\
## Endpoints\
\
Every endpoint that you add to your API appears here with usage statistics and a status badge. Click an endpoint to view detailed usage metrics.\
\
## Events\
\
If your app emits events you will see an **Events** table. For each event you can view:\
\
* Status (*Running*, *Paused* or error).\
* Latest processed block.\
* Total records stored.\
* Disk size consumed in the DB.\
\
Click an event to open a detailed view that shows catch-up progress, the last five processed events and full logs.\
\
## Other deployments\
\
The **Other deployments** panel lists every build that ran for this app. For each row you can:\
\
* View the deployment hash, status, environment and commit.\
* Open build logs to debug failures.\
\
Clicking a deployment switches the entire App Page to that build, letting you inspect its endpoints, events and metrics in isolation.\
\
# App Folder Structure\
Source: https://docs.sim.dune.com/idx/app-structure\
\
Understand the folder structure of a Sim IDX app.\
\
```text\
my-idx-app/\
├── sim.toml                       # App configuration\
├── abis/                          # JSON ABIs for the contracts you want to index\
├── apis/                          # TypeScript/Edge runtime APIs (Node.js project)\
│   ├── drizzle.config.ts          # Drizzle ORM configuration\
│   └── src/                       # API source code\
│       ├── index.ts               # Main API entry point\
│       └── db/                    # Database schema and utilities\
│           └── schema/            # Auto-generated database schema\
│               └── Listener.ts    # Schema generated from listener events\
└── listeners/                     # Foundry project for indexing logic\
    ├── src/\
    │   └── Main.sol               # Triggers contract and main listener logic\
    ├── test/\
    │   └── Main.t.sol             # Unit tests for your listener\
    └── lib/\
        ├── sim-idx-sol/           # Core Sim IDX framework (DSL, context, helpers)\
        └── sim-idx-generated/     # Code generated from the ABIs you add\
```\
\
Running `sim init` creates a new Sim IDX app with the folder structure shown above.\
The following sections explain each folder's purpose and contents in detail.\
\
## App Folder Structure\
\
#### sim.toml\
\
The `sim.toml` file is your app's main configuration file. It contains your app's `name` and a `[listeners]` table for configuring code generation.\
\
```toml\
[app]\
name = "my-test"\
```\
\
The `name` field is used internally by Sim IDX for resource naming and deployment.\
\
```toml\
[listeners]\
codegen_naming_convention = "plain"\
```\
\
The `codegen_naming_convention` field in the `[listeners]` table controls how function and type names are generated from your ABIs. This manages potential name conflicts when you index multiple contracts. It supports two values:\
\
* **`"plain"` (Default):** Generates clean names without any prefixes (e.g., `onSwapFunction`). This is the most common setting, especially when you split logic for different ABIs into separate listener contracts.\
* **`"abi_prefix"`:** Prefixes generated names with the ABI's name (e.g., `ABI1$onSwapFunction`). Use this option to prevent compilation errors when a single listener contract must handle functions with the same name from two different ABIs.\
\
#### abis/\
\
The `abis/` folder contains JSON ABI files of smart contracts you want to index. The sample app includes `abis/UniswapV3Factory.json` for the Uniswap V3 Factory contract.\
\
<Note>\
  When you add a new ABI with the [`sim abi add`](/idx/cli#sim-abi-add-\<file-path>) CLI command, it automatically generates Solidity bindings in `listeners/lib/sim-idx-generated/`.\
</Note>\
\
#### apis/\
\
The `apis/` folder is a complete Node.js project that provides TypeScript API endpoints running on the Cloudflare Workers Edge runtime.\
\
The `src/index.ts` file defines your HTTP routes, while `src/db/schema/Listener.ts` is produced by `sim build` and exposes your listener-generated tables through Drizzle ORM for type-safe queries.\
\
<Columns cols={1}>\
  <Card title="API Development" href="/idx/apis">\
    Build fast, type-safe endpoints backed by your indexed data.\
  </Card>\
</Columns>\
\
#### listeners/\
\
The `listeners/` folder is a Foundry project that contains everything related to on-chain indexing. The `Triggers` contract must be defined in `src/Main.sol`, but handler logic can be implemented in one or more listener contracts, which can have any name and be defined across multiple `.sol` files in the `src/` directory. **Unit tests live under the `test/` directory. Foundry will discover any file ending in `.t.sol`, so you can add as many unit-test files as you need (e.g., `Main.t.sol`, `SwapHandlers.t.sol`, etc.).**\
\
During `sim build`, the framework inserts core helpers into `lib/sim-idx-sol/` and writes ABI-specific bindings into `lib/sim-idx-generated/`. These generated files should not be edited directly.\
\
<Columns cols={1}>\
  <Card title="Listener Development" href="/idx/listener">\
    Learn how to create triggers and write handler logic in Solidity.\
  </Card>\
</Columns>\
\
## Development Workflow\
\
Here's how these folders work together:\
\
1. **Add Contract ABI** → `abis/YourContract.json`\
2. **Generate Bindings** → `sim abi add` creates Solidity bindings\
3. **Extend Listener** → Implement handlers in `listeners/src/`\
4. **Test Logic** → Write tests in `listeners/test/` (e.g., any `*.t.sol` files)\
5. **Build APIs** → Use generated schema in `apis/src/` to query your data\
6. **Deploy** → Push your changes to a branch (or `main`) and follow the steps in the [deployment guide](/idx/deployment) to promote them to a live environment\
\
# Build with AI for Sim IDX\
Source: https://docs.sim.dune.com/idx/build-with-ai\
\
Build Sim IDX apps faster using LLMs and AI assistants.\
\
We provide several resources to help you use LLMs and AI coding assistants to build Sim IDX apps much faster. Using AI, you can automate boilerplate, enforce best practices, and focus on the unique logic of your app.\
\
## Cursor Rules for Sim IDX\
\
To supercharge your Sim IDX development, you can use our official Cursor Rules. By defining rules, you can teach the LLM that you use in Cursor about Sim IDX's specific architecture, coding patterns, and app structure. This makes sure that any generated code, from Solidity listeners to TypeScript APIs, is consistent and follows best practices.\
\
To add a rule, create a file with the specified name in the correct directory, and copy and paste the content for that rule into the file. Cursor will automatically detect and apply the rule.\
\
<Frame caption="Create a new Project Rule in Cursor by creating the file. Cursor will automatically pick it up.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/cursor-new-rule.png" />\
</Frame>\
\
### Root Rule for Sim IDX Development\
\
This rule provides high-level guidance on the overall project structure, Solidity listeners, and core `sim` CLI commands. It should be applied to your entire project.\
\
````markdown .cursor/idx.mdc [expandable]\
---\
description: "Core principles, structure, and workflows for developing on the Sim IDX framework. Provides high-level guidance on listeners, APIs, and the CLI."\
globs:\
alwaysApply: true\
---\
\
# Sim IDX Project Rules\
\
You are an expert full-stack blockchain developer specializing in the Sim IDX framework. Your primary goal is to assist in building and maintaining Sim IDX applications, which consist of Solidity listeners for indexing on-chain data and TypeScript APIs for serving that data.\
\
Refer to the complete Sim IDX documentation for detailed information: `https://docs.sim.dune.com/llms-full.txt`\
\
## 1. Sim IDX Framework Overview\
\
- **Core Concept**: Sim IDX is a framework for indexing blockchain data. It uses on-chain Solidity contracts (**Listeners**) to react to events and function calls, and a serverless TypeScript application (**API**) to serve the indexed data from a PostgreSQL database.\
- **Data Flow**: On-chain activity -> Triggers Listener Handler -> Listener Emits Event -> Sim IDX writes to DB -> API queries DB -> Client consumes API.\
\
## 2. Project Structure\
\
- **`sim.toml`**: The main configuration file for your app. Defines the app name and code generation settings.\
- **`abis/`**: Contains the JSON ABI files for the smart contracts you want to index. Use `sim abi add abis/<path/to/abi.json>` to register them.\
- **`listeners/`**: A Foundry project for the on-chain indexing logic.\
    - `src/Main.sol`: Must contain the `Triggers` contract. Listener logic can be here or in other `.sol` files in `src/`.\
    - `test/`: Contains unit tests for your listeners (`*.t.sol` files).\
    - `lib/sim-idx-generated/`: Contains auto-generated Solidity bindings from your ABIs. **Do not edit these files manually.**\
- **`apis/`**: A Hono + Drizzle project for your TypeScript APIs, running on Cloudflare Workers.\
    - `src/index.ts`: The main entry point for your API routes (Hono framework).\
    - `src/db/schema/Listener.ts`: Auto-generated Drizzle ORM schema from your listener events. Regenerated by `sim build`.\
\
## 3. Core Development Workflow\
\
1.  **Add ABI**: Place a new contract ABI in `abis/` and run `sim abi add abis/YourContract.json`.\
2.  **Write Listener**: In `listeners/src/`, create or extend a listener contract. Inherit from the generated abstract contracts (e.g., `ContractName$OnEventName`) to implement handlers. These can be found in `lib/sim-idx-generated/`.\
3.  **Define Events**: In your listener, declare events. These events define the schema of your database tables. The event name is converted to `snake_case` for the table name. If your event has more than about 10 properties, use a struct to group the properties and define the event with an unnamed struct. Otherwise, you can define the event with individual parameters.\
4.  **Optionally Add Indexes**: In your listener, optionally add indexes to the event structs using the `@custom:index` annotation to improve the performance of the database query if necessary.\
5. **Register Triggers**: In `listeners/src/Main.sol`, update the `Triggers` contract to register your new handlers using `addTrigger()`.\
6. **Test Listener**: Write unit tests in `listeners/test/` and run with `sim test`. Validate against historical data with `sim listeners evaluate`.\
7. **Build Project**: Run `sim build`. This compiles your Solidity code and generates/updates the Drizzle schema in `apis/src/db/schema/Listener.ts`.\
8.  **Write API**: In `apis/src/`, create or update API endpoints in `index.ts` to query the new tables using the Drizzle ORM.\
9. **Evaluate**: Run `sim listeners evaluate` to evaluate the listener against historical data.\
10.  **Deploy**: Push your code to a GitHub branch. Pushing to `main` deploys to production. Pushing to any other branch creates a preview deployment.\
\
## 4. Solidity Listener Best Practices\
\
### Contract Structure\
- Always import `import "sim-idx-sol/Simidx.sol";` and `import "sim-idx-generated/Generated.sol";`.\
- The `Triggers` contract in `Main.sol` must extend `BaseTriggers` and implement the `triggers()` function.\
- For code organization, implement listener logic in separate files/contracts and instantiate them in `Triggers`.\
- Import any listeners in other files you need in `Main.sol` like so:\
\
```solidity\
// listeners/src/Main.sol\
import "./MyListener.sol";\
contract Triggers is BaseTriggers {\
      function triggers() external virtual override {\
          MyListener listener = new MyListener();\
          addTrigger(chainContract(...), listener.triggerOnMyEvent());\
      }\
}\
```\
\
### Advanced Triggering\
\
- **By Address (Default)**: `chainContract(Chains.Ethereum, 0x...)`\
- **By ABI**: `chainAbi(Chains.Ethereum, ContractName$Abi())` to trigger on any contract matching an ABI.\
- **Globally**: `chainGlobal(Chains.Ethereum)` to trigger on every block, call, or log on a chain.\
\
### Context and Inputs\
\
- Handler functions receive context objects (`EventContext`, `FunctionContext`) and typed input/output structs. To find the correct context objects, look in `lib/sim-idx-generated/`.\
- Access block/transaction data via global helpers and context objects. Key values include `blockNumber()`, `block.timestamp`, `block.chainid`, and `ctx.txn.hash`. Note that `blockNumber()` is a function call.\
- Access event/function parameters via the `inputs` struct (e.g., `inputs.from`, `inputs.value`).\
\
### Common Pitfalls & Solutions\
\
- **Name Conflicts**: If two ABIs have a function/event with the same name, either:\
    1.  (Recommended) Split logic into two separate listener contracts.\
    2.  Set `codegen_naming_convention = "abi_prefix"` in `sim.toml` to use prefixed handler names (e.g., `ABI1$onSwapFunction`).\
- **Stack Too Deep Errors**: If an event has >16 parameters, use a `struct` to group them and emit the event with the struct as a single, **unnamed** parameter. Sim IDX will automatically flatten the struct into columns.\
    ```solidity\
    struct MyEventData { /* 20 fields... */ }\
    event MyEvent(MyEventData); // Correct: unnamed parameter\
    // event MyEvent(MyEventData data); // Incorrect\
    ```\
\
## 5. Key CLI Commands\
\
- `sim init [--template=<name>]`: Initialize a new app.\
- `sim authenticate`: Save your Sim API key.\
- `sim abi add <path/to/abi.json>`: Add an ABI and generate bindings.\
- `sim build`: Compile contracts and generate API schema.\
- `sim test`: Run Foundry unit tests from `listeners/test/`.\
- `sim listeners evaluate --chain-id <id> --start-block <num> [--listeners=<name>]`: Dry-run listener against historical blocks.\
````\
\
### API Development Rule\
\
This rule provides detailed guidelines for building TypeScript APIs in the `apis/` directory using Hono and Drizzle.\
\
````markdown apis/.cursor/apis.mdc [expandable]\
---\
description: "Detailed guidelines and patterns for building TypeScript APIs with Hono and Drizzle on the Sim IDX platform. Covers setup, queries, auth, and best practices."\
globs:\
  - "*.ts"\
  - "*.tsx"\
alwaysApply: false\
---\
\
# Sim IDX API Development Rules\
\
You are an expert API developer specializing in building serverless APIs with Hono, Drizzle, and TypeScript on the Sim IDX platform. Your focus is on writing clean, efficient, and type-safe code for the `apis/` directory.\
\
## 1. Framework & Setup\
\
- **Stack**: Your API runs on **Cloudflare Workers** using the **Hono** web framework and **Drizzle ORM** for database access.\
- **App Initialization**: The app instance is created once with `const app = App.create();`.\
- **Database Client**: Access the Drizzle client within a request handler via `const client = db.client(c)`. Never manage your own database connections.\
- **Local Development**:\
    - Run `npm install` to get dependencies.\
    - Create `apis/.dev.vars` and add your `DB_CONNECTION_STRING` from the app page on sim.dune.com.\
    - Start the server with `npm run dev`, available at `http://localhost:8787`.\
\
## 2. API Endpoint Best Practices\
\
- **RESTful Naming**: Use RESTful conventions (e.g., `/api/pools`, `/api/pools/:id`).\
- **Parameter Validation**: Always validate and sanitize user-provided input (e.g., query params, request body) before using it in a database query.\
\
```typescript\
// GOOD EXAMPLE: Complete, safe endpoint\
app.get("/api/pools/:poolAddress", async (c) => {\
  try {\
    const { poolAddress } = c.req.param();\
\
    // Basic validation\
    if (!poolAddress.startsWith('0x')) {\
        return Response.json({ error: "Invalid pool address format" }, { status: 400 });\
    }\
\
    const client = db.client(c);\
    const result = await client\
      .select({\
        pool: poolCreated.pool,\
        token0: poolCreated.token0,\
        token1: poolCreated.token1,\
        fee: poolCreated.fee\
      })\
      .from(poolCreated)\
      .where(eq(poolCreated.pool, poolAddress))\
      .limit(1);\
\
    if (result.length === 0) {\
        return Response.json({ error: "Pool not found" }, { status: 404 });\
    }\
\
    return Response.json({ data: result[0] });\
  } catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: "Internal Server Error" }, { status: 500 });\
  }\
});\
```\
\
## 3. Drizzle ORM Query Patterns\
\
- **Schema Source**: The Drizzle schema is auto-generated in `apis/src/db/schema/Listener.ts` when you run `sim build`. Always import table objects from this file.\
- **Explicit Columns**: Avoid `select()` without arguments. Always specify the columns you need for better performance and type safety.\
- **Prefer ORM**: Use Drizzle's expressive methods. Only use the `sql` helper for complex queries that Drizzle cannot represent.\
- **Pagination**: Implement pagination for all list endpoints. Use `.limit()` and `.offset()` and enforce a reasonable maximum limit (e.g., 100).\
\
```typescript\
// Get a count\
const [{ total }] = await client.select({ total: sql<number>`COUNT(*)` }).from(poolCreated);\
\
// Complex filtering and ordering\
const page = 1;\
const limit = 50;\
const results = await client\
  .select()\
  .from(usdcTransfer)\
  .where(and(\
      eq(usdcTransfer.from, '0x...'),\
      gte(usdcTransfer.value, '1000000')\
  ))\
  .orderBy(desc(usdcTransfer.blockNumber))\
  .limit(limit)\
  .offset((page - 1) * limit);\
```\
\
## 4. Authentication\
\
- **Middleware**: Sim IDX provides built-in authentication. Enable it for all routes by adding `app.use("*", middlewares.authentication);` after `App.create()`.\
- **Production Behavior**: In production, this middleware will reject any request without a valid Sim IDX App Endpoints API key with a `401 Unauthorized` error.\
- **Local Behavior**: The middleware is automatically disabled during local development.\
- **Calling Authenticated API**: Clients must include the key in the `Authorization` header.\
```bash\
curl --url https://<your-api-url>/api/pools \\
    --header 'Authorization: Bearer YOUR_SIM_IDX_APP_ENDPOINTS_API_KEY'\
```\
````\
\
## Develop with AI Agents\
\
We highly recommend using AI agents to accelerate your Sim IDX development. Cursor's **Background Agents** are particularly useful for this.\
\
Background Agents are asynchronous assistants that can work on your codebase in a remote environment. You can assign them tasks like writing new listeners, building out API endpoints, or fixing bugs, and they will work in the background, pushing changes to a separate branch for your review. This lets you offload complex tasks and focus on other parts of your app.\
\
To get started with Background Agents:\
\
1. Press `⌘E` to open the control panel.\
2. Write a detailed prompt for your agent (e.g., "Create a new Solidity listener for the USDC Transfer event and a corresponding TypeScript API endpoint to query transfers by address").\
3. Select the agent from the list to monitor its progress or provide follow-up instructions.\
\
<Frame caption="Starting a Cursor Background Agent">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/cursor-background-agents.png" />\
</Frame>\
\
## Add Docs to Cursor\
\
To integrate our documentation directly into Cursor:\
\
1. Go to **Cursor Settings -> Indexing & Docs -> Add Doc**.\
2. Enter `docs.sim.dune.com/idx` in the URL field.\
3. Provide a name (e.g., "@simdocs").\
4. Hit confirm. The documentation will sync automatically.\
5. Reference Sim IDX documentation by typing `@simdocs` (or your chosen name) in your Cursor chat window.\
\
<Frame caption="Add our docs to Cursor to use it in your chats">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/cursor-add-docs.png" />\
</Frame>\
\
## AI Search\
\
To ask questions about our documentation, click the **Ask AI** button in the header of the site. This opens a chat interface, powered by Mintlify, that understands natural language queries. Ask questions about endpoints, authentication, or specific data points, and it will answer you with the most relevant, accurate information.\
\
## Use with LLMs\
\
### Complete Documentation for LLMs\
\
For LLM applications such as custom agents, RAG systems, or any scenario requiring our complete documentation, we provide an optimized text file at [`https://docs.sim.dune.com/llms-full.txt`](https://docs.sim.dune.com/llms-full.txt).\
\
### Per-Page Access\
\
You can get the Markdown version of any documentation page by appending `.md` to its URL. For example, `/guides/replace-a-sample-api` becomes [`https://docs.sim.dune.com/guides/replace-a-sample-api.md`](https://docs.sim.dune.com/guides/replace-a-sample-api.md).\
\
Additionally, in the top-right corner of each page, you will find several options to access the page's content in LLM-friendly formats:\
\
* **Copy Page:** Copies the fully rendered content of the current page.\
* **View Markdown:** Provides a URL with the raw Markdown source. This is ideal for direct input into LLMs.\
* **Open with ChatGPT:** Instantly loads the page's content into a new session with ChatGPT. Ask questions, summarize, or generate code based on the page's content.\
\
<Frame caption="Copy the page, view raw markdown, or open with ChatGPT">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/mintlify-open-with-chatgpt.png" />\
</Frame>\
\
You can also type `⌘C` or `Ctrl+C` to copy any page's Markdown content.\
Try it now.\
\
# Changelog\
Source: https://docs.sim.dune.com/idx/changelog\
\
Product updates and announcements\
\
<Update label="August 19, 2025" description="CLI v0.0.95">\
  The Sim IDX framework has been updated with a new core import and a standardized function for accessing the block number in listener contracts.\
\
  **What's new:**\
\
  * **Core Import:** All listeners should now include `import "sim-idx-sol/Simidx.sol";`. This file provides essential framework helpers required for core functionality.\
  * **`blockNumber()` Function:** This function is now available to get the current block number. Use this instead of `block.number` for standardized access across all supported blockchains.\
\
  **Impact:**\
\
  To use the `blockNumber()` function, listeners must include the `sim-idx-sol/Simidx.sol` import. Attempting to call the function without the import will result in a compilation error. Going forward, all listener contracts should adopt this pattern to access core framework features.\
\
  ```diff Example Listener\
  // SPDX-License-Identifier: UNLICENSED\
  pragma solidity ^0.8.13;\
\
  + import "sim-idx-sol/Simidx.sol";\
    import "sim-idx-generated/Generated.sol";\
\
  contract MyListener is MyContract$OnMyEvent {\
      event MyEvent(uint64 chainId, uint256 blockNum);\
\
      function onMyEvent(\
          EventContext memory /*ctx*/,\
          MyContract$MyEventParams memory /*inputs*/\
      ) external override {\
          emit MyEvent(\
              uint64(block.chainid),\
  -           block.number\
  +           blockNumber()\
          );\
      }\
  }\
  ```\
</Update>\
\
<Update label="August 5, 2025" description="CLI v0.0.86">\
  **New Feature: Custom Block Range Support**\
\
  You can now specify custom block ranges for your triggers, allowing you to target specific blocks or time periods for each trigger.\
\
  **What's new:**\
\
  * Chain helper functions now support `.withStartBlock()`, `.withEndBlock()`, and `.withBlockRange()` methods\
  * Block range support for contract, ABI, and global targets\
\
  **Examples:**\
\
  **Range from Block Onwards**\
\
  ```solidity\
  addTrigger(chainContract(Chains.Ethereum.withStartBlock(10000000), 0x1F98431c8aD98523631AE4a59f267346ea31F984), listener.triggerOnPoolCreatedEvent());\
  ```\
\
  This creates a trigger that listens to events starting from block 10,000,000 onwards with no end block. The `withStartBlock()` method creates a `BlockRange` struct with `BlockRangeKind.RangeFrom`, meaning it captures all blocks from the specified start block to the latest available block.\
\
  **Inclusive Block Range**\
\
  ```solidity\
  addTrigger(chainContract(Chains.Ethereum.withStartBlock(10000000).withEndBlock(10000001), 0x1F98431c8aD98523631AE4a59f267346ea31F984), listener.triggerOnPoolCreatedEvent());\
  ```\
\
  This creates a trigger that listens to events only within blocks 10,000,000 to 10,000,001 (both inclusive). The `withEndBlock()` method modifies the `BlockRange` to use `BlockRangeKind.RangeInclusive`, creating a bounded range that stops processing after the end block.\
\
  **Using BlockRange Struct Directly**\
\
  ```solidity\
  BlockRange memory range = BlockRangeLib.withStartBlock(100000).withEndBlock(10000001);\
  addTrigger(chainContract(Chains.Ethereum.withBlockRange(range), 0x1F98431c8aD98523631AE4a59f267346ea31F984), listener.triggerOnPoolCreatedEvent());\
  ```\
\
  This demonstrates creating a `BlockRange` struct directly using the `BlockRangeLib` library functions before applying it to the chain. The `BlockRange` struct is available through the `sim-idx-sol` import. This approach gives you more flexibility to reuse ranges across multiple triggers or build complex range logic.\
</Update>\
\
<Update label="July 25, 2025" description="CLI v0.0.83">\
  **CallFrame Properties Are Now Functions**\
\
  Every field on `ctx.txn.call`’s `CallFrame` structure has been updated to use function calls instead of direct property access.\
\
  **What changed:**\
\
  | Old (≤ v0.0.82)          | New (v0.0.83+)             |\
  | ------------------------ | -------------------------- |\
  | `ctx.txn.call.callee`    | `ctx.txn.call.callee()`    |\
  | `ctx.txn.call.caller`    | `ctx.txn.call.caller()`    |\
  | `ctx.txn.call.callData`  | `ctx.txn.call.callData()`  |\
  | `ctx.txn.call.callDepth` | `ctx.txn.call.callDepth()` |\
  | `ctx.txn.call.value`     | `ctx.txn.call.value()`     |\
  | `ctx.txn.call.callType`  | `ctx.txn.call.callType()`  |\
  | *(new)*                  | `ctx.txn.call.delegator()` |\
  | *(new)*                  | `ctx.txn.call.delegatee()` |\
\
  `ctx.txn.call.verificationSource` is unchanged (still a property).\
\
  **Impact:**\
\
  If you were directly reading these fields, your code will no longer compile. Add `()` everywhere you touch `ctx.txn.call.*`.\
\
  ```diff Example (UniswapV3Factory Listener)\
  emit PoolCreated(\
  -     uint64(block.chainid), ctx.txn.call.callee, outputs.pool, inputs.tokenA, inputs.tokenB, inputs.fee\
  +     uint64(block.chainid), ctx.txn.call.callee(), outputs.pool, inputs.tokenA, inputs.tokenB, inputs.fee\
  );\
  ```\
</Update>\
\
<Update label="July 23, 2025" description="CLI v0.0.82">\
  **New Feature: Database Indexing Support**\
\
  You can now define database indexes directly within your listener contracts. This gives you more control over your app's query performance.\
\
  **What's new:**\
\
  * Define indexes directly above your `event` declarations using a `/// @custom:index` comment in your Solidity code.\
  * Support for multiple index types, including `BTREE`, `HASH`, `BRIN`, and `GIN`.\
  * The `sim build` command now validates your index definitions to catch errors early.\
\
  **Benefits:**\
\
  * **Improved Query Performance**: Significantly speed up data retrieval by indexing columns that are frequently used in your API queries.\
  * **Declarative and Convenient**: Manage database performance directly from your Solidity code without writing separate migration scripts.\
  * **Fine-Grained Control**: Apply the right index types to the right columns for optimal performance.\
\
  For more details on how to define indexes, see the [Listener Features](/idx/listener/features#db-indexes) documentation.\
</Update>\
\
<Update label="July 16, 2025" description="CLI v0.0.79">\
  **Breaking Change: Generated Struct Names Now Include Contract Names**\
\
  With CLI version v0.0.79 and upwards, there will be a breaking change that impacts users who import and use generated structs from the ABI.\
\
  **Why this change was needed:**\
  The same struct name can be used across different contracts (example: `GPv2Trade.Data` and `GPv2Interaction.Data` within the same ABI) with different definitions. Using just the struct name for generated structs prevented proper triggering on protocols like CoW Swap.\
\
  **What changed:**\
  We now include the contract name as part of the struct name in the generated Solidity file associated with the ABI. Instead of using `$AbiName$StructName` for the names, we now use `$AbiName$ContractName$StructName`.\
\
  **Impact:**\
  If you have imported a generated struct, you'll need to update the name to include the contract name the next time you run codegen. This doesn't impact the default inputs/outputs/context structs, so most users won't encounter this issue.\
\
  **Who is affected:**\
  You'll only run into this issue if you:\
\
  * Update to use CLI v0.0.79 or higher\
  * Add a new ABI or manually run a new codegen\
  * AND you've been using generated structs that aren't the ones provided in the trigger inputs/outputs object (i.e., you're using a nested struct from the inputs/outputs for some variable or part of the event)\
</Update>\
\
<Update label="July 15, 2025" description="CLI v0.0.78">\
  **New Feature: Multiple Listener Contracts Support**\
\
  The Sim CLI now supports defining multiple listener contracts within a single IDX application, enabling better code organization and structure.\
\
  **What's new:**\
\
  * You can now define listeners in separate files instead of having everything in `Main.sol`\
  * Listeners can be organized across multiple contracts for better code maintainability\
  * The `Main.sol` file still needs to contain the `Triggers` contract, but individual listeners can be defined anywhere\
  * Enhanced `sim listeners evaluate` command to target specific listeners for focused testing\
\
  **Benefits:**\
\
  * **Better Code Organization**: Split large applications with many listeners into manageable, separate files\
  * **Improved Maintainability**: Organize related listeners together (e.g., all DEX-specific listeners in one file)\
  * **Focused Testing**: Evaluate specific listeners without noise from other listeners in your application\
\
  **Migration:**\
\
  * Existing single-file applications continue to work without changes\
  * `Main.sol` must still exist and contain your `Triggers` contract\
  * Listener contracts can be moved to separate files as needed\
\
  This feature is particularly valuable for complex applications like DEX trade indexers that may have 15+ listeners and benefit from better file organization.\
</Update>\
\
<Update label="July 4, 2025" description="CLI v0.0.73">\
  **New Feature: Pre-Execution Triggers**\
\
  The Sim CLI now supports pre-execution triggers, allowing you to execute code *before* a function runs instead of the default behavior of executing after.\
\
  **What's new:**\
\
  * Pre-triggers use corresponding `Pre-` abstract contracts (e.g., `preCreatePoolFunction`)\
  * Handlers receive a `PreFunctionContext` with access to function inputs only (outputs haven't been generated yet)\
  * Enables reactive logic that needs to run before the target function executes\
\
  **Use cases:**\
\
  * Emit events or perform actions based on upcoming function calls\
  * Pre-process or validate function inputs before execution\
  * Set up state or conditions that the main function execution will depend on\
\
  For detailed implementation examples and usage patterns, see the [Function Triggers documentation](/idx/listener#function-triggers).\
</Update>\
\
# CLI Overview\
Source: https://docs.sim.dune.com/idx/cli\
\
The Sim IDX CLI is your primary tool for interacting with the Sim IDX framework.\
You can use the CLI to initialize new projects, manage contract ABIs, and test your listeners.\
\
This page provides an overview of all available commands, their functions, and potential error messages you might encounter.\
\
## Install or Upgrade the CLI\
\
Installing the CLI or Upgrading to the latest version is as simple as rerunning the installer script.\
The installer will download the most recent release and replace your existing `sim` binary.\
\
```bash\
curl -L https://simcli.dune.com | bash\
```\
\
## Available Commands\
\
#### `sim init`\
\
Initializes a new Sim IDX application in the current directory.\
This command creates the standard project structure.\
It includes a `sim.toml` configuration file, a sample listener, and a boilerplate API.\
The command initializes a new Git repository, and makes the first commit containing all generated files.\
\
```bash\
sim init\
```\
\
If the current directory is not empty, the command will fail to prevent overwriting existing files.\
Make sure you run `mkdir new-project` and create a new directory *before* running the init command.\
\
You can optionally scaffold a project from one of the official templates using the `--template` flag.\
For example, to start from the [contract-decoder](https://github.com/duneanalytics/sim-idx-example-contract-decoder) template:\
\
```bash\
sim init --template=contract-decoder\
```\
\
If you omit `--template`, the command uses the default [**sample** template](https://github.com/duneanalytics/sim-idx-example-sample-app).\
\
#### `sim build`\
\
Builds your Foundry project by running `forge build` under the hood. This compiles every Solidity contract in your project—including the listener contracts inside `listeners/`—along with any imported libraries.\
\
```bash\
sim build\
```\
\
If there are compilation errors in your Solidity code, the build will fail.\
The output will provide details from the Solidity compiler to help you debug.\
\
#### `sim test`\
\
Runs the Solidity tests for your listener contracts.\
The tests are located in `listeners/test/`.\
This command first compiles your contracts and then executes the tests using Foundry.\
\
```bash\
sim test\
```\
\
If any of the tests fail, the command will exit with an error.\
The output will show which tests failed and provide assertion details.\
\
#### `sim authenticate`\
\
Saves your Sim IDX API key locally, allowing the CLI to authenticate with the platform.\
You can find and create API keys in the [Sim dashboard](https://sim.dune.com/).\
\
```bash\
sim authenticate\
```\
\
You will be asked to paste your API key and press **Enter**.\
\
<Note>\
  For detailed, step-by-step instructions on obtaining your API key, see the [Quickstart guide](/idx#authentication).\
</Note>\
\
#### `sim help`\
\
Displays help information and available commands for the Sim IDX CLI.\
This command shows usage instructions, available commands, and options.\
\
```bash\
sim help\
```\
\
You can also use `sim --help` or `sim -h` for the same functionality.\
\
#### `sim --version`\
\
Displays the current version of the Sim IDX CLI.\
\
```bash\
sim v0.0.86 (eaddf2 2025-06-22T18:01:14.000000000Z)\
```\
\
<Note>\
  When a CLI command displays an error log, the current CLI version appears at the bottom of the output.\
</Note>\
\
#### `sim abi`\
\
Provides a set of commands for managing contract ABIs and generating corresponding Solidity interfaces for use in your listener.\
\
#### `sim abi add <file_path>`\
\
Registers a contract ABI with your project and generates all the Solidity interfaces, structs, and helper functions your listener needs.\
\
```bash\
sim abi add abis/YourContract.json\
```\
\
Follow these steps *before* running the command:\
\
1. Obtain the contract's ABI JSON from Etherscan or another blockchain explorer.\
2. Inside your project, create a new file in `abis/` (for example, `abis/YourContract.json`).\
3. Paste the ABI JSON into that file and save it.\
4. Run `sim abi add abis/YourContract.json` pointing to the file you just created.\
\
The command fails if the file path you provide does not exist.\
\
#### `sim abi codegen`\
\
Manually regenerates the Solidity interfaces from all ABI files currently in the `abis/` directory. This is useful if the generated files need to be refreshed.\
\
```bash\
sim abi codegen\
```\
\
<Note>\
  In most cases, you don't need to run this command manually because it runs automatically after you execute `sim abi add`. Use it only when you want to force-regenerate the interfaces.\
</Note>\
\
#### `sim listeners`\
\
A namespace for commands that interact with **listener contracts** during local development.\
Similar to `sim abi`, you must append a sub-command after `listeners`.\
\
```bash\
sim listeners <COMMAND>\
```\
\
#### `sim listeners evaluate`\
\
Runs your listener(s) locally against historical main-chain data so you can verify that triggers fire and events are emitted **before** you deploy the app.\
\
```bash\
sim listeners evaluate \\
  --start-block <START_BLOCK> \\
  --chain-id <CHAIN_ID> \\
  --end-block <END_BLOCK> \\
  --listeners <LISTENER_CONTRACT>\
```\
\
<Info>\
  `evaluate` **does not** persist any data. It is purely a local dry-run to ensure your handler logic behaves as expected.\
</Info>\
\
| Flag            | Required      | Description                                                                                                                                                                                                                                                |\
| --------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\
| `--start-block` | Yes           | First block to process.                                                                                                                                                                                                                                    |\
| `--chain-id`    | Conditional\* | Chain ID to test against. If omitted, Sim tries to infer it from your `addTrigger` definitions. Required when your listener has triggers on multiple chains.                                                                                               |\
| `--end-block`   | No            | Last block to process. Provide this if you want to replay more than one block and observe state changes over a range.                                                                                                                                      |\
| `--listeners`   | No            | Specific listener contract to evaluate. Accepts any listener contract within any of the Solidity files in `/listener/src`. If omitted, the command will run all listener contracts in all files. The command will fail if you specify an unknown listener. |\
\
The command compiles your listener, executes the triggers across the block range, and prints a summary such as:\
\
```text\
INFO deploy: {\
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
],\
"errors": []\
}\
```\
\
##### Handling Failed Transaction Events\
\
When you run `sim listeners evaluate`, the output in your terminal may include events where the value of the `name` property is prefixed with `fail_`, such as `fail_PoolCreated`. A `fail_` prefix indicates that the event data was generated from a transaction that **failed** or was **reverted** onchain.\
\
<Info>\
  This output appears exclusively in the terminal during a local `evaluate` run to give you a complete picture of how your listener reacts to all transactions within a block, including failed ones.\
\
  Data from these failed transactions is **not** written to your app's database.It is for informational purposes only.\
</Info>\
\
Here's an example of a failed trace in the terminal:\
\
```text Failed Transaction Example\
INFO deploy: {\
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
],\
"errors": []\
}\
```\
\
# DB Inspection\
Source: https://docs.sim.dune.com/idx/db\
\
After deploying your Sim IDX app, the framework automatically provisions a dedicated PostgreSQL database to store your indexed on-chain data.\
The deployment output provides you with a read-only connection string to access this database directly.\
\
You can use this during development to verify your schema, inspect live data, and create queries while building your API.\
\
<Note>\
  The database connection string provided after deployment is intended for development and debugging.\
  Your deployed [APIs](/idx/apis) will connect to a separate, production-ready database instance with the same schema.\
</Note>\
\
## Connect to Your Database\
\
Use the [database connection string](/idx/app-page#db-connection) provided in your app's deployment to connect with any standard PostgreSQL client.\
\
```\
postgres://username:password@host/database?sslmode=require\
```\
\
For example, using `psql`:\
\
```bash\
# Connect using the full connection string\
psql "your_connection_string_here"\
```\
\
<Info>\
  You can also use clients like DBeaver, Postico, or Beekeeper Studio for a more visual way to explore your data and schema.\
</Info>\
\
## Understand the Schema\
\
The structure of your database is directly determined by the `event` definitions in your `Main.sol` contract.\
\
* **Views**: Each `event` in your listener creates a corresponding queryable view in the database. The view name is the lowercase `snake_case` version of the event name.\
* **Columns**: The parameters of the event become the columns of the view, and each column name is converted to lowercase `snake_case`.\
* **Tables**: The underlying tables that store the data have random character suffixes (e.g., `pool_created_X3rbm4nC`) and should not be queried directly.\
\
An event defined as `event PoolCreated(address pool, address token0, address token1)` will result in a queryable view named `pool_created` with the columns `pool`, `token0`, and `token1`.\
\
When you inspect your database, you will see both the clean views you should query and the internal tables with random suffixes. **Always query the views (lowercase `snake_case` names).**\
\
## Inspect Indexes\
\
If you have [defined indexes in your listener](/idx/listener/features#db-indexes), you can verify their existence directly from your database client.\
\
To confirm your indexes were created successfully, you can list them using `psql`.\
To list all indexes in the database, use the `\di` command. This shows the index name, type, and the table it belongs to.\
To see the indexes for a specific table, use the `\d "view_name"` command. This describes the view and lists the indexes on its underlying table.\
\
```bash\
# List all indexes in the database\
\di\
\
# Describe the view and see its specific indexes\
\d "position_owner_changes"\
```\
\
## Common Database Operations\
\
Here are some common `psql` commands you can use to inspect your database:\
\
| Operation            | `psql` Command                        | Description                                                                                                |\
| -------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |\
| **List Views**       | `\dv`                                 | Shows all queryable views in the public schema.                                                            |\
| **Describe View**    | `\d "view_name"`                      | Displays the columns, types, and structure for a specific view, including indexes on the underlying table. |\
| **List Indexes**     | `\di`                                 | Shows all indexes in the database.                                                                         |\
| **View Sample Data** | `SELECT * FROM "view_name" LIMIT 10;` | Retrieves the first 10 rows from a view.                                                                   |\
| **Count Rows**       | `SELECT COUNT(*) FROM "view_name";`   | Counts the total number of records indexed in a view.                                                      |\
\
## Limitations\
\
Currently, Sim IDX only supports creating new rows in the database, not updates to existing rows. This means that once data is indexed and stored, it cannot be modified through the framework. We are exploring options to support updates in future versions.\
\
# Push & Deploy Your Sim IDX App\
Source: https://docs.sim.dune.com/idx/deployment\
\
Push your local Sim IDX project to GitHub, import it into the Sim dashboard and ship the first build.\
\
Deploying publishes your app on Sim's managed infrastructure so it can continuously index data and serve production-ready APIs. This guide shows how to connect a local project to GitHub, import it into the Sim dashboard and trigger the first build.\
\
<Info>\
  Before you continue, complete the [Quickstart](/idx) to install the Sim CLI and initialise an app.\
</Info>\
\
## Create GitHub repo\
\
<Frame caption="Create a new repository on GitHub">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/create-new-github-repository.png" />\
</Frame>\
\
Open GitHub and [create a new repository](https://github.com/new) named after the folder that contains your project.\
In the Quickstart we used `my-first-idx-app`.\
\
## Push app to GitHub\
\
When you ran `sim init`, besides initializing your app, the CLI created a Git repository and committed the first version of your code.\
Point the repo at GitHub and push the commit.\
\
<Frame caption="Push the first commit to GitHub">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/push-from-existing-repo-github.png" />\
</Frame>\
\
Copy the code snippet from GitHub for pushing a code snippet from the command line.\
It should look like the following:\
\
```bash\
# inside your project folder\
git remote add origin https://github.com/your-username/my-first-idx-app.git\
git branch -M main\
git push -u origin main\
```\
\
## Import repo\
\
<Note>If you don't have access to IDX tab in the Sim dashboard yet, click Request Access to get enabled.</Note>\
\
Open the Sim dashboard at [sim.dune.com](https://sim.dune.com), select IDX in the sidebar and click Import Repo.\
The first time you do this you will have to install the Dune Sim GitHub App.\
\
<Frame caption="Import your new GitHub repo into the Sim IDX dashboard">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/sim-idx-apps.png" />\
</Frame>\
\
## Install GitHub App\
\
<Frame caption="Select where to install the GitHub App">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/install-dune-sim-github-app.png" />\
</Frame>\
\
Choose the GitHub account, select allow all or only the repositories you need and click Install.\
After installation you return to the import screen and pick your repo.\
\
## Configure & deploy\
\
<Frame caption="Review app settings and deploy">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/new-app.png" />\
</Frame>\
\
Review the settings for the App name, the optional description, then press Deploy.\
The dashboard will show the deployment with status Building.\
\
## Monitor deployment progress\
\
<Frame caption="Deployment building and ingesting data">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/deployment-progress.png" />\
</Frame>\
\
Return to the [Sim dashboard](https://sim.dune.com/), click on your app in the IDX tab and watch the new deployment move from **Building → Ingesting → Ready**.\
Once the status shows **Ingesting**, your APIs and database are live and serving data.\
\
## Next steps\
\
Your first build is now running. Head over to the [App Page](/idx/app-page) to learn where to find the database connection string, generated API endpoints and deployment status.\
Once you have your first deployment live, you can start iterating on your [Listener Contract](/idx/listener) to capture additional onchain events and shape your database schema.\
\
<Columns cols={2}>\
  <Card title="App Page" href="/idx/app-page">\
    Explore deployment details & endpoints\
  </Card>\
\
  <Card title="Listener Contract" href="/idx/listener">\
    Extend or modify your onchain data indexing logic\
  </Card>\
</Columns>\
\
# Branch Environments\
Source: https://docs.sim.dune.com/idx/deployment-environments\
\
Sim IDX streamlines your development and deployment lifecycle by integrating directly with your Git branching strategy.\
This allows you to build, test, and ship changes using isolated environments.\
\
Every Sim IDX app operates in one of two environments: **Production** or **Preview**.\
\
## Production Environment\
\
When you push a new commit to the `main` branch of your connected repo, a new production deployment is automatically created.\
\
A new, dedicated PostgreSQL database is provisioned for every deployment.\
A new base URL for your APIs is also created.\
\
<Note>\
  If you're using these values during development, make sure you update them after every push.\
</Note>\
\
<Frame caption="The Current Deployment section of your App Page represents your latest production deployment.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/current-deployment.png" />\
</Frame>\
\
## Preview Environments\
\
When you push a new commit to any branch that *is not* `main`, Sim IDX automatically spins up a completely separate environment for it.\
Each preview deployment will get its own isolated database and unique API URL.\
\
<Frame caption="The Other Deployments section of your App Page is where you can find preview deployments.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/other-deployments.png" />\
</Frame>\
\
## Build and Ingestion Lifecycle\
\
Every deployment progresses through three statuses: **Building → Ingesting → Ready**. This lifecycle governs when your code is compiled, when data is indexed, and what changes re-trigger historical backfill.\
\
### Building\
\
After you push a commit, Sim IDX builds your app (equivalent to running `sim build`). If there is a problem, the build fails with clear logs to help you resolve it. Fix the issue locally, commit, and push again to start a new build.\
\
### Ingesting\
\
When the build succeeds, the deployment begins ingesting. Two things happen in parallel:\
\
* Real‑time indexing from the chain tip begins immediately.\
* Historical backfill starts for the data defined by your Listener Contract. The status percentage reflects the backfill progress until it reaches 100%.\
\
Your APIs and database are usable as soon as the deployment enters Ingesting. Response completeness improves as the backfill advances.\
\
<Note>\
  Backfill is re-triggered only when you change your Listener Contract (including generated bindings that alter what the listener indexes). API-only or other non-listener code changes will create a new deployment but will not re-run historical backfill. The new deployment continues from the latest indexed state. To force a new backfill, modify your listener, commit, and push.\
</Note>\
\
### Ready\
\
Backfill has completed (100%). Your app continues to index new onchain activity in real time.\
\
## PR Flow\
\
For a more structured development process, you can use PRs on GitHub to trigger preview deployments.\
This allows for code review and collaborative testing before merging changes into the `main` branch.\
\
To start, create a new branch in your local repo and push it to GitHub.\
Then, open a pull request from your new branch to the `main` branch.\
\
<Frame caption="Open a new pull request on GitHub">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/new-pr-on-github.png" />\
</Frame>\
\
Once the pull request is created, Sim IDX automatically builds a new preview deployment.\
You can find this build in the "Other Deployments" section of your App Page in the Sim dashboard.\
\
The deployment is linked to the pull request, allowing you and your team to easily access the PR on GitHub to review changes and test the isolated deployment.\
\
<Frame caption="The PR link in the deployment details.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/deployment/pr-other-deployment-sim-idx.png" />\
</Frame>\
\
After the pull request is approved and merged, a new production deployment will be created from the `main` branch.\
\
# Decode Any Smart Contract\
Source: https://docs.sim.dune.com/idx/guides/decode-any-contract\
\
Set up a new Sim IDX app using the contract-decoder template to decode all events and functions from any smart contract.\
\
This guide shows you how to use the [**contract-decoder**](/idx/resources/templates) template to set up a Sim IDX app that decodes an entire smart contract. As an example, we will configure the app to listen to and persist every event emitted by the Moonbirds ERC721 NFT contract on Ethereum, but you can follow the same process for any contract.\
\
The [`contract-decoder`](https://github.com/duneanalytics/sim-idx-example-contract-decoder) template provides a shortcut to make this happen. Instead of manually defining each event you want to capture, it generates a special listener that automatically handles all events from a given contract ABI.\
\
## 1. Initialize the App from the Template\
\
First, create a new directory for your project and initialize a Sim IDX app using the `--template=contract-decoder` flag.\
\
```bash\
# Create and enter a new directory for your app\
mkdir moonbirds-decoded\
cd moonbirds-decoded\
\
# Initialize the app with the contract-decoder template\
sim init --template=contract-decoder\
```\
\
This command scaffolds a new project with a sample Uniswap V3 Factory ABI. In the next steps, we will replace it with the Moonbirds contract ABI.\
\
<Note>\
  To make development even faster, you can add our official **Cursor Rules** to your project.\
  These rules teach Cursor about Sim IDX's architecture, helping it generate correct and consistent code.\
\
  Learn more in our [Build with AI guide](/idx/build-with-ai).\
</Note>\
\
## 2. Remove the Sample ABI\
\
The template includes a default ABI at `abis/UniswapV3Factory.json`. Since we're replacing it, the first step is to delete this file.\
\
```bash\
rm abis/UniswapV3Factory.json\
```\
\
Removing the JSON file is not enough. The project still contains the Solidity bindings that were generated from it. To remove them, run `sim abi codegen`. This command re-scans the `abis/` directory and regenerates the bindings, effectively removing the ones for the now-deleted Uniswap ABI.\
\
```bash\
sim abi codegen\
```\
\
## 3. Add the Moonbirds Contract ABI\
\
Now, you need the ABI for the contract you want to decode. You can typically find a contract's ABI on a blockchain explorer like Etherscan. For this guide, we'll use the Moonbirds contract on Ethereum.\
\
1. Navigate to the [Moonbirds contract on Etherscan](https://etherscan.io/address/0x23581767a106ae21c074b2276D25e5C3e136a68b#code).\
2. Scroll down to the "Contract ABI" section and copy the entire JSON blob.\
3. Create a new file in your project at `abis/Moonbirds.json` and paste the ABI into it.\
\
```bash\
# Create the new ABI file\
touch abis/Moonbirds.json\
\
# Then paste the JSON into the file using your editor.\
```\
\
With the ABI file in place, run [`sim abi add`](/idx/cli#sim-abi-add-\<file-path>) to register it with your project and generate the necessary Solidity bindings.\
\
```bash\
sim abi add abis/Moonbirds.json\
```\
\
The CLI will parse the new ABI and generate a `Moonbirds.sol` file in `listeners/lib/sim-idx-generated/`. This file contains all the interfaces and helper contracts needed to interact with the Moonbirds contract in your listener.\
\
## 4. Configure the Listener to Decode All Events\
\
Open `listeners/src/Main.sol`. This is the core file where you define your indexing logic. We need to make two small changes to trigger on the generated Moonbirds bindings.\
\
The `Moonbirds.sol` file generated in the previous step includes a special abstract contract called `Moonbirds$EmitAllEvents`. By inheriting from this contract, your listener automatically gains the ability to:\
\
1. React to every event defined in the Moonbirds ABI.\
2. Define and emit corresponding events that Sim IDX will use to create database tables.\
3. Expose a helper function, `allTriggers()`, to register all event listeners at once.\
\
The event names are automatically converted to `snake_case` for your PostgreSQL table names. For example, an on-chain event named `RoleGranted` will have its data stored in a table named `role_granted`.\
\
Update `listeners/src/Main.sol` with the following code:\
\
```solidity Main.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
import "sim-idx-sol/Simidx.sol";\
import "sim-idx-generated/Generated.sol";\
\
contract Triggers is BaseTriggers {\
    function triggers() external virtual override {\
        Listener listener = new Listener();\
        // The allTriggers() helper registers every event from the ABI.\
        addTriggers(\
            // Moonbirds contract on Ethereum Mainnet (Chain ID 1)\
            chainContract(Chains.Ethereum, 0x23581767a106ae21c074b2276D25e5C3e136a68b),\
            listener.allTriggers()\
        );\
    }\
}\
\
// Inherit from Moonbirds$EmitAllEvents to automatically handle all events.\
contract Listener is Moonbirds$EmitAllEvents {}\
```\
\
This is all the Solidity code required. The `Listener` contract inherits the decoding logic, and the `Triggers` contract points to the on-chain Moonbirds address, registering all its events for indexing.\
\
## 5. Evaluate the Listener Against Live Data\
\
Before deploying, you can test your listener against historical blockchain data using [`sim listeners evaluate`](/idx/cli#sim-listeners-evaluate). This command runs a local dry-run to confirm your triggers fire correctly and decode events as expected.\
\
Find a block number on Etherscan where a Moonbirds transaction occurred and use it for the `--start-block` flag.\
\
```bash\
sim listeners evaluate \\
  --chain-id=1 \\
  --start-block=22830504 \\
  --listeners=Listener\
```\
\
If the setup is correct, the output will be a JSON object containing a list of decoded Moonbirds events in the `events` array and an empty `errors` array.\
\
## 6. Update the API to Query New Data\
\
When you ran `sim init`, a sample API was created in `apis/src/index.ts`. This API is configured to query data from the original Uniswap contract and will fail now that we've replaced the ABI. We need to update it to query one of the new tables created for the Moonbirds events.\
\
When you run `sim build`, Drizzle schemas for all your new event tables are automatically generated and placed in `apis/src/db/schema/Listener.ts`. You can inspect this file to see which tables are available to query.\
\
Let's update `apis/src/index.ts` to fetch the 10 most recent records from the `approval_for_all` table, which corresponds to the `ApprovalForAll` event.\
\
```typescript\
import { eq } from "drizzle-orm";\
import { approvalForAll } from "./db/schema/Listener"; // Import a schema from the new contract\
import {types, db, App} from "@duneanalytics/sim-idx";\
\
const app = App.create();\
\
app.get("/*", async (c) => {\
try {\
    const client = db.client(c);\
\
    // Query one of the new tables generated from the Moonbirds ABI\
    const result = await client.select().from(approvalForAll).limit(10);\
\
    return Response.json({\
      result: result,\
    });\
} catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: (e as Error).message }, { status: 500 });\
}\
});\
\
export default app;\
```\
\
## 7. Build the Project\
\
With the listener and API updated, run `sim build` to compile your contracts and API code.\
\
```bash\
sim build\
```\
\
The command should complete successfully. Unlike other templates, the `contract-decoder` template does not include listener tests that need to be updated, simplifying the development workflow.\
\
## Next steps\
\
Your app is now configured to decode the entire Moonbirds contract. The final step is to deploy it to Sim's managed infrastructure so it can begin indexing data and serving your API.\
\
<Columns cols={1}>\
  <Card title="Deploy your App" href="/idx/deployment">\
    Push the project to GitHub and ship the first build.\
  </Card>\
</Columns>\
\
# Replace Sample ABI with Any Contract\
Source: https://docs.sim.dune.com/idx/guides/swap-sample-abi\
\
Replace the sample Uniswap V3 Factory ABI with any contract's ABI in your Sim IDX app.\
\
This guide shows you how to swap out the Uniswap V3 Factory ABI bundled with the [**sample**](https://github.com/duneanalytics/sim-idx-example-sample-app) Sim IDX app and replace it with the ABI of any contract you would like to index. As an example, we'll use the USDC contract, but you can follow the same process for any contract. The sample app is what gets created by default when you run `sim init` without any additional [templates](/idx/resources/templates). The workflow mirrors the process you will follow in a real project: locate the ABI, register it with the CLI, extend your listener, and validate the new triggers against historical data.\
\
## 1. Remove the Uniswap V3 Factory ABI from the project\
\
Inside the sample repository you will find a file at `abis/UniswapV3Factory.json`. Because you are replacing this ABI entirely, delete the file (or move it out of `abis/`). Leaving it in place would cause the CLI to generate bindings for both Factory **and** USDC, which is not what you want for this walkthrough.\
\
```bash\
rm abis/UniswapV3Factory.json\
# Regenerate bindings\
sim abi codegen\
```\
\
Running [`sim abi codegen`](/idx/cli#sim-abi-codegen) removes the now-missing Factory bindings from `listeners/lib/sim-idx-generated/`.\
\
## 2. Locate the ABI for your target contract\
\
Start by obtaining the ABI for the contract you want to observe. The most common approach is to open the contract page on a blockchain explorer such as Etherscan, Basescan or Polygonscan and click the **Contract** tab. From there select **Contract ABI** and copy the full JSON blob to your clipboard.\
\
For the purposes of this guide we'll trigger on the [Ethereum USDC contract](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48#code).\
\
<Frame>\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/idx/guides/swap-abi/usdc-contract-abi.png" />\
</Frame>\
\
## 3. Add the new ABI JSON file\
\
Create a fresh file under `abis/` and paste the JSON you copied earlier. The filename should match the contract you are tracking, e.g. `abis/USDC.json`.\
\
```bash\
touch abis/USDC.json\
# then paste the JSON using your editor or:\
cat > abis/USDC.json  # Ctrl-D to save\
```\
\
You can just as easily create the file through your editor's GUI. Both approaches work the same.\
\
## 4. Generate Solidity bindings with `sim abi add`\
\
Run the command below in the root of your project to register the ABI and generate strongly-typed Solidity bindings. The CLI parses the JSON, creates the corresponding structs, abstract contracts and helper functions, and writes them into `listeners/lib/sim-idx-generated/`.\
\
```bash\
sim abi add abis/USDC.json\
```\
\
After the command completes you will see the updated files in `listeners/lib/sim-idx-generated/`. The generated Solidity bindings expose multiple *abstract contracts* that fire whenever a specific USDC function is called or event is emitted onchain. You will extend one of these contracts in the next step.\
\
## 5. Update the listener contract to inherit the new functionality\
\
Create a new file at `listeners/src/USDCListener.sol`.\
Next, create a new contract so that it inherits from the abstract contracts generated for your ABI. For example, to react to the `Transfer` event of USDC the inheritance line might look like this:\
\
```solidity USDCListener.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
import "sim-idx-sol/Simidx.sol";\
import "sim-idx-generated/Generated.sol";\
\
contract USDCListener is USDC$OnTransferEvent {\
    event USDCTransfer(\
        uint64  chainId,\
        address from,\
        address to,\
        uint256 value\
    );\
\
    function onTransferEvent(\
        EventContext memory /* ctx */,\
        USDC$TransferEventParams memory inputs\
    ) external override {\
        emit USDCTransfer(\
            uint64(block.chainid),\
            inputs.from,\
            inputs.to,\
            inputs.value\
        );\
    }\
}\
```\
\
Add or modify event definitions to capture the onchain data you want persisted and implement each handler function required by the abstract contract. The Sim IDX framework will create the associated database tables automatically on deployment.\
\
## 6. Register triggers for the new contract\
\
In the `Main.sol` file, you now need to import your new `USDCListener` and update the `Triggers` contract to use it.\
In the `Triggers` contract, replace the existing `addTrigger` call so that it points to the USDC contract address on Ethereum and references the helper selector exposed by the listener:\
\
```solidity Main.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
import "sim-idx-sol/Simidx.sol";\
import "sim-idx-generated/Generated.sol";\
import "./USDCListener.sol";\
\
contract Triggers is BaseTriggers {\
    function triggers() external virtual override {\
        USDCListener listener = new USDCListener();\
        addTrigger(\
            chainContract(Chains.Ethereum, 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48),\
            listener.triggerOnTransferEvent()\
        );\
    }\
}\
```\
\
Want to listen on multiple networks (e.g. Base)? Simply add additional `addTrigger` calls with the appropriate chain name from the `Chains` enum (for example, `Chains.Base`) and contract address. You can find the list of supported chains at [sim.dune.com/chains](https://sim.dune.com/chains).\
\
## 7. Evaluate the listener against historical blocks\
\
Before deploying, replay historical chain data to confirm that the new triggers activate and that the listener emits the expected events. [`sim listeners evaluate`](/idx/cli#sim-listeners-evaluate) compiles your listener, fetches onchain transactions for the specified block range and prints a structured summary of events and errors.\
\
```bash\
sim listeners evaluate \\
  --chain-id 1 \\
  --start-block <BLOCK_NUMBER> \\
  --listeners=USDCListener\
# --end-block   <BLOCK_NUMBER>   # optional, evaluates a single block if omitted\
```\
\
Replace the placeholders with blocks that are known to interact with USDC. You can usually find them on the same explorer page where you copied the ABI. If the summary shows your custom events in `events` and `errors` is empty, the evaluation succeeded.\
\
<Note>\
  To learn more about the `sim listeners evaluate` command and its options, visit the [CLI reference page](/idx/cli#sim-listeners-evaluate).\
</Note>\
\
## 8. Rebuild and update the API endpoint\
\
Next, rebuild the project so that Drizzle schemas are regenerated from the new events:\
\
```bash\
sim build\
```\
\
`sim build` places the generated Drizzle schema for your listener under `apis/src/db/schema/Listener.ts`. The existing `apis/src/index.ts` still imports `poolCreated` (an event from the previous Uniswap V3 ABI included in the sample) which no longer exists.\
\
Update `apis/src/index.ts` so that it queries the new `usdcTransfer` table generated from your `USDCTransfer` event:\
\
```typescript index.ts\
import { eq } from "drizzle-orm";\
import { usdcTransfer } from "./db/schema/Listener"; // adjust path if needed\
import { types, db, App } from "@duneanalytics/sim-idx";\
\
const app = App.create();\
app.get("/*", async (c) => {\
try {\
    const result = await db.client(c).select().from(usdcTransfer).limit(10);\
\
    return Response.json({\
      result,\
    });\
} catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: (e as Error).message }, { status: 500 });\
}\
});\
\
export default app;\
```\
\
After saving, run `sim build` once again to verify the API is building correctly with the new Drizzle schema.\
\
## Next steps\
\
With your listener, tests, and API all pointing at USDC data, you're ready to deploy your updated app to Sim's managed infrastructure.\
\
<Columns cols={1}>\
  <Card title="Deploy your updated app" href="/idx/deployment">\
    Push the project to GitHub and ship your new build\
  </Card>\
</Columns>\
\
# Uniswap X Swaps\
Source: https://docs.sim.dune.com/idx/guides/uniswap-x-swaps\
\
Learn how to use Sim IDX to turn Uniswap X's gas-optimized architecture into rich, queryable data.\
\
Uniswap X is an intent-based, auction-driven routing protocol that delivers better prices, gas-free swaps, and built-in MEV protection by letting swappers sign orders that competing fillers execute onchain.\
The same efficiency, though, leaves most offchain indexers effectively blind.\
The data is emitted.\
It's just not in a format their offchain parsers can easily recognize.\
It's no problem for Sim IDX.\
\
This guide breaks down exactly how Sim IDX's unique onchain architecture turns this challenge into a straightforward indexing task.\
\
<Note>\
  **What you'll learn in this guide**\
\
  * How the **Quoter pattern** lets an onchain listener pull fully-decoded swap data straight from Uniswap X reactors. This is something conventional offchain indexers can't do.\
  * Why a **single Sim IDX listener** can index *every* Uniswap X swap, regardless of reactor type or order variant.\
  * The fee-handling and onchain interaction techniques that make your indexer both **accurate and future-proof**.\
</Note>\
\
## Why is Uniswap X Hard to Index?\
\
The core difficulty in indexing Uniswap X stems from its order-based architecture.\
Reactors settle signed orders and verify execution, but they don't emit explicit logs of the final token amounts.\
Instead, the critical details live inside encoded calldata that only the reactors themselves can decode.\
\
This complexity is compounded by:\
\
1. **Multiple Reactor Types**: Uniswap X relies on several reactor contracts, each tailored to a different kind of order with its own decoding logic. An indexer must replicate the nuances of every variant, which is a significant engineering challenge.\
2. **Opaque Logs**: onchain events expose only an order hash and the filler address, leaving out the tokens traded, the final amounts, and even the recipient of the swap proceeds.\
3. **Decoded State is Private/Internal**: All the logic required to understand an order's final state is contained within the reactor contracts themselves. Traditional indexers, which operate offchain, cannot easily access or execute this onchain logic.\
\
An attempt to index this with a traditional indexing tool would require painstakingly re-implementing every reactor's decoding logic offchain and keeping it in sync with any protocol upgrades.\
\
## The Sim IDX Solution\
\
Sim IDX overcomes these challenges by fundamentally changing the relationship between the indexer and the protocol.\
Where traditional indexers are passive, offchain observers, a **Sim IDX listener is a smart contract that lives onchain**.\
\
The listener is a smart contract, so it can do more than just read events.\
It can interact with other onchain contracts.\
The listener can call their functions, pass them arguments, and read their return data, just like any other contract would.\
\
This capability lets us use an elegant technique we call the **Quoter Pattern**.\
Instead of painstakingly re-implementing Uniswap X's sophisticated decoding logic, we simply ask the Reactor to run its own logic for us.\
We treat the protocol itself as an on-demand decoding oracle.\
\
The following sections highlight the most unique parts of this implementation. To see the code in its entirety, we encourage you to explore the full repository.\
\
<Card title="View Full Code on GitHub" icon="github" iconType="brands" href="https://github.com/duneanalytics/sim-idx-example-uniswap-x" cta="View Repository" arrow="true">\
  Explore the complete, unabridged source code for this Uniswap X indexer.\
</Card>\
\
## Index by ABI, Not by Address\
\
The first challenge in indexing Uniswap X is its scale. The protocol uses multiple Reactor contracts across several chains, and new ones can be deployed at any time. Maintaining a hardcoded list of addresses is not a scalable solution.\
\
Sim IDX solves this with ABI-based triggers. Instead of targeting specific addresses, you can instruct your listener to trigger on *any contract* that matches a given ABI signature. This makes your indexer automatically forward-compatible.\
\
We achieve this with the `ChainIdAbi` helper in our `Triggers` contract. The code below sets up our listener to trigger on the `execute` function family for *any* contract on Ethereum, Unichain, and Base that implements the `IReactor` interface.\
\
```solidity listeners/src/Main.sol\
import "sim-idx-sol/Simidx.sol";\
contract Triggers is BaseTriggers {\
    function triggers() external virtual override {\
        Listener listener = new Listener();\
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteFunction());\
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteBatchFunction());\
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteBatchWithCallbackFunction());\
        addTrigger(ChainIdAbi(1, IReactor$Abi()), listener.triggerPreExecuteWithCallbackFunction());\
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteFunction());\
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteBatchFunction());\
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteBatchWithCallbackFunction());\
        addTrigger(ChainIdAbi(130, IReactor$Abi()), listener.triggerPreExecuteWithCallbackFunction());\
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteFunction());\
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteBatchFunction());\
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteBatchWithCallbackFunction());\
        addTrigger(ChainIdAbi(8453, IReactor$Abi()), listener.triggerPreExecuteWithCallbackFunction());\
    }\
}\
```\
\
This single pattern ensures our listener will capture swaps from all current and future Uniswap X reactors without needing any code changes.\
\
<Note>\
  To learn more about `ChainAbi`, see the [Listener Features guide](/idx/listener/features).\
</Note>\
\
## Decode Opaque Data with the Quoter Pattern\
\
Once triggered, our listener receives the opaque `order` bytes. Replicating the decoding logic for every reactor type offchain would be a massive, brittle engineering effort.\
\
With Sim IDX, we don't have to. Because our listener is an onchain contract, we can use the "Quoter Pattern" to have the Reactor contract decode its own data for us.\
\
This pattern is implemented in the `OrderQuoter.sol` contract, which our main `Listener` inherits from. It revolves around two primary functions:\
\
1. The `quote` function, called by our listener's handler, simulates a fill by calling the Reactor's `executeWithCallback` inside a `try/catch` block. It knows this call will revert and is designed to catch the revert reason.\
\
   ```solidity listeners/src/OrderQuoter.sol\
   /// @notice Quote the given order, returning the ResolvedOrder object which defines\
   /// the current input and output token amounts required to satisfy it\
   /// Also bubbles up any reverts that would occur during the processing of the order\
   /// @param order abi-encoded order, including `reactor` as the first encoded struct member\
   /// @param sig The order signature\
   /// @return result The ResolvedOrder\
   function quote(bytes memory order, bytes memory sig) external returns (ResolvedOrder memory result) {\
       try IReactor(getReactor(order)).executeWithCallback(SignedOrder(order, sig), bytes("")) {}\
       catch (bytes memory reason) {\
           result = parseRevertReason(reason);\
       }\
   }\
   ```\
\
2. The `reactorCallback` function is the endpoint the Reactor calls on our contract. It receives the fully decoded `ResolvedOrder`, encodes it, and immediately places it into a `revert` message.\
\
   ```solidity listeners/src/OrderQuoter.sol\
   /// @notice Reactor callback function\
   /// @dev reverts with the resolved order as reason\
   /// @param resolvedOrders The resolved orders\
   function reactorCallback(ResolvedOrder[] memory resolvedOrders, bytes memory) external pure {\
       if (resolvedOrders.length != 1) {\
           revert OrdersLengthIncorrect();\
       }\
       bytes memory order = abi.encode(resolvedOrders[0]);\
       /// @solidity memory-safe-assembly\
       assembly {\
           revert(add(32, order), mload(order))\
       }\
   }\
   ```\
\
This interaction that calls a contract to make it call you back with data you capture from a deliberate revert is the heart of the solution. It's a powerful technique only possible because Sim IDX listeners operate onchain.\
\
## Build the Perfect Event Onchain\
\
After decoding the raw order, we need to refine it into a complete and useful record. The listener acts as an onchain data assembly line, composing other onchain logic for accuracy and making live calls to enrich the data.\
\
First, to ensure financial accuracy, we must account for protocol fees. We do this by porting Uniswap's own onchain fee logic into a `FeeInjector` library. Our handler calls this library to inject any applicable fees into the `ResolvedOrder`, ensuring the final amounts are perfect.\
\
```solidity listeners/src/Main.sol\
function preExecuteFunction(PreFunctionContext memory ctx, ...) external override {\
    // 1. Get the decoded order using the Quoter Pattern.\
    ResolvedOrder memory order = this.quote(inputs.order.order, inputs.order.sig);\
\
    // 2. Inject protocol fees for accuracy.\
    FeeInjector._injectFees(order, IReactor(order.info.reactor).feeController());\
\
    // 3. Emit the final, perfected event.\
    emitTradesFromOrder(order, ctx.txn.call.caller());\
}\
```\
\
Next, we enrich the data. Instead of just storing token addresses, we can get human-readable symbols and names. The listener makes a live `call` to each token contract to retrieve its metadata.\
\
```solidity listeners/src/Main.sol\
function emitUniswapXTrade(\
    address makingToken,\
    address takingToken,\
    address maker,\
    address taker,\
    uint256 makingAmount,\
    uint256 takingAmount,\
    address platformContract\
) internal {\
    (string memory makingTokenSymbol, string memory makingTokenName, uint256 makingTokenDecimals) =\
        makingToken == address(0) ? ("ETH", "Ether", 18) : getMetadata(makingToken);\
    (string memory takingTokenSymbol, string memory takingTokenName, uint256 takingTokenDecimals) =\
        takingToken == address(0) ? ("ETH", "Ether", 18) : getMetadata(takingToken);\
    emit Swap(\
        SwapData(\
            uint64(block.chainid),\
            txnHash,\
            blockNumber(),\
            uint64(block.timestamp),\
            makingToken,\
            makingAmount,\
            makingTokenSymbol,\
            makingTokenName,\
            uint64(makingTokenDecimals),\
            takingToken,\
            takingAmount,\
            takingTokenSymbol,\
            takingTokenName,\
            uint64(takingTokenDecimals),\
            tx.origin,\
            maker,\
            taker,\
            platformContract\
        )\
    );\
}\
\
function emitTradesFromOrder(ResolvedOrder memory order, address taker) internal {\
    (InputToken memory input, OutputToken memory output) = getIoTokensFromOrder(order);\
    emitUniswapXTrade(\
        input.token, output.token, output.recipient, taker, input.amount, output.amount, address(order.info.reactor)\
    );\
}\
```\
\
This onchain assembly process that consists of decoding, correcting for fees, and enriching with live metadata creates a complete data record before it's written to the database.\
\
## Define Your API Directly in Solidity\
\
The final step in the Sim IDX workflow demonstrates its most powerful abstraction: your onchain `event` definition *is* your API schema.\
\
In our `Listener` contract, we define a `SwapData` struct and a `Swap` event. This struct contains all the decoded, fee-corrected, and enriched data points we assembled in the previous steps.\
\
```solidity listeners/src/Main.sol\
struct SwapData {\
    uint64 chainId;\
    bytes32 txnHash;\
    uint64 blockNumber;\
    uint64 blockTimestamp;\
    address makerToken;\
    uint256 makerAmt;\
    string makerTokenSymbol;\
    string makerTokenName;\
    uint64 makerTokenDecimals;\
    address takerToken;\
    uint256 takerAmt;\
    string takerTokenSymbol;\
    string takerTokenName;\
    uint64 takerTokenDecimals;\
    address txnOriginator;\
    address maker;\
    address taker;\
    address reactor;\
}\
\
event Swap(SwapData);\
\
function emitTradesFromOrder(ResolvedOrder memory order, address taker) internal {\
    (InputToken memory input, OutputToken memory output) = getIoTokensFromOrder(order);\
    emitUniswapXTrade(\
        input.token, output.token, output.recipient, taker, input.amount, output.amount, address(order.info.reactor)\
    );\
}\
```\
\
When this `Swap` event is emitted, Sim IDX automatically creates a `swap` table in your database with columns matching the fields in `SwapData`. It then generates a type-safe Drizzle schema for you to use in your API.\
\
The result is that your API code becomes trivially simple. You can query your `swap` table without writing any complex data transformation pipelines or ORM configurations.\
\
```typescript apis/src/index.ts\
import { swap } from "./db/schema/Listener";\
import { db, App } from "@duneanalytics/sim-idx";\
\
const app = App.create()\
\
// This endpoint returns the 5 most recent swaps.\
app.get("/*", async (c) => {\
try {\
    const result = await db.client(c).select().from(swap).limit(5);\
    return Response.json({ result });\
} catch (e) {\
    console.error("Database operation failed:", e);\
    return Response.json({ error: (e as Error).message }, { status: 500 });\
}\
});\
\
export default app;\
```\
\
From a complex, gas-optimized protocol to a simple, queryable API, the entire process is orchestrated through onchain logic. Your work as a developer is focused on Solidity.\
\
## Conclusion\
\
You have successfully designed an indexer for one of DeFi's most complex protocols. This guide demonstrates the power of Sim IDX's architecture. By enabling your listener to act as an onchain contract, you can solve sophisticated indexing problems with surprisingly simple and robust code.\
\
This "Quoter" pattern can be adapted to any protocol where data is resolved through onchain logic rather than emitted in simple events.\
\
<Columns cols={2}>\
  <Card title="App Deployment" href="/idx/deployment">\
    Learn how to deploy your Sim IDX app to production.\
  </Card>\
\
  <Card title="Listener Features" href="/idx/listener/features">\
    Learn about more listener features like global triggers, abi triggers, interfaces, and db indexes.\
  </Card>\
</Columns>\
\
# Listener Contract Basics\
Source: https://docs.sim.dune.com/idx/listener\
\
The core of a Sim IDX app is the **listener**, a Solidity contract that defines what onchain data to index. By writing simple handlers for specific contract function calls or events, you instruct the Sim IDX framework on which data to capture and store in your database.\
\
This guide covers the structure of a listener contract, how to add indexing for new functions, and how to test your logic.\
\
## Understand the Listener Contract\
\
A listener is a special contract Sim IDX executes onchain. It has handler functions which are called when certain conditions are triggered onchain (e.g., when another contract calls a function, or a contract with a matching ABI emits an event). The Listener contract itself emits events which Sim IDX stores in your app's database.\
\
### Mental Model\
\
1. A transaction is executed onchain.\
2. Sim IDX checks whether it matches any trigger you defined during deployment.\
3. When there's a match, Sim IDX invokes the corresponding handler in your listener contract.\
4. The handler emits one or more events that capture the facts you care about.\
5. Sim IDX stores each event as a new row in the appropriate table of your app database.\
\
### File Anatomy\
\
<Note>\
  Before diving into listener development, make sure you understand the overall [app folder structure](/idx/app-structure) and how the `listeners/` folder fits into your Sim IDX app.\
</Note>\
\
The indexing logic is primarily located in `listeners/src/`.\
\
| Contract    | Purpose                                                                                                                                               | Location                 |\
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |\
| `Triggers`  | Registers all triggers via `addTrigger`. Must be named `Triggers` and defined in `Main.sol`.                                                          | `listeners/src/Main.sol` |\
| Listener(s) | One or more contracts that implement handler logic and emit events. They can have any name and be defined in any `.sol` file within `listeners/src/`. | `listeners/src/`         |\
\
Let's break the `Main.sol` file from the sample app down step-by-step.\
\
### Imports\
\
```solidity\
import "sim-idx-sol/Simidx.sol";\
import "sim-idx-generated/Generated.sol";\
import "./UniswapV3FactoryListener.sol";\
```\
\
These two imports pull in everything provided by the **Sim IDX framework**.\
`Simidx.sol` provides core helpers, while `Generated.sol` contains the Solidity code created from your ABIs.\
The `./UniswapV3FactoryListener.sol` import brings in the listener contract from a separate file.\
\
### Triggers Contract\
\
This contract tells Sim IDX when to run your code using a **trigger**, which specifies a target contract and the handler to call.\
The `Triggers` contract must be named `Triggers` and must be located in `listeners/src/Main.sol`.\
\
<Note>\
  You can also use helpers like `chainAbi` and `chainGlobal`.\
  For other trigger types, see the [Listener Features](/idx/listener/features) page.\
</Note>\
\
```solidity Main.sol\
contract Triggers is BaseTriggers {\
    function triggers() external virtual override {\
        UniswapV3FactoryListener listener = new UniswapV3FactoryListener();\
        addTrigger(\
            chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),\
            listener.triggerOnCreatePoolFunction()\
        );\
        addTrigger(\
            chainContract(Chains.Unichain, 0x1F98400000000000000000000000000000000003),\
            listener.triggerOnCreatePoolFunction()\
        );\
        addTrigger(\
            chainContract(Chains.Base, 0x33128a8fC17869897dcE68Ed026d694621f6FDfD),\
            listener.triggerOnCreatePoolFunction()\
        );\
    }\
}\
```\
\
* **`BaseTriggers`**: An abstract contract from `Simidx.sol` that provides the `addTrigger` helper.\
* **`triggers()`**: The required function where you register all your triggers.\
* **`new UniswapV3FactoryListener()`**: The listener contract is instantiated from its own contract type.\
* **`chainContract(...)`**: This helper function uses the `Chains` enum for readability. The sample app registers the same trigger for Ethereum, Base, and Unichain, demonstrating how to monitor a contract across multiple networks.\
\
### Listener Contract\
\
This is where you implement your business logic.\
The sample app places this logic in `listeners/src/UniswapV3FactoryListener.sol`.\
\
```solidity UniswapV3FactoryListener.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
import "sim-idx-sol/Simidx.sol";\
import "sim-idx-generated/Generated.sol";\
\
/// Index calls to the UniswapV3Factory.createPool function on Ethereum\
/// To hook on more function calls, specify that this listener should implement that interface and follow the compiler errors.\
contract UniswapV3FactoryListener is UniswapV3Factory$OnCreatePoolFunction {\
    /// Emitted events are indexed.\
    /// To change the data which is indexed, modify the event or add more events.\
    event PoolCreated(uint64 chainId, address caller, address pool, address token0, address token1, uint24 fee);\
\
    /// The handler called whenever the UniswapV3Factory.createPool function is called.\
    /// Within here you write your indexing specific logic (e.g., call out to other contracts to get more information).\
    /// The only requirement for handlers is that they have the correct signature, but usually you will use generated interfaces to help write them.\
    function onCreatePoolFunction(\
        FunctionContext memory ctx,\
        UniswapV3Factory$CreatePoolFunctionInputs memory inputs,\
        UniswapV3Factory$CreatePoolFunctionOutputs memory outputs\
    ) external override {\
        emit PoolCreated(\
            uint64(block.chainid), ctx.txn.call.callee(), outputs.pool, inputs.tokenA, inputs.tokenB, inputs.fee\
        );\
    }\
}\
```\
\
* **Inheritance**: The listener extends an abstract contract (`UniswapV3Factory$OnCreatePoolFunction`) that is automatically generated from your ABI. This provides the required handler function signature and typed structs for `inputs` and `outputs`.\
* **Events**: Emitting an event like `PoolCreated` defines the shape of your database.\
\
The sample app uses the descriptive name `UniswapV3FactoryListener`.\
You should use descriptive names for your contracts.\
For larger projects, you can even split logic into multiple listener contracts, each in its own `.sol` file within the `src/` directory.\
\
## Define and Emit Events\
\
Events are the bridge between your listener's logic and your database. When your listener emits an event, Sim IDX creates a database record.\
\
### From Events to DB\
\
The framework automatically maps your event to a database view. The event name is converted to `snake_case` to become the view name, and each event parameter becomes a column.\
\
For example, the `PoolCreated` event from the sample app results in a queryable `pool_created` view:\
\
| chain\_id | caller                                     | pool                                       | token0                                     | token1                                     | fee   |\
| --------- | ------------------------------------------ | ------------------------------------------ | ------------------------------------------ | ------------------------------------------ | ----- |\
| 1         | 0x1f98431c8ad98523631ae4a59f267346ea31f984 | 0xf2c1e03841e06127db207fda0c3819ed9f788903 | 0x4a074a606ccc467c513933fa0b48cf37033cac1f | 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 | 10000 |\
\
### Extending an Event\
\
To capture more data, you simply add parameters to your event definition and update the `emit` statement in your handler. Let's modify the sample app to also record the block number.\
\
**1. Extend the Event Definition**\
\
Add the new `blockNumber` parameter to your `PoolCreated` event in `Main.sol`.\
\
```solidity\
event PoolCreated(\
    uint64   chainId,\
    address  caller,\
    address  pool,\
    address  token0,\
    address  token1,\
    uint24   fee,\
    uint256  blockNumber // new field\
);\
```\
\
**2. Emit the New Data**\
\
Pass the new value when you emit the event in your `onCreatePoolFunction` handler.\
\
```solidity\
function onCreatePoolFunction(...) external override {\
    emit PoolCreated(\
        uint64(block.chainid),\
        ctx.txn.call.callee(),\
        outputs.pool,\
        inputs.tokenA,\
        inputs.tokenB,\
        inputs.fee,\
        blockNumber() // pass the new value\
    );\
}\
```\
\
After deploying these changes, your `pool_created` table will automatically include the new `block_number` column.\
\
<Tip>\
  Prefer `blockNumber()` over Solidity's `block.number` to standardize access across all supported blockchains.\
</Tip>\
\
## Trigger Onchain Activity\
\
Sim IDX can trigger on contract events as well as function calls, both before and after they execute. This allows you to capture a wide range of onchain activity.\
\
To add a new trigger to your listener, you'll follow a simple, five-step process:\
\
1. **Discover the Trigger**: Find the abstract contract for your target function or event in the generated files.\
2. **Extend the Listener**: Add the abstract contract to your listener's inheritance list.\
3. **Define a New Event**: Create a Solidity event to define your database schema.\
4. **Implement the Handler**: Write the function required by the abstract contract to process the data and emit your event.\
5. **Register the Trigger**: Call `addTrigger` in your `Triggers` contract to activate the trigger.\
\
Let's walk through an example of adding a new event trigger to the sample app's `UniswapV3FactoryListener` contract.\
We will extend the `Listener` to also index the `OwnerChanged` event from the Uniswap V3 Factory.\
\
### 1. Discover the Trigger\
\
Look inside `listeners/lib/sim-idx-generated/UniswapV3Factory.sol`. You will find an abstract contract for the `OwnerChanged` event.\
\
```solidity\
abstract contract UniswapV3Factory$OnOwnerChangedEvent {\
    function onOwnerChangedEvent(EventContext memory ctx, UniswapV3Factory$OwnerChangedEventParams memory inputs) virtual external;\
    function triggerOnOwnerChangedEvent() view external returns (Trigger memory);\
}\
```\
\
### 2. Extend the Listener\
\
Add `UniswapV3Factory$OnOwnerChangedEvent` to the inheritance list of the `UniswapV3FactoryListener` contract in `UniswapV3FactoryListener.sol`.\
\
```solidity UniswapV3FactoryListener.sol\
contract UniswapV3FactoryListener is\
    UniswapV3Factory$OnCreatePoolFunction, // existing\
    UniswapV3Factory$OnOwnerChangedEvent   // new\
{\
    // ... existing events and handlers\
}\
```\
\
### 3. Define a New Event\
\
Inside the `UniswapV3FactoryListener` contract, add a new event to define the schema for the `owner_changed` table.\
\
```solidity\
event OwnerChanged(\
    uint64  chainId,\
    address oldOwner,\
    address newOwner\
);\
```\
\
### 4. Implement the Handler\
\
Implement the `onOwnerChangedEvent` function required by the abstract contract, also inside `UniswapV3FactoryListener`.\
\
```solidity\
function onOwnerChangedEvent(\
    EventContext memory /*ctx*/,\
    UniswapV3Factory$OwnerChangedEventParams memory inputs\
) external override {\
    emit OwnerChanged(\
        uint64(block.chainid),\
        inputs.oldOwner,\
        inputs.newOwner\
    );\
}\
```\
\
### 5. Register the Trigger\
\
Finally, add a new trigger for this handler in your `Triggers` contract within `Main.sol`. You will need to instantiate the listener first.\
\
```solidity Main.sol\
// In Triggers.triggers()\
UniswapV3FactoryListener listener = new UniswapV3FactoryListener();\
\
addTrigger(\
    chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),\
    listener.triggerOnCreatePoolFunction() // existing trigger\
);\
addTrigger(\
    chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),\
    listener.triggerOnOwnerChangedEvent() // new trigger\
);\
```\
\
## Function Triggers\
\
The framework supports both post-execution and pre-execution function triggers.\
\
**Post-Execution:** This is what the sample app uses with `onCreatePoolFunction`. The handler is called *after* the contract's function completes, so it has access to both `inputs` and `outputs`.\
\
**Pre-Execution:** To react to a function *before* it executes, you use the corresponding `Pre-` abstract contract (e.g., `preCreatePoolFunction`). The handler receives a `PreFunctionContext` and only has access to the function's `inputs`, as outputs have not yet been generated. This logic can live in its own file.\
\
```solidity UniswapV3FactoryPreExecutionListener.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
import "sim-idx-sol/Simidx.sol";\
import "sim-idx-generated/Generated.sol";\
\
contract UniswapV3FactoryPreExecutionListener is UniswapV3Factory$PreCreatePoolFunction {\
    // Fires *before* createPool executes\
    event PoolWillBeCreated(\
        uint64  chainId,\
        address token0,\
        address token1,\
        uint24  fee\
    );\
\
    function preCreatePoolFunction(\
        PreFunctionContext memory /*ctx*/,\
        UniswapV3Factory$CreatePoolFunctionInputs memory inputs\
    )\
        external\
        override\
    {\
        emit PoolWillBeCreated(\
            uint64(block.chainid),\
            inputs.tokenA,\
            inputs.tokenB,\
            inputs.fee\
        );\
    }\
}\
```\
\
You would then import and register this new listener in your `Triggers` contract inside `Main.sol`.\
\
```solidity Main.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
import "sim-idx-sol/Simidx.sol";\
import "./UniswapV3FactoryPreExecutionListener.sol";\
\
contract Triggers is BaseTriggers {\
    function triggers() external override {\
        UniswapV3FactoryPreExecutionListener listener = new UniswapV3FactoryPreExecutionListener();\
\
        address factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984; // Uniswap V3 Factory (Ethereum)\
\
        addTrigger(chainContract(Chains.Ethereum, factory), listener.triggerPreCreatePoolFunction());\
    }\
}\
```\
\
## Test Your Listener\
\
Sim IDX gives you two ways to make sure your listener behaves as expected while you build.\
\
### Unit Tests with Foundry\
\
The `listeners` folder is a Foundry project. `sim test` is a thin wrapper around `forge test`. It will compile your contracts, execute all Forge unit tests inside `listeners/test/`, and surface any failures.\
\
### Historical Replay\
\
Use `sim listeners evaluate` to see how your listener reacts to real onchain data *before* pushing your updates. This command compiles your listener and executes the transactions in any block range you specify.\
\
```bash\
sim listeners evaluate \\
  --chain-id 1 \\
  --start-block 12369662 \\
  --end-block 12369670 \\
  --listeners=UniswapV3FactoryListener\
```\
\
<Note>\
  Use the `--listeners` flag to specify which listener contract to evaluate. Set this to your contract's name. When running `evaluate`, the output may include events with names prefixed by `fail_` which indicates data from failed or reverted transactions. For details on these outputs and available flags, see the [`sim listeners evaluate`](/idx/cli#sim-listeners-evaluate) documentation.\
</Note>\
\
## Next Steps\
\
You've now seen how to create triggers, emit events, and validate your listener. Here are a few great ways to level-up your Sim IDX app.\
\
<Columns cols={2}>\
  <Card title="Listener Features" href="/idx/listener/features">\
    Explore more listener features like triggering by ABI, global triggers, interfaces, and DB indexes.\
  </Card>\
\
  <Card title="Deployment Guide" href="/idx/deployment">\
    Push your app to a staging or production environment and watch it process live onchain activity.\
  </Card>\
\
  <Card title="API Development Guide" href="/idx/apis">\
    Build fast, type-safe endpoints that surface the data your listener captures.\
  </Card>\
</Columns>\
\
# Listener Errors\
Source: https://docs.sim.dune.com/idx/listener/errors\
\
Sim IDX listeners may occasionally hit Solidity compilation errors during development. This page explains the most common issues and shows how to resolve them.\
\
## Handle Name Conflicts\
\
When working with multiple ABIs, you may encounter functions or events with the same name, which can cause compilation errors. Sim IDX provides two solutions.\
\
### 1. Multiple Listeners\
\
The recommended approach is to split your logic into separate, dedicated listener contracts for each ABI. This keeps your code clean and modular.\
\
```solidity\
// In Triggers.triggers()\
Listener1 listener1 = new Listener1();\
Listener2 listener2 = new Listener2();\
\
addTrigger(..., listener1.triggerOnSwapFunction());\
addTrigger(..., listener2.triggerOnSwapFunction());\
\
// Separate listener contracts\
contract Listener1 is ABI1$OnSwapFunction { /* ... */ }\
contract Listener2 is ABI2$OnSwapFunction { /* ... */ }\
```\
\
### 2. Prefixed Naming for Shared State\
\
If you need to share state between handlers for conflicting functions within a single contract, you can configure `sim.toml` to prefix the generated names.\
\
```toml sim.toml\
[listeners]\
codegen_naming_convention = "abi_prefix"\
```\
\
This changes the generated function names, allowing you to implement them both in the same contract:\
\
```solidity Example Listener with Shared State\
contract CombinedListener is ABI1$OnSwapFunction, ABI2$OnSwapFunction {\
    // Store every recipient that swaps via DEX #1\
    address[] public swapRecipients;\
\
    // Emit an alert for large swaps coming through DEX #2\
    event LargeSwap(address indexed dex, address indexed recipient, uint256 amountOut);\
\
    // Handler for ABI1 (e.g., Uniswap V2 style router)\
    function ABI1$onSwapFunction(\
        FunctionContext memory /*ctx*/,\
        ABI1$SwapFunctionInputs memory inputs\
    )\
        external\
        override\
    {\
        // Track who received tokens in this swap\
        swapRecipients.push(inputs.to);\
    }\
\
    // Handler for ABI2 (e.g., SushiSwap router)\
    function ABI2$onSwapFunction(\
        FunctionContext memory /*ctx*/,\
        ABI2$SwapFunctionInputs memory inputs\
    )\
        external\
        override\
    {\
        // Fire an event if the swap paid out at least 1 ETH worth of tokens\
        if (inputs.amountOut >= 1 ether) {\
            emit LargeSwap(msg.sender, inputs.to, inputs.amountOut);\
        }\
    }\
}\
\
contract Triggers is BaseTriggers {\
    function triggers() external override {\
        CombinedListener listener = new CombinedListener();\
\
        // DEX #1 (ABI1) on Ethereum\
        addTrigger(\
            chainContract(Chains.Ethereum, 0xAbCDEFabcdefABCdefABcdefaBCDEFabcdefAB),\
            listener.ABI1$triggerOnSwapFunction()\
        );\
\
        // DEX #2 (ABI2) on Ethereum\
        addTrigger(\
            chainContract(Chains.Ethereum, 0x1234561234561234561234561234561234561234),\
            listener.ABI2$triggerOnSwapFunction()\
        );\
    }\
}\
```\
\
<Note>\
  To learn more about the `codegen_naming_convention` property and other `sim.toml` configuration options, visit the [App Structure](/idx/app-structure#sim-toml) page.\
</Note>\
\
## Stack Too Deep Errors\
\
You may encounter a `Stack too deep` compilation error if your event contains more than 16 parameters, or if your handler function declares too many local variables. This is due to a fundamental limit in the Solidity EVM.\
\
The solution is to use a pattern called **Struct Flattening**. You group your event parameters into a `struct` and then define your event to take this struct as a single, **unnamed** parameter. Sim IDX recognizes this specific pattern and will automatically "flatten" the struct's members into individual columns in your database. This gives you the best of both worlds: code that compiles and a clean, relational database schema.\
\
<Info>\
  Implement struct flattening in your listener contract code (in `listeners/src/`), not in the generated files. Files in `listeners/lib/sim-idx-generated/` are auto-generated and should never be modified directly, as they will be overwritten when you run `sim build`.\
</Info>\
\
<Steps>\
  <Step title="Define a Struct">\
    Create a struct containing all the fields you want in your database table.\
\
    ```solidity\
    struct EmitSwapData {\
        uint64 chainId;\
        bytes32 txnHash;\
        uint64 blockNumber;\
        uint64 blockTimestamp;\
        bytes32 poolId;\
        address fromToken;\
        uint256 fromTokenAmt;\
        string fromTokenSymbol;\
        string fromTokenName;\
        uint64 fromTokenDecimals;\
        address toToken;\
        uint256 toTokenAmt;\
        string toTokenSymbol;\
        string toTokenName;\
        uint64 toTokenDecimals;\
        address txnOriginator;\
        address recipient;\
        address poolManager;\
    }\
    ```\
\
    <Note>\
      This struct can be defined in any Solidity file within `listeners/src/`, but it must be properly imported in any file where you plan to use it for events or handler functions.\
    </Note>\
  </Step>\
\
  <Step title="Update Event Definition">\
    Change your event to accept the struct as a single, **unnamed** parameter. This is the crucial step that enables struct flattening.\
\
    ```solidity\
    // Incorrect: event Swap(EmitSwapData emitData);\
    // Correct:\
    event Swap(EmitSwapData);\
    ```\
  </Step>\
\
  <Step title="Populate and Emit the Struct">\
    In your handler, create an instance of the struct, populate its fields, and emit it.\
\
    ```solidity\
    function onSwapFunction(...) external override {\
        // ...\
        EmitSwapData memory emitData;\
        emitData.chainId = uint64(block.chainid);\
        emitData.txnHash = ctx.txn.hash;\
        emitData.blockNumber = blockNumber();\
        // ... populate all other fields\
\
        emit Swap(emitData);\
    }\
    ```\
  </Step>\
</Steps>\
\
By following this pattern, you can define events with any number of parameters while keeping your code compliant with the EVM's limitations.\
\
# Listener Features\
Source: https://docs.sim.dune.com/idx/listener/features\
\
After learning about listeners in the [Listener Basics](/idx/listener) guide, you can use more advanced features to build sophisticated indexers.\
This page explores core Sim IDX concepts that give you more flexibility in how you trigger listeners and structure your onchain data.\
\
We will cover advanced triggering, calling other contracts via interfaces, and adding indexes to your generated database.\
\
## Trigger on an ABI\
\
The `chainAbi` helper allows you to trigger your listener on any contract that matches a specific ABI signature. This is incredibly powerful for monitoring activity across all instances of a particular standard, like ERC-721 or Uniswap V3 pools, without needing to list every contract address explicitly.\
\
<Note>\
  **ABI Matching is Permissive**: The matching behavior is permissive - if a contract implements the functions and events in the specified ABI, it counts as a match even if it also implements other functionality. This means contracts don't need to match the ABI exactly; they just need to include the required functions and events.\
</Note>\
\
The example below shows how to trigger the `onBurnEvent` handler for any contract on Ethereum that matches the `UniswapV3Pool` ABI. The `UniswapV3Pool$Abi()` is a helper struct that is automatically generated from that ABI file.\
\
```solidity Main.sol\
import "./UniswapPoolListener.sol";\
\
contract Triggers is BaseTriggers {\
    function triggers() external virtual override {\
        UniswapPoolListener listener = new UniswapPoolListener();\
        // Trigger on any contract on Ethereum matching the UniswapV3Pool ABI\
        addTrigger(chainAbi(Chains.Ethereum, UniswapV3Pool$Abi()), listener.triggerOnBurnEvent());\
    }\
}\
```\
\
```solidity UniswapPoolListener.sol\
contract UniswapPoolListener is UniswapV3Pool$OnBurnEvent {\
    event PoolBurn(address indexed poolAddress, address owner, int24 tickLower, int24 tickUpper, uint128 amount);\
\
    function onBurnEvent(EventContext memory ctx, UniswapV3Pool$BurnEventParams memory inputs) external override {\
        // Only emit an event if the burn amount is greater than zero\
        if (inputs.amount > 0) {\
            emit PoolBurn(\
                ctx.txn.call.callee(), // The address of the pool that emitted the event\
                inputs.owner,\
                inputs.tickLower,\
                inputs.tickUpper,\
                inputs.amount\
            );\
        }\
    }\
}\
```\
\
## Trigger Globally\
\
The `chainGlobal` helper creates triggers that are not tied to any specific contract or ABI. This can be used to set up block-level handlers with `onBlock` for tasks that need to run once per block, such as creating periodic data snapshots, calculating time-weighted averages, or performing end-of-block settlements.\
\
The framework provides a built-in abstract contract, `Raw$OnBlock`, for this purpose.\
First, implement the `onBlock` handler and register the trigger in the `Triggers` contract.\
Next, add `Raw$OnBlock` to your listener's inheritance list.\
\
```solidity Main.sol\
import "./MyBlockListener.sol";\
\
contract Triggers is BaseTriggers {\
    function triggers() external virtual override {\
        MyBlockListener listener = new MyBlockListener();\
        addTrigger(chainGlobal(Chains.Ethereum), listener.triggerOnBlock());\
    }\
}\
```\
\
```solidity MyBlockListener.sol\
contract MyBlockListener is Raw$OnBlock {\
    event BlockProcessed(uint256 blockNumber, uint256 timestamp);\
\
    function onBlock(RawBlockContext memory /*ctx*/) external override {\
        emit BlockProcessed(block.number, block.timestamp);\
    }\
}\
```\
\
The framework also provides abstract contracts for `Raw$OnCall` and `Raw$OnLog`, allowing you to create global triggers for every function call or every event log on a chain.\
\
## Register Multiple Triggers\
\
`addTriggers` (plural) lets you register several handler functions for the same contract, ABI, or global target in one call. It accepts an array of trigger functions.\
\
<Note>\
  `addTriggers` lives in the same `Triggers` contract as `addTrigger`. It is purely a convenience helper and behaviour is identical. If you are new to triggers, start with the [Listener Basics](/idx/listener) guide where `addTrigger` is introduced.\
</Note>\
\
```solidity listeners/src/Main.sol\
import "./MyPoolListener.sol";\
\
contract Triggers is BaseTriggers {\
    function triggers() external override {\
        MyPoolListener listener = new MyPoolListener();\
\
        // Collect every handler we care about for this pool\
        Trigger[] memory poolTriggers = [\
            listener.UniswapV3Pool$triggerOnSwapEvent(),\
            listener.UniswapV3Pool$triggerOnMintEvent(),\
            listener.UniswapV3Pool$triggerOnBurnEvent()\
        ];\
\
        // Register all three triggers for the same contract in one call\
        addTriggers(\
            chainContract(Chains.Ethereum, 0x1F98431c8aD98523631AE4a59f267346ea31F984),\
            poolTriggers\
        );\
    }\
}\
```\
\
Use `addTriggers` when your listener exposes multiple handlers that share a target.\
\
## Use Interfaces\
\
Often, your handler is triggered by one contract, but you need to fetch additional data from another contract to enrich your event. For example, a `Swap` event on a pool tells you a swap occurred, but you need to call the pool contract directly to get its current `slot0` state. Solidity interfaces allow your listener to do this.\
\
### 1. Define the Interface\
\
It's best practice to create an `interfaces` directory (e.g., `listeners/src/interfaces/`) and define the interface in a new `.sol` file.\
\
```solidity listeners/src/interfaces/IUniswapV3Pool.sol\
// SPDX-License-Identifier: UNLICENSED\
pragma solidity ^0.8.13;\
\
interface IUniswapV3Pool {\
    function slot0()\
        external\
        view\
        returns (\
            uint160 sqrtPriceX96,\
            int24 tick,\
            uint16 observationIndex,\
            uint16 observationCardinality,\
            uint16 observationCardinalityNext,\
            uint8 feeProtocol,\
            bool unlocked\
        );\
    // ... other functions\
}\
```\
\
### 2. Import and Use the Interface\
\
In your listener, import the interface. You can then cast a contract's address to the interface type to call its functions.\
\
```solidity\
import {IUniswapV3Pool} from "./interfaces/IUniswapV3Pool.sol";\
\
contract Listener is UniswapV3Pool$OnSwapEvent {\
    // ...\
    function onSwapEvent(EventContext memory ctx, ...) external override {\
        // Cast the address of the contract that triggered the event\
        // to the IUniswapV3Pool interface to call its functions.\
        (uint160 sqrtPriceX96, , , , , , ) = IUniswapV3Pool(ctx.txn.call.callee()).slot0();\
    }\
}\
```\
\
<Note>\
  For guidance on resolving compilation issues such as name conflicts or `Stack too deep` errors, refer to the [Listener Errors](/idx/listener/errors) guide.\
</Note>\
\
## DB Indexes\
\
Database indexes are a common way to improve database performance. Sim IDX lets you define indexes directly on the [event definition](/idx/listener#define-and-emit-events) of your listener contract, giving you fine-grained control of your database's performance.\
\
<Card title="Learn More About PostgreSQL Database Indexes" href="https://www.postgresql.org/docs/current/indexes-intro.html">\
  To learn more about database indexes, visit the PostgreSQL documentation.\
</Card>\
\
### Index Definition Syntax\
\
To add a database index, use a special comment with the `@custom:index` annotation directly *above* the `event` definition in your Solidity listener.\
\
```text\
/// @custom:index <index_name> <INDEX_TYPE> (<column1>, <column2>, ...);\
```\
\
The syntax components:\
\
* `<index_name>`: A unique name for your index.\
* `<INDEX_TYPE>`: The type of index to create (e.g., `BTREE`, `HASH`).\
* `(<columns>)`: A comma-separated list of one or more columns to include in the index. These names must **exactly match** the field names in your event or struct definition, including case.\
\
<Accordion title="Adding Indexes to Events with Unnamed Structs">\
  When events use unnamed structs to avoid [Solidity's "Stack too deep" errors](/idx/listener/errors#stack-too-deep-errors), column names in your index annotations must match the **struct field names**, not event parameter names.\
\
  ```solidity\
  struct SwapData {\
      uint64 chainId;\
      bytes32 txnHash;\
      uint64 blockNumber;\
      uint64 blockTimestamp;\
      bytes32 poolId;\
      address fromToken;\
      uint256 fromTokenAmt;\
      string fromTokenSymbol;\
      string fromTokenName;\
      uint64 fromTokenDecimals;\
      address toToken;\
      uint256 toTokenAmt;\
      string toTokenSymbol;\
      string toTokenName;\
      uint64 toTokenDecimals;\
      address txnOriginator;\
      address recipient;\
      address poolManager;\
  }\
\
  /// @custom:index swap_pool_time_idx BTREE (poolId, blockNumber, blockTimestamp);\
  event Swap(SwapData);\
  ```\
\
  Notice how the index column names (`poolId`, `blockNumber`, `blockTimestamp`, etc.) correspond exactly to the field names in the `SwapData` struct, even though the event takes an unnamed parameter.\
</Accordion>\
\
<Accordion title="Adding Indexes to Events with Named Parameters">\
  For simple events with fewer parameters that don't hit Solidity's stack limits, you can use named parameters directly. Column names must match the event parameter names.\
\
  ```solidity\
  /// @custom:index position_owner_idx HASH (to_address, token_id);\
  event PositionOwnerChanges(\
      bytes32 txn_hash,\
      uint256 block_number,\
      uint256 block_timestamp,\
      address from_address,\
      address to_address,\
      uint256 token_id,\
      address pool\
  );\
  ```\
</Accordion>\
\
### Multiple Indexes Per Event\
\
You can define multiple indexes for a single event by adding multiple `@custom:index` lines. This is useful when you want to query the same table in different ways.\
\
```solidity\
struct LiquidityEventData {\
    bytes32 txnHash;\
    uint64 blockNumber;\
    uint64 blockTimestamp;\
    address pool;\
    address owner;\
    int24 tickLower;\
    int24 tickUpper;\
    uint128 liquidity;\
    uint256 amount0;\
    uint256 amount1;\
}\
\
/// @custom:index lp_events_by_pool BTREE (pool, blockNumber);\
/// @custom:index lp_events_by_owner BRIN (owner, blockTimestamp);\
/// @custom:index lp_events_by_tick_range HASH (pool, tickLower, tickUpper);\
event LiquidityEvent(LiquidityEventData);\
```\
\
<Note>\
  When events use unnamed structs to solve [Solidity's stack errors](/idx/listener/errors#stack-too-deep-errors), Sim IDX automatically flattens the struct fields into individual database columns. Your index annotations reference these **struct field names**.\
</Note>\
\
### Supported Index Types\
\
Sim IDX supports several PostgreSQL index types. `BTREE` is the default and most common type, suitable for a wide range of queries.\
\
| Type    | Use Case                                                                                                                                                      |\
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |\
| `BTREE` | The default and most versatile index type. Good for equality and range queries on sortable data (`=`, `>`, `<`, `BETWEEN`, `IN`).                             |\
| `HASH`  | Useful only for simple equality comparisons (`=`).                                                                                                            |\
| `BRIN`  | Best for very large tables where columns have a natural correlation with their physical storage order (e.g., timestamps).                                     |\
| `GIN`   | An inverted index useful for composite types like `array` or `jsonb`. It can efficiently check for the presence of specific values within the composite type. |\
\
<Card title="Learn More About PostgreSQL Index Types" href="https://www.postgresql.org/docs/current/indexes-types.html">\
  To learn more about index types and their specific use cases, visit the\
  PostgreSQL documentation.\
</Card>\
\
### Syntax Validation\
\
The `sim build` command automatically validates your index definitions. If it detects an error in the syntax, it will fail the build and provide a descriptive error message.\
\
For example, if you misspell a column name:\
`Error: Cannot find column(s): 'block_numbr' in event PositionOwnerChanges`\
\
# App Templates\
Source: https://docs.sim.dune.com/idx/resources/templates\
\
Sim IDX templates let you bootstrap fully-featured indexing apps in minutes.\
Each template ships with a production-ready listener contract, events, and REST API logic so you can focus on your custom business logic instead of boilerplate.\
\
## Contract Decoder\
\
Quickly decode and index data emitted by any smart contract.\
The template scaffolds a listener that listens to function calls and events (pre-configured for the Uniswap V3 Factory) and surfaces the decoded results via an API.\
\
```bash\
sim init --template=contract-decoder\
```\
\
<Columns cols={2}>\
  <Card title="Step-by-step Guide" href="/idx/guides/decode-any-contract">\
    Complete walkthrough showing how to configure the contract-decoder template to decode any smart contract, using the Moonbirds NFT contract as an example.\
  </Card>\
\
  <Card title="sim-idx-example-contract-decoder" icon="github" href="https://github.com/duneanalytics/sim-idx-example-contract-decoder">\
    View the complete template source code and example implementation on GitHub.\
  </Card>\
</Columns>\
\
## Uniswap V3 In-Range LPs\
\
Index Uniswap V3 liquidity provision events and query which positions are in-range at any block. The template exposes an `/lp-snapshot` endpoint that returns all active LP positions for a given pool.\
\
```bash\
sim init --template=univ3-lp\
```\
\
<CardGroup cols={1}>\
  <Card title="sim-idx-example-univ3-lp" icon="github" horizontal href="https://github.com/duneanalytics/sim-idx-example-univ3-lp" />\
</CardGroup>\
\
# Developer Quickstart\
Source: https://docs.sim.dune.com/index\
\
Take your first steps with the Sim APIs\
\
<Frame>\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/quickstart.webp" alt="Quickstart" title="Quickstart" className="mx-auto" style={{ width:"100%" }} />\
</Frame>\
\
Sim APIs power wallets and onchain apps with fast, reliable access to real-time blockchain activity and ownership data.\
Access data from 60+ chains with a single request.\
\
This guide will help you make your first API call to retrieve multichain token balances for an address.\
\
## Authentication\
\
Sim APIs use API keys to authenticate requests.\
You can create and manage your API keys in your [Sim Dashboard](https://sim.dune.com/).\
\
<Frame caption="To generate a new API key, visit the Keys page and click the New button.">\
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/sim-dune/images/get-sim-api-key.png" />\
</Frame>\
\
Select **Sim API** for the key's purpose when creating your new API key.\
\
To authenticate, include your API key in the `X-Sim-Api-Key` header for every request.\
\
```bash\
curl --request GET \\
  --header "X-Sim-Api-Key: YOUR_API_KEY"\
```\
\
All API requests must be made over HTTPS.\
Calls made over plain HTTP will fail.\
API requests without authentication will also fail.\
\
<Note>\
  Your API keys carry many privileges, so be sure to keep them secure.\
  Do not share your secret API keys in public places like GitHub, client-side code, and so on.\
</Note>\
\
## Your First Request\
\
Let's make your first request. We'll retrieve token balances for `0xd8da6bf26964af9d7eed9e03e53415d37aa96045` (Vitalik's wallet) across multiple EVM chains using the [Balances API](/evm/balances).\
\
Here's how to make the API call:\
\
<CodeGroup>\
  ```bash cURL\
  curl -X GET "https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045" \\
       -H "X-Sim-Api-Key: YOUR_API_KEY"\
  ```\
\
  ```javascript JavaScript\
  const options = {method: 'GET', headers: {'X-Sim-Api-Key': 'YOUR_API_KEY'}};\
\
  fetch('https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045', options)\
    .then(response => response.json())\
    .then(response => console.log(response))\
    .catch(err => console.error(err));\
  ```\
\
  ```python Python\
  import requests\
\
  url = "https://api.sim.dune.com/v1/evm/balances/0xd8da6bf26964af9d7eed9e03e53415d37aa96045"\
\
  headers = {"X-Sim-Api-Key": "YOUR_API_KEY"}\
\
  response = requests.request("GET", url, headers=headers)\
\
  print(response.text)\
  ```\
</CodeGroup>\
\
<Note>\
  Replace `YOUR_API_KEY` with your actual API key from the Sim Dashboard.\
</Note>\
\
The API will return a JSON response containing an array of `balances`.\
Each object in the array represents a token balance for the specified address on one of the chains, including various details.\
\
```json Response (JSON) [expandable]\
{\
"balances": [\
    {\
      "address": "native",\
      "amount": "605371497350928252303",\
      "chain": "ethereum",\
      "decimals": 18,\
      "price_usd": 3042.816964922323,\
      "symbol": "ETH",\
      "value_usd": 1842034.6622198338\
    }\
],\
"next_offset": "dKMBWDLqM7vlyn5OMEXsLWp0nI4AAAABA5JLazNO7x4poVGqUwsgxgqvvIg",\
"request_time": "2023-11-07T05:31:56Z",\
"response_time": "2023-11-07T05:31:56Z",\
"wallet_address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"\
}\
```\
\
With a single API request you get normalized, realtime data with enriched metadata and pricing.\
\
## Next Steps\
\
After making your first API call to Sim APIs, you'll either see the JSON response shown above (success!) or you might encounter an error. If you received an error, check out our [Error Handling Guide](/error-handling) for troubleshooting tips and best practices.\
\
If your call was successful, you've seen how easily you can retrieve comprehensive, multichain data. But this is just the beginning of what's possible.\
\
Are you ready to learn more?\
Here are a few paths you can explore:\
\
<CardGroup cols={2}>\
  <Card icon="ethereum" title="Explore EVM Endpoints" href="/evm/overview">\
    See all available EVM API endpoints. Learn how to fetch transaction histories, token metadata, and more detailed onchain activity.\
  </Card>\
\
  <Card icon="books" title="Build Real App Features" href="/evm/build-a-realtime-wallet">\
    Follow our practical guides to build fully-functional features like token portfolio displays, real-time activity feeds, and more for your onchain apps.\
  </Card>\
\
  <Card icon="microchip-ai" title="Build with AI" href="/build-with-ai">\
    Speed up your development using Sim APIs with our LLM-friendly resources.\
  </Card>\
</CardGroup>\
\
# Cloudflare Proxy\
Source: https://docs.sim.dune.com/proxy\
\
Learn how to set up a Cloudflare Worker to securely proxy your Sim API requests, protecting your API key from client-side exposure.\
\
Protect your Sim API key when making requests from client-side apps by using a Cloudflare Worker as a proxy.\
This worker receives requests from you app, securely adds your `SIM_API_KEY` on the server, and then forwards the requests to the Sim API endpoints.\
\
We provide a one-click-deploy Cloudflare Worker to simplify this setup.\
Find detailed instructions in our GitHub repo:\
\
<Card title="Sim API Proxy on GitHub" icon="github" horizontal href="https://github.com/duneanalytics/sim-proxy">\
  One-click deployment and comprehensive setup instructions for the Cloudflare Worker proxy.\
</Card>\
\
# Support\
Source: https://docs.sim.dune.com/support\
\
## Primary Support: Intercom\
\
Most of our support is provided through **Intercom**, directly accessible from the Sim [web portal](https://sim.dune.com/). Just look for the small chat icon in the bottom-right corner.\
\
Through Intercom, you can:\
\
* Chat with **Blocky**, our Sim AI support agent, powered by Dune\
* Get help from the **Dune support team**, either live via chat or asynchronously via email/ticket\
\
We want to help you successfully integrate and use Sim. This page outlines the support channels available to you.\
\
## Developer Community\
\
Join the official Sim [Telegram Group](https://t.me/+nvyoX5xyxNwyNjU0) to connect with other developers, ask questions, and get help from the community.\
\
<Card title="Telegram" icon="telegram" iconType="regular" horizontal href="https://t.me/+nvyoX5xyxNwyNjU0" />\
\
## API Status\
\
You can check the operational status of Sim APIs and view uptime history on our [status page](https://status.sim.dune.com/).\
\
## Rate Limits & Scaling\
\
Information about API rate limits for your current plan can be found under Billing at [sim.dune.com](https://sim.dune.com). Need higher throughput or interested in Enterprise plans with custom limits? Contact us through Intercom.\
\
## Other Questions\
\
If your question isn’t answered in the docs or you’re reporting a bug, please reach out via the Intercom button in the app.\
\
Alternatively, you can email [simsupport@dune.com](mailto:simsupport@dune.com) to contact our team.\
\
<Card title="Support Email" icon="envelope" horizontal href="mailto:simsupport@dune.com" />\
\
# Balances\
Source: https://docs.sim.dune.com/svm/balances\
\
svm/openapi/balances.json get /beta/svm/balances/{uri}\
Get token balances for a given SVM address\
\
The Token Balances API provides accurate and fast real time balances of the native, SPL and SPL-2022 tokens of accounts on supported SVM blockchains.\
We currently support Solana and Eclipse.\
\
<Note>\
  * These endpoints are authenticated with a normal Sim API key.\
  * Specify `?chains=solana,eclipse` to fetch balances only for select chains.\
  * Token metadata includes symbols, decimals, and price information when available.\
</Note>\
\
# Response Structure\
\
The API returns a JSON object with the following top-level fields:\
\
| Field                | Description                                       | Type        |\
| -------------------- | ------------------------------------------------- | ----------- |\
| processing\_time\_ms | Time taken to process the request in milliseconds | number      |\
| wallet\_address      | The queried wallet address                        | string      |\
| next\_offset         | Pagination token for the next page of results     | string/null |\
| balances\_count      | Total number of balances returned                 | number      |\
| balances             | Array of token balance objects                    | array       |\
\
# Balance Object Fields\
\
Each item in the `balances` array contains the following fields:\
\
| Field           | Description                                                | Type        |\
| --------------- | ---------------------------------------------------------- | ----------- |\
| chain           | Name of blockchain of token                                | string      |\
| address         | Token contract address or blockchain name for native token | string      |\
| amount          | Amount of token owned in smallest unit                     | string      |\
| balance         | Formatted amount with decimals applied                     | string      |\
| value\_usd      | Current value of token owned, if available                 | number      |\
| program\_id     | Program ID of the token (for SPL tokens)                   | string      |\
| decimals        | Decimals of token                                          | number      |\
| total\_supply   | Total supply of the token                                  | string      |\
| name            | Name of token                                              | string      |\
| symbol          | Symbol of token                                            | string      |\
| uri             | URI to token metadata                                      | string      |\
| price\_usd      | Current price of token, if available                       | number      |\
| liquidity\_usd  | Liquidity in USD, if available                             | number/null |\
| pool\_type      | Type of liquidity pool, if available                       | string/null |\
| pool\_address   | Address of liquidity pool, if available                    | string/null |\
| mint\_authority | Mint authority address, if available                       | string/null |\
\
# Pagination\
\
This endpoint is using cursor based pagination. You can use the `limit` parameter to define the maximum page size.\
Results might at times be less than the maximum page size.\
The `next_offset` value is passed back by the initial response and can be used to fetch the next page of results, by passing it as the `offset` query parameter in the next request.\
\
<Warning>You can only use the value from `next_offset` to set the `offset` parameter of the next page of results. Using your own `offset` value will not have any effect.</Warning>\
\
# SVM Overview\
Source: https://docs.sim.dune.com/svm/overview\
\
<CardGroup cols={2}>\
  <Card title="Balances" href="/svm/balances">\
    Get accurate and fast realtime balances of native, SPL and SPL-2022 tokens on Solana and Eclipse blockchains, with token metadata and USD valuations.\
  </Card>\
\
  <Card title="Transactions" href="/svm/transactions">\
    Quick and accurate lookup of transactions associated with a Solana address, ordered by descending block time, with complete raw transaction data.\
  </Card>\
</CardGroup>\
\
# Transactions\
Source: https://docs.sim.dune.com/svm/transactions\
\
svm/openapi/transactions.json get /beta/svm/transactions/{uri}\
Get transactions for a given SVM address\
\
The Transactions Endpoint allows for quick and accurate lookup of transactions associated with an address.\
We currently only support Solana.\
\
# Response Structure\
\
The API returns a JSON object with the following top-level fields:\
\
| Field        | Description                                   | Type        |\
| ------------ | --------------------------------------------- | ----------- |\
| next\_offset | Pagination token for the next page of results | string/null |\
| transactions | Array of transaction objects                  | array       |\
\
# Transaction Object Fields\
\
Each item in the `transactions` array contains the following fields:\
\
| Field            | Description                                                     | Type   |\
| ---------------- | --------------------------------------------------------------- | ------ |\
| address          | Wallet address                                                  | string |\
| block\_slot      | Block's sequential index                                        | number |\
| block\_time      | Timestamp of block creation (in microseconds)                   | number |\
| chain            | Name of the blockchain                                          | string |\
| raw\_transaction | Raw transaction data from the RPC node at the time of ingestion | object |\
\
<Note>\
  See [getTransaction RPC Method](https://solana.com/docs/rpc/http/gettransaction) for more details about `raw_transaction`.\
</Note>\
\
# Ordering\
\
The data is ordered by descending block time, so that new transactions will always be delivered first.\
\
# Pagination\
\
This endpoint is using cursor based pagination. You can use the `limit` parameter to define the maximum page size.\
Results might at times be less than the maximum page size.\
The `next_offset` value is included in the response and can be utilized to fetch the next page of results by passing it as the `offset` query parameter in the next request.\
\
<Warning>You can only use the value from `next_offset` to set the `offset` parameter of the next page of results. Using your own `offset` value will not have any effect.</Warning>\
\
# Token Filtering\
Source: https://docs.sim.dune.com/token-filtering\
\
Learn how Sim APIs provide liquidity data to help you filter tokens based on your specific needs.\
\
When working with blockchain data, you'll encounter numerous tokens with varying levels of liquidity and utility.\
Sim APIs provide comprehensive token metadata and liquidity data to help you implement custom filtering logic that fits your specific requirements.\
\
## Our Approach to Token Data\
\
We don't offer direct spam filtering because definitions of spam are varying and subjective.\
Instead, we provide the best objective measure that we're aware of—liquidity data—to allow developers to filter downstream based on their specific requirements.\
\
By grounding filtering decisions in measurable, onchain liquidity, rather than subjective labels, our method offers several advantages:\
\
* **Objective**: We provide liquidity metrics rather than subjective spam classifications\
* **Realtime**: Liquidity is checked at query time, not based on outdated lists\
* **Flexible**: All filtering data is provided, allowing you to implement custom logic that fits your use case\
* **Transparent**: You have full visibility into the data used for filtering decisions\
* **Adaptable**: Your filtering criteria can evolve with your application's needs\
\
<Note>\
  **We do not detect or flag honeypots, scam tokens, or other malicious contracts**.\
  Our APIs will return price and liquidity data for any token that has trading activity.\
  The presence of price data does not indicate that a token is safe to trade or that transactions will be successful.\
</Note>\
\
## Supported APIs\
\
<Columns>\
  <Card title="EVM Balances API" href="/evm/balances">\
    Get wallet token balances with comprehensive filtering metadata\
  </Card>\
\
  <Card title="EVM Activity API" href="/evm/activity">\
    Track wallet activity with detailed token information\
  </Card>\
</Columns>\
\
For each token in our responses, we include comprehensive metadata that gives you the information needed to make informed filtering decisions:\
\
1. **Token basics**: `symbol`, `name`, and `decimals` properties\
2. **Price data**: Current USD pricing information using `price_usd`\
3. **Liquidity information**: Real-time liquidity pool data with `pool_size`\
4. **Pool size**: The total value locked in the token's highest liquidity pool using `low_liquidity`\
\
## How Sim Calculates Liquidity Data\
\
Sim's approach to assessing liquidity is sophisticated and real-time:\
\
* For each token, we dynamically track the highest liquidity route to USDC\
* We calculate the USD value of the liquidity along that route for each token upon each query\
* This provides you with current, accurate liquidity information rather than static or outdated data\
\
<Warning>\
  When `pool_size` is very small and `low_liquidity` is true, you should disregard `price_usd` and `value_usd` fields. While the price is technically correct based on the best liquidity pool we can find, it becomes effectively meaningless when there's insufficient liquidity. You can't actually exchange the token for anything else of value at that price.\
</Warning>\
\
## Using Token Data for Custom Filtering\
\
Let's explore practical implementations for different filtering scenarios.\
The following examples demonstrate how to use this data to create robust filtering logic that meets your app's needs.\
\
### Liquidity Threshold Filtering\
\
Filter tokens based on minimum liquidity requirements using the `pool_size` field. This is one of the most effective ways to filter out low-quality tokens.\
\
```javascript\
// Filter tokens with at least $10,000 in liquidity\
const filterByLiquidity = (tokens, minLiquidity = 10000) => {\
return tokens.filter(token => {\
    return token.pool_size && token.pool_size >= minLiquidity;\
});\
};\
\
// Usage\
const filteredTokens = filterByLiquidity(tokenData, 10000);\
```\
\
This approach ensures you only show tokens that have sufficient trading volume and market depth, reducing the likelihood of displaying illiquid or potentially problematic tokens.\
\
### Allowlisting Specific Tokens\
\
Include certain tokens regardless of their liquidity metrics by maintaining a list of approved token addresses and chain IDs.\
\
A secure method for allowlisting is to use a combination of the token's unique contract `address` and its `chain_id`.\
This guarantees you are identifying the exact token on the correct network.\
\
```javascript\
// Allowlist of trusted tokens. Each entry is an object containing\
// the specific chainId and the token's contract address.\
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
];\
\
const filterWithAllowlist = (tokens, minLiquidity = 10000) => {\
return tokens.filter(token => {\
    // Check if the current token matches any in our allowlist.\
    const isAllowlisted = ALLOWLIST.some(allowlistItem => {\
      // Note: The Balances API uses `address`, while the Activity API uses `token_address`.\
      // We handle both possibilities here. We also convert to lowercase for a reliable match.\
      const tokenAddress = (token.address || token.token_address || '').toLowerCase();\
\
      return token.chain_id === allowlistItem.chainId && tokenAddress === allowlistItem.address;\
    });\
\
    // 1. If the token is on the allowlist, always include it.\
    if (isAllowlisted) {\
      return true;\
    }\
\
    // 2. For all other tokens, apply a standard liquidity filter.\
    return token.pool_size && token.pool_size >= minLiquidity;\
});\
};\
```\
\
### Denylisting Specific Tokens\
\
Exclude certain tokens even if they meet your liquidity criteria by maintaining a blocklist of problematic symbols, or any other criteria you choose.\
\
```javascript\
// Denylist of problematic token symbols\
const DENYLISTED_SYMBOLS = [\
'SCAM',\
'RUG',\
];\
\
const filterWithDenylist = (tokens) => {\
return tokens.filter(token => {\
    // Exclude denylisted tokens\
    if (token.symbol && DENYLISTED_SYMBOLS.includes(token.symbol.toUpperCase())) {\
      return false;\
    }\
    // Apply other filtering criteria\
    return token.pool_size && token.pool_size >= 1000;\
});\
};\
```\
\
Denylisting helps you maintain control over which tokens appear in your application, even if they have sufficient liquidity.\
\
### Custom Criteria Combinations\
\
Create sophisticated filtering logic by combining multiple criteria such as liquidity, completeness, and custom business rules.\
\
```javascript\
const advancedTokenFilter = (tokens, options = {}) => {\
const {\
    minLiquidity = 1000,\
    requireCompleteName = true,\
    minPriceUsd = 0.000001,\
    allowLowLiquidity = false\
} = options;\
\
return tokens.filter(token => {\
    // Check if token has complete metadata\
    if (requireCompleteName && (!token.name || !token.symbol)) {\
      return false;\
    }\
\
    // Check minimum price threshold\
    if (token.price_usd && token.price_usd < minPriceUsd) {\
      return false;\
    }\
\
    // Check liquidity requirements\
    if (!allowLowLiquidity && token.low_liquidity) {\
      return false;\
    }\
\
    if (token.pool_size && token.pool_size < minLiquidity) {\
      return false;\
    }\
\
    return true;\
});\
};\
```\
\
This approach allows you to create nuanced filtering that considers multiple factors simultaneously.\
\
### Token Completeness Filtering\
\
Filter based on whether tokens have complete metadata, ensuring users only see tokens with proper names and symbols.\
\
```javascript\
const filterCompleteTokens = (tokens) => {\
return tokens.filter(token => {\
    // Require all basic metadata to be present\
    const hasBasicInfo = token.name &&\
                        token.symbol &&\
                        token.decimals !== undefined;\
\
    // Optionally require price data\
    const hasPriceData = token.price_usd !== undefined;\
\
    return hasBasicInfo && hasPriceData;\
});\
};\
\
// Or create a more flexible version\
const filterTokensByCompleteness = (tokens, strict = false) => {\
return tokens.filter(token => {\
    if (strict) {\
      // Strict mode: require all fields\
      return token.name && token.symbol && token.decimals &&\
             token.price_usd && token.pool_size;\
    } else {\
      // Lenient mode: require only basic fields\
      return token.symbol && token.decimals !== undefined;\
    }\
});\
};\
```\
\
Completeness filtering ensures your users have meaningful information about the tokens they're viewing.\
\
`````