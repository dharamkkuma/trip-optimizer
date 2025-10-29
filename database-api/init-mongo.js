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

// Create a test user for demo purposes
db.users.insertOne({
  email: 'user@tripoptimizer.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  password: 'user123', // This should be hashed in production
  role: 'user',
  status: 'active',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create trips collection
db.createCollection('trips', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'destination', 'dates', 'budget', 'travelers'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Trip title is required'
        },
        destination: {
          bsonType: 'object',
          required: ['country', 'city'],
          properties: {
            country: { bsonType: 'string' },
            city: { bsonType: 'string' }
          }
        },
        dates: {
          bsonType: 'object',
          required: ['startDate', 'endDate'],
          properties: {
            startDate: { bsonType: 'date' },
            endDate: { bsonType: 'date' }
          }
        },
        budget: {
          bsonType: 'object',
          required: ['total', 'currency'],
          properties: {
            total: { bsonType: 'number', minimum: 0 },
            currency: { bsonType: 'string' }
          }
        },
        status: {
          bsonType: 'string',
          enum: ['planning', 'booked', 'active', 'completed', 'cancelled'],
          description: 'Status must be one of: planning, booked, active, completed, cancelled'
        },
        travelers: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'object',
            required: ['userId', 'role'],
            properties: {
              userId: { bsonType: 'objectId' },
              role: {
                bsonType: 'string',
                enum: ['owner', 'admin', 'member']
              }
            }
          }
        },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' }
        },
        isPublic: { bsonType: 'bool' }
      }
    }
  }
});

// Create indexes for trips
db.trips.createIndex({ 'travelers.userId': 1 });
db.trips.createIndex({ status: 1 });
db.trips.createIndex({ 'dates.startDate': 1 });
db.trips.createIndex({ 'dates.endDate': 1 });
db.trips.createIndex({ title: 'text', 'destination.city': 'text', 'destination.country': 'text' });

// Insert dummy trip data
const adminUserId = db.users.findOne({ email: 'admin@tripoptimizer.com' })._id;
const testUserId = db.users.findOne({ email: 'user@tripoptimizer.com' })._id;

db.trips.insertMany([
  {
    title: 'European Adventure',
    destination: {
      country: 'France',
      city: 'Paris'
    },
    dates: {
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-22')
    },
    budget: {
      total: 2500,
      currency: 'USD'
    },
    status: 'planning',
    travelers: [
      { userId: adminUserId, role: 'owner' }
    ],
    tags: ['europe', 'culture', 'romantic'],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Tokyo Business Trip',
    destination: {
      country: 'Japan',
      city: 'Tokyo'
    },
    dates: {
      startDate: new Date('2024-04-10'),
      endDate: new Date('2024-04-15')
    },
    budget: {
      total: 1800,
      currency: 'USD'
    },
    status: 'booked',
    travelers: [
      { userId: adminUserId, role: 'owner' }
    ],
    tags: ['business', 'asia', 'work'],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Beach Vacation',
    destination: {
      country: 'Thailand',
      city: 'Phuket'
    },
    dates: {
      startDate: new Date('2024-05-20'),
      endDate: new Date('2024-05-27')
    },
    budget: {
      total: 1200,
      currency: 'USD'
    },
    status: 'active',
    travelers: [
      { userId: testUserId, role: 'owner' }
    ],
    tags: ['beach', 'relaxation', 'tropical'],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Mountain Hiking',
    destination: {
      country: 'Switzerland',
      city: 'Zermatt'
    },
    dates: {
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-22')
    },
    budget: {
      total: 2200,
      currency: 'USD'
    },
    status: 'completed',
    travelers: [
      { userId: adminUserId, role: 'owner' },
      { userId: testUserId, role: 'member' }
    ],
    tags: ['mountains', 'hiking', 'adventure'],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'City Break',
    destination: {
      country: 'Italy',
      city: 'Rome'
    },
    dates: {
      startDate: new Date('2024-07-10'),
      endDate: new Date('2024-07-14')
    },
    budget: {
      total: 800,
      currency: 'USD'
    },
    status: 'planning',
    travelers: [
      { userId: testUserId, role: 'owner' }
    ],
    tags: ['city', 'history', 'food'],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialization completed successfully!');
print('Created trip_optimizer database with users and trips collections');
print('Created indexes for optimal performance');
print('Created default admin user: admin@tripoptimizer.com');
print('Created test user: user@tripoptimizer.com');
print('Inserted 5 dummy trips for testing');
