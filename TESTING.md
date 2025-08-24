# Testing Guide for MCP Ledger Server

## 🧪 Testing Strategy Overview

This project uses a **comprehensive multi-layer testing approach** designed to handle the unique challenges of testing a hybrid architecture with hardware dependencies.

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                         │
├─────────────────────────────────────────────────────────────┤
│  Hardware Tests   │ Real Ledger device integration         │  
├─────────────────────────────────────────────────────────────┤
│  E2E Tests        │ Full system workflows (mocked)         │
├─────────────────────────────────────────────────────────────┤
│  Contract Tests   │ API compatibility between components    │
├─────────────────────────────────────────────────────────────┤
│  Integration      │ Component interaction testing           │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests       │ Individual function validation          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install test dependencies  
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 supertest
```

### Run Tests
```bash
# Run all tests (CI-safe, no hardware)
npm run test:ci

# Run all tests including E2E
npm run test:all  

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui
```

## 📋 Test Categories

### 1️⃣ Unit Tests (`npm run test:unit`)
**Purpose**: Test individual functions and utilities in isolation
**Requirements**: None - fully mocked
**Duration**: < 10 seconds

```bash
npm run test:unit

# Example output:
✓ Address Validation (12ms)
✓ Balance Formatting (8ms) 
✓ Network Configuration (5ms)
✓ Error Handling (15ms)
```

**What's Tested**:
- Address validation logic
- Balance formatting functions
- Network configuration mapping
- Error handling utilities
- API URL construction

### 2️⃣ Integration Tests (`npm run test:integration`)
**Purpose**: Test component interactions with mocked dependencies
**Requirements**: None - hardware mocked
**Duration**: < 30 seconds

```bash
npm run test:integration

# Example output:
✓ Proxy Health Endpoints (45ms)
✓ Address Generation API (32ms)
✓ Device Management (28ms) 
✓ Error Handling (41ms)
```

**What's Tested**:
- Ledger proxy API endpoints
- Request/response handling
- Error scenarios and recovery
- Input validation

### 3️⃣ Contract Tests (`npm run test:contracts`)
**Purpose**: Verify API compatibility between Vercel server and Ledger proxy
**Requirements**: None - schema validation only
**Duration**: < 5 seconds

```bash
npm run test:contracts

# Example output:
✓ Request Schema Validation (8ms)
✓ Response Schema Validation (12ms)
✓ Data Format Consistency (6ms)
✓ Error Response Structure (9ms)
```

**What's Tested**:
- Zod schema validation
- API request/response formats
- Data type consistency
- Error response structure

### 4️⃣ End-to-End Tests (`npm run test:e2e`)  
**Purpose**: Test complete user workflows with mocked external services
**Requirements**: None - fully simulated
**Duration**: < 60 seconds

```bash
npm run test:e2e

# Example output:
✓ Complete Portfolio Analysis Workflow (234ms)
✓ Transaction Preparation Workflow (187ms)
✓ Error Handling and Recovery (156ms)
✓ Performance and Reliability (298ms)
```

**What's Tested**:
- Full user workflows from AI agent to result
- Component coordination
- Error propagation and recovery
- Performance characteristics

### 5️⃣ Hardware Tests (`npm run test:hardware`) ⚠️
**Purpose**: Test actual Ledger device integration  
**Requirements**: **Physical Ledger device required**
**Duration**: 2-5 minutes (includes user interaction)

```bash
# Only run with connected Ledger device
npm run test:hardware

# Example output:
🔌 Connecting to Ledger device...
📱 Please ensure:
  - Ledger device is connected via USB
  - Device is unlocked  
  - Ethereum app is open

✓ Address Generation (1.2s)
✓ Device Information (850ms)
✓ Performance Characteristics (3.1s)
```

**What's Tested**:
- Real Ledger device communication
- USB/HID transport layer
- Address generation accuracy
- Device error handling
- Performance measurements

## 🔄 CI/CD Testing

### Continuous Integration (GitHub Actions)
```yaml
# .github/workflows/test.yml
- name: Run CI Tests
  run: npm run test:ci
  # Includes: unit + integration + contract tests
  # Excludes: e2e + hardware tests
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npx husky install

# Tests run automatically before each commit
npm run test:ci && npm run lint && npm run typecheck
```

## 🎯 Test Execution Examples

### Development Workflow
```bash
# Start development with watch mode
npm run test:watch

# Make code changes...
# Tests automatically re-run on file changes

# Run specific test suite
npm run test:unit
npm run test:integration

# Check coverage
npm run test:coverage
```

### Production Deployment Testing
```bash
# Smoke tests for health checks
npm run test:smoke

# Full system validation (no hardware)
npm run test:all

# Component-specific testing
npm run test:vercel  # Test Vercel server
npm run test:proxy   # Test Ledger proxy
```

### Hardware Validation (Manual)
```bash
# Connect Ledger device first
# 1. Connect via USB
# 2. Unlock device
# 3. Open Ethereum app
# 4. Enable "Blind signing" in settings

# Run hardware tests
npm run test:hardware

# Expected output:
✅ Connected to Ledger device successfully
📍 Default address: 0x742d35Cc6632C0532c718C2c8E8d9A2B0FCC3c5c
⚡ Address generation performance: Average: 456ms
```

## 🛠️ Debugging Tests

### Debug Mode
```bash
# Run tests with debug output
DEBUG_TESTS=1 npm run test:unit

# Run specific test file
npx vitest run src/test/unit/blockchain-operations.test.ts

# Run with verbose output  
npx vitest run --reporter=verbose
```

### Test Coverage Analysis
```bash
# Generate detailed coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html

# Coverage thresholds (vitest.config.ts):
# - Branches: 70%
# - Functions: 70% 
# - Lines: 70%
# - Statements: 70%
```

### Mock Debugging
```bash
# Check mock implementations
npm run test:unit -- --reporter=verbose

# Clear mocks between tests
npm run test:integration -- --clearMocks
```

## 🚨 Troubleshooting

### Common Issues

**1. Hardware Tests Failing**
```bash
# Error: "Device not found"
# Solution: Check USB connection and device unlock
# 1. Reconnect USB cable
# 2. Unlock Ledger device
# 3. Open Ethereum app
# 4. Verify device permissions on Linux
```

**2. Integration Tests Timeout**
```bash
# Error: "Test timeout after 30s"
# Solution: Check mock configuration
npm run test:integration -- --timeout=60000
```

**3. Coverage Below Threshold**
```bash
# Error: "Coverage below 70%"
# Solution: Add more tests or adjust thresholds
# Edit vitest.config.ts coverage.thresholds
```

**4. Contract Tests Failing**
```bash
# Error: "Schema validation failed"
# Solution: Update API contracts
# Check src/test/contracts/ for schema mismatches
```

### Test Environment Issues

**Environment Variables**
```bash
# Ensure test environment is configured
export NODE_ENV=test
export DUNE_SIM_API_KEY=test-key

# Or use .env.test file
cp .env.example .env.test
```

**Permission Issues (Linux)**
```bash
# USB device permissions for hardware tests
sudo usermod -a -G plugdev $USER
sudo udevadm control --reload-rules
```

## 📊 Test Metrics & Reporting

### Coverage Reports
- **HTML**: `coverage/index.html` - Interactive coverage browser
- **JSON**: `coverage/coverage.json` - Machine-readable coverage data  
- **Text**: Terminal output during test runs

### Performance Benchmarks
- **Unit Tests**: < 10s for full suite
- **Integration Tests**: < 30s for full suite
- **Hardware Tests**: 2-5 minutes (user interaction required)
- **E2E Tests**: < 60s for full workflow coverage

### Test Results
```bash
# Generate test report
npm run test -- --reporter=json --outputFile=test-results.json

# View test results
cat test-results.json | jq '.testResults[].assertionResults'
```

## 🔄 Test Maintenance

### Adding New Tests
1. **Unit Test**: Add to `src/test/unit/`
2. **Integration Test**: Add to `src/test/integration/`
3. **Contract Test**: Add to `src/test/contracts/`
4. **E2E Test**: Add to `src/test/e2e/`
5. **Hardware Test**: Add to `src/test/hardware/`

### Updating Mocks
- **External APIs**: Update mock responses in test files
- **Hardware**: Update mock implementations in `@ledgerhq` mocks
- **Network**: Update axios mocks for API calls

### Performance Testing
```bash
# Measure test execution time
time npm run test:ci

# Profile specific test suites
npm run test:unit -- --reporter=verbose --segfault-retry=0
```

---

This comprehensive testing strategy ensures **reliable, maintainable, and secure** operation of both the traditional MCP server and the hybrid Vercel AI architecture, with appropriate test coverage for all components from individual functions to complete system workflows.