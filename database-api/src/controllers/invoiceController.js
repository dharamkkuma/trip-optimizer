const Invoice = require('../models/Invoice');
const { validateObjectId } = require('../utils/validators');

class InvoiceController {
  // Get invoice analytics and insights
  static async getAnalytics(req, res) {
    try {
      const { tripId, dateFrom, dateTo } = req.query;
      
      const matchStage = { status: 'active' };
      if (tripId) matchStage.tripId = validateObjectId(tripId) ? tripId : null;
      if (dateFrom || dateTo) {
        matchStage.invoiceDate = {};
        if (dateFrom) matchStage.invoiceDate.$gte = new Date(dateFrom);
        if (dateTo) matchStage.invoiceDate.$lte = new Date(dateTo);
      }

      const analytics = await Invoice.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalAmount: { $sum: '$parsedData.financial.totalAmount' },
            averageAmount: { $avg: '$parsedData.financial.totalAmount' },
            minAmount: { $min: '$parsedData.financial.totalAmount' },
            maxAmount: { $max: '$parsedData.financial.totalAmount' },
            processingTime: { $avg: '$processingMetadata.processingTime' },
            confidenceScore: { $avg: '$processingMetadata.confidenceScore' }
          }
        }
      ]);

      // Get processing efficiency metrics
      const processingMetrics = await Invoice.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 },
            avgProcessingTime: { $avg: '$processingMetadata.processingTime' },
            avgConfidenceScore: { $avg: '$processingMetadata.confidenceScore' }
          }
        }
      ]);

      // Get monthly trends
      const monthlyTrends = await Invoice.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$invoiceDate' },
              month: { $month: '$invoiceDate' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$parsedData.financial.totalAmount' },
            avgAmount: { $avg: '$parsedData.financial.totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]);

      res.json({
        success: true,
        data: {
          overview: analytics[0] || {},
          processingMetrics,
          monthlyTrends,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error fetching invoice analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching invoice analytics',
        error: error.message
      });
    }
  }

  // Bulk operations
  static async bulkUpdate(req, res) {
    try {
      const { invoiceIds, updates } = req.body;

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invoice IDs array is required'
        });
      }

      // Validate all IDs
      const validIds = invoiceIds.filter(id => validateObjectId(id));
      if (validIds.length !== invoiceIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some invoice IDs are invalid'
        });
      }

      const result = await Invoice.updateMany(
        { _id: { $in: validIds } },
        { 
          ...updates,
          updatedBy: req.user?.id || null,
          updatedAt: new Date()
        }
      );

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} invoices`,
        data: {
          matched: result.matchedCount,
          modified: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error bulk updating invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk updating invoices',
        error: error.message
      });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { invoiceIds } = req.body;

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invoice IDs array is required'
        });
      }

      // Validate all IDs
      const validIds = invoiceIds.filter(id => validateObjectId(id));
      if (validIds.length !== invoiceIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some invoice IDs are invalid'
        });
      }

      const result = await Invoice.updateMany(
        { _id: { $in: validIds } },
        { 
          status: 'archived',
          updatedBy: req.user?.id || null,
          updatedAt: new Date()
        }
      );

      res.json({
        success: true,
        message: `Deleted ${result.modifiedCount} invoices`,
        data: {
          matched: result.matchedCount,
          modified: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk deleting invoices',
        error: error.message
      });
    }
  }

  // Export invoices
  static async exportInvoices(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;

      // Build filter object (similar to GET /invoices)
      const filter = { status: 'active' };
      if (filters.status) filter.status = filters.status;
      if (filters.documentStatus) filter.documentStatus = filters.documentStatus;
      if (filters.tripId) filter.tripId = filters.tripId;
      if (filters.category) filter.category = filters.category;

      const invoices = await Invoice.find(filter)
        .populate('tripId', 'title destination dates')
        .populate('expenseId', 'title amount')
        .populate('createdBy', 'name email')
        .populate('verifiedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = invoices.map(invoice => ({
          'Invoice Number': invoice.invoiceNumber,
          'Invoice Date': invoice.invoiceDate,
          'Due Date': invoice.dueDate,
          'Vendor': invoice.parsedData?.vendor?.name || '',
          'Customer': invoice.parsedData?.customer?.name || '',
          'Total Amount': invoice.parsedData?.financial?.totalAmount || 0,
          'Currency': invoice.parsedData?.financial?.currency || 'USD',
          'Status': invoice.documentStatus,
          'Processing Status': invoice.processingStatus,
          'Category': invoice.category,
          'Trip': invoice.tripId?.title || '',
          'Created At': invoice.createdAt
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
        
        // Simple CSV conversion
        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        res.send(csvContent);
      } else {
        res.json({
          success: true,
          data: invoices,
          exportedAt: new Date(),
          totalCount: invoices.length
        });
      }
    } catch (error) {
      console.error('Error exporting invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting invoices',
        error: error.message
      });
    }
  }

  // Get processing queue status
  static async getProcessingQueue(req, res) {
    try {
      const queue = await Invoice.find({
        processingStatus: { $in: ['pending', 'in_progress', 'retry'] },
        status: 'active'
      })
        .populate('tripId', 'title destination')
        .populate('createdBy', 'name email')
        .sort({ createdAt: 1 });

      const queueStats = await Invoice.aggregate([
        { $match: { processingStatus: { $in: ['pending', 'in_progress', 'retry'] }, status: 'active' } },
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 },
            avgWaitTime: { $avg: { $subtract: [new Date(), '$createdAt'] } }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          queue,
          stats: queueStats,
          totalInQueue: queue.length
        }
      });
    } catch (error) {
      console.error('Error fetching processing queue:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching processing queue',
        error: error.message
      });
    }
  }

  // Validate invoice data
  static async validateInvoiceData(req, res) {
    try {
      const { parsedData } = req.body;

      if (!parsedData) {
        return res.status(400).json({
          success: false,
          message: 'Parsed data is required'
        });
      }

      const validationResults = {
        isValid: true,
        errors: [],
        warnings: [],
        confidenceScore: 0
      };

      // Required field validation
      if (!parsedData.financial?.totalAmount) {
        validationResults.errors.push('Missing required field: financial.totalAmount');
        validationResults.isValid = false;
      }
      
      if (!parsedData.vendor?.name) {
        validationResults.errors.push('Missing required field: vendor.name');
        validationResults.isValid = false;
      }
      
      if (!parsedData.customer?.name) {
        validationResults.errors.push('Missing required field: customer.name');
        validationResults.isValid = false;
      }

      // Amount validation
      if (parsedData.financial?.totalAmount) {
        const amount = parseFloat(parsedData.financial.totalAmount);
        if (isNaN(amount) || amount <= 0) {
          validationResults.errors.push('Invalid total amount');
          validationResults.isValid = false;
        }
      }

      // Date validation
      if (parsedData.invoiceDate) {
        const invoiceDate = new Date(parsedData.invoiceDate);
        if (isNaN(invoiceDate.getTime())) {
          validationResults.errors.push('Invalid invoice date');
          validationResults.isValid = false;
        }
      }

      // Line items validation
      if (parsedData.lineItems && Array.isArray(parsedData.lineItems)) {
        parsedData.lineItems.forEach((item, index) => {
          if (!item.description) {
            validationResults.warnings.push(`Line item ${index + 1} missing description`);
          }
          if (!item.unitPrice || isNaN(parseFloat(item.unitPrice))) {
            validationResults.errors.push(`Line item ${index + 1} has invalid unit price`);
            validationResults.isValid = false;
          }
        });
      }

      // Calculate confidence score
      let confidenceScore = 100;
      confidenceScore -= validationResults.errors.length * 20;
      confidenceScore -= validationResults.warnings.length * 5;
      validationResults.confidenceScore = Math.max(0, confidenceScore);

      res.json({
        success: true,
        data: validationResults
      });
    } catch (error) {
      console.error('Error validating invoice data:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating invoice data',
        error: error.message
      });
    }
  }
}

module.exports = InvoiceController;
