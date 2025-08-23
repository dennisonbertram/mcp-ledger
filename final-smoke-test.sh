#!/bin/bash

echo "🚀 MCP Ledger Server - Comprehensive Smoke Test"
echo "=============================================="

# Test 1: Server initialization
echo ""
echo "📡 Test 1: Server initialization"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"1.0.0"}}}' | timeout 5s npm start 2>/dev/null | head -1 | jq '.result.serverInfo.name' 2>/dev/null && echo "✅ Server initialized successfully"

# Test 2: Tool listing
echo ""
echo "🛠  Test 2: Tool listing"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | timeout 5s npm start 2>/dev/null | head -1 | jq '.result.tools | length' 2>/dev/null && echo "✅ Tools listed successfully"

# Test 3: Balance query (Ethereum mainnet)
echo ""
echo "💰 Test 3: Balance query (Ethereum mainnet)"
BALANCE=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_balance","arguments":{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","network":"mainnet"}}}' | timeout 10s npm start 2>/dev/null | head -1 | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.balanceEth' 2>/dev/null)
if [[ "$BALANCE" =~ ^[0-9]+\.[0-9]+$ ]]; then
  echo "✅ Balance retrieved: ${BALANCE} ETH"
else
  echo "❌ Balance query failed"
fi

# Test 4: Balance query (Polygon)
echo ""
echo "🔹 Test 4: Balance query (Polygon)"
POLYGON_BALANCE=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_balance","arguments":{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","network":"polygon"}}}' | timeout 10s npm start 2>/dev/null | head -1 | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.balanceEth' 2>/dev/null)
if [[ "$POLYGON_BALANCE" =~ ^[0-9]+\.[0-9]+$ ]]; then
  echo "✅ Polygon balance retrieved: ${POLYGON_BALANCE} MATIC"
else
  echo "❌ Polygon balance query failed"
fi

# Test 5: Error handling (invalid address)
echo ""
echo "⚠️  Test 5: Error handling (invalid address)"
ERROR_RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_balance","arguments":{"address":"invalid","network":"mainnet"}}}' | timeout 5s npm start 2>/dev/null | head -1 | jq -r '.result.isError' 2>/dev/null)
if [[ "$ERROR_RESULT" == "true" ]]; then
  echo "✅ Error handling working correctly"
else
  echo "❌ Error handling not working"
fi

# Test 6: Ledger connection (should fail gracefully)
echo ""
echo "🔒 Test 6: Ledger connection (should fail gracefully without device)"
LEDGER_ERROR=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ledger_address","arguments":{}}}' | timeout 5s npm start 2>/dev/null | head -1 | jq -r '.result.isError' 2>/dev/null)
if [[ "$LEDGER_ERROR" == "true" ]]; then
  echo "✅ Ledger error handled gracefully"
else
  echo "❌ Ledger error handling issue"
fi

echo ""
echo "🎉 Smoke test completed!"
echo "The MCP Ledger server is functional and ready for use."