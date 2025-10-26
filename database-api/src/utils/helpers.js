const fs = require('fs');
const path = require('path');

// Logger utility class
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (process.env.NODE_ENV === 'development') {
      return JSON.stringify(logEntry, null, 2);
    }

    return JSON.stringify(logEntry);
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

// Create logger instance
const logger = new Logger();

// Response utility functions
class ResponseUtils {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    logger.error(message, { statusCode, errors });
    return res.status(statusCode).json(response);
  }

  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, errors);
  }

  static notFound(res, resource = 'Resource') {
    return this.error(res, `${resource} not found`, 404);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static conflict(res, message = 'Conflict') {
    return this.error(res, message, 409);
  }
}

// Error handling utility
class ErrorHandler {
  static handle(error, req, res, next) {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return ResponseUtils.validationError(res, errors);
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return ResponseUtils.conflict(res, `${field} already exists`);
    }

    // Mongoose cast error
    if (error.name === 'CastError') {
      return ResponseUtils.error(res, 'Invalid ID format', 400);
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return ResponseUtils.unauthorized(res, 'Invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      return ResponseUtils.unauthorized(res, 'Token expired');
    }

    // Default error
    return ResponseUtils.error(res, error.message || 'Internal Server Error', error.status || 500);
  }
}

// File utility functions
class FileUtils {
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      logger.error('Failed to create directory', { dirPath, error: error.message });
      return false;
    }
  }

  static async readFile(filePath) {
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to read file', { filePath, error: error.message });
      return { success: false, error: error.message };
    }
  }

  static async writeFile(filePath, data) {
    try {
      await fs.promises.writeFile(filePath, data, 'utf8');
      return { success: true };
    } catch (error) {
      logger.error('Failed to write file', { filePath, error: error.message });
      return { success: false, error: error.message };
    }
  }

  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  static isValidImageExtension(extension) {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validExtensions.includes(extension);
  }

  static isValidDocumentExtension(extension) {
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    return validExtensions.includes(extension);
  }
}

// Date utility functions
class DateUtils {
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return d.toISOString();
    }
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  static isDateInRange(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  }

  static getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// String utility functions
class StringUtils {
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static slugify(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncate(str, length, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  static generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : local;
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone) {
    if (!phone) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return phone.replace(/\d(?=\d{4})/g, '*');
  }
}

module.exports = {
  logger,
  ResponseUtils,
  ErrorHandler,
  FileUtils,
  DateUtils,
  StringUtils
};
