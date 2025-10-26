// Test fixtures and data for Auth API tests

const testUsers = {
  valid: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User'
  },
  admin: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPass123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  invalid: {
    username: 'ab', // Too short
    email: 'invalid-email', // Invalid email
    password: '123', // Too short
    firstName: '',
    lastName: ''
  },
  duplicate: {
    username: 'testuser',
    email: 'different@example.com',
    password: 'Password123',
    firstName: 'Different',
    lastName: 'User'
  }
};

const loginCredentials = {
  valid: {
    emailOrUsername: 'test@example.com',
    password: 'Password123'
  },
  username: {
    emailOrUsername: 'testuser',
    password: 'Password123'
  },
  invalid: {
    emailOrUsername: 'test@example.com',
    password: 'wrongpassword'
  },
  missing: {
    emailOrUsername: 'test@example.com'
    // Missing password
  }
};

const jwtTokens = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZlNGJjNmFkMDZlNTQyMjA5YzM4N2IiLCJ1c2VybmFtZSI6InRlc3R1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0MTIzQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjE0OTYwMTQsImV4cCI6MTc2MTQ5NzgxNH0.MZHyUAC_2uhKkSeuJsGnqPUBKeW8DHHTe36O5w-fwUo',
  invalid: 'invalid-token',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZlNGJjNmFkMDZlNTQyMjA5YzM4N2IiLCJ1c2VybmFtZSI6InRlc3R1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0MTIzQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MzUyNjQwMTQsImV4cCI6MTYzNTI2NTgxNH0.expired-signature',
  malformed: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed-payload'
};

const refreshTokens = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZlNGJjNmFkMDZlNTQyMjA5YzM4N2IiLCJpYXQiOjE3NjE0OTYwMTQsImV4cCI6MTc2MjEwMDgxNH0.r_jx5oKqDstlwxbJXvsETm40q7yFmXl9pimXc5-W8x8',
  invalid: 'invalid-refresh-token',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZlNGJjNmFkMDZlNTQyMjA5YzM4N2IiLCJpYXQiOjE2MzUyNjQwMTQsImV4cCI6MTYzNTI2NTgxNH0.expired-refresh-signature'
};

const expectedResponses = {
  success: {
    register: {
      success: true,
      message: 'User registered successfully',
      data: {
        user: expect.objectContaining({
          email: expect.any(String),
          username: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          role: expect.any(String),
          status: expect.any(String)
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 1800
      }
    },
    login: {
      success: true,
      message: 'Login successful',
      data: {
        user: expect.objectContaining({
          email: expect.any(String),
          username: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String)
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 1800
      }
    },
    profile: {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: expect.objectContaining({
          email: expect.any(String),
          username: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String)
        })
      }
    },
    verify: {
      success: true,
      message: 'Token is valid',
      data: {
        user: expect.objectContaining({
          email: expect.any(String),
          username: expect.any(String)
        }),
        tokenData: expect.objectContaining({
          userId: expect.any(String),
          username: expect.any(String),
          email: expect.any(String),
          role: expect.any(String)
        })
      }
    },
    refresh: {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: expect.objectContaining({
          email: expect.any(String),
          username: expect.any(String)
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 1800
      }
    },
    logout: {
      success: true,
      message: 'Logged out successfully'
    },
    logoutAll: {
      success: true,
      message: 'Logged out from all devices successfully'
    },
    health: {
      success: true,
      message: 'Auth API Health Check',
      status: 'healthy',
      version: '1.0.0',
      timestamp: expect.any(String)
    }
  },
  error: {
    validation: {
      success: false,
      message: 'Validation failed',
      errors: expect.arrayContaining([
        expect.objectContaining({
          type: 'field',
          msg: expect.any(String),
          path: expect.any(String),
          location: 'body'
        })
      ])
    },
    unauthorized: {
      success: false,
      message: expect.stringMatching(/Access token required|Invalid or expired token/)
    },
    invalidCredentials: {
      success: false,
      message: 'Invalid credentials'
    },
    userExists: {
      success: false,
      message: expect.stringMatching(/already exists/)
    },
    notFound: {
      success: false,
      message: 'Route not found'
    }
  }
};

const validationErrors = {
  username: {
    tooShort: 'Username must be between 3 and 30 characters',
    invalidChars: 'Username can only contain letters, numbers, and underscores'
  },
  email: {
    invalid: 'Please provide a valid email address'
  },
  password: {
    tooShort: 'Password must be at least 6 characters long',
    weak: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  },
  firstName: {
    required: 'First name must be between 1 and 50 characters'
  },
  lastName: {
    required: 'Last name must be between 1 and 50 characters'
  }
};

const httpStatusCodes = {
  success: {
    ok: 200,
    created: 201
  },
  clientError: {
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409
  },
  serverError: {
    internalServerError: 500
  }
};

const testEndpoints = {
  auth: {
    register: 'POST /api/v1/auth/register',
    login: 'POST /api/v1/auth/login',
    logout: 'POST /api/v1/auth/logout',
    logoutAll: 'POST /api/v1/auth/logout-all',
    refresh: 'POST /api/v1/auth/refresh',
    verify: 'POST /api/v1/auth/verify',
    profile: 'GET /api/v1/auth/profile'
  },
  health: {
    health: 'GET /api/v1/health',
    root: 'GET /'
  }
};

module.exports = {
  testUsers,
  loginCredentials,
  jwtTokens,
  refreshTokens,
  expectedResponses,
  validationErrors,
  httpStatusCodes,
  testEndpoints
};
