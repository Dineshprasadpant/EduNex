import mongoose from 'mongoose';

const learningFormatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Format name is required']
  },
  description: {
    type: String,
    required: [true, 'Format description is required']
  }
}, { _id: false });

const curriculumItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Curriculum item title is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  }
}, { _id: false });

const scheduleItemSchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  medium: {
    type: String,
    enum: ['online', 'offline', 'both'],
    required: [true, 'medium is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
    unique: true
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  description: {
    type: [String],
    required: [true, 'Description is required'],
    validate: {
      validator: function(v) {
        return v.length > 0 && v.every(item => item.length > 0);
      },
      message: 'Description must contain at least one paragraph'
    }
  },
  studentsEnrolled: {
    type: Number,
    default: 0,
    min: [0, 'Students enrolled cannot be negative']
  },
  teachersCount: {
    type: Number,
    required: [true, 'Teachers count is required'],
    min: [1, 'There must be at least one teacher'],
    default: 1
  },
  courseHighlights: {
    type: [String],
    required: [true, 'Course highlights are required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one course highlight is required'
    }
  },
  overallHours: {
    type: Number,
    required: [true, 'Overall hours are required'],
    min: [1, 'Course must be at least 1 hour long']
  },
  moduleLeader: {
    type: String,
    required: [true, 'Module leader is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  learningFormat: {
    type: [learningFormatSchema],
    required: [true, 'Learning format is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one learning format is required'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  onlinePrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  offlinePrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  curriculum: {
    type: [curriculumItemSchema],
    required: [true, 'Curriculum is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one curriculum item is required'
    }
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  deliveryMode: {
    type: String,
    required: [true, 'Delivery mode is required'],
    enum: ['online', 'offline', 'hybrid'],
    default: 'online'
  },
  schedule: {
    type: [scheduleItemSchema],
    required: function() {
      return this.deliveryMode !== 'online';
    },
    validate: {
      validator: function(v) {
        if (this.deliveryMode === 'online') return true;
        return v.length > 0;
      },
      message: 'At least one schedule item is required for offline/hybrid courses'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add priority weight for sorting
courseSchema.virtual('priorityWeight').get(function() {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return priorityOrder[this.priority] || 0;
});

// Middleware to update price based on delivery mode before saving
courseSchema.pre('save', function(next) {
  if (this.deliveryMode === 'online') {
    this.price = this.onlinePrice;
  } else if (this.deliveryMode === 'offline') {
    this.price = this.offlinePrice;
  } else if (this.deliveryMode === 'hybrid') {
    this.price = Math.min(this.onlinePrice || 0, this.offlinePrice || 0);
  }
  
  this.updatedAt = Date.now();
  next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;