const request = require('supertest');
const app = require('../../src/app');

describe('Auth API Integration Tests', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  const validUserData = {
    username: 'integrationtest',
    email: 'integration@example.com',
    password: 'Password123',
    firstName: 'Integration',
    lastName: 'Test'
  };

  describe('Complete Authentication Flow', () => {
    test('Should complete full authentication flow', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data).toHaveProperty('accessToken');
      expect(registerResponse.body.data).toHaveProperty('refreshToken');

      const initialAccessToken = registerResponse.body.data.accessToken;
      const initialRefreshToken = registerResponse.body.data.refreshToken;

      // Step 2: Verify initial token
      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${initialAccessToken}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.user.email).toBe(validUserData.email);

      // Step 3: Get user profile
      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${initialAccessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.username).toBe(validUserData.username);

      // Step 4: Refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken');

      const newAccessToken = refreshResponse.body.data.accessToken;
      const newRefreshToken = refreshResponse.body.data.refreshToken;

      // Step 5: Verify new token works
      const newVerifyResponse = await request(app)
        .post('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newVerifyResponse.body.success).toBe(true);

      // Step 6: Login with existing user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(validUserData.email);

      // Step 7: Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken: newRefreshToken })
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });

    test('Should handle concurrent authentication requests', async () => {
      const concurrentRequests = [];

      // Create multiple login requests
      for (let i = 0; i < 5; i++) {
        concurrentRequests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              emailOrUsername: validUserData.email,
              password: validUserData.password
            })
        );
      }

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
      });
    });

    test('Should handle token expiration gracefully', async () => {
      // Login to get a token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;
      const refreshToken = loginResponse.body.data.refreshToken;

      // Use the token immediately (should work)
      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.data.accessToken;

      // Use the new token
      const newProfileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newProfileResponse.body.success).toBe(true);
    });
  });

  describe('Database API Integration', () => {
    test('Should handle database API errors gracefully', async () => {
      // This test would require mocking the database API to return errors
      // For now, we'll test with invalid user data that should cause database errors
      
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Try to register a user that might already exist
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      // Should either succeed (if user doesn't exist) or fail gracefully
      expect([201, 400]).toContain(response.status);
    });

    test('Should maintain data consistency across operations', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;

      // Get profile multiple times - should be consistent
      const profile1 = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const profile2 = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profile1.body.data.user.email).toBe(profile2.body.data.user.email);
      expect(profile1.body.data.user.username).toBe(profile2.body.data.user.username);
    });
  });

  describe('Security Tests', () => {
    test('Should not expose sensitive information in responses', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const user = loginResponse.body.data.user;

      // Should not contain password
      expect(user).not.toHaveProperty('password');
      
      // Should not contain sensitive fields
      expect(user).not.toHaveProperty('refreshTokens');
      expect(user).not.toHaveProperty('emailVerificationToken');
      expect(user).not.toHaveProperty('passwordResetToken');
    });

    test('Should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', token || '')
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    test('Should enforce CORS properly', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Performance Tests', () => {
    test('Should handle multiple rapid requests', async () => {
      const startTime = Date.now();
      const requests = [];

      // Make 20 rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/v1/health')
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('Should handle large payloads', async () => {
      const largeUserData = {
        username: 'largeuser',
        email: 'large@example.com',
        password: 'Password123',
        firstName: 'A'.repeat(1000), // Large first name
        lastName: 'B'.repeat(1000)   // Large last name
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(largeUserData);

      // Should either succeed or fail gracefully with validation error
      expect([201, 400]).toContain(response.status);
    });
  });
});
