import express from 'express';
import { authenticateToken } from './auth.js';
import { body, validationResult } from 'express-validator';
import Contact from '../models/Contact.js';

const router = express.Router();

// Get all contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { department, status, search } = req.query;
    let filter = {};

    if (department) {
      filter.department = new RegExp(department, 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { position: searchRegex }
      ];
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });

    res.json({
      contacts: contacts,
      total: contacts.length
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contact by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('relatedRoute', 'name routeNumber')
      .populate('relatedBus', 'busNumber')
      .populate('assignedTo', 'firstName lastName email')
      .populate('response.respondedBy', 'firstName lastName');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contact
router.post('/', [
  authenticateToken,
  body('name').isLength({ min: 2 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('subject').optional().isLength({ min: 2 }).trim(),
  body('message').optional().isLength({ min: 10 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      subject,
      message,
      category,
      priority,
      relatedRoute,
      relatedBus,
      department,
      position,
      role
    } = req.body;

    // Check if email already exists for active contacts
    const existingContact = await Contact.findOne({ email: email, status: { $ne: 'closed' } });
    if (existingContact) {
      return res.status(400).json({ error: 'Active contact with this email already exists' });
    }

    const newContact = new Contact({
      name,
      email,
      phone,
      subject: subject || `${role || position || department || 'Staff'} Contact`,
      message: message || `Contact information for ${name}`,
      category: category || 'inquiry',
      priority: priority || 'medium',
      status: 'new',
      relatedRoute: relatedRoute || null,
      relatedBus: relatedBus || null,
      department: department || null,
      position: position || null,
      role: role || null
    });

    await newContact.save();

    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contact
router.put('/:id', [
  authenticateToken,
  body('name').optional().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('subject').optional().isLength({ min: 2 }).trim(),
  body('message').optional().isLength({ min: 10 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if email already exists (excluding current contact)
    if (req.body.email) {
      const existingContact = await Contact.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.params.id },
        status: { $ne: 'closed' }
      });
      if (existingContact) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      message: 'Contact updated successfully',
      contact: updatedContact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);

    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contacts by category
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const category = req.params.category;
    const categoryContacts = await Contact.find({ category: category }).sort({ createdAt: -1 });

    res.json({
      category,
      contacts: categoryContacts,
      total: categoryContacts.length
    });
  } catch (error) {
    console.error('Error fetching category contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get urgent contacts
router.get('/urgent/all', authenticateToken, async (req, res) => {
  try {
    const urgentContacts = await Contact.find({ 
      priority: { $in: ['high', 'urgent'] },
      status: { $ne: 'closed' }
    })
    .populate('relatedRoute', 'name routeNumber')
    .populate('relatedBus', 'busNumber')
    .sort({ createdAt: -1 });

    res.json({
      urgentContacts,
      total: urgentContacts.length
    });
  } catch (error) {
    console.error('Error fetching urgent contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contact statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    const inProgressContacts = await Contact.countDocuments({ status: 'in-progress' });
    const resolvedContacts = await Contact.countDocuments({ status: 'resolved' });
    const closedContacts = await Contact.countDocuments({ status: 'closed' });
    
    const categoryStats = await Contact.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const priorityStats = await Contact.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalContacts,
      statusBreakdown: {
        new: newContacts,
        inProgress: inProgressContacts,
        resolved: resolvedContacts,
        closed: closedContacts
      },
      categoryBreakdown: categoryStats,
      priorityBreakdown: priorityStats
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;