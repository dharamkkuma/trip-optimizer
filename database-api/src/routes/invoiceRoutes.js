const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const InvoiceController = require('../controllers/invoiceController');
const { validateObjectId } = require('../utils/validators');

// GET /api/invoices - Get all invoices with filtering, pagination, and search
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      documentStatus,
      processingStatus,
      tripId,
      category,
      search,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      isOverdue,
      needsApproval
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (status) filter.status = status;
    if (documentStatus) filter.documentStatus = documentStatus;
    if (processingStatus) filter.processingStatus = processingStatus;
    if (tripId) filter.tripId = tripId;
    if (category) filter.category = category;

    // Date range filter
    if (dateFrom || dateTo) {
      filter.invoiceDate = {};
      if (dateFrom) filter.invoiceDate.$gte = new Date(dateFrom);
      if (dateTo) filter.invoiceDate.$lte = new Date(dateTo);
    }

    // Amount range filter
    if (amountMin || amountMax) {
      filter['parsedData.financial.totalAmount'] = {};
      if (amountMin) filter['parsedData.financial.totalAmount'].$gte = parseFloat(amountMin);
      if (amountMax) filter['parsedData.financial.totalAmount'].$lte = parseFloat(amountMax);
    }

    // Overdue filter
    if (isOverdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.documentStatus = { $nin: ['paid', 'archived'] };
    }

    // Needs approval filter
    if (needsApproval === 'true') {
      filter['approval.isApproved'] = false;
      filter.documentStatus = 'verified';
    }

    // Search filter
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { originalFileName: { $regex: search, $options: 'i' } },
        { 'parsedData.vendor.name': { $regex: search, $options: 'i' } },
        { 'parsedData.customer.name': { $regex: search, $options: 'i' } },
        { 'parsedData.notes': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const invoices = await Invoice.find(filter)
      .populate('tripId', 'title destination dates')
      .populate('expenseId', 'title amount')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
});

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$parsedData.financial.totalAmount' },
          averageAmount: { $avg: '$parsedData.financial.totalAmount' }
        }
      }
    ]);

    // Get overdue count
    const overdueCount = await Invoice.countDocuments({
      dueDate: { $lt: new Date() },
      documentStatus: { $nin: ['paid', 'archived'] },
      status: 'active'
    });

    // Get pending approval count
    const pendingApprovalCount = await Invoice.countDocuments({
      'approval.isApproved': false,
      documentStatus: 'verified',
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        ...stats[0],
        overdueCount,
        pendingApprovalCount
      }
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice statistics',
      error: error.message
    });
  }
});

// GET /api/invoices/analytics - Get invoice analytics
router.get('/analytics', InvoiceController.getAnalytics);

// GET /api/invoices/processing-queue - Get processing queue
router.get('/processing-queue', InvoiceController.getProcessingQueue);

// GET /api/invoices/export - Export invoices
router.get('/export', InvoiceController.exportInvoices);

// GET /api/invoices/overdue - Get overdue invoices
router.get('/overdue', async (req, res) => {
  try {
    const invoices = await Invoice.findOverdue()
      .populate('tripId', 'title destination dates')
      .populate('expenseId', 'title amount');

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue invoices',
      error: error.message
    });
  }
});

// GET /api/invoices/pending-approval - Get invoices pending approval
router.get('/pending-approval', async (req, res) => {
  try {
    const invoices = await Invoice.findPendingApproval()
      .populate('tripId', 'title destination dates')
      .populate('expenseId', 'title amount');

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching pending approval invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approval invoices',
      error: error.message
    });
  }
});

// GET /api/invoices/trip/:tripId - Get invoices by trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    if (!validateObjectId(req.params.tripId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID'
      });
    }

    const invoices = await Invoice.findByTrip(req.params.tripId)
      .populate('expenseId', 'title amount');

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices by trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices by trip',
      error: error.message
    });
  }
});

// GET /api/invoices/status/:status - Get invoices by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const invoices = await Invoice.findByStatus(status)
      .populate('tripId', 'title destination dates')
      .populate('expenseId', 'title amount');

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices by status',
      error: error.message
    });
  }
});

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const invoice = await Invoice.findById(req.params.id)
      .populate('tripId', 'title destination dates')
      .populate('expenseId', 'title amount');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
});

// POST /api/invoices - Create new invoice
router.post('/', async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      originalFileName,
      filePath,
      fileSize,
      fileType,
      mimeType,
      tripId,
      category,
      tags,
      parsedData
    } = req.body;

    // Validate required fields
    if (!invoiceDate || !dueDate || !originalFileName || !filePath || !fileSize || !fileType || !mimeType || !tripId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate tripId
    if (!validateObjectId(tripId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID'
      });
    }

    const invoice = new Invoice({
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      originalFileName,
      filePath,
      fileSize,
      fileType,
      mimeType,
      tripId,
      category: category || 'other',
      tags: tags || [],
      parsedData: parsedData || {},
      createdBy: req.user?.id || null
    });

    await invoice.save();

    // Add to audit trail
    invoice.auditTrail.push({
      action: 'created',
      performedBy: req.user?.id || null,
      details: 'Invoice created'
    });
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
});

// PUT /api/invoices/:id - Update invoice
router.put('/:id', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      documentStatus,
      processingStatus,
      parsingStatus,
      tripId,
      expenseId,
      category,
      tags,
      parsedData
    } = req.body;

    // Update fields
    if (invoiceNumber !== undefined) invoice.invoiceNumber = invoiceNumber;
    if (invoiceDate !== undefined) invoice.invoiceDate = new Date(invoiceDate);
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (documentStatus !== undefined) invoice.documentStatus = documentStatus;
    if (processingStatus !== undefined) invoice.processingStatus = processingStatus;
    if (parsingStatus !== undefined) invoice.parsingStatus = parsingStatus;
    if (tripId !== undefined) {
      if (!validateObjectId(tripId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trip ID'
        });
      }
      invoice.tripId = tripId;
    }
    if (expenseId !== undefined) {
      if (expenseId && !validateObjectId(expenseId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expense ID'
        });
      }
      invoice.expenseId = expenseId;
    }
    if (category !== undefined) invoice.category = category;
    if (tags !== undefined) invoice.tags = tags;
    if (parsedData !== undefined) invoice.parsedData = parsedData;

    invoice.updatedBy = req.user?.id || null;

    await invoice.save();

    // Add to audit trail
    invoice.auditTrail.push({
      action: 'updated',
      performedBy: req.user?.id || null,
      details: 'Invoice updated',
      changes: req.body
    });
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
});

// PATCH /api/invoices/:id - Partial update invoice
router.patch('/:id', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update only provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'invoiceDate' || key === 'dueDate') {
          invoice[key] = new Date(req.body[key]);
        } else if (key === 'tripId' || key === 'expenseId') {
          if (req.body[key] && !validateObjectId(req.body[key])) {
            throw new Error(`Invalid ${key}`);
          }
          invoice[key] = req.body[key];
        } else {
          invoice[key] = req.body[key];
        }
      }
    });

    invoice.updatedBy = req.user?.id || null;

    await invoice.save();

    // Add to audit trail
    invoice.auditTrail.push({
      action: 'updated',
      performedBy: req.user?.id || null,
      details: 'Invoice partially updated',
      changes: req.body
    });
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
});

// DELETE /api/invoices/:id - Soft delete invoice
router.delete('/:id', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Soft delete
    await invoice.softDelete();

    // Add to audit trail
    invoice.auditTrail.push({
      action: 'archived',
      performedBy: req.user?.id || null,
      details: 'Invoice archived'
    });
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
});

// POST /api/invoices/:id/process - Start processing invoice
router.post('/:id/process', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.startProcessing();

    res.json({
      success: true,
      message: 'Invoice processing started',
      data: invoice
    });
  } catch (error) {
    console.error('Error starting invoice processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting invoice processing',
      error: error.message
    });
  }
});

// POST /api/invoices/:id/complete-processing - Complete processing
router.post('/:id/complete-processing', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const { parsedData, confidenceScore } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.completeProcessing(parsedData, confidenceScore);

    res.json({
      success: true,
      message: 'Invoice processing completed',
      data: invoice
    });
  } catch (error) {
    console.error('Error completing invoice processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing invoice processing',
      error: error.message
    });
  }
});

// POST /api/invoices/:id/fail-processing - Mark processing as failed
router.post('/:id/fail-processing', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const { error } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.failProcessing(error);

    res.json({
      success: true,
      message: 'Invoice processing marked as failed',
      data: invoice
    });
  } catch (error) {
    console.error('Error marking invoice processing as failed:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking invoice processing as failed',
      error: error.message
    });
  }
});

// POST /api/invoices/:id/verify - Verify invoice
router.post('/:id/verify', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const { notes, confidenceLevel } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.verify(req.user?.id, notes, confidenceLevel);

    res.json({
      success: true,
      message: 'Invoice verified successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error verifying invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying invoice',
      error: error.message
    });
  }
});

// POST /api/invoices/:id/approve - Approve invoice
router.post('/:id/approve', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const { notes, approvalLevel } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.approve(req.user?.id, notes, approvalLevel);

    res.json({
      success: true,
      message: 'Invoice approved successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error approving invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving invoice',
      error: error.message
    });
  }
});

// POST /api/invoices/:id/reject - Reject invoice
router.post('/:id/reject', async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    const { reason } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.reject(req.user?.id, reason);

    res.json({
      success: true,
      message: 'Invoice rejected successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error rejecting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting invoice',
      error: error.message
    });
  }
});

// GET /api/invoices/analytics - Get invoice analytics
router.get('/analytics', InvoiceController.getAnalytics);

// POST /api/invoices/bulk-update - Bulk update invoices
router.post('/bulk-update', InvoiceController.bulkUpdate);

// POST /api/invoices/bulk-delete - Bulk delete invoices
router.post('/bulk-delete', InvoiceController.bulkDelete);

// GET /api/invoices/export - Export invoices
router.get('/export', InvoiceController.exportInvoices);

// GET /api/invoices/processing-queue - Get processing queue
router.get('/processing-queue', InvoiceController.getProcessingQueue);

// POST /api/invoices/validate - Validate invoice data
router.post('/validate', InvoiceController.validateInvoiceData);

module.exports = router;
