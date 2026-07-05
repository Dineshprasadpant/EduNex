import mongoose from 'mongoose';

const ResourceMaterialSchema = new mongoose.Schema({
  materialName: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    trim: true
  },
  fileSize: Number,
  url: {
    type: String,
    trim: true
  }
}, { _id: false });

const SubInformationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  bulletPoints: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const CtaButtonSchema = new mongoose.Schema({
  buttonName: {
    type: String,
    trim: true
  },
  href: {
    type: String,
    trim: true
  }
}, { _id: false });

const CtaSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  buttons: [CtaButtonSchema]
}, { _id: false });

const AnnouncementSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  image:{
    type: String,
    required: true
  },

  // Execution and Timing
  announcedDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Content Details
  content: [{
    type: String,
    trim: true,
    required: true
  }],


  // Call to Action (Optional)
  cta: {
    type: CtaSchema,
    default: undefined
  },

  // Resource Materials
resourceMaterials: {
  type: [ResourceMaterialSchema],
  default: undefined
},

// Sub-Information
subInformation: {
  type: [SubInformationSchema],
  default: undefined
},




}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});


AnnouncementSchema.index({ announcedDate: -1 });

const AnnouncementModel = mongoose.model('Announcement', AnnouncementSchema);

export default AnnouncementModel;