import { QuestionSheet } from '../models/questionSheet.js';

export async function findAllQuestionSheets(fields, page = 1, pageSize = 10) {
  try {

    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const skip = (page - 1) * pageSize;

    const selectFields = fields && fields.length > 0 ? fields.split(',').join(' ') : '';

    const questionSheets = await QuestionSheet.find()
      .select(selectFields)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); 

    const totalCount = await QuestionSheet.countDocuments();

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: questionSheets,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error fetching question sheets: ${error.message}`);
  }
}

export async function findQuestionSheetById(id, answer = "1") {
  try {
    let questionSheet = {}
    if(answer === "0"){
      questionSheet = await QuestionSheet.findById(id)
    .select({
      'questions.answers': 0, // Exclude correctAnswer field from questions
      'questions.question': 0,
      'questions.marks': 0,
      'createdAt': 0,
      'updatedAt': 0,
      '__v':0
    });

    } else if(answer != "0") {
      questionSheet = await QuestionSheet.findById(id)
    .select({
      'questions.correctAnswer': 0, // Exclude correctAnswer field from questions
      'createdAt': 0,
      'updatedAt': 0,
      '__v':0
    });
    }
    
    console.log(questionSheet)

    return questionSheet;
  } catch (error) {
    throw new Error(`Error fetching question sheet: ${error.message}`);
  }
}

export async function findQuestionSheetsById(id) {
  try {
    const questionSheet = await QuestionSheet.findById(id);

    return questionSheet;
  } catch (error) {
    throw new Error(`Error fetching question sheet: ${error.message}`);
  }
}


export async function createQuestionSheet(questionSheetData) {
  try {
    const newQuestionSheet = new QuestionSheet(questionSheetData);
    return await newQuestionSheet.save();
  } catch (error) {
    throw new Error(`Error creating question sheet: ${error.message}`);
  }
}

export async function updateQuestionSheet(id, questionSheetData) {
  try {
    const options = { new: true, runValidators: true };
    return await QuestionSheet.findByIdAndUpdate(id, questionSheetData, options);
  } catch (error) {
    throw new Error(`Error updating question sheet: ${error.message}`);
  }
}

export async function deleteQuestionSheet(id) {
  try {
    return await QuestionSheet.findByIdAndDelete(id);
  } catch (error) {
    throw new Error(`Error deleting question sheet: ${error.message}`);
  }
}