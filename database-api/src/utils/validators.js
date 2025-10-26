const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  date: Joi.date().iso().optional(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  status: Joi.string().valid('active', 'inactive', 'archived').default('active'),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }
};

// User validation schemas
const userSchemas = {
  create: Joi.object({
    email: commonSchemas.email,
    username: Joi.string().alphanum().min(3).max(30).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    dateOfBirth: commonSchemas.date,
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().optional()
    }).optional(),
    preferences: Joi.object({
      language: Joi.string().default('en'),
      timezone: Joi.string().default('UTC'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        sms: Joi.boolean().default(false),
        push: Joi.boolean().default(true)
      }).optional()
    }).optional(),
    role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').default('active')
  }),

  update: Joi.object({
    email: commonSchemas.email.optional(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    phone: commonSchemas.phone,
    dateOfBirth: commonSchemas.date,
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().optional()
    }).optional(),
    preferences: Joi.object({
      language: Joi.string().optional(),
      timezone: Joi.string().optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        push: Joi.boolean().optional()
      }).optional()
    }).optional(),
    role: Joi.string().valid('user', 'admin', 'moderator').optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional()
  })
};

// Trip validation schemas
const tripSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    destination: Joi.object({
      country: Joi.string().min(1).required(),
      city: Joi.string().min(1).required(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).required(),
    dates: Joi.object({
      startDate: commonSchemas.date.required(),
      endDate: commonSchemas.date.required()
    }).required(),
    budget: Joi.object({
      total: Joi.number().min(0).required(),
      currency: commonSchemas.currency,
      breakdown: Joi.object({
        accommodation: Joi.number().min(0).optional(),
        transportation: Joi.number().min(0).optional(),
        food: Joi.number().min(0).optional(),
        activities: Joi.number().min(0).optional(),
        miscellaneous: Joi.number().min(0).optional()
      }).optional()
    }).required(),
    preferences: Joi.object({
      accommodationType: Joi.string().valid('hotel', 'hostel', 'airbnb', 'camping', 'other').optional(),
      transportationMode: Joi.string().valid('flight', 'train', 'bus', 'car', 'walking', 'other').optional(),
      activityLevel: Joi.string().valid('low', 'medium', 'high').default('medium'),
      dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
      accessibility: Joi.object({
        wheelchairAccessible: Joi.boolean().optional(),
        mobilityAssistance: Joi.boolean().optional(),
        other: Joi.string().optional()
      }).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isPublic: Joi.boolean().default(false),
    visibility: Joi.string().valid('private', 'friends', 'public').default('private')
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    destination: Joi.object({
      country: Joi.string().min(1).optional(),
      city: Joi.string().min(1).optional(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    dates: Joi.object({
      startDate: commonSchemas.date.optional(),
      endDate: commonSchemas.date.optional()
    }).optional(),
    budget: Joi.object({
      total: Joi.number().min(0).optional(),
      currency: commonSchemas.currency,
      breakdown: Joi.object({
        accommodation: Joi.number().min(0).optional(),
        transportation: Joi.number().min(0).optional(),
        food: Joi.number().min(0).optional(),
        activities: Joi.number().min(0).optional(),
        miscellaneous: Joi.number().min(0).optional()
      }).optional()
    }).optional(),
    preferences: Joi.object({
      accommodationType: Joi.string().valid('hotel', 'hostel', 'airbnb', 'camping', 'other').optional(),
      transportationMode: Joi.string().valid('flight', 'train', 'bus', 'car', 'walking', 'other').optional(),
      activityLevel: Joi.string().valid('low', 'medium', 'high').optional(),
      dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
      accessibility: Joi.object({
        wheelchairAccessible: Joi.boolean().optional(),
        mobilityAssistance: Joi.boolean().optional(),
        other: Joi.string().optional()
      }).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isPublic: Joi.boolean().optional(),
    visibility: Joi.string().valid('private', 'friends', 'public').optional()
  })
};

// Payment validation schemas
const paymentSchemas = {
  create: Joi.object({
    user: commonSchemas.mongoId,
    trip: commonSchemas.mongoId,
    amount: Joi.object({
      value: Joi.number().min(0).required(),
      currency: commonSchemas.currency.required()
    }).required(),
    paymentMethod: Joi.object({
      type: Joi.string().valid('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'crypto', 'cash', 'other').required(),
      details: Joi.object({
        cardLast4: Joi.string().length(4).optional(),
        cardBrand: Joi.string().optional(),
        bankName: Joi.string().optional(),
        accountLast4: Joi.string().length(4).optional(),
        walletAddress: Joi.string().optional()
      }).optional()
    }).required(),
    category: Joi.string().valid('accommodation', 'transportation', 'food', 'activity', 'sightseeing', 'miscellaneous', 'other').required(),
    description: Joi.string().max(500).optional(),
    dueDate: commonSchemas.date,
    notes: Joi.string().optional()
  }),

  update: Joi.object({
    amount: Joi.object({
      value: Joi.number().min(0).optional(),
      currency: commonSchemas.currency.optional()
    }).optional(),
    paymentMethod: Joi.object({
      type: Joi.string().valid('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'crypto', 'cash', 'other').optional(),
      details: Joi.object({
        cardLast4: Joi.string().length(4).optional(),
        cardBrand: Joi.string().optional(),
        bankName: Joi.string().optional(),
        accountLast4: Joi.string().length(4).optional(),
        walletAddress: Joi.string().optional()
      }).optional()
    }).optional(),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded').optional(),
    category: Joi.string().valid('accommodation', 'transportation', 'food', 'activity', 'sightseeing', 'miscellaneous', 'other').optional(),
    description: Joi.string().max(500).optional(),
    dueDate: commonSchemas.date,
    notes: Joi.string().optional()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  commonSchemas,
  userSchemas,
  tripSchemas,
  paymentSchemas,
  validate
};
