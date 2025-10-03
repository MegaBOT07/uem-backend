import express from 'express';
import { authenticateToken } from './auth.js';
import { Bus, Route, Schedule, Contact } from '../models/index.js';

const router = express.Router();

// Get real dashboard stats from database
const getDashboardStats = async () => {
  try {
    // Get actual bus counts
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });
    const blockedBuses = await Bus.countDocuments({ status: 'blocked' });
    
    // Get route count
    const totalRoutes = await Route.countDocuments();
    
    // Get schedule count
    const totalSchedules = await Schedule.countDocuments();
    
    // Get contact count
    const totalContacts = await Contact.countDocuments();

    return {
      overview: {
        totalFleet: totalBuses,
        activeVehicles: activeBuses,
        totalRoutes: totalRoutes,
        dailyPassengers: 0, // Will be calculated when passenger data exists
        revenue: {
          today: 0,
          thisMonth: 0,
          currency: 'INR'
        },
        efficiency: totalBuses > 0 ? Math.round((activeBuses / totalBuses) * 100) : 0
      },
      fleetStatus: {
        active: activeBuses,
        maintenance: maintenanceBuses,
        outOfService: blockedBuses,
        idle: Math.max(0, totalBuses - activeBuses - maintenanceBuses - blockedBuses)
      },
      recentAlerts: [], // No alerts when system is clean
      performanceMetrics: {
        onTimePerformance: 0,
        customerSatisfaction: 0,
        fuelEfficiency: 0,
        averageSpeed: 0,
        maintenanceCosts: {
          thisMonth: 0,
          lastMonth: 0,
          trend: 'stable'
        }
      },
      routePerformance: [], // No route performance when no routes exist
      weeklyTrends: {
        passengers: [0, 0, 0, 0, 0, 0, 0],
        revenue: [0, 0, 0, 0, 0, 0, 0],
        efficiency: [0, 0, 0, 0, 0, 0, 0],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    // Return empty stats if database query fails
    return {
      overview: {
        totalFleet: 0,
        activeVehicles: 0,
        totalRoutes: 0,
        dailyPassengers: 0,
        revenue: { today: 0, thisMonth: 0, currency: 'INR' },
        efficiency: 0
      },
      fleetStatus: { active: 0, maintenance: 0, outOfService: 0, idle: 0 },
      recentAlerts: [],
      performanceMetrics: {
        onTimePerformance: 0,
        customerSatisfaction: 0,
        fuelEfficiency: 0,
        averageSpeed: 0,
        maintenanceCosts: { thisMonth: 0, lastMonth: 0, trend: 'stable' }
      },
      routePerformance: [],
      weeklyTrends: {
        passengers: [0, 0, 0, 0, 0, 0, 0],
        revenue: [0, 0, 0, 0, 0, 0, 0],
        efficiency: [0, 0, 0, 0, 0, 0, 0],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }
    };
  }
};

// Get complete dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats.overview);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get fleet status summary
router.get('/fleet-status', authenticateToken, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats.fleetStatus);
  } catch (error) {
    console.error('Error fetching fleet status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, severity } = req.query;
    const stats = await getDashboardStats();
    let alerts = stats.recentAlerts;

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    alerts = alerts.slice(0, parseInt(limit));

    res.json({
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get performance metrics
router.get('/performance', authenticateToken, (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json(stats.performanceMetrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get route performance
router.get('/routes/performance', authenticateToken, (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json({
      routes: stats.routePerformance,
      total: stats.routePerformance.length
    });
  } catch (error) {
    console.error('Error fetching route performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weekly trends
router.get('/trends/weekly', authenticateToken, (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json(stats.weeklyTrends);
  } catch (error) {
    console.error('Error fetching weekly trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get complete dashboard data
router.get('/complete', authenticateToken, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error fetching complete dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update alert status (mark as read/resolved)
router.patch('/alerts/:id', authenticateToken, (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const { status } = req.body;

    // In a real application, you would update the alert in the database
    res.json({
      message: `Alert ${alertId} marked as ${status}`,
      alertId,
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;