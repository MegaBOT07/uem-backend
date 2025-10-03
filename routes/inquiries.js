import express from 'express';
import { authenticateToken } from './auth.js';
import { body, validationResult } from 'express-validator';
import { Contact, Bus, Route, User } from '../models/index.js';

const router = express.Router();

// Submit customer inquiry (public endpoint)
router.post('/inquiry', [
  body('name').isLength({ min: 1 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('subject').isLength({ min: 1 }).trim().escape(),
  body('message').isLength({ min: 10, max: 1000 }).trim().escape(),
  body('category').optional().isIn(['complaint', 'suggestion', 'inquiry', 'compliment', 'lost-found', 'other']),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, subject, message, category = 'inquiry', relatedRoute, relatedBus } = req.body;

    const newInquiry = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      category,
      relatedRoute,
      relatedBus
    });

    await newInquiry.save();

    res.status(201).json({
      message: 'Your inquiry has been submitted successfully. We will get back to you soon.',
      inquiryId: newInquiry._id
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all customer inquiries (admin only)
router.get('/inquiries', authenticateToken, async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const inquiries = await Contact.find(query)
      .populate('assignedTo', 'firstName lastName username')
      .populate('relatedRoute', 'routeNumber name')
      .populate('relatedBus', 'busNumber model')
      .populate('response.respondedBy', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      inquiries,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inquiry by ID
router.get('/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const inquiry = await Contact.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName username email')
      .populate('relatedRoute', 'routeNumber name')
      .populate('relatedBus', 'busNumber model')
      .populate('response.respondedBy', 'firstName lastName username');

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Mark as read if not already read
    if (!inquiry.isRead) {
      inquiry.isRead = true;
      inquiry.readAt = new Date();
      inquiry.readBy = req.user.id;
      await inquiry.save();
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inquiry (assign, change status, priority)
router.put('/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assignedTo, tags } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (tags) updateData.tags = tags;

    const updatedInquiry = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'firstName lastName username')
    .populate('relatedRoute', 'routeNumber name')
    .populate('relatedBus', 'busNumber model');

    if (!updatedInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    res.json({
      message: 'Inquiry updated successfully',
      inquiry: updatedInquiry
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Respond to inquiry
router.post('/inquiries/:id/respond', authenticateToken, [
  body('message').isLength({ min: 10, max: 2000 }).trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    const inquiry = await Contact.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    inquiry.response = {
      message,
      respondedBy: req.user.id,
      respondedAt: new Date()
    };
    inquiry.status = 'resolved';

    await inquiry.save();
    await inquiry.populate('response.respondedBy', 'firstName lastName username');

    res.json({
      message: 'Response sent successfully',
      inquiry
    });
  } catch (error) {
    console.error('Error responding to inquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inquiry statistics
router.get('/stats/inquiries', authenticateToken, async (req, res) => {
  try {
    const totalInquiries = await Contact.countDocuments();
    const newInquiries = await Contact.countDocuments({ status: 'new' });
    const inProgressInquiries = await Contact.countDocuments({ status: 'in-progress' });
    const resolvedInquiries = await Contact.countDocuments({ status: 'resolved' });

    // Inquiries by category
    const inquiriesByCategory = await Contact.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Inquiries by priority
    const inquiriesByPriority = await Contact.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalInquiries,
      newInquiries,
      inProgressInquiries,
      resolvedInquiries,
      inquiriesByCategory: inquiriesByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      inquiriesByPriority: inquiriesByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching inquiry stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;