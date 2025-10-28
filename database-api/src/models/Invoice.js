const mongoose = require('mongoose');
const baseSchema = require('./BaseModel');

const invoiceSchema = new mongoose.Schema({
  // Basic Invoice Information
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Document Processing Information
  documentStatus: {
    type: String,
    enum: ['uploaded', 'processing', 'parsed', 'verified', 'approved', 'rejected', 'archived'],
    default: 'uploaded'
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'retry'],
    default: 'pending'
  },
  parsingStatus: {
    type: String,
    enum: ['not_started', 'extracting_text', 'analyzing_structure', 'identifying_fields', 'completed', 'failed'],
    default: 'not_started'
  },
  
  // File Information
  originalFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'image', 'document']
  },
  mimeType: {
    type: String,
    required: true
  },
  
  // Parsed Data
  parsedData: {
    // Vendor Information
    vendor: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      contact: {
        phone: String,
        email: String,
        website: String
      },
      taxId: String,
      registrationNumber: String
    },
    
    // Customer Information
    customer: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      contact: {
        phone: String,
        email: String
      },
      taxId: String,
      customerNumber: String
    },
    
    // Financial Information
    financial: {
      subtotal: {
        type: Number,
        default: 0
      },
      taxAmount: {
        type: Number,
        default: 0
      },
      taxRate: {
        type: Number,
        default: 0
      },
      discountAmount: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        required: false
      },
      currency: {
        type: String,
        default: 'USD'
      },
      paymentTerms: String,
      paymentMethod: String
    },
    
    // Line Items
    lineItems: [{
      description: String,
      quantity: {
        type: Number,
        default: 1
      },
      unitPrice: {
        type: Number,
        required: false
      },
      totalPrice: {
        type: Number,
        required: false
      },
      taxRate: {
        type: Number,
        default: 0
      },
      category: String,
      sku: String,
      unit: String
    }],
    
    // Additional Information
    notes: String,
    terms: String,
    reference: String,
    poNumber: String,
    projectCode: String
  },
  
  // Processing Metadata
  processingMetadata: {
    startTime: Date,
    endTime: Date,
    processingTime: Number, // in milliseconds
    retryCount: {
      type: Number,
      default: 0
    },
    lastError: {
      message: String,
      code: String,
      timestamp: Date
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    extractionMethod: {
      type: String,
      enum: ['ocr', 'template', 'ai', 'hybrid'],
      default: 'ocr'
    }
  },
  
  // Verification and Approval
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String,
    confidenceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  
  // Approval Workflow
  approval: {
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    approvalNotes: String,
    approvalLevel: {
      type: String,
      enum: ['pending', 'manager', 'finance', 'executive'],
      default: 'pending'
    }
  },
  
  // Trip Association
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: false
  },
  
  // User Ownership
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Expense Association
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },
  
  // Tags and Categories
  tags: [String],
  category: {
    type: String,
    enum: ['accommodation', 'transportation', 'meals', 'entertainment', 'shopping', 'other'],
    default: 'other'
  },
  
  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'verified', 'approved', 'rejected', 'archived', 'restored']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    changes: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add base schema fields
invoiceSchema.add(baseSchema);

// Indexes for better performance
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ invoiceDate: 1 });
invoiceSchema.index({ documentStatus: 1 });
invoiceSchema.index({ processingStatus: 1 });
invoiceSchema.index({ tripId: 1 });
invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ expenseId: 1 });
invoiceSchema.index({ 'parsedData.financial.totalAmount': 1 });
invoiceSchema.index({ createdAt: -1 });

// Virtual for processing duration
invoiceSchema.virtual('processingDuration').get(function() {
  if (this.processingMetadata.startTime && this.processingMetadata.endTime) {
    return this.processingMetadata.endTime - this.processingMetadata.startTime;
  }
  return null;
});

// Virtual for days until due
invoiceSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return this.daysUntilDue < 0;
});

// Pre-save middleware
invoiceSchema.pre('save', function(next) {
  // Auto-generate invoice number if not provided
  if (!this.invoiceNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.invoiceNumber = `INV-${timestamp}-${random}`.toUpperCase();
  }
  
  // Calculate line item totals
  if (this.parsedData && this.parsedData.lineItems) {
    this.parsedData.lineItems.forEach(item => {
      item.totalPrice = item.quantity * item.unitPrice;
    });
  }
  
  // Calculate subtotal
  if (this.parsedData && this.parsedData.lineItems) {
    this.parsedData.financial.subtotal = this.parsedData.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  
  // Calculate total amount
  if (this.parsedData && this.parsedData.financial) {
    const { subtotal, taxAmount, discountAmount } = this.parsedData.financial;
    this.parsedData.financial.totalAmount = subtotal + taxAmount - discountAmount;
  }
  
  next();
});

// Static methods
invoiceSchema.statics.findByTrip = function(tripId) {
  return this.find({ tripId, status: 'active' });
};

invoiceSchema.statics.findByStatus = function(status) {
  return this.find({ documentStatus: status, status: 'active' });
};

invoiceSchema.statics.findOverdue = function() {
  return this.find({ 
    dueDate: { $lt: new Date() },
    documentStatus: { $nin: ['paid', 'archived'] },
    status: 'active'
  });
};

invoiceSchema.statics.findPendingApproval = function() {
  return this.find({ 
    'approval.isApproved': false,
    documentStatus: 'verified',
    status: 'active'
  });
};

// Instance methods
invoiceSchema.methods.startProcessing = function() {
  this.processingStatus = 'in_progress';
  this.parsingStatus = 'extracting_text';
  this.processingMetadata.startTime = new Date();
  return this.save();
};

invoiceSchema.methods.completeProcessing = function(parsedData, confidenceScore) {
  this.processingStatus = 'completed';
  this.parsingStatus = 'completed';
  this.processingMetadata.endTime = new Date();
  this.processingMetadata.confidenceScore = confidenceScore;
  this.parsedData = parsedData;
  this.documentStatus = 'parsed';
  return this.save();
};

invoiceSchema.methods.failProcessing = function(error) {
  this.processingStatus = 'failed';
  this.processingMetadata.endTime = new Date();
  this.processingMetadata.lastError = {
    message: error.message,
    code: error.code || 'PROCESSING_ERROR',
    timestamp: new Date()
  };
  this.processingMetadata.retryCount += 1;
  return this.save();
};

invoiceSchema.methods.verify = function(verifiedBy, notes, confidenceLevel) {
  this.verification.isVerified = true;
  this.verification.verifiedBy = verifiedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  this.verification.confidenceLevel = confidenceLevel;
  this.documentStatus = 'verified';
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'verified',
    performedBy: verifiedBy,
    details: notes
  });
  
  return this.save();
};

invoiceSchema.methods.approve = function(approvedBy, notes, approvalLevel) {
  this.approval.isApproved = true;
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  this.approval.approvalNotes = notes;
  this.approval.approvalLevel = approvalLevel;
  this.documentStatus = 'approved';
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'approved',
    performedBy: approvedBy,
    details: notes
  });
  
  return this.save();
};

invoiceSchema.methods.reject = function(rejectedBy, reason) {
  this.documentStatus = 'rejected';
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'rejected',
    performedBy: rejectedBy,
    details: reason
  });
  
  return this.save();
};

module.exports = mongoose.model('Invoice', invoiceSchema);
