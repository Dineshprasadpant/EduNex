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
  imageUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  buttons: [CtaButtonSchema]
}, { _id: false });

const NewsSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  image:{
    type: String,
    required: true,
  },

  // Execution and Timing
  publishedDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  publisher: {
    type: String,
    trim: true,
    required: true
  },

  // Content Details
  content: [{
    type: String,
    trim: true,
    required: true
  }],

  // Resource Materials
  resourceMaterials: [ResourceMaterialSchema],

  // Sub-Information
  subInformation: [SubInformationSchema],

  // Call to Action (Optional)
  cta: {
    type: CtaSchema,
    default: undefined
  },

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});


NewsSchema.index({ publishedDate: -1 });

const NewsModel = mongoose.model('News', NewsSchema);

export default NewsModel;