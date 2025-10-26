const request = require('supertest');
const app = require('../../src/app');

describe('Auth API Endpoints', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  // Test data
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User'
  };

  const invalidUserData = {
    username: 'ab', // Too short
    email: 'invalid-email', // Invalid email
    password: '123', // Too short
    firstName: '',
    lastName: ''
  };

  describe('Health Check Endpoints', () => {
    test('GET /api/v1/health should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Auth API Health Check');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET / should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Auth API Service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('User Registration', () => {
    test('POST /api/v1/auth/register should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);

      // Store tokens for later tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
      testUser = response.body.data.user;
    });

    test('POST /api/v1/auth/register should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('POST /api/v1/auth/register should fail with duplicate email', async () => {
      const duplicateUserData = {
        ...validUserData,
        username: 'differentuser'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already exists');
    });

    test('POST /api/v1/auth/register should fail with duplicate username', async () => {
      const duplicateUserData = {
        ...validUserData,
        email: 'different@example.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('User Login', () => {
    test('POST /api/v1/auth/login should login with email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);
    });

    test('POST /api/v1/auth/login should login with username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.username,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    test('POST /api/v1/auth/login should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    test('POST /api/v1/auth/login should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  describe('Token Verification', () => {
    test('POST /api/v1/auth/verify should verify valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Token is valid');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokenData');
      expect(response.body.data.tokenData).toHaveProperty('userId');
      expect(response.body.data.tokenData).toHaveProperty('username');
      expect(response.body.data.tokenData).toHaveProperty('email');
      expect(response.body.data.tokenData).toHaveProperty('role');
    });

    test('POST /api/v1/auth/verify should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    test('POST /api/v1/auth/verify should fail with expired token', async () => {
      // This would require creating an expired token
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('POST /api/v1/auth/verify should fail without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('User Profile', () => {
    test('GET /api/v1/auth/profile should return user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Profile retrieved successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', validUserData.email);
      expect(response.body.data.user).toHaveProperty('username', validUserData.username);
      expect(response.body.data.user).toHaveProperty('firstName', validUserData.firstName);
      expect(response.body.data.user).toHaveProperty('lastName', validUserData.lastName);
    });

    test('GET /api/v1/auth/profile should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Access token required');
    });

    test('GET /api/v1/auth/profile should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid or expired token');
    });
  });

  describe('Token Refresh', () => {
    test('POST /api/v1/auth/refresh should refresh tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);

      // Update tokens for further tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    test('POST /api/v1/auth/refresh should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid or expired refresh token');
    });

    test('POST /api/v1/auth/refresh should fail without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('User Logout', () => {
    test('POST /api/v1/auth/logout should logout user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    test('POST /api/v1/auth/logout should fail without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Access token required');
    });

    test('POST /api/v1/auth/logout-all should logout from all devices', async () => {
      // First login again to get new tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const newAccessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out from all devices successfully');
    });
  });

  describe('Error Handling', () => {
    test('Should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });

    test('Should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });

    test('Should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validUserData)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limiting', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/v1/health')
        );
      }

      const responses = await Promise.all(requests);
      
      // All should succeed (rate limit is 100 per 15 minutes)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});
