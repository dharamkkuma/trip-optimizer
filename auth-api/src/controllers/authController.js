const authService = require('../services/authService');
const axios = require('axios');

const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    const result = await authService.registerUser({
      username,
      email,
      password,
      firstName,
      lastName
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    const result = await authService.loginUser(emailOrUsername, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;
    
    const result = await authService.logoutUser(userId, refreshToken);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await authService.logoutAllDevices(userId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    const result = await authService.verifyToken(token);

    res.json({
      success: true,
      message: 'Token is valid',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user profile via Database API
    const userResponse = await axios.get(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${userId}`);
    const user = userResponse.data.data;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to get profile'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, phone, bio } = req.body;
    
    // Update user profile via Database API
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    
    const userResponse = await axios.put(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${userId}`, updateData);
    const user = userResponse.data.data;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to update profile'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin functions
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);
    if (status) queryParams.append('status', status);
    
    const response = await axios.get(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users?${queryParams.toString()}`);
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: response.data
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to get users'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${id}`);
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: response.data
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to get user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const response = await axios.patch(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${id}`, updateData);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: response.data
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to update user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    const response = await axios.delete(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${id}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to delete user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    // Get user first, then update password with proper hashing
    const userResponse = await axios.get(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${id}`);
    const user = userResponse.data.data;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update password via database API with proper hashing
    const response = await axios.patch(`${process.env.DATABASE_API_URL || 'http://localhost:8002'}/api/users/${id}/password`, {
      password: newPassword
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Failed to reset password'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  verifyToken,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword
};
