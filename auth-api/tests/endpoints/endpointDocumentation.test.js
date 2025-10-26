const request = require('supertest');
const app = require('../../src/app');
const { testUsers, expectedResponses, httpStatusCodes } = require('../fixtures/testData');
const { assertions, performanceUtils } = require('../utils/testHelpers');

describe('Auth API Endpoint Documentation Tests', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  describe('API Endpoints Overview', () => {
    test('Should have all required endpoints', async () => {
      const endpoints = [
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login', 
        'POST /api/v1/auth/logout',
        'POST /api/v1/auth/logout-all',
        'POST /api/v1/auth/refresh',
        'POST /api/v1/auth/verify',
        'GET /api/v1/auth/profile',
        'GET /api/v1/health',
        'GET /'
      ];

      // Test that all endpoints exist by checking for 404 vs other errors
      for (const endpoint of endpoints) {
        const [method, path] = endpoint.split(' ');
        
        let response;
        if (method === 'GET') {
          response = await request(app).get(path);
        } else if (method === 'POST') {
          response = await request(app).post(path);
        }

        // Should not return 404 (endpoint exists)
        expect(response.status).not.toBe(404);
      }
    });
  });

  describe('POST /api/v1/auth/register', () => {
    test('Input: Valid user data', async () => {
      const userData = testUsers.valid;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(httpStatusCodes.success.created);

      assertions.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);

      // Store for later tests
      testUser = response.body.data.user;
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    test('Input: Invalid user data', async () => {
      const userData = testUsers.invalid;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(httpStatusCodes.clientError.badRequest);

      assertions.expectValidationError(response);
    });

    test('Input: Duplicate email', async () => {
      const userData = testUsers.duplicate;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(httpStatusCodes.clientError.badRequest);

      assertions.expectErrorResponse(response);
      expect(response.body.message).toContain('already exists');
    });

    test('Output: User object structure', async () => {
      const userData = testUsers.valid;
      userData.username = `testuser${Date.now()}`;
      userData.email = `test${Date.now()}@example.com`;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(httpStatusCodes.success.created);

      const user = response.body.data.user;
      
      // Required fields
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('email', userData.email);
      expect(user).toHaveProperty('username', userData.username);
      expect(user).toHaveProperty('firstName', userData.firstName);
      expect(user).toHaveProperty('lastName', userData.lastName);
      expect(user).toHaveProperty('role', 'user');
      expect(user).toHaveProperty('status', 'active');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      
      // Should not contain sensitive data
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('refreshTokens');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('Input: Email and password', async () => {
      const credentials = {
        emailOrUsername: testUser.email,
        password: testUsers.valid.password
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);
    });

    test('Input: Username and password', async () => {
      const credentials = {
        emailOrUsername: testUser.username,
        password: testUsers.valid.password
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
    });

    test('Input: Invalid credentials', async () => {
      const credentials = {
        emailOrUsername: testUser.email,
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(httpStatusCodes.clientError.unauthorized);

      assertions.expectErrorResponse(response);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('Output: Login response structure', async () => {
      const credentials = {
        emailOrUsername: testUser.email,
        password: testUsers.valid.password
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(httpStatusCodes.success.ok);

      const data = response.body.data;
      
      // User object
      expect(data.user).toHaveProperty('_id');
      expect(data.user).toHaveProperty('email', testUser.email);
      expect(data.user).toHaveProperty('username', testUser.username);
      expect(data.user).toHaveProperty('lastLogin');
      
      // Tokens
      expect(data.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(data.refreshToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(data.expiresIn).toBe(1800);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    test('Input: Valid access token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    test('Input: Invalid access token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(httpStatusCodes.clientError.forbidden);

      assertions.expectUnauthorizedError(response);
    });

    test('Input: No token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(httpStatusCodes.clientError.unauthorized);

      assertions.expectUnauthorizedError(response);
    });

    test('Output: Profile response structure', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatusCodes.success.ok);

      const user = response.body.data.user;
      
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      
      // Should not contain sensitive data
      expect(user).not.toHaveProperty('password');
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    test('Input: Valid access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokenData');
    });

    test('Input: Invalid access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(httpStatusCodes.clientError.unauthorized);

      assertions.expectUnauthorizedError(response);
    });

    test('Output: Verify response structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatusCodes.success.ok);

      const data = response.body.data;
      
      // User object
      expect(data.user).toHaveProperty('_id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('username');
      
      // Token data
      expect(data.tokenData).toHaveProperty('userId');
      expect(data.tokenData).toHaveProperty('username');
      expect(data.tokenData).toHaveProperty('email');
      expect(data.tokenData).toHaveProperty('role');
      expect(data.tokenData).toHaveProperty('iat');
      expect(data.tokenData).toHaveProperty('exp');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    test('Input: Valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);
    });

    test('Input: Invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(httpStatusCodes.clientError.unauthorized);

      assertions.expectErrorResponse(response);
    });

    test('Input: No refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(httpStatusCodes.clientError.badRequest);

      assertions.expectValidationError(response);
    });

    test('Output: Refresh response structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(httpStatusCodes.success.ok);

      const data = response.body.data;
      
      expect(data.user).toHaveProperty('_id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('username');
      
      expect(data.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(data.refreshToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(data.expiresIn).toBe(1800);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('Input: Valid access token and refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.message).toBe('Logged out successfully');
    });

    test('Input: No access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(httpStatusCodes.clientError.unauthorized);

      assertions.expectUnauthorizedError(response);
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    test('Input: Valid access token', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUsers.valid.password
        })
        .expect(httpStatusCodes.success.ok);

      const newAccessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.message).toBe('Logged out from all devices successfully');
    });

    test('Input: No access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .expect(httpStatusCodes.clientError.unauthorized);

      assertions.expectUnauthorizedError(response);
    });
  });

  describe('GET /api/v1/health', () => {
    test('Input: No parameters required', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
      expect(response.body.status).toBe('healthy');
      expect(response.body.version).toBe('1.0.0');
    });

    test('Output: Health check structure', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(httpStatusCodes.success.ok);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Auth API Health Check');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /', () => {
    test('Input: No parameters required', async () => {
      const response = await request(app)
        .get('/')
        .expect(httpStatusCodes.success.ok);

      assertions.expectSuccessResponse(response);
    });

    test('Output: Root endpoint structure', async () => {
      const response = await request(app)
        .get('/')
        .expect(httpStatusCodes.success.ok);

      expect(response.body).toHaveProperty('message', 'Auth API Service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('register');
      expect(response.body.endpoints).toHaveProperty('login');
      expect(response.body.endpoints).toHaveProperty('refresh');
      expect(response.body.endpoints).toHaveProperty('logout');
      expect(response.body.endpoints).toHaveProperty('profile');
      expect(response.body.endpoints).toHaveProperty('verify');
    });
  });

  describe('Error Handling', () => {
    test('404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(httpStatusCodes.clientError.notFound);

      assertions.expectErrorResponse(response);
      expect(response.body.message).toBe('Route not found');
    });

    test('Malformed JSON handling', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(httpStatusCodes.clientError.badRequest);
    });

    test('Missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(testUsers.valid)
        .expect(httpStatusCodes.clientError.badRequest);
    });
  });

  describe('Performance Tests', () => {
    test('Health endpoint performance', async () => {
      const duration = await performanceUtils.measureTime(async () => {
        await request(app).get('/api/v1/health');
      });

      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('Concurrent requests handling', async () => {
      const requests = performanceUtils.runConcurrentRequests(
        () => request(app).get('/api/v1/health'),
        10
      );

      const responses = await requests;
      
      responses.forEach(response => {
        expect(response.status).toBe(httpStatusCodes.success.ok);
      });
    });
  });
});
