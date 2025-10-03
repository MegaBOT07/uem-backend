import mongoose from 'mongoose';

const staffContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  role: {
    type: String,
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters']
  },
  shift: {
    type: String,
    enum: ['Day (8:00 AM - 4:00 PM)', 'Evening (4:00 PM - 12:00 AM)', 'Night (12:00 AM - 8:00 AM)', 'Rotating'],
    default: 'Day (8:00 AM - 4:00 PM)'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave', 'terminated'],
    default: 'active'
  },
  emergencyContact: {
    type: String,
    trim: true,
    maxlength: [200, 'Emergency contact cannot exceed 200 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  busesAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }],
  hireDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
staffContactSchema.index({ email: 1 });
staffContactSchema.index({ department: 1 });
staffContactSchema.index({ status: 1 });

const StaffContact = mongoose.model('StaffContact', staffContactSchema);

export default StaffContact;