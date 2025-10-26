const mongoose = require('mongoose');

// Base schema with common fields
const baseSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to update updatedAt
baseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find active documents
baseSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, status: 'active' });
};

// Instance method to soft delete
baseSchema.methods.softDelete = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to restore
baseSchema.methods.restore = function() {
  this.status = 'active';
  return this.save();
};

module.exports = baseSchema;
