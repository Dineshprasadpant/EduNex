import Exam from '../models/exams.js';
import moment from "moment-timezone";
import {validateUserBatch, getAttendedExamIds, processExams} from "../services/examService.js"
import { handleInitializePerformanceRecord } from '../controllers/examPerformanceController.js';

export const createExam = async (examData) => {
    const result = await Exam.create(examData);
    await handleInitializePerformanceRecord({
      batches: result.batches,
      examId: result._id
  })
  return result;
};

export const findExamsByIds = async (examIds) => {
    return await Exam.find({ exam_id: { $in: examIds } });
};


  // Get paginated current exams
  export const getCurrentExamsByBatch = async (batchId, page = 1, limit = 10, userId = null) => {
    const skip = (page - 1) * limit;
    const nepalTime = moment().tz("Asia/Kathmandu");

    // Extract the components of Nepal time
    const year = nepalTime.format("YYYY");
    const month = nepalTime.format("MM");
    const day = nepalTime.format("DD");
    const hour = nepalTime.format("HH");
    const minute = nepalTime.format("mm");
    const second = nepalTime.format("ss");
    const millisecond = nepalTime.format("SSS");
    
    // Format as if it were UTC time (but using Nepal's actual time components)
    const now = `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+00:00`;

    const user = await validateUserBatch(userId, batchId);
    const attendedExamIds = getAttendedExamIds(user);
  
    // Query for current exams (started but not ended)
    const currentExamQuery = {
      batches: batchId,
      startDateTime: { $lte: now },
      endDateTime: { $gt: now }
    };
  
    const [total, exams] = await Promise.all([
      Exam.countDocuments(currentExamQuery),
      Exam.find(currentExamQuery)
        .skip(skip)
        .limit(limit)
        .sort({ startDateTime: 1 })
    ]);
  
    const processedExams = processExams(exams, "active", user, attendedExamIds);
  
    return {
      exams: processedExams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1
      }
    };
  };
  
  // Get paginated upcoming exams
  export const getUpcomingExamsByBatch = async (batchId, page = 1, limit = 10, userId = null) => {
    const skip = (page - 1) * limit;
    const nepalTime = moment().tz("Asia/Kathmandu");

    // Extract the components of Nepal time
    const year = nepalTime.format("YYYY");
    const month = nepalTime.format("MM");
    const day = nepalTime.format("DD");
    const hour = nepalTime.format("HH");
    const minute = nepalTime.format("mm");
    const second = nepalTime.format("ss");
    const millisecond = nepalTime.format("SSS");
    
    // Format as if it were UTC time (but using Nepal's actual time components)
    const now = `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+00:00`;
  
    await validateUserBatch(userId, batchId);
  
    // Query for upcoming exams (not started yet)
    const upcomingExamQuery = {
      batches: batchId,
      startDateTime: { $gt: now }
    };
  
    const [total, exams] = await Promise.all([
      Exam.countDocuments(upcomingExamQuery),
      Exam.find(upcomingExamQuery)
        .select("-question_sheet_id") // Always exclude question_sheet_id for upcoming exams
        .skip(skip)
        .limit(limit)
        .sort({ startDateTime: 1 })
    ]);
  
    const processedExams = processExams(exams, "upcoming");
  
    return {
      exams: processedExams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1
      }
    };
  };
  

export const getAllExamsPaginated = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    const [exams, total] = await Promise.all([
        Exam.find()
            .populate({
                path: 'question_sheet_id',
                select: 'sheetName _id',
            })
            .populate({
                path: 'batches',
                select: 'batch_name _id',
            })
            .skip(skip)
            .limit(limit)
            .lean() 
            .exec(), 
        Exam.countDocuments().exec() 
    ]);
    
    
    return {
        exams,
        pagination: {
            totalObjects: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            hasNext: page < Math.ceil(total / limit),
            hasPrevious: page > 1
        }
    };
};

export const updateExamById = async (examId, updateData) => {
    const exam = await Exam.findOneAndUpdate(
        { exam_id: examId },
        updateData,
        { new: true, runValidators: true }
    );
    
    if (!exam) {
        throw new NotFoundError(`Exam with ID ${examId} not found`);
    }
    
    return exam;
};

export const deleteExamById = async (examId) => {
    const exam = await Exam.findOneAndDelete({ _id: examId });
    
    if (!exam) {
        throw new NotFoundError(`Exam with ID ${examId} not found`);
    }
    
    return exam;
};