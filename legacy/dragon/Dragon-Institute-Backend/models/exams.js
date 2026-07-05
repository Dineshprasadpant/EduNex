import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    exam_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    exam_name: { type: String, required: true },
    startDateTime: { type: Date, required: true, index: true }, 
    endDateTime: { type: Date, required: true, index: true }, 
    total_marks: { type: Number, required: true },
    pass_marks: { type: Number, required: true },
    duration: { type: Number, required: true },
    negativeMarking: { type: Boolean, required: true },
    negativeMarkingNumber: {type: Number, required: false},
    question_sheet_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionSheet',
        required: true
     },
    batches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
        index: true
    }]
}, { timestamps: true });

// Compound index for faster batch-based queries
examSchema.index({ batches: 1, startDateTime: -1, endDateTime: -1 });

export default mongoose.model('Exam', examSchema);