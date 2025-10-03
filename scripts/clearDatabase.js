import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Bus, Route, Schedule, Contact } from '../models/index.js';

dotenv.config();

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transport-system');
    console.log('Connected to MongoDB');

    console.log('Clearing all data from database...');
    
    // Clear all collections except admin user
    await Bus.deleteMany({});
    console.log('✓ Cleared all buses');
    
    await Route.deleteMany({});
    console.log('✓ Cleared all routes');
    
    await Schedule.deleteMany({});
    console.log('✓ Cleared all schedules');
    
    await Contact.deleteMany({});
    console.log('✓ Cleared all contacts');
    
    // Remove all users except admin
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('✓ Cleared all users (kept admin)');
    
    console.log('\n🎉 Database cleared successfully!');
    console.log('You can now add fresh data using the application.');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();