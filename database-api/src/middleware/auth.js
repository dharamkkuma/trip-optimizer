const authMiddleware = async (req, res, next) => {
  try {
    // Extract user info from headers sent by backend
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const userRole = req.headers['x-user-role'];
    
    if (userId) {
      req.user = {
        id: userId,
        email: userEmail || 'unknown@example.com',
        role: userRole || 'user'
      };
    } else {
      // If no user ID provided, create a default user for testing
      req.user = {
        id: '507f1f77bcf86cd799439011', // Default user ID for testing
        email: 'test@example.com',
        role: 'user'
      };
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = authMiddleware;