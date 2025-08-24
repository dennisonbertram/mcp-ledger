# Testing Strategy for MCP Ledger Hybrid Architecture

## 🎯 Testing Challenges

### Hardware Dependencies
- Ledger device may not be available in CI/CD
- USB/HID access requires special permissions
- Device state changes during tests
- Physical user interaction required for some operations

### Distributed Architecture  
- Vercel serverless functions
- Local proxy service
- Network communication between components
- Different deployment environments

## 🧪 Testing Levels

### 1. Unit Tests
Test individual functions and services in isolation.

### 2. Integration Tests
Test component interactions with mocked dependencies.

### 3. Contract Tests
Verify API contracts between Vercel server and Ledger proxy.

### 4. End-to-End Tests
Test complete user workflows with real or simulated hardware.

### 5. Hardware Tests
Test actual Ledger device integration (manual/optional).

## 🚀 Test Execution Strategy

### Continuous Integration (No Hardware)
```bash
npm run test:unit
npm run test:integration  
npm run test:contracts
```

### Local Development (With Hardware)
```bash
npm run test:all
npm run test:hardware
npm run test:e2e
```

### Production Validation
```bash  
npm run test:smoke
npm run test:health
```