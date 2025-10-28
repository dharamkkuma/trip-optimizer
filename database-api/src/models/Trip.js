const mongoose = require('mongoose');
const baseSchema = require('./BaseModel');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  destination: {
    country: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  dates: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  budget: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    breakdown: {
      accommodation: Number,
      transportation: Number,
      food: Number,
      activities: Number,
      miscellaneous: Number
    }
  },
  travelers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    }
  }],
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['private', 'friends', 'public'],
    default: 'private'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add base schema fields
tripSchema.add(baseSchema);

// Virtual for owner
tripSchema.virtual('owner').get(function() {
  return this.travelers && this.travelers.find(traveler => traveler.role === 'owner');
});

// Indexes
tripSchema.index({ title: 1 });
tripSchema.index({ 'destination.country': 1 });
tripSchema.index({ 'destination.city': 1 });
tripSchema.index({ 'dates.startDate': 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
