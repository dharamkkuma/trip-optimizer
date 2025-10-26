# Auth API Test Suite Documentation

## Overview

This test suite provides comprehensive testing for the Auth API service, covering all endpoints, input/output validation, error handling, and integration scenarios.

## Test Structure

```
tests/
├── endpoints/           # Individual endpoint tests
│   ├── auth.test.js                    # Main authentication tests
│   └── endpointDocumentation.test.js   # Endpoint documentation tests
├── integration/        # Integration tests
│   └── integration.test.js             # Full workflow tests
├── fixtures/          # Test data and fixtures
│   └── testData.js                     # Test data definitions
├── utils/             # Test utilities
│   └── testHelpers.js                   # Helper functions
├── setup.js           # Test setup and configuration
├── package.json       # Test dependencies and scripts
└── README.md          # This file
```

## Test Categories

### 1. Endpoint Tests (`endpoints/`)

#### `auth.test.js`
Tests all authentication endpoints with various scenarios:

**Health Check Endpoints:**
- `GET /api/health` - Health status
- `GET /` - API information

**User Registration:**
- Valid user registration
- Invalid data validation
- Duplicate email/username handling

**User Login:**
- Login with email
- Login with username
- Invalid credentials
- Missing fields

**Token Verification:**
- Valid token verification
- Invalid token handling
- Expired token handling
- Missing token handling

**User Profile:**
- Profile retrieval with valid token
- Unauthorized access
- Invalid token handling

**Token Refresh:**
- Valid refresh token
- Invalid refresh token
- Missing refresh token

**User Logout:**
- Single device logout
- All devices logout
- Unauthorized logout

**Error Handling:**
- 404 for non-existent routes
- Malformed JSON handling
- Missing Content-Type headers

**Rate Limiting:**
- Multiple rapid requests

#### `endpointDocumentation.test.js`
Comprehensive documentation tests showing:

**Input/Output Examples:**
- Expected request formats
- Expected response formats
- Error response formats
- HTTP status codes

**Data Validation:**
- Required fields
- Field validation rules
- Data type validation

### 2. Integration Tests (`integration/`)

#### `integration.test.js`
Tests complete authentication workflows:

**Complete Authentication Flow:**
1. User registration
2. Token verification
3. Profile retrieval
4. Token refresh
5. Login with existing user
6. Logout

**Concurrent Operations:**
- Multiple simultaneous logins
- Token expiration handling
- Data consistency across operations

**Database Integration:**
- Database API error handling
- Data consistency maintenance

**Security Tests:**
- Sensitive data exposure prevention
- Malformed JWT token handling
- CORS enforcement

**Performance Tests:**
- Multiple rapid requests
- Large payload handling

### 3. Test Fixtures (`fixtures/`)

#### `testData.js`
Contains all test data definitions:

**Test Users:**
- Valid user data
- Admin user data
- Invalid user data
- Duplicate user data

**Login Credentials:**
- Valid credentials
- Username-based login
- Invalid credentials
- Missing fields

**JWT Tokens:**
- Valid tokens
- Invalid tokens
- Expired tokens
- Malformed tokens

**Refresh Tokens:**
- Valid refresh tokens
- Invalid refresh tokens
- Expired refresh tokens

**Expected Responses:**
- Success response structures
- Error response structures
- Validation error structures

**HTTP Status Codes:**
- Success codes (200, 201)
- Client error codes (400, 401, 403, 404, 409)
- Server error codes (500)

### 4. Test Utilities (`utils/`)

#### `testHelpers.js`
Provides utility functions for testing:

**Token Utilities:**
- Generate test JWT tokens
- Decode JWT tokens
- Validate token structure
- Check token expiration

**User Utilities:**
- Create test users
- Create multiple test users
- Generate test data for different scenarios

**Request Utilities:**
- Extract tokens from headers
- Create authorization headers
- Mock database API responses

**Performance Utilities:**
- Measure execution time
- Run concurrent requests

**Assertion Utilities:**
- Common response assertions
- Validation error assertions
- Unauthorized error assertions

## Running Tests

### Prerequisites
```bash
# Install test dependencies
cd tests
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:endpoints
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run for CI/CD
npm run test:ci
```

### Individual Test Files

```bash
# Run specific test file
npm test -- tests/endpoints/auth.test.js
npm test -- tests/integration/integration.test.js
npm test -- tests/endpoints/endpointDocumentation.test.js
```

## Test Data Examples

### Valid User Registration
```javascript
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123",
  "firstName": "Test",
  "lastName": "User"
}
```

### Expected Registration Response
```javascript
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

### Login Request
```javascript
{
  "emailOrUsername": "test@example.com",
  "password": "Password123"
}
```

### Profile Response
```javascript
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "role": "user",
      "status": "active",
      "lastLogin": "2025-10-26T16:30:00.000Z",
      "createdAt": "2025-10-26T16:30:00.000Z",
      "updatedAt": "2025-10-26T16:30:00.000Z"
    }
  }
}
```

## Error Response Examples

### Validation Error
```javascript
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "ab",
      "msg": "Username must be between 3 and 30 characters",
      "path": "username",
      "location": "body"
    }
  ]
}
```

### Unauthorized Error
```javascript
{
  "success": false,
  "message": "Access token required"
}
```

### Invalid Credentials
```javascript
{
  "success": false,
  "message": "Invalid credentials"
}
```

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| GET | `/` | API information | No |
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | Single device logout | Yes |
| POST | `/api/auth/logout-all` | All devices logout | Yes |
| POST | `/api/auth/refresh` | Refresh tokens | Refresh Token |
| POST | `/api/auth/verify` | Verify token | Access Token |
| GET | `/api/auth/profile` | Get user profile | Yes |

## Test Coverage

The test suite covers:

- ✅ All API endpoints
- ✅ Input validation
- ✅ Output validation
- ✅ Error handling
- ✅ Authentication flows
- ✅ Token management
- ✅ Database integration
- ✅ Security scenarios
- ✅ Performance testing
- ✅ Edge cases

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Auth API Tests
  run: |
    cd auth-api/tests
    npm install
    npm run test:ci
```

## Debugging Tests

To debug tests:

```bash
# Enable debug output
DEBUG_TESTS=true npm test

# Run specific test with verbose output
npm test -- --verbose tests/endpoints/auth.test.js

# Run with coverage and debug
DEBUG_TESTS=true npm run test:coverage
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add test data to `fixtures/testData.js`
3. Add utilities to `utils/testHelpers.js`
4. Update this documentation
5. Ensure tests pass in CI/CD

## Test Environment

Tests run in a controlled environment with:
- Test JWT secrets
- Mock database responses
- Isolated test data
- Controlled timeouts
- Error simulation capabilities
