const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/users - Get all users with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  query('search').optional().isString().withMessage('Search must be a string'),
  validateRequest
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  validateRequest
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// POST /api/users - Create new user
router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('firstName').isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('lastName').isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  validateRequest
], async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: req.body.email.toLowerCase() },
        { username: req.body.username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const userData = {
      ...req.body,
      email: req.body.email.toLowerCase(),
      username: req.body.username.toLowerCase()
    };

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user (full update)
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  validateRequest
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for email/username conflicts if they're being updated
    if (req.body.email || req.body.username) {
      const conflictQuery = { _id: { $ne: req.params.id } };
      const conflictFields = [];
      
      if (req.body.email) conflictFields.push({ email: req.body.email.toLowerCase() });
      if (req.body.username) conflictFields.push({ username: req.body.username.toLowerCase() });
      
      if (conflictFields.length > 0) {
        conflictQuery.$or = conflictFields;
        const existingUser = await User.findOne(conflictQuery);
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email or username already exists'
          });
        }
      }
    }

    // Update user data
    const updateData = { ...req.body };
    if (updateData.email) updateData.email = updateData.email.toLowerCase();
    if (updateData.username) updateData.username = updateData.username.toLowerCase();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -twoFactorSecret');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// PATCH /api/users/:id - Partial update user
router.patch('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  validateRequest
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for email/username conflicts if they're being updated
    if (req.body.email || req.body.username) {
      const conflictQuery = { _id: { $ne: req.params.id } };
      const conflictFields = [];
      
      if (req.body.email) conflictFields.push({ email: req.body.email.toLowerCase() });
      if (req.body.username) conflictFields.push({ username: req.body.username.toLowerCase() });
      
      if (conflictFields.length > 0) {
        conflictQuery.$or = conflictFields;
        const existingUser = await User.findOne(conflictQuery);
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email or username already exists'
          });
        }
      }
    }

    // Update only provided fields
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (updateData.email) updateData.email = updateData.email.toLowerCase();
    if (updateData.username) updateData.username = updateData.username.toLowerCase();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -twoFactorSecret');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  validateRequest
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// GET /api/users/search/:query - Search users
router.get('/search/:query', [
  param('query').isLength({ min: 1 }).withMessage('Search query is required'),
  validateRequest
], async (req, res) => {
  try {
    const query = req.params.query;
    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    })
    .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -twoFactorSecret')
    .limit(20);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
});

module.exports = router;
