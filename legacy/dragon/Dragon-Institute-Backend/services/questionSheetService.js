import * as questionSheetRepository from '../repository/questionSheetRepository.js';
import { addExamResults } from '../repository/userRepository.js';
import { handleUpdateStudentPerformance } from '../controllers/examPerformanceController.js';

export async function getAllQuestionSheets(fields, page, pageSize) {
  try {
    return await questionSheetRepository.findAllQuestionSheets(fields, page, pageSize);
  } catch (error) {
    throw error;
  }
}

export async function getQuestionSheetById(id, answer) {
  try {
    const questionSheet = await questionSheetRepository.findQuestionSheetById(id, answer);
    if (!questionSheet) {
      throw new Error('Question sheet not found');
    }
    return questionSheet;
  } catch (error) {
    throw error;
  }
}

export async function createQuestionSheet(questionSheetData) {
  try {
    // Validate data
    if (!questionSheetData.questions || !Array.isArray(questionSheetData.questions) || questionSheetData.questions.length === 0) {
      throw new Error('Question sheet must contain at least one question');
    }
    
    // Validate each question
    questionSheetData.questions.forEach((q, index) => {
      if (!q.question) {
        throw new Error(`Question at index ${index} is missing question text`);
      }
      if (!q.answers || !Array.isArray(q.answers) || q.answers.length < 2) {
        throw new Error(`Question at index ${index} must have at least 2 answers`);
      }
      if (!q.correctAnswer) {
        throw new Error(`Question at index ${index} is missing correct answer`);
      }
      if (!q.answers.includes(q.correctAnswer)) {
        throw new Error(`Question at index ${index} has a correct answer that is not in the answers array`);
      }
    });
    
    return await questionSheetRepository.createQuestionSheet(questionSheetData);
  } catch (error) {
    throw error;
  }
}

export async function updateQuestionSheet(id, questionSheetData) {
  try {
    // Check if question sheet exists
    const existingSheet = await questionSheetRepository.findQuestionSheetById(id);
    if (!existingSheet) {
      throw new Error('Question sheet not found');
    }
    
    // If questions are provided, validate them
    if (questionSheetData.questions) {
      if (!Array.isArray(questionSheetData.questions) || questionSheetData.questions.length === 0) {
        throw new Error('Question sheet must contain at least one question');
      }
      
      // Validate each question
      questionSheetData.questions.forEach((q, index) => {
        if (!q.question) {
          throw new Error(`Question at index ${index} is missing question text`);
        }
        if (!q.answers || !Array.isArray(q.answers) || q.answers.length < 2) {
          throw new Error(`Question at index ${index} must have at least 2 answers`);
        }
        if (!q.correctAnswer) {
          throw new Error(`Question at index ${index} is missing correct answer`);
        }
        if (!q.answers.includes(q.correctAnswer)) {
          throw new Error(`Question at index ${index} has a correct answer that is not in the answers array`);
        }
      });
    }
    
    return await questionSheetRepository.updateQuestionSheet(id, questionSheetData);
  } catch (error) {
    throw error;
  }
}

export async function deleteQuestionSheet(id) {
  try {
    const questionSheet = await questionSheetRepository.deleteQuestionSheet(id);
    if (!questionSheet) {
      throw new Error('Question sheet not found');
    }
    return questionSheet;
  } catch (error) {
    throw error;
  }
}

export async function saveExamResults(
  userId,
  examId,
  examName,
  totalQuestions,
  correctAnswers,
  totalMarksObtained,
  totalMarks,
  percentage,
  unAnsweredQuestions,
  answers
) {
  await addExamResults(userId, { 
    examId,
    examName,
    totalQuestions,
    correctAnswers,
    totalMarksObtained,
    totalMarks,
    percentage,
    unAnsweredQuestions,
    answers
  });

  const examDetails = { studentId : userId, percentage, examId }

  await handleUpdateStudentPerformance(examDetails);

  return("Result ucessfully recorded")
}



