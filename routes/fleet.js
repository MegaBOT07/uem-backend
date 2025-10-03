import express from 'express';
import { authenticateToken } from './auth.js';
import { Bus, Route, User } from '../models/index.js';

const router = express.Router();

// Get all buses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, route, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (route) {
      query.route = route;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const buses = await Bus.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    console.log('Backend: Found buses:', buses.length);
    buses.forEach((bus, index) => {
      console.log(`Backend: Bus ${index}:`, {
        _id: bus._id,
        id: bus.id,
        busNumber: bus.busNumber,
        driver: bus.driver,
        route: bus.route
      });
    });

    // For now, return buses without populate to debug the ID issue
    // TODO: Re-add populate logic after fixing ID issue

    const total = await Bus.countDocuments(query);

    res.json({
      buses,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bus by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let bus = await Bus.findById(req.params.id);
    
    // Try to populate if the fields are ObjectIds
    if (bus) {
      try {
        if (bus.driver && typeof bus.driver === 'object' && bus.driver.toString().match(/^[0-9a-fA-F]{24}$/)) {
          await bus.populate('driver', 'firstName lastName username email phone');
        }
        if (bus.route && typeof bus.route === 'object' && bus.route.toString().match(/^[0-9a-fA-F]{24}$/)) {
          await bus.populate('route', 'routeNumber name startLocation endLocation');
        }
      } catch (e) {
        // Populate failed, but that's okay - we'll use the string values
      }
    }

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json(bus);
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new bus
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      busNumber,
      model,
      capacity,
      type,
      driver,
      route,
      year,
      licensePlate,
      fuelType,
      mileage,
      features
    } = req.body;

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ error: 'Bus number already exists' });
    }

    // Validate driver if provided (can be ObjectId or string)
    if (driver) {
      if (driver.match(/^[0-9a-fA-F]{24}$/)) {
        const driverExists = await User.findById(driver);
        if (!driverExists) {
          return res.status(400).json({ error: 'Invalid driver ID' });
        }
      }
      // If not ObjectId format, treat as string name (which is valid)
    }

    // Validate route if provided (can be ObjectId or string)
    if (route) {
      if (route.match(/^[0-9a-fA-F]{24}$/)) {
        const routeExists = await Route.findById(route);
        if (!routeExists) {
          return res.status(400).json({ error: 'Invalid route ID' });
        }
      }
      // If not ObjectId format, treat as string name (which is valid)
    }

    const newBus = new Bus({
      busNumber,
      model,
      capacity,
      type,
      driver,
      route,
      year,
      licensePlate,
      fuelType,
      mileage: mileage || 0,
      features: features || [],
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    await newBus.save();

    await newBus.populate('driver', 'firstName lastName username');
    await newBus.populate('route', 'routeNumber name');

    res.status(201).json({
      message: 'Bus created successfully',
      bus: newBus
    });
  } catch (error) {
    console.error('Error creating bus:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bus
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { driver, route, busNumber, ...updateData } = req.body;

    // Check if bus number is being changed and already exists
    if (busNumber) {
      const existingBus = await Bus.findOne({ 
        busNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingBus) {
        return res.status(400).json({ error: 'Bus number already exists' });
      }
      updateData.busNumber = busNumber;
    }

    // Handle driver - can be ObjectId or string name
    if (driver !== undefined) {
      if (driver) {
        // Check if it's a valid ObjectId format
        if (driver.match(/^[0-9a-fA-F]{24}$/)) {
          const driverExists = await User.findById(driver);
          if (!driverExists) {
            return res.status(400).json({ error: 'Invalid driver ID' });
          }
          updateData.driver = driver;
        } else {
          // It's a string name, store as is for now
          updateData.driver = driver;
        }
      } else {
        // Empty string or null - clear the driver
        updateData.driver = null;
      }
    }

    // Handle route - can be ObjectId or string name
    if (route !== undefined) {
      if (route) {
        // Check if it's a valid ObjectId format
        if (route.match(/^[0-9a-fA-F]{24}$/)) {
          const routeExists = await Route.findById(route);
          if (!routeExists) {
            return res.status(400).json({ error: 'Invalid route ID' });
          }
          updateData.route = route;
        } else {
          // It's a string name, store as is for now
          updateData.route = route;
        }
      } else {
        // Empty string or null - clear the route
        updateData.route = null;
      }
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Try to populate if the fields are ObjectIds, otherwise they'll remain as strings
    try {
      await updatedBus.populate('driver', 'firstName lastName username');
    } catch (e) {
      // If populate fails, driver is likely a string, which is fine
    }
    
    try {
      await updatedBus.populate('route', 'routeNumber name');
    } catch (e) {
      // If populate fails, route is likely a string, which is fine
    }

    if (!updatedBus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json(updatedBus);
  } catch (error) {
    console.error('Error updating bus:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete bus
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedBus = await Bus.findByIdAndDelete(req.params.id);

    if (!deletedBus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json({ 
      message: 'Bus deleted successfully',
      deletedBus: {
        id: deletedBus._id,
        busNumber: deletedBus.busNumber
      }
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get fleet statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });
    const outOfServiceBuses = await Bus.countDocuments({ status: 'out-of-service' });
    
    // Get capacity and mileage stats
    const busStats = await Bus.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          averageMileage: { $avg: '$mileage' },
          totalMileage: { $sum: '$mileage' }
        }
      }
    ]);

    // Count buses by type
    const busByType = await Bus.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = busStats[0] || { totalCapacity: 0, averageMileage: 0, totalMileage: 0 };

    res.json({
      totalBuses,
      activeBuses,
      maintenanceBuses,
      outOfServiceBuses,
      totalCapacity: stats.totalCapacity,
      averageMileage: Math.round(stats.averageMileage || 0),
      totalMileage: stats.totalMileage,
      utilizationRate: totalBuses > 0 ? Math.round((activeBuses / totalBuses) * 100) : 0,
      busByType: busByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;