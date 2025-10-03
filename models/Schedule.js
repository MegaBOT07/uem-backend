import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    ref: 'Route',
    required: [true, 'Route is required']
  },
  bus: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Made optional - not required for basic schedule creation
  },
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required']
  },
  arrivalTime: {
    type: Date,
    required: [true, 'Arrival time is required']
  },
  actualDepartureTime: {
    type: Date
  },
  actualArrivalTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  passengers: {
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    boarded: {
      type: Number,
      default: 0,
      min: 0
    },
    alighted: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  delays: [{
    reason: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  weather: {
    condition: {
      type: String,
      trim: true
    },
    temperature: {
      type: Number
    },
    visibility: {
      type: String,
      enum: ['good', 'moderate', 'poor']
    }
  },
  fuelConsumption: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
scheduleSchema.index({ route: 1, departureTime: 1 });
scheduleSchema.index({ bus: 1, departureTime: 1 });
scheduleSchema.index({ driver: 1, departureTime: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ departureTime: 1 });

// Validate that arrival time is after departure time
scheduleSchema.pre('save', function(next) {
  if (this.arrivalTime <= this.departureTime) {
    next(new Error('Arrival time must be after departure time'));
  } else {
    next();
  }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;