import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../models/Contact.js';

dotenv.config();

const testContact = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transport-system');
    console.log('Connected to MongoDB');

    // Create a test contact
    const testContactData = new Contact({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+91-9876543210',
      subject: 'Test Contact Inquiry',
      message: 'This is a test contact message to verify database functionality.',
      category: 'inquiry',
      priority: 'medium'
    });

    await testContactData.save();
    console.log('✅ Test contact created successfully');

    // Fetch all contacts
    const allContacts = await Contact.find();
    console.log(`📊 Total contacts in database: ${allContacts.length}`);
    
    if (allContacts.length > 0) {
      console.log('Latest contact:', {
        name: allContacts[allContacts.length - 1].name,
        email: allContacts[allContacts.length - 1].email,
        subject: allContacts[allContacts.length - 1].subject,
        createdAt: allContacts[allContacts.length - 1].createdAt
      });
    }

  } catch (error) {
    console.error('Error testing contact:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testContact();