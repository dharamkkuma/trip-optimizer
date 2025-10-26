// Test utilities and helpers for Auth API tests

const jwt = require('jsonwebtoken');

/**
 * Generate a test JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {string} expiresIn - Token expiration
 * @returns {string} JWT token
 */
function generateTestToken(payload, secret = 'test-secret', expiresIn = '1h') {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Decode a JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Create a test user object
 * @param {Object} overrides - Override default values
 * @returns {Object} Test user object
 */
function createTestUser(overrides = {}) {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  };
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create multiple test users
 * @param {number} count - Number of users to create
 * @param {Object} baseOverrides - Base overrides for all users
 * @returns {Array} Array of test user objects
 */
function createMultipleTestUsers(count, baseOverrides = {}) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(createTestUser({
      username: `testuser${i}`,
      email: `test${i}@example.com`,
      ...baseOverrides
    }));
  }
  return users;
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
}

/**
 * Create Authorization header
 * @param {string} token - JWT token
 * @returns {string} Authorization header value
 */
function createAuthHeader(token) {
  return `Bearer ${token}`;
}

/**
 * Validate JWT token structure
 * @param {string} token - JWT token
 * @returns {boolean} True if token has valid structure
 */
function isValidTokenStructure(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
function isTokenExpired(token) {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

/**
 * Generate test data for different scenarios
 */
const testDataGenerator = {
  validUser: () => createTestUser(),
  invalidUser: () => ({
    username: 'ab',
    email: 'invalid-email',
    password: '123',
    firstName: '',
    lastName: ''
  }),
  adminUser: () => createTestUser({
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin'
  }),
  duplicateUser: (baseUser) => createTestUser({
    username: baseUser.username,
    email: 'different@example.com'
  })
};

/**
 * Mock database API responses
 */
const mockDatabaseAPI = {
  successResponse: (data) => ({
    success: true,
    data: data
  }),
  errorResponse: (message, statusCode = 400) => ({
    success: false,
    message: message,
    statusCode: statusCode
  }),
  userResponse: (user) => ({
    success: true,
    data: {
      ...user,
      _id: user._id || '507f1f77bcf86cd799439011',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    }
  })
};

/**
 * Test environment configuration
 */
const testConfig = {
  jwtSecret: 'test-jwt-secret-key',
  jwtExpiry: '30m',
  refreshTokenExpiry: '7d',
  databaseApiUrl: 'http://localhost:8002',
  port: 8003
};

/**
 * Common test assertions
 */
const assertions = {
  expectSuccessResponse: (response) => {
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
  },
  expectErrorResponse: (response) => {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  },
  expectValidationError: (response) => {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Validation failed');
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  },
  expectUnauthorizedError: (response) => {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toMatch(/Access token required|Invalid or expired token/);
  }
};

/**
 * Performance testing utilities
 */
const performanceUtils = {
  measureTime: async (fn) => {
    const start = Date.now();
    await fn();
    const end = Date.now();
    return end - start;
  },
  runConcurrentRequests: async (requestFn, count) => {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(requestFn());
    }
    return Promise.all(promises);
  }
};

module.exports = {
  generateTestToken,
  decodeToken,
  createTestUser,
  delay,
  createMultipleTestUsers,
  extractTokenFromHeader,
  createAuthHeader,
  isValidTokenStructure,
  isTokenExpired,
  testDataGenerator,
  mockDatabaseAPI,
  testConfig,
  assertions,
  performanceUtils
};
