import express from 'express';
import Schedule from '../models/Schedule.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper function to validate and sanitize schedule data
const validateScheduleData = (schedule) => {
  try {
    // Check if schedule has required fields
    if (!schedule || typeof schedule !== 'object') return false;
    
    // Debug: log the actual schedule object to see its structure
    console.log('Validating schedule object:', {
      _id: schedule._id,
      keys: Object.keys(schedule),
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      date: schedule.date,
      createdAt: schedule.createdAt
    });
    
    // Validate departure and arrival times (these are required)
    const depTime = new Date(schedule.departureTime);
    const arrTime = new Date(schedule.arrivalTime);
    
    const isValidDep = depTime && !isNaN(depTime.getTime());
    const isValidArr = arrTime && !isNaN(arrTime.getTime());
    
    if (!isValidDep || !isValidArr) {
      console.warn('Invalid departure/arrival times in schedule:', {
        id: schedule._id || schedule.id,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        valid: { dep: isValidDep, arr: isValidArr }
      });
      return false;
    }
    
    // For date validation, be more flexible - it might not exist or might be derived from departureTime
    let schedDate;
    if (schedule.date) {
      schedDate = new Date(schedule.date);
    } else {
      // If no explicit date, use the date from departureTime
      schedDate = new Date(schedule.departureTime);
    }
    
    const isValidDate = schedDate && !isNaN(schedDate.getTime());
    if (!isValidDate) {
      console.warn('Invalid date in schedule:', {
        id: schedule._id || schedule.id,
        date: schedule.date,
        departureTime: schedule.departureTime,
        extractedDate: schedDate
      });
      return false;
    }
    
    // Check logical date order
    if (arrTime <= depTime) {
      console.warn('Arrival time before departure time:', schedule._id || schedule.id);
      return false;
    }
    
    console.log('✓ Schedule validation passed:', schedule._id);
    return true;
  } catch (error) {
    console.warn('Error validating schedule:', schedule._id || schedule.id, error);
    return false;
  }
};

// Database-based schedule operations

// Get all schedules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, status, busId } = req.query;
    
    // Fetch schedules from database
    let query = {};
    if (date) query.date = new Date(date);
    if (status) query.status = status;
    if (busId) query.bus = busId;
    
    // Fetch schedules without population first to avoid cast errors
    const allSchedules = await Schedule.find(query)
      .sort({ departureTime: 1 });
    
    console.log(`Found ${allSchedules.length} schedules from database`);
    
    // Process schedules and add populated data where possible
    const processedSchedules = await Promise.all(allSchedules.map(async (schedule) => {
      const scheduleObj = schedule.toObject();
      
      // Try to populate bus if it's an ObjectId
      if (schedule.bus && typeof schedule.bus === 'string' && schedule.bus.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const bus = await Bus.findById(schedule.bus);
          if (bus) {
            scheduleObj.bus = { _id: bus._id, busNumber: bus.busNumber };
          }
        } catch (err) {
          console.warn('Could not populate bus:', schedule.bus);
        }
      }
      
      // Try to populate route if it's an ObjectId
      if (schedule.route && typeof schedule.route === 'string' && schedule.route.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const route = await Route.findById(schedule.route);
          if (route) {
            scheduleObj.route = { _id: route._id, name: route.name };
          }
        } catch (err) {
          console.warn('Could not populate route:', schedule.route);
        }
      }
      
      return scheduleObj;
    }));
    
    // Filter out invalid schedules
    const validSchedules = processedSchedules.filter(schedule => {
      const isValid = validateScheduleData(schedule);
      if (!isValid) {
        console.warn('Filtering out invalid schedule:', schedule._id);
      }
      return isValid;
    });
    
    console.log(`Returning ${validSchedules.length} valid schedules`);
    
    res.json({
      schedules: validSchedules,
      total: validSchedules.length,
      page: 1,
      pages: 1
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      schedules: [],
      total: 0,
      page: 1,
      pages: 1
    });
  }
});

// Get schedule by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Validate schedule before returning
    if (!validateScheduleData(schedule)) {
      return res.status(404).json({ error: 'Schedule data is invalid' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new schedule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      routeId,
      busId,
      departureTime,
      arrivalTime,
      date,
      frequency,
      status
    } = req.body;

    console.log('Creating schedule with data:', req.body);

    // Basic validation
    if (!routeId || !busId || !departureTime || !arrivalTime || !date) {
      console.log('Missing required fields:', { routeId, busId, departureTime, arrivalTime, date });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate bus exists (can be ObjectId or string)
    let bus;
    if (busId && busId.match && busId.match(/^[0-9a-fA-F]{24}$/)) {
      bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(400).json({ error: 'Invalid bus ID' });
      }
    }

    // Comprehensive date validation and parsing
    let depTime, arrTime, scheduleDate;
    try {
      // Validate input date
      scheduleDate = new Date(date);
      if (isNaN(scheduleDate.getTime())) {
        throw new Error('Invalid date provided');
      }
      
      // Handle different time formats with better validation
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      
      if (!timeRegex.test(departureTime)) {
        throw new Error('Invalid departure time format. Expected HH:MM');
      }
      if (!timeRegex.test(arrivalTime)) {
        throw new Error('Invalid arrival time format. Expected HH:MM');
      }
      
      const depTimeFormatted = `${departureTime}:00`;
      const arrTimeFormatted = `${arrivalTime}:00`;
      
      console.log('Creating date objects:', { 
        date,
        depTimeFormatted,
        arrTimeFormatted
      });
      
      depTime = new Date(`${date}T${depTimeFormatted}`);
      arrTime = new Date(`${date}T${arrTimeFormatted}`);
      
      console.log('Parsed times:', { depTime, arrTime });
      
      // Strict validation of created dates
      if (!depTime || !arrTime || isNaN(depTime.getTime()) || isNaN(arrTime.getTime())) {
        throw new Error('Failed to create valid date objects');
      }
      
      // Validate that arrival is after departure
      if (arrTime <= depTime) {
        throw new Error('Arrival time must be after departure time');
      }
      
      // Validate dates are reasonable (not too far in past/future)
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (scheduleDate < oneYearAgo || scheduleDate > oneYearFromNow) {
        throw new Error('Schedule date must be within one year of current date');
      }
      
    } catch (dateError) {
      console.error('Date validation/parsing error:', dateError);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date or time format', 
        details: dateError.message 
      });
    }

    // Create schedule with flexible route/bus handling
    const scheduleData = {
      route: routeId, // Can be ObjectId or string name
      bus: busId, // Can be ObjectId or string
      date: scheduleDate, // Add the validated date field
      departureTime: depTime,
      arrivalTime: arrTime,
      status: status || 'scheduled',
      passengers: {
        current: 0,
        boarded: 0,
        alighted: 0
      }
    };

    console.log('Schedule data to save:', scheduleData);
    console.log('Schedule date field type:', typeof scheduleData.date, scheduleData.date);

    const newSchedule = new Schedule(scheduleData);
    const savedSchedule = await newSchedule.save();

    console.log('Successfully created schedule:', savedSchedule);
    console.log('Saved schedule date field:', savedSchedule.date, typeof savedSchedule.date);
    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      console.error('Cast error:', error.message);
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Update schedule
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Update the schedule with new data
    Object.assign(schedule, req.body);
    const updatedSchedule = await schedule.save();

    res.json({
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationErrors
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete schedule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await Schedule.findByIdAndDelete(scheduleId);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's active schedules
router.get('/today/active', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySchedules = await Schedule.find({
      departureTime: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'scheduled'
    })
    .sort({ departureTime: 1 });

    // Filter valid schedules
    const validSchedules = todaySchedules.filter(validateScheduleData);

    res.json({
      schedules: validSchedules,
      total: validSchedules.length,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching today\'s schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get schedule statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const allSchedules = await Schedule.find({});
    
    // Filter valid schedules
    const validSchedules = allSchedules.filter(validateScheduleData);
    
    const totalSchedules = validSchedules.length;
    const scheduledStatus = validSchedules.filter(s => s.status === 'scheduled').length;
    const completedStatus = validSchedules.filter(s => s.status === 'completed').length;
    const cancelledStatus = validSchedules.filter(s => s.status === 'cancelled').length;
    
    // Get unique routes count
    const uniqueRoutes = [...new Set(validSchedules.map(s => 
      s.route?.name || s.routeId || s.route
    ))].length;
    
    // Get unique buses count
    const uniqueBuses = [...new Set(validSchedules.map(s => 
      s.bus?.busNumber || s.busId || s.bus
    ))].length;

    res.json({
      totalSchedules,
      scheduledStatus,
      completedStatus,
      cancelledStatus,
      uniqueRoutes,
      uniqueBuses,
      operationalRate: totalSchedules > 0 ? Math.round((scheduledStatus / totalSchedules) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      totalSchedules: 0,
      scheduledStatus: 0,
      completedStatus: 0,
      cancelledStatus: 0,
      uniqueRoutes: 0,
      uniqueBuses: 0,
      operationalRate: 0
    });
  }
});

export default router;