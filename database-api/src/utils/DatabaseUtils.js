const mongoose = require('mongoose');

// Database utility functions
class DatabaseUtils {
  // Generic CRUD operations
  static async create(Model, data) {
    try {
      const document = new Model(data);
      await document.save();
      return { success: true, data: document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findById(Model, id, populate = []) {
    try {
      let query = Model.findById(id);
      populate.forEach(field => {
        query = query.populate(field);
      });
      const document = await query;
      return { success: true, data: document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async find(Model, filter = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        populate = [],
        select = ''
      } = options;

      const skip = (page - 1) * limit;

      let query = Model.find(filter);
      
      if (select) query = query.select(select);
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      
      const documents = await query
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Model.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateById(Model, id, updateData, options = {}) {
    try {
      const document = await Model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true, ...options }
      );
      return { success: true, data: document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async deleteById(Model, id) {
    try {
      const document = await Model.findByIdAndDelete(id);
      return { success: true, data: document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Search functionality
  static async search(Model, searchTerm, searchFields = [], options = {}) {
    try {
      const searchQuery = {
        $or: searchFields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' }
        }))
      };

      return await this.find(Model, searchQuery, options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Aggregation helpers
  static async aggregate(Model, pipeline) {
    try {
      const result = await Model.aggregate(pipeline);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Bulk operations
  static async bulkCreate(Model, documents) {
    try {
      const result = await Model.insertMany(documents);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async bulkUpdate(Model, filter, updateData) {
    try {
      const result = await Model.updateMany(filter, updateData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async bulkDelete(Model, filter) {
    try {
      const result = await Model.deleteMany(filter);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Database health check
  static async healthCheck() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        success: state === 1,
        status: states[state] || 'unknown',
        connected: state === 1
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Transaction support
  static async withTransaction(callback) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(callback);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      await session.endSession();
    }
  }
}

module.exports = DatabaseUtils;
