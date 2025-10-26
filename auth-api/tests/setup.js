// Test setup and configuration
const { testConfig } = require('./utils/testHelpers');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET_KEY = testConfig.jwtSecret;
process.env.JWT_ACCESS_TOKEN_EXPIRE_MINUTES = '30';
process.env.JWT_REFRESH_TOKEN_EXPIRE_DAYS = '7';
process.env.DATABASE_API_URL = testConfig.databaseApiUrl;
process.env.PORT = testConfig.port;

// Global test timeout
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  generateTestUser: () => {
    const timestamp = Date.now();
    return {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User'
    };
  },
  
  waitForServices: async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Cleanup after each test
afterEach(() => {
  // Clear any mocks or timers
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress console.log during tests unless explicitly enabled
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
