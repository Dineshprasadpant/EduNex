import mongoose from 'mongoose';

const highestScorerSchema = new mongoose.Schema({
  studentId: { 
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
       },
  percentage: { type: Number, required: true }
});

const examPerformanceSchema = new mongoose.Schema({
  batchId: { 
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Batch',
          required: true
       },
       examId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
        unique: true
     },
  academicYear: { type: String, required: true },
  overallPercentage: { type: Number, default: 0 },
  numberOfExaminees: { type: Number, default: 0 },
  highestScorers: [highestScorerSchema],
  createdAt: { type: Date, default: Date.now }
});

examPerformanceSchema.index({ batchId: 1, academicYear: 1, examId: 1 });

export const ExamPerformance = mongoose.model('ExamPerformance', examPerformanceSchema);