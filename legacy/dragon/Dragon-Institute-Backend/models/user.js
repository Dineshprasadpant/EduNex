import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const examsAttendedSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  examName: {
    type: String,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },

  unAnsweredQuestions: {
    type: Number,
    required: true
  },
  totalMarksObtained: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },

}, { _id: false });

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'user'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  platformPreference:{
type: String,
    enum: ['online', 'offline', 'asPerCourse'],
    required: false
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['verified', 'unverified'],
    default: 'unverified'
  },
  batch:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  courseEnrolled: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
  citizenshipImageUrl: {
    type: String,
    required: true
  },
  paymentImage: {
    type: [[String]],
    required: false
  },
  planUpgradedFrom: {
    type: String,
    required: false
  },  
  plan: {
    type: String,
    enum: ['full', 'half', 'free' ],
    required: true
  },
  examsAttended: [examsAttendedSchema  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ fullname: 'text' });

// Add search method to the model
userSchema.statics.searchByFullname = async function(searchTerm, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const results = await this.find(
    { $text: { $search: searchTerm } },
    { score: { $meta: 'textScore' } }
  )
  .populate({
    path: "batch",
    select: 'batch_name _id',
  }).populate({
    path: "courseEnrolled",
    select: 'title _id',
  })
  .sort({ score: { $meta: 'textScore' } })
  .skip(skip)
  .limit(limit)
  .select('-password -__v'); // exclude sensitive fields

  const total = await this.countDocuments({ $text: { $search: searchTerm } });

  return {
    users: results,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};


// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;