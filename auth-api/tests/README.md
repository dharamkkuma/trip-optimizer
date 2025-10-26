# Auth API Test Suite

This directory contains comprehensive tests for the Auth API service.

## Test Structure

- `endpoints/` - Individual endpoint tests
- `integration/` - Integration tests
- `fixtures/` - Test data and fixtures
- `utils/` - Test utilities and helpers

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/endpoints/auth.test.js

# Run with coverage
npm test -- --coverage
```

## Test Categories

1. **Unit Tests** - Individual function testing
2. **Integration Tests** - API endpoint testing
3. **Authentication Tests** - JWT token validation
4. **Database Tests** - Database API integration
5. **Error Handling Tests** - Error scenarios

## Test Data

All test data is stored in `fixtures/` directory:
- Valid user data
- Invalid user data
- JWT tokens
- Error responses

## Environment

Tests use a separate test environment configuration:
- Test database
- Test JWT secrets
- Mock external services
