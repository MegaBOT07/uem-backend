import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const demoUsers = [
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

const addDemoUsers = async () => {
	if (!process.env.MONGODB_URI) {
		console.error('❌ MONGODB_URI is not configured. Set it in your environment before running this script.');
		process.exit(1);
	}

	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		for (const userData of demoUsers) {
			const existingUser = await User.findOne({ email: userData.email });
			if (existingUser) {
				console.log(`ℹ️  Skipping existing user: ${userData.email}`);
				continue;
			}

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
			console.log(`✅ Created user: ${userData.username} (${userData.role})`);
		}

		console.log('\n🎉 Demo user setup complete!');
	} catch (error) {
		console.error('❌ Error creating demo users:', error);
	} finally {
		await mongoose.connection.close();
		console.log('🔌 Database connection closed');
		process.exit(0);
	}
};

addDemoUsers();
