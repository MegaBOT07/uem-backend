import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Bus, Route, Schedule, Contact } from '../models/index.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transport-system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Bus.deleteMany({});
    await Route.deleteMany({});
    await Schedule.deleteMany({});
    await Contact.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users (matching frontend credentials)
    
    // Admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@uem.edu.in',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      phone: '+91-9876543210'
    });
    await adminUser.save();

    // Co-Admin user
    const coAdminPassword = await bcrypt.hash('coadmin123', 12);
    const coAdminUser = new User({
      username: 'coadmin',
      email: 'coadmin@uem.edu.in',
      password: coAdminPassword,
      firstName: 'Co',
      lastName: 'Administrator',
      role: 'co-admin',
      phone: '+91-9876543211'
    });
    await coAdminUser.save();

    // Viewer user
    const viewerPassword = await bcrypt.hash('viewer123', 12);
    const viewerUser = new User({
      username: 'viewer',
      email: 'viewer@uem.edu.in',
      password: viewerPassword,
      firstName: 'System',
      lastName: 'Viewer',
      role: 'viewer',
      phone: '+91-9876543212'
    });
    await viewerUser.save();

    // Create routes
    const route1 = new Route({
      routeNumber: 'R001',
      name: 'City Center - Airport',
      startLocation: 'City Center Bus Terminal',
      endLocation: 'International Airport',
      distance: 25.5,
      estimatedDuration: 45,
      operatingHours: {
        start: '05:30',
        end: '23:30'
      },
      frequency: 15,
      fare: 3.50,
      stops: [
        {
          name: 'City Center Bus Terminal',
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          estimatedTime: 0,
          order: 1
        },
        {
          name: 'Downtown Plaza',
          coordinates: { latitude: 40.7589, longitude: -73.9851 },
          estimatedTime: 10,
          order: 2
        },
        {
          name: 'University Campus',
          coordinates: { latitude: 40.7282, longitude: -73.7949 },
          estimatedTime: 25,
          order: 3
        },
        {
          name: 'International Airport',
          coordinates: { latitude: 40.6413, longitude: -73.7781 },
          estimatedTime: 45,
          order: 4
        }
      ]
    });
    await route1.save();

    const route2 = new Route({
      routeNumber: 'R002',
      name: 'Residential - Business District',
      startLocation: 'Sunset Residential Area',
      endLocation: 'Business District Center',
      distance: 18.2,
      estimatedDuration: 35,
      operatingHours: {
        start: '06:00',
        end: '22:00'
      },
      frequency: 20,
      fare: 2.75,
      stops: [
        {
          name: 'Sunset Residential Area',
          coordinates: { latitude: 40.7505, longitude: -73.9934 },
          estimatedTime: 0,
          order: 1
        },
        {
          name: 'Metro Shopping Center',
          coordinates: { latitude: 40.7614, longitude: -73.9776 },
          estimatedTime: 12,
          order: 2
        },
        {
          name: 'Central Park East',
          coordinates: { latitude: 40.7829, longitude: -73.9654 },
          estimatedTime: 20,
          order: 3
        },
        {
          name: 'Business District Center',
          coordinates: { latitude: 40.7912, longitude: -73.9441 },
          estimatedTime: 35,
          order: 4
        }
      ]
    });
    await route2.save();

    // Create buses
    const bus1 = new Bus({
      busNumber: 'BUS-001',
      capacity: 50,
      type: 'standard',
      model: 'Mercedes Citaro',
      year: 2020,
      licensePlate: 'TC-001',
      fuelType: 'diesel',
      route: route1._id,
      mileage: 45000,
      features: ['Air Conditioning', 'WiFi', 'USB Charging'],
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await bus1.save();

    const bus2 = new Bus({
      busNumber: 'BUS-002',
      capacity: 45,
      type: 'luxury',
      model: 'Volvo 7900',
      year: 2021,
      licensePlate: 'TC-002',
      fuelType: 'electric',
      route: route2._id,
      mileage: 28000,
      features: ['Air Conditioning', 'WiFi', 'USB Charging', 'Leather Seats'],
      nextMaintenance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    });
    await bus2.save();

    const bus3 = new Bus({
      busNumber: 'BUS-003',
      capacity: 55,
      type: 'standard',
      status: 'maintenance',
      model: 'MAN Lions City',
      year: 2019,
      licensePlate: 'TC-003',
      fuelType: 'hybrid',
      mileage: 62000,
      features: ['Air Conditioning', 'Low Floor'],
      lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    });
    await bus3.save();

    // Create sample schedules
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 30, 0, 0);

    const schedule1 = new Schedule({
      route: route1._id,
      bus: bus1._id,
      departureTime: new Date(tomorrow),
      arrivalTime: new Date(tomorrow.getTime() + 45 * 60 * 1000) // 45 minutes later
    });
    await schedule1.save();

    const schedule2 = new Schedule({
      route: route2._id,
      bus: bus2._id,
      departureTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      arrivalTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000 + 35 * 60 * 1000) // 35 minutes duration
    });
    await schedule2.save();

    // Create sample customer inquiries
    const inquiry1 = new Contact({
      name: 'Alice Johnson',
      email: 'alice.j@email.com',
      phone: '+1-555-1001',
      subject: 'Bus Route Inquiry',
      message: 'I would like to know more about the route to the airport and the schedule.',
      category: 'inquiry',
      relatedRoute: route1._id
    });
    await inquiry1.save();

    const inquiry2 = new Contact({
      name: 'Bob Wilson',
      email: 'bob.w@email.com',
      subject: 'Lost Item',
      message: 'I left my backpack on the bus yesterday evening. Bus number was BUS-002.',
      category: 'lost-found',
      priority: 'high',
      relatedBus: bus2._id
    });
    await inquiry2.save();

    console.log('Database seeded successfully!');
    console.log('Demo User Credentials:');
    console.log('Admin: admin@uem.edu.in | Password: admin123');
    console.log('Co-Admin: coadmin@uem.edu.in | Password: coadmin123');
    console.log('Viewer: viewer@uem.edu.in | Password: viewer123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedDatabase();