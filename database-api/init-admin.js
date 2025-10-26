const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

// Initialize admin user
const initializeAdminUser = async () => {
  try {
    console.log('🔍 Checking for admin user...');
    
    // Check if admin user already exists
    const adminExists = await User.findOne({
      $or: [
        { email: 'admin@tripoptimizer.com' },
        { username: 'admin' }
      ]
    });

    if (!adminExists) {
      console.log('👤 Creating admin user...');
      
      // Create admin user (password will be hashed by pre-save middleware)
      const adminUser = new User({
        email: 'admin@tripoptimizer.com',
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        password: 'Admin123!', // Will be hashed by pre-save middleware
        role: 'admin',
        status: 'active',
        emailVerified: false,
        twoFactorEnabled: false,
        loginAttempts: 0,
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'en',
          timezone: 'UTC'
        },
        refreshTokens: []
      });
      
      // Save admin user (this will trigger pre-save middleware for password hashing)
      const savedUser = await adminUser.save();
      console.log('✅ Admin user created successfully with ID:', savedUser._id);
      console.log('📧 Email: admin@tripoptimizer.com');
      console.log('👤 Username: admin');
      console.log('🔑 Password: Admin123!');
      
    } else {
      console.log('ℹ️  Admin user already exists, ensuring admin role...');
      
      // Ensure admin user has admin role
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('✅ Updated admin user role to admin');
      } else {
        console.log('✅ Admin user already has admin role');
      }
    }
    
    console.log('🎉 Admin user initialization completed');
    
  } catch (error) {
    console.error('❌ Error initializing admin user:', error.message);
    throw error;
  }
};

// Connect to MongoDB and initialize admin user
const connectAndInitialize = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trip_optimizer';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Initialize admin user
    await initializeAdminUser();
    
    // Close connection after initialization
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  connectAndInitialize();
}

module.exports = { initializeAdminUser };
