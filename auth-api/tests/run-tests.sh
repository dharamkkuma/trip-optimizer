#!/bin/bash

# Auth API Test Runner
# This script runs the comprehensive test suite for the Auth API

echo "🧪 Auth API Test Suite"
echo "====================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the auth-api/tests directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
fi

# Check if Auth API is running
echo "🔍 Checking if Auth API is running..."
if ! curl -s http://localhost:8003/api/v1/health > /dev/null; then
    echo "❌ Error: Auth API is not running on port 8003"
    echo "Please start the Auth API first:"
    echo "  cd .. && npm run dev"
    exit 1
fi

echo "✅ Auth API is running"

# Check if Database API is running
echo "🔍 Checking if Database API is running..."
if ! curl -s http://localhost:8002/api/health > /dev/null; then
    echo "❌ Error: Database API is not running on port 8002"
    echo "Please start the Database API first"
    exit 1
fi

echo "✅ Database API is running"

# Run tests
echo ""
echo "🚀 Running tests..."
echo "=================="

# Run different test suites
echo ""
echo "1. Running Endpoint Tests..."
npm test tests/endpoints/

echo ""
echo "2. Running Integration Tests..."
npm test tests/integration/

echo ""
echo "3. Running All Tests with Coverage..."
npm run test:coverage

echo ""
echo "🎉 Test suite completed!"
echo "======================="

# Show test results summary
if [ -f "coverage/lcov-report/index.html" ]; then
    echo "📊 Coverage report generated: coverage/lcov-report/index.html"
fi

echo ""
echo "📋 Test Summary:"
echo "- Endpoint tests: Comprehensive testing of all API endpoints"
echo "- Integration tests: Full authentication workflow testing"
echo "- Coverage report: Detailed code coverage analysis"
echo ""
echo "For detailed test documentation, see: TEST_DOCUMENTATION.md"
