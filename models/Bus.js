import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  capacity: {
    type: Number,
    required: [true, 'Bus capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [100, 'Capacity cannot exceed 100']
  },
  type: {
    type: String,
    enum: ['standard', 'luxury', 'double-decker', 'mini'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out-of-service', 'retired'],
    default: 'active'
  },
  driver: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    ref: 'User'
  },
  route: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String  
    ref: 'Route'
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1980,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    trim: true,
    uppercase: true
  },
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'electric', 'hybrid'],
    default: 'diesel'
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  mileage: {
    type: Number,
    default: 0,
    min: 0
  },
  features: [{
    type: String,
    trim: true
  }],
  location: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for performance (keep only non-unique indexes)
busSchema.index({ status: 1 });
busSchema.index({ route: 1 });

const Bus = mongoose.model('Bus', busSchema);

export default Bus;