// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the trip_optimizer database
db = db.getSiblingDB('trip_optimizer');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'username', 'firstName', 'lastName', 'password'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Username must be between 3 and 30 characters'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'First name is required and must be between 1 and 50 characters'
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Last name is required and must be between 1 and 50 characters'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters long'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'inactive', 'suspended', 'pending'],
          description: 'Status must be one of: active, inactive, suspended, pending'
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin', 'moderator'],
          description: 'Role must be one of: user, admin, moderator'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ status: 1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ firstName: 'text', lastName: 'text', email: 'text', username: 'text' });

// Create a default admin user (password should be changed in production)
db.users.insertOne({
  email: 'admin@tripoptimizer.com',
  username: 'admin',
  firstName: 'System',
  lastName: 'Administrator',
  password: 'admin123', // This should be hashed in production
  role: 'admin',
  status: 'active',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialization completed successfully!');
print('Created trip_optimizer database with users collection');
print('Created indexes for optimal performance');
print('Created default admin user: admin@tripoptimizer.com');
