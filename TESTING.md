# Testing Guide for Wuta-Wuta AI Art Marketplace

This document provides comprehensive information about the testing setup and procedures for the Wuta-Wuta blockchain project.

## Overview

The Wuta-Wuta project includes a comprehensive testing suite covering:
- Smart contract testing with Hardhat
- Frontend component testing with React Testing Library
- Integration testing across contracts
- Performance and gas optimization testing
- Security testing with Slither and Mythril
- End-to-end testing

## Testing Architecture

### Smart Contract Tests

**Location**: `test/`

#### Core Contract Tests
- `MuseNFT.test.js` - Tests for the NFT contract
- `ProjectManager.test.js` - Tests for the project management contract
- `integration/integration.test.js` - Cross-contract integration tests

#### Helper Utilities
- `helpers/hardhat-helper.js` - Common testing utilities and helpers

#### Performance Tests
- `performance/gas-benchmarks.test.js` - Gas usage benchmarks

### Frontend Tests

**Location**: `src/components/__tests__/`

#### Component Tests
- `CreateArt.test.js` - Art creation form component
- `Dashboard.test.js` - User dashboard component  
- `Gallery.test.js` - Art gallery component

#### Store Tests
**Location**: `src/store/__tests__/`
- `museStore.test.js` - Main application store
- `walletStore.test.js` - Wallet connection store

## Running Tests

### Prerequisites

Ensure you have Node.js 18+ and npm installed:

```bash
node --version
npm --version
```

### Install Dependencies

```bash
npm install
```

### Smart Contract Tests

#### Run all contract tests:
```bash
npm run test:contracts
```

#### Run contract tests with coverage:
```bash
npm run test:contracts:coverage
```

#### Run gas usage tests:
```bash
npm run test:contracts:gas
```

#### Run specific test file:
```bash
npx hardhat test test/MuseNFT.test.js
```

### Frontend Tests

#### Run all frontend tests:
```bash
npm test
```

#### Run tests with coverage:
```bash
npm run test:coverage
```

#### Run tests in CI mode:
```bash
npm run test:ci
```

### Integration Tests

#### Run integration tests:
```bash
npm run test:integration
```

### End-to-End Tests

#### Run E2E tests:
```bash
npm run test:e2e
```

## Test Coverage

### Smart Contract Coverage Areas

#### MuseNFT Contract
- ✅ Deployment and initialization
- ✅ AI model registration
- ✅ Collaborative artwork creation
- ✅ Artwork evolution
- ✅ Royalty management
- ✅ Access control and permissions
- ✅ Reentrancy protection
- ✅ Edge cases and error handling

#### ProjectManager Contract
- ✅ Project creation and management
- ✅ Issue creation and tracking
- ✅ Status updates
- ✅ Access control
- ✅ Data retrieval functions

### Frontend Coverage Areas

#### Components
- ✅ Rendering and UI states
- ✅ User interactions
- ✅ Form validation
- ✅ Error handling
- ✅ Accessibility
- ✅ Responsive design

#### Stores
- ✅ State management
- ✅ API interactions
- ✅ Error handling
- ✅ Data persistence

## Performance Testing

### Gas Benchmarks

The project includes comprehensive gas benchmarking:

```bash
npm run test:contracts:gas
```

#### Target Gas Limits
- AI Model Registration: < 50,000 gas
- Artwork Creation: < 300,000 gas
- Artwork Evolution: < 200,000 gas
- Project Creation: < 150,000 gas
- Issue Creation: < 100,000 gas

### Load Testing

```bash
npm run test:load
```

## Security Testing

### Automated Security Analysis

#### Slither Analysis
```bash
npm run security:slither
```

#### Mythril Analysis
```bash
npm run security:mythril
```

### Security Test Coverage
- ✅ Reentrancy attacks
- ✅ Integer overflow/underflow
- ✅ Access control vulnerabilities
- ✅ Business logic flaws
- ✅ Gas limit issues

## Continuous Integration

### GitHub Actions Workflow

**Location**: `.github/workflows/test.yml`

#### Workflow Jobs
1. **Smart Contract Tests** - Contract testing and coverage
2. **Frontend Tests** - Component and store testing
3. **Integration Tests** - Cross-contract testing
4. **Security Audit** - Automated security analysis
5. **Performance Tests** - Gas benchmarks and load testing
6. **Build Test** - Application build verification
7. **Deploy Preview** - Preview deployments for PRs

#### Triggers
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

## Test Data and Mocking

### Smart Contract Mocks

The test suite uses Hardhat's built-in network for testing:
- Local test network with instant mining
- Pre-funded test accounts
- Contract deployment utilities

### Frontend Mocks

#### Store Mocking
```javascript
jest.mock('../../store/museStore', () => ({
  useMuseStore: () => ({
    isConnected: true,
    isLoading: false,
    error: null,
    artworks: [],
    // ... other store properties
  }),
}));
```

#### Ethers.js Mocking
```javascript
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn(),
    parseEther: (value) => BigInt(value * 1e18),
    formatEther: (value) => (Number(value) / 1e18).toString(),
  },
}));
```

## Best Practices

### Writing Tests

1. **Arrange, Act, Assert** pattern
2. **Descriptive test names**
3. **Test edge cases and error conditions**
4. **Mock external dependencies**
5. **Use helper utilities for common operations**

### Test Organization

1. **Group related tests** with `describe` blocks
2. **Use `beforeEach`** for test setup
3. **Keep tests independent** and isolated
4. **Use meaningful assertions**

### Coverage Goals

- **Smart Contracts**: > 90% line coverage
- **Frontend Components**: > 85% line coverage
- **Store Logic**: > 90% line coverage

## Debugging Tests

### Smart Contract Debugging

```bash
# Run tests with verbose output
npx hardhat test --verbose

# Run specific test with console logs
npx hardhat test test/MuseNFT.test.js --show-stack-traces
```

### Frontend Debugging

```bash
# Run tests with debug output
npm test -- --verbose

# Run tests in interactive mode
npm test -- --watch
```

## Adding New Tests

### Smart Contract Tests

1. Create test file in `test/` directory
2. Use HardhatHelper for common operations
3. Follow existing test patterns
4. Include gas usage benchmarks for new functions

### Frontend Tests

1. Create test file in appropriate `__tests__/` directory
2. Use React Testing Library
3. Mock store dependencies
4. Test user interactions and accessibility

## Troubleshooting

### Common Issues

#### Gas Limit Exceeded
- Increase gas limit in hardhat.config.js
- Optimize contract functions
- Check for infinite loops

#### Time-related Tests
- Use HardhatHelper time utilities
- Mock `block.timestamp` for deterministic tests

#### Async Test Issues
- Use `await` for all async operations
- Wrap async calls in `act()` for React tests

## Test Environment Variables

Create a `.env.test` file for test-specific configurations:

```bash
# Test network configuration
TEST_NETWORK_URL=http://localhost:8545
TEST_PRIVATE_KEY=your_test_private_key

# API endpoints for testing
TEST_API_URL=http://localhost:3001/api
```

## Reporting

### Coverage Reports

Coverage reports are generated in:
- `coverage/` directory for smart contracts
- `coverage/` directory for frontend code

### Test Results

Test results are displayed in:
- Console output during test runs
- GitHub Actions workflow logs
- Coverage dashboard (if configured)

## Contributing to Tests

When contributing new features:
1. Write tests for new functionality
2. Ensure all existing tests pass
3. Maintain or improve coverage percentages
4. Update documentation as needed
5. Add performance benchmarks for contract functions

## Future Enhancements

### Planned Testing Improvements
- [ ] Fuzzing testing for smart contracts
- [ ] Visual regression testing for UI
- [ ] Performance monitoring in production
- [ ] Automated vulnerability scanning
- [ ] Contract formal verification

### Testing Tools to Consider
- [ ] Echidna for property-based testing
- [ ] Manticore for symbolic execution
- [ ] Storybook for component testing
- [ ] Cypress for advanced E2E testing

---

For questions or issues related to testing, please create an issue in the repository or contact the development team.
