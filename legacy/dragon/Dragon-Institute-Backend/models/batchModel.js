import mongoose from 'mongoose';

const scheduledMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  meeting_link: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  expiryTime: { 
    type: Date, 
    required: true,
    // 👇 Custom setter to prevent automatic timezone conversion
    set: (value) => {
      // If it's already a Date, return as-is
      if (value instanceof Date) return value;
      
      // If it's a string, parse it as UTC (no timezone shift)
      if (typeof value === 'string') {
        // Split into date and time (assuming format: "2025-05-10T01:50:00")
        const [datePart, timePart] = value.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        
        // Create a Date object in UTC (avoids local timezone conversion)
        return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
      }
      
      // Fallback (if not a string or Date)
      return new Date(value);
    }
  },
  duration_minutes: { type: Number, required: true }
}, { timestamps: true });

const batchSchema = new mongoose.Schema({
  batch_name: { type: String, required: true },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true 
  },
  scheduled_meetings: [scheduledMeetingSchema],
}, { timestamps: true });

export default mongoose.model('Batch', batchSchema);