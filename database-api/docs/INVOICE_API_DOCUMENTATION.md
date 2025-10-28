# Invoice API Documentation

## Overview
The Invoice API provides comprehensive CRUD operations for managing invoices, including PDF parsing, document processing, verification, and approval workflows.

## Base URL
```
http://localhost:8002/api/invoices
```

## Authentication
All endpoints require authentication via custom headers for user identification:
```
x-user-id: <user_id>
x-user-email: <user_email>
```

**Note**: The system uses custom headers instead of JWT tokens for database-api authentication. The user ID and email are passed in custom headers to enable user-specific data filtering.

## Data Models

### Invoice Schema
```javascript
{
  // Basic Information
  invoiceNumber: String (unique, auto-generated),
  invoiceDate: Date (required),
  dueDate: Date (required),
  
  // Document Processing
  documentStatus: String (enum: uploaded, processing, parsed, verified, approved, rejected, archived),
  processingStatus: String (enum: pending, in_progress, completed, failed, retry),
  parsingStatus: String (enum: not_started, extracting_text, analyzing_structure, identifying_fields, completed, failed),
  
  // File Information
  originalFileName: String (required),
  filePath: String (required),
  fileSize: Number (required),
  fileType: String (enum: pdf, image, document),
  mimeType: String (required),
  
  // Parsed Data
  parsedData: {
    vendor: {
      name: String,
      address: { street, city, state, zipCode, country },
      contact: { phone, email, website },
      taxId: String,
      registrationNumber: String
    },
    customer: {
      name: String,
      address: { street, city, state, zipCode, country },
      contact: { phone, email },
      taxId: String,
      customerNumber: String
    },
    financial: {
      subtotal: Number,
      taxAmount: Number,
      taxRate: Number,
      discountAmount: Number,
      totalAmount: Number (required),
      currency: String (default: USD),
      paymentTerms: String,
      paymentMethod: String
    },
    lineItems: [{
      description: String,
      quantity: Number (default: 1),
      unitPrice: Number (required),
      totalPrice: Number (calculated),
      taxRate: Number,
      category: String,
      sku: String,
      unit: String
    }],
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
    processingTime: Number,
    retryCount: Number (default: 0),
    lastError: { message, code, timestamp },
    confidenceScore: Number (0-100),
    extractionMethod: String (enum: ocr, template, ai, hybrid)
  },
  
  // Verification & Approval
  verification: {
    isVerified: Boolean (default: false),
    verifiedBy: ObjectId (ref: User),
    verifiedAt: Date,
    verificationNotes: String,
    confidenceLevel: String (enum: low, medium, high)
  },
  approval: {
    isApproved: Boolean (default: false),
    approvedBy: ObjectId (ref: User),
    approvedAt: Date,
    approvalNotes: String,
    approvalLevel: String (enum: pending, manager, finance, executive)
  },
  
  // Associations
  tripId: ObjectId (ref: Trip, required),
  expenseId: ObjectId (ref: Expense),
  userId: ObjectId (ref: User, required), // User who created/owns the invoice
  
  // Metadata
  tags: [String],
  category: String (enum: accommodation, transportation, meals, entertainment, shopping, other),
  auditTrail: [{
    action: String,
    performedBy: ObjectId (ref: User),
    timestamp: Date,
    details: String,
    changes: Mixed
  }]
}
```

## Endpoints

### 1. Get All Invoices
**GET** `/api/invoices`

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order - asc/desc (default: desc)
- `status` (string): Filter by status
- `documentStatus` (string): Filter by document status
- `processingStatus` (string): Filter by processing status
- `tripId` (string): Filter by trip ID
- `category` (string): Filter by category
- `search` (string): Search in invoice number, filename, vendor, customer
- `dateFrom` (string): Filter by invoice date from
- `dateTo` (string): Filter by invoice date to
- `amountMin` (number): Filter by minimum amount
- `amountMax` (number): Filter by maximum amount
- `isOverdue` (boolean): Filter overdue invoices
- `needsApproval` (boolean): Filter invoices needing approval

#### Response
```json
{
  "success": true,
  "data": [Invoice],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

### 2. Get Invoice Statistics
**GET** `/api/invoices/stats`

#### Response
```json
{
  "success": true,
  "data": {
    "totalInvoices": 150,
    "totalAmount": 125000.50,
    "averageAmount": 833.34,
    "statusBreakdown": {
      "uploaded": 10,
      "processing": 5,
      "parsed": 25,
      "verified": 30,
      "approved": 80
    },
    "processingBreakdown": {
      "pending": 8,
      "in_progress": 3,
      "completed": 139
    },
    "overdueCount": 12,
    "pendingApprovalCount": 15
  }
}
```

### 3. Get Single Invoice
**GET** `/api/invoices/:id`

#### Response
```json
{
  "success": true,
  "data": Invoice
}
```

### 4. Create Invoice
**POST** `/api/invoices`

#### Request Body
```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "originalFileName": "invoice.pdf",
  "filePath": "/uploads/invoices/invoice.pdf",
  "fileSize": 1024000,
  "fileType": "pdf",
  "mimeType": "application/pdf",
  "tripId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "category": "accommodation",
  "tags": ["hotel", "business"],
  "parsedData": {
    "vendor": {
      "name": "Hotel ABC",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "financial": {
      "totalAmount": 500.00,
      "currency": "USD"
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": Invoice
}
```

### 5. Update Invoice
**PUT** `/api/invoices/:id`

#### Request Body
```json
{
  "invoiceNumber": "INV-2024-001-UPDATED",
  "documentStatus": "verified",
  "parsedData": {
    "financial": {
      "totalAmount": 550.00
    }
  }
}
```

### 6. Partial Update Invoice
**PATCH** `/api/invoices/:id`

#### Request Body
```json
{
  "documentStatus": "approved",
  "category": "transportation"
}
```

### 7. Delete Invoice
**DELETE** `/api/invoices/:id`

#### Response
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

### 8. Start Processing
**POST** `/api/invoices/:id/process`

#### Response
```json
{
  "success": true,
  "message": "Invoice processing started",
  "data": Invoice
}
```

### 9. Complete Processing
**POST** `/api/invoices/:id/complete-processing`

#### Request Body
```json
{
  "parsedData": {
    "vendor": { "name": "Vendor Name" },
    "financial": { "totalAmount": 500.00 }
  },
  "confidenceScore": 85
}
```

### 10. Mark Processing Failed
**POST** `/api/invoices/:id/fail-processing`

#### Request Body
```json
{
  "error": {
    "message": "OCR processing failed",
    "code": "OCR_ERROR"
  }
}
```

### 11. Verify Invoice
**POST** `/api/invoices/:id/verify`

#### Request Body
```json
{
  "notes": "Data looks accurate",
  "confidenceLevel": "high"
}
```

### 12. Approve Invoice
**POST** `/api/invoices/:id/approve`

#### Request Body
```json
{
  "notes": "Approved for payment",
  "approvalLevel": "manager"
}
```

### 13. Reject Invoice
**POST** `/api/invoices/:id/reject`

#### Request Body
```json
{
  "reason": "Incorrect vendor information"
}
```

### 14. Get Invoices by Trip
**GET** `/api/invoices/trip/:tripId`

### 15. Get Invoices by Status
**GET** `/api/invoices/status/:status`

### 16. Get Overdue Invoices
**GET** `/api/invoices/overdue`

### 17. Get Pending Approval Invoices
**GET** `/api/invoices/pending-approval`

### 18. Retry Processing
**POST** `/api/invoices/:id/retry`

### 19. Get Audit Trail
**GET** `/api/invoices/:id/audit-trail`

#### Response
```json
{
  "success": true,
  "data": [
    {
      "action": "created",
      "performedBy": { "name": "John Doe", "email": "john@example.com" },
      "timestamp": "2024-01-15T10:30:00Z",
      "details": "Invoice created"
    }
  ]
}
```

### 20. Get Analytics
**GET** `/api/invoices/analytics`

#### Query Parameters
- `tripId` (string): Filter by trip
- `dateFrom` (string): Filter from date
- `dateTo` (string): Filter to date

#### Response
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalInvoices": 150,
      "totalAmount": 125000.50,
      "averageAmount": 833.34,
      "processingTime": 2500,
      "confidenceScore": 87.5
    },
    "processingMetrics": [
      {
        "_id": "completed",
        "count": 139,
        "avgProcessingTime": 2500,
        "avgConfidenceScore": 87.5
      }
    ],
    "monthlyTrends": [
      {
        "_id": { "year": 2024, "month": 1 },
        "count": 25,
        "totalAmount": 20000.00,
        "avgAmount": 800.00
      }
    ]
  }
}
```

### 21. Bulk Update
**POST** `/api/invoices/bulk-update`

#### Request Body
```json
{
  "invoiceIds": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"],
  "updates": {
    "category": "transportation",
    "tags": ["updated"]
  }
}
```

### 22. Bulk Delete
**POST** `/api/invoices/bulk-delete`

#### Request Body
```json
{
  "invoiceIds": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"]
}
```

### 23. Export Invoices
**GET** `/api/invoices/export`

#### Query Parameters
- `format` (string): Export format - json/csv (default: json)
- All filter parameters from GET /invoices

#### Response (CSV)
```csv
Invoice Number,Invoice Date,Due Date,Vendor,Customer,Total Amount,Currency,Status,Processing Status,Category,Trip,Created At
INV-2024-001,2024-01-15,2024-02-15,Hotel ABC,Customer XYZ,500.00,USD,approved,completed,accommodation,Trip to NYC,2024-01-15T10:30:00Z
```

### 24. Get Processing Queue
**GET** `/api/invoices/processing-queue`

#### Response
```json
{
  "success": true,
  "data": {
    "queue": [Invoice],
    "stats": [
      {
        "_id": "pending",
        "count": 8,
        "avgWaitTime": 300000
      }
    ],
    "totalInQueue": 8
  }
}
```

### 25. Validate Invoice Data
**POST** `/api/invoices/validate`

#### Request Body
```json
{
  "parsedData": {
    "vendor": { "name": "Vendor Name" },
    "customer": { "name": "Customer Name" },
    "financial": { "totalAmount": 500.00 },
    "lineItems": [
      {
        "description": "Service",
        "unitPrice": 100.00,
        "quantity": 5
      }
    ]
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": ["Line item 1 missing description"],
    "confidenceScore": 95
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error processing request",
  "error": "Detailed error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
- 100 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Virtual Fields
- `processingDuration` - Processing time in milliseconds
- `daysUntilDue` - Days until due date
- `isOverdue` - Boolean indicating if invoice is overdue

## Indexes
- `invoiceNumber` (unique)
- `invoiceDate`
- `documentStatus`
- `processingStatus`
- `tripId`
- `expenseId`
- `parsedData.financial.totalAmount`
- `createdAt` (descending)
