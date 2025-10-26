const jwtService = require('../services/jwtService');
const axios = require('axios');

class AuthService {
  constructor() {
    this.databaseApiUrl = process.env.DATABASE_API_URL || 'http://localhost:8002';
  }

  async registerUser(userData) {
    try {
      // Check if user already exists via Database API
      const checkResponse = await axios.get(`${this.databaseApiUrl}/api/users/check-exists`, {
        params: {
          email: userData.email,
          username: userData.username
        }
      });

      if (checkResponse.data.exists) {
        throw new Error('User with this email or username already exists');
      }

      // Create new user via Database API
      const createResponse = await axios.post(`${this.databaseApiUrl}/api/users`, {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user'
      });

      const user = createResponse.data.data;

      // Generate tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token via Database API
      await axios.post(`${this.databaseApiUrl}/api/users/${user.id}/refresh-tokens`, {
        token: tokens.refreshToken
      });

      return {
        user: user,
        ...tokens
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Database API error');
      }
      throw error;
    }
  }

  async loginUser(emailOrUsername, password) {
    try {
      // Authenticate user via Database API
      const authResponse = await axios.post(`${this.databaseApiUrl}/api/users/authenticate`, {
        emailOrUsername: emailOrUsername,
        password: password
      });

      const user = authResponse.data.data.user;

      // Generate tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token via Database API
      await axios.post(`${this.databaseApiUrl}/api/users/${user.id}/refresh-tokens`, {
        token: tokens.refreshToken
      });

      // Update last login via Database API
      await axios.patch(`${this.databaseApiUrl}/api/users/${user.id}`, {
        lastLogin: new Date().toISOString()
      });

      return {
        user: user,
        ...tokens
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Invalid credentials');
      }
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwtService.verifyToken(refreshToken);
      
      // Get user via Database API
      const userResponse = await axios.get(`${this.databaseApiUrl}/api/users/${decoded.userId}`);
      const user = userResponse.data.data;

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Check if refresh token exists via Database API
      const tokenResponse = await axios.get(`${this.databaseApiUrl}/api/users/${user.id}/refresh-tokens`);
      const userTokens = tokenResponse.data.data.tokens;
      
      const tokenExists = userTokens.some(tokenObj => tokenObj.token === refreshToken);
      if (!tokenExists) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = jwtService.generateTokenPair(user);

      // Remove old refresh token and add new one via Database API
      await axios.delete(`${this.databaseApiUrl}/api/users/${user.id}/refresh-tokens`, {
        data: { token: refreshToken }
      });
      
      await axios.post(`${this.databaseApiUrl}/api/users/${user.id}/refresh-tokens`, {
        token: tokens.refreshToken
      });

      return {
        user: user,
        ...tokens
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Token refresh failed');
      }
      throw error;
    }
  }

  async logoutUser(userId, refreshToken) {
    try {
      // Remove the specific refresh token via Database API
      await axios.delete(`${this.databaseApiUrl}/api/users/${userId}/refresh-tokens`, {
        data: { token: refreshToken }
      });
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Logout failed');
      }
      throw error;
    }
  }

  async logoutAllDevices(userId) {
    try {
      // Clear all refresh tokens via Database API
      await axios.delete(`${this.databaseApiUrl}/api/users/${userId}/refresh-tokens/all`);
      
      return { message: 'Logged out from all devices successfully' };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Logout all failed');
      }
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwtService.verifyToken(token);
      
      // Get user via Database API
      const userResponse = await axios.get(`${this.databaseApiUrl}/api/users/${decoded.userId}`);
      const user = userResponse.data.data;
      
      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      return {
        user: user,
        tokenData: decoded
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Token verification failed');
      }
      throw error;
    }
  }
}

module.exports = new AuthService();
