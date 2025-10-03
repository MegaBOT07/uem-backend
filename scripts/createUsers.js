import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const createUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transport-system');
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@uem.edu.in' });
    const existingCoAdmin = await User.findOne({ email: 'coadmin@uem.edu.in' });
    const existingViewer = await User.findOne({ email: 'viewer@uem.edu.in' });

    let usersCreated = 0;

    // Create Admin user if doesn't exist
    if (!existingAdmin) {
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
      console.log('✅ Admin user created');
      usersCreated++;
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create Co-Admin user if doesn't exist
    if (!existingCoAdmin) {
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
      console.log('✅ Co-Admin user created');
      usersCreated++;
    } else {
      console.log('ℹ️  Co-Admin user already exists');
    }

    // Create Viewer user if doesn't exist
    if (!existingViewer) {
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
      console.log('✅ Viewer user created');
      usersCreated++;
    } else {
      console.log('ℹ️  Viewer user already exists');
    }

    console.log(`\n🎯 User creation completed!`);
    console.log(`📊 ${usersCreated} new users created`);
    
    if (usersCreated > 0) {
      console.log('\n=== Login Credentials ===');
      console.log('Admin: admin@uem.edu.in | Password: admin123');
      console.log('Co-Admin: coadmin@uem.edu.in | Password: coadmin123');
      console.log('Viewer: viewer@uem.edu.in | Password: viewer123');
    }

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createUsers();