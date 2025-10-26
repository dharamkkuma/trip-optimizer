const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authenticateRefreshToken, requireRole } = require('../middleware/auth');
const { validateRegistration, validateLogin, validateRefreshToken } = require('../middleware/validators');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', validateRefreshToken, authenticateRefreshToken, authController.refreshToken);
router.post('/verify', authController.verifyToken);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAll);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Admin routes
router.get('/admin/users', authenticateToken, requireRole(['admin']), authController.getAllUsers);
router.get('/admin/users/:id', authenticateToken, requireRole(['admin']), authController.getUserById);
router.put('/admin/users/:id', authenticateToken, requireRole(['admin']), authController.updateUser);
router.delete('/admin/users/:id', authenticateToken, requireRole(['admin']), authController.deleteUser);
router.post('/admin/users/:id/reset-password', authenticateToken, requireRole(['admin']), authController.resetUserPassword);

module.exports = router;
