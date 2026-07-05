import mongoose from 'mongoose';

const utmSourceSchema = new mongoose.Schema(
    {
      source: { type: String, required: true },
      users: { type: Number, default: 0 }
    },
    { _id: false } 
  );
  

const enrolledPlanSchema = new mongoose.Schema({
  free: { type: Number, default: 0 },
  half: { type: Number, default: 0 },
  full: { type: Number, default: 0 }
});

const analyticsSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  totalVisitors: { type: Number, default: 0 },
  totalVisits: { type: Number, default: 0 },
  utmSources: [utmSourceSchema],
  subscribersGain: { type: Number, default: 0 },
  enrolledPlan: { type: enrolledPlanSchema, default: () => ({}) }
}, { timestamps: true });

analyticsSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model('Analytics', analyticsSchema);