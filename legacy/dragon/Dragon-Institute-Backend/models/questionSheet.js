import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  marks:{
    type: Number,
    required: true
  },
  answers: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2; // At least 2 answer options
      },
      message: 'At least 2 answer options are required'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return this.answers.includes(v);
      },
      message: 'Correct answer must be one of the provided answers'
    }
  }
}, { id: false }); // Disable the _id field for questions

const questionSheetSchema = new mongoose.Schema({
  sheetName: {
    type: String,
    required: true
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one question is required'
    }
  }
}, { timestamps: true });

export const QuestionSheet = mongoose.model('QuestionSheet', questionSheetSchema);
