import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const createUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://mohitlalwani1907:Cnxd0tFRmKO6mTOE@cluster0.tzkp3vg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Demo users data
    const users = [
      {
        username: 'admin',
        email: 'admin@uem.edu.in',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        phone: '+91-9876543210'
      },
      {
        username: 'coadmin',
        email: 'coadmin@uem.edu.in',
        password: 'coadmin123',
        firstName: 'Co',
        lastName: 'Administrator',
        role: 'co-admin',
        phone: '+91-9876543211'
      },
      {
        username: 'viewer',
        email: 'viewer@uem.edu.in',
        password: 'viewer123',
        firstName: 'System',
        lastName: 'Viewer',
        role: 'viewer',
        phone: '+91-9876543212'
      },
      {
        username: 'driver1',
        email: 'driver1@uem.edu.in',
        password: 'driver123',
        firstName: 'John',
        lastName: 'Driver',
        role: 'driver',
        phone: '+91-9876543213'
      }
    ];

    // Create users
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        isActive: true
      });

      await user.save();
      console.log(`✅ Created user: ${userData.username} (${userData.email}) - Role: ${userData.role}`);
    }

    console.log('\n🎉 All users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@uem.edu.in / admin123');
    console.log('Co-Admin: coadmin@uem.edu.in / coadmin123');
    console.log('Viewer: viewer@uem.edu.in / viewer123');
    console.log('Driver: driver1@uem.edu.in / driver123');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createUsers();