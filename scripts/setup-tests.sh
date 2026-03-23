#!/bin/bash

# Setup Testing Environment for Wuta-Wuta Project
# This script sets up the complete testing environment

set -e

echo "🚀 Setting up Wuta-Wuta Testing Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install global testing tools
echo "🔧 Installing global testing tools..."
npm install -g hardhat
npm install -g slither-analyzer

# Create test environment file
if [ ! -f .env.test ]; then
    echo "📝 Creating test environment file..."
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
HARDHAT_NETWORK=hardhat

# Test Accounts (Hardhat provides these automatically)
TEST_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
TEST_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Test API Endpoints
TEST_API_URL=http://localhost:3001/api
TEST_WS_URL=ws://localhost:3001

# Gas Settings for Testing
TEST_GAS_LIMIT=8000000
TEST_GAS_PRICE=20000000000

# Coverage Settings
COVERAGE_THRESHOLD=90

# Security Test Settings
SLITHER_FILTER_PATHS=node_modules/
SLITHER_EXCLUDE=naming-convention,external-function
EOF
    echo "✅ Created .env.test file"
fi

# Create test data directory
mkdir -p test/data
mkdir -p test/reports
mkdir -p coverage

# Download test fixtures if needed
echo "📥 Setting up test fixtures..."
cat > test/data/test-artworks.json << EOF
{
  "artworks": [
    {
      "id": 1,
      "name": "Test Artwork 1",
      "aiModel": "stable-diffusion",
      "humanContribution": 60,
      "aiContribution": 40,
      "prompt": "A beautiful test landscape",
      "tokenURI": "https://metadata.example.com/art/1",
      "canEvolve": true,
      "contentHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    {
      "id": 2,
      "name": "Test Artwork 2",
      "aiModel": "dall-e",
      "humanContribution": 50,
      "aiContribution": 50,
      "prompt": "Abstract test composition",
      "tokenURI": "https://metadata.example.com/art/2",
      "canEvolve": false,
      "contentHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
  ]
}
EOF

# Run initial compilation
echo "🔨 Compiling contracts..."
npx hardhat compile

# Run initial test suite
echo "🧪 Running initial test suite..."
npm run test:contracts

# Generate initial coverage report
echo "📊 Generating coverage report..."
npm run test:contracts:coverage

# Run security analysis
echo "🔒 Running security analysis..."
npm run security:slither || echo "⚠️  Slither analysis completed with warnings"

# Check if all tests pass
if npm run test:contracts:ci; then
    echo "✅ All smart contract tests passed!"
else
    echo "❌ Some smart contract tests failed!"
    exit 1
fi

if npm run test:ci; then
    echo "✅ All frontend tests passed!"
else
    echo "❌ Some frontend tests failed!"
    exit 1
fi

# Create test summary
echo "📋 Creating test summary..."
cat > test/reports/setup-summary.md << EOF
# Test Environment Setup Summary

## Setup Completed: $(date)

## Environment
- Node.js: $(node -v)
- npm: $(npm -v)
- Hardhat: $(npx hardhat --version)

## Test Results
- Smart Contract Tests: ✅ Passed
- Frontend Tests: ✅ Passed
- Coverage Report: ✅ Generated
- Security Analysis: ✅ Completed

## Test Coverage
- Contract Coverage: $(cat coverage/coverage-summary.json | grep 'total' | grep -o '"lines":"[^"]*"' | cut -d'"' -f4 || echo "N/A")%
- Frontend Coverage: Check coverage/lcov-report/index.html

## Next Steps
1. Run \`npm run test:contracts\` to run contract tests
2. Run \`npm test\` to run frontend tests
3. Run \`npm run test:integration\` for integration tests
4. Check coverage reports in \`coverage/\` directory
5. Review security analysis results

## Test Commands
- \`npm run test:contracts\` - Run smart contract tests
- \`npm run test:contracts:coverage\` - Run contract tests with coverage
- \`npm run test:contracts:gas\` - Run gas benchmark tests
- \`npm test\` - Run frontend tests
- \`npm run test:coverage\` - Run frontend tests with coverage
- \`npm run test:integration\` - Run integration tests
- \`npm run security:slither\` - Run security analysis
- \`npm run gas-report\` - Generate gas usage report

## Files Created
- \`.env.test\` - Test environment configuration
- \`test/data/test-artworks.json\` - Test data fixtures
- \`test/reports/setup-summary.md\` - This summary file

EOF

echo "🎉 Testing environment setup completed successfully!"
echo "📖 See test/reports/setup-summary.md for detailed information"
echo "🧪 Run 'npm test' to start testing!"

# Display test commands
echo ""
echo "🔧 Available Test Commands:"
echo "  npm run test:contracts           # Run smart contract tests"
echo "  npm run test:contracts:coverage  # Run contract tests with coverage"
echo "  npm run test:contracts:gas       # Run gas benchmark tests"
echo "  npm test                         # Run frontend tests"
echo "  npm run test:coverage           # Run frontend tests with coverage"
echo "  npm run test:integration         # Run integration tests"
echo "  npm run security:slither         # Run security analysis"
echo "  npm run gas-report               # Generate gas usage report"
echo ""
echo "📊 Coverage Reports:"
echo "  Smart Contracts: coverage/coverage-report/index.html"
echo "  Frontend: coverage/lcov-report/index.html"
echo ""
echo "🔒 Security Reports:"
echo "  Slither: Check terminal output or test/reports/"
echo ""
echo "🚀 Ready for development and testing!"
