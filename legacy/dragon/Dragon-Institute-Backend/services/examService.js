import * as examRepository from '../repository/examRepository.js';
import { emailService } from '../services/mailService.js';
import { NotFoundError, ValidationError } from '../utils/errorHandler.js';
import User from '../models/user.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

// Configure Handlebars
handlebars.noConflict();

// Get template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '../examNotificationTemplate.html');

// Simple in-memory cache for the compiled template
let examTemplate = null;

const loadTemplate = () => {
  if (examTemplate) return examTemplate;
  
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Validate template size
    if (Buffer.byteLength(templateContent, 'utf8') > 100000) {
      throw new Error('Exam template is too large (>100KB)');
    }
    
    examTemplate = handlebars.compile(templateContent, {
      noEscape: true,
      strict: false
    });
    
    return examTemplate;
  } catch (err) {
    console.error('Error loading exam template:', err);
    throw new Error('Failed to load exam template');
  }
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const prepareExamEmailContent = (examData) => {
  const template = loadTemplate();
  const exam = examData.toObject ? examData.toObject() : {...examData};

  const renderedHtml = template({
    title: exam.title,
    examName: exam.exam_name,
    description: exam.description,
    startDateTime: formatDateTime(exam.startDateTime),
    endDateTime: formatDateTime(exam.endDateTime),
    totalMarks: exam.total_marks,
    passMarks: exam.pass_marks,
    duration: `${exam.duration} minutes`,
    negativeMarking: exam.negativeMarking ? 'Yes' : 'No',
    negativeMarkingValue: exam.negativeMarkingNumber || 'N/A',
    examLink: 'https://yourdomain.com/exams', // Replace with actual exam link
    unsubscribeLink: 'https://yourdomain.com/unsubscribe'
  }).replace(/\s+/g, ' ').trim();

  if (Buffer.byteLength(renderedHtml, 'utf8') > 256000) {
    console.warn('Warning: Large exam email content size may cause delivery issues');
  }

  return {
    subject: `Mock Exam Scheduled: ${exam.title}`,
    html: renderedHtml
  };
};

const sendExamNotifications = async (exam) => {
  try {
    const emailContent = prepareExamEmailContent(exam);
    console.log(`Exam email size: ${Buffer.byteLength(emailContent.html, 'utf8')} bytes`);
    
    // Send to each batch separately
    const batchResults = await Promise.all(exam.batches.map(async batchId => {
      return await emailService.sendBulkEmails({
        target: 'batch',
        batchId: batchId,
        subject: emailContent.subject,
        body: emailContent.html,
        isHtml: true
      });
    }));
    
    const totalSent = batchResults.reduce((sum, result) => sum + (result.sentCount || 0), 0);
    console.log(`Sent exam notifications to ${totalSent} recipients across ${exam.batches.length} batches`);
    
    return batchResults;
  } catch (err) {
    console.error('Error sending exam notifications:', err);
    throw err;
  }
};

export const createExam = async (examData) => {
  if (!examData.batches || examData.batches.length === 0) {
    throw new ValidationError('At least one batch must be specified');
  }

  const exam = await examRepository.createExam(examData);
  
  // Send notifications in background (don't await)
  sendExamNotifications(exam)
    .catch(err => console.error('Background exam notification error:', err));
  
  return exam;
};

export const getExamsByIds = async (examIds) => {
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
        throw new ValidationError('Please provide valid exam IDs');
    }
    
    const exams = await examRepository.findExamsByIds(examIds);
    
    if (exams.length === 0) {
        throw new NotFoundError('No exams found with the provided IDs');
    }
    
    return exams;
};

export const getExamsByBatch = async (batchId, page, limit, userId, status) => {
    if (page <= 0 || limit <= 0) {
        throw new ValidationError('Page and limit must be positive numbers');
    }

    if(status === "upComming"){
        return await examRepository.getUpcomingExamsByBatch(batchId, page, limit, userId);

    } else if(status==="current") {
        return await examRepository.getCurrentExamsByBatch(batchId, page, limit, userId);

    } else {
        throw new Error("Valid Status is required")
    }
    
    
};

export const getPaginatedExams = async (page, limit) => {
    if (page <= 0 || limit <= 0) {
        throw new ValidationError('Page and limit must be positive numbers');
    }
    
    return await examRepository.getAllExamsPaginated(page, limit);
};

export const updateExam = async (examId, updateData) => {
    if (!examId) {
        throw new ValidationError('Exam ID is required');
    }
    
    return await examRepository.updateExamById(examId, updateData);
};

export const deleteExam = async (examId) => {
    if (!examId) {
        throw new ValidationError('Exam ID is required');
    }
    
    return await examRepository.deleteExamById(examId);
};

// Common utility function for user and batch validation 
export const validateUserBatch = async (userId, batchId) => {
    if (!userId) return null;
  
    const user = await User.findById(userId);
    if (user && user.batch && user.batch.toString() !== batchId.toString()) {
      throw new Error("User doesn't belong to the specified batch");
    }
    return user;
  };
  
  // Common function to get attended exam IDs
export const getAttendedExamIds = (user) => {
    return user?.examsAttended?.map(e => e.examId.toString()) || [];
  };
  
  // Common function to process exams
export const processExams = (exams, status, user = null, attendedExamIds = []) => {
    return exams.map(exam => {
      const examObj = exam.toObject ? exam.toObject() : {...exam};
      examObj.status = status;
  
      // Hide question_sheet_id if:
      // 1. No user is specified, OR
      // 2. User has already attended this exam
      // 3. For upcoming exams (handled in the query)
      if (status === "active" && (!user || attendedExamIds.includes(exam._id.toString()))) {
        examObj.question_sheet_id = undefined;
      }
  
      return examObj;
    });
  };
  