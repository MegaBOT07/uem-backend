import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: [true, 'Route number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
  },
  startLocation: {
    type: String,
    required: [true, 'Start location is required'],
    trim: true
  },
  endLocation: {
    type: String,
    required: [true, 'End location is required'],
    trim: true
  },
  stops: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    estimatedTime: {
      type: Number, // in minutes from start
      default: 0
    },
    order: {
      type: Number,
      required: true
    }
  }],
  distance: {
    type: Number, // in kilometers
    required: [true, 'Route distance is required'],
    min: [0.1, 'Distance must be at least 0.1 km']
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: [true, 'Estimated duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  operatingHours: {
    start: {
      type: String,
      required: [true, 'Operating start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    end: {
      type: String,
      required: [true, 'Operating end time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    }
  },
  frequency: {
    type: Number, // in minutes
    required: [true, 'Frequency is required'],
    min: [5, 'Frequency must be at least 5 minutes']
  },
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: [0, 'Fare cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'seasonal'],
    default: 'active'
  },
  buses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }]
}, {
  timestamps: true
});

// Indexes for performance (keep only non-unique indexes)
routeSchema.index({ status: 1 });
routeSchema.index({ 'stops.coordinates': '2dsphere' });

const Route = mongoose.model('Route', routeSchema);

export default Route;