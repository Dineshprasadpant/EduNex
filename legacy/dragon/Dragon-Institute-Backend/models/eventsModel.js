import mongoose from 'mongoose';

const OrganizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    trim: true
  }
}, { _id: false });

const VenueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

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

const ExtraInformationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  event_type: {
    type: String,
    required: true,
    default: 'Other'
  },
  month: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  organizer: {
    type: OrganizerSchema,
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  venue: {
    type: VenueSchema,
    required: true
  },
  resourceMaterials: [ResourceMaterialSchema],
  extraInformation: [ExtraInformationSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

EventSchema.index({ date: -1 });


const EventModel = mongoose.model('Event', EventSchema);

export default EventModel;