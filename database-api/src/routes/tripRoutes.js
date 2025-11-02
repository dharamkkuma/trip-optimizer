const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { validateObjectId } = require('../utils/validators');

// GET /api/trips - Get all trips with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      userId
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { status: 'active' };
    
    // Filter by user (from JWT token or query param) - skip if admin
    const currentUserId = req.user?.id || userId;
    const currentUserRole = req.user?.role;
    
    // Only filter by user if not admin
    if (currentUserId && currentUserRole !== 'admin') {
      query['travelers.userId'] = currentUserId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'destination.city': { $regex: search, $options: 'i' } },
        { 'destination.country': { $regex: search, $options: 'i' } }
      ];
    }

    const trips = await Trip.find(query)
      .populate('travelers.userId', 'firstName lastName email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: trips,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trips',
      error: error.message
    });
  }
});

// GET /api/trips/:id - Get single trip by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID'
      });
    }

    const trip = await Trip.findById(id)
      .populate('travelers.userId', 'firstName lastName email username')
      .populate('expenses');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trip',
      error: error.message
    });
  }
});

// POST /api/trips - Create new trip
router.post('/', async (req, res) => {
  try {
    const tripData = req.body;

    // Validate required fields
    if (!tripData.title || !tripData.destination || !tripData.dates || !tripData.budget || !tripData.travelers) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, destination, dates, budget, travelers'
      });
    }

    // Validate travelers array
    if (!Array.isArray(tripData.travelers) || tripData.travelers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one traveler is required'
      });
    }

    // Validate traveler IDs
    for (const traveler of tripData.travelers) {
      if (!validateObjectId(traveler.userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid traveler user ID'
        });
      }
    }

    const trip = new Trip(tripData);
    await trip.save();

    await trip.populate('travelers.userId', 'firstName lastName email username');

    res.status(201).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trip',
      error: error.message
    });
  }
});

// PUT /api/trips/:id - Update trip
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID'
      });
    }

    const trip = await Trip.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('travelers.userId', 'firstName lastName email username');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip',
      error: error.message
    });
  }
});

// PATCH /api/trips/:id - Partially update trip
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID'
      });
    }

    const trip = await Trip.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('travelers.userId', 'firstName lastName email username');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip',
      error: error.message
    });
  }
});

// DELETE /api/trips/:id - Soft delete trip
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID'
      });
    }

    const trip = await Trip.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting trip',
      error: error.message
    });
  }
});

// GET /api/trips/user/:userId - Get trips by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!validateObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const trips = await Trip.find({
      'travelers.userId': userId,
      status: 'active'
    })
      .populate('travelers.userId', 'firstName lastName email username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user trips',
      error: error.message
    });
  }
});

module.exports = router;
