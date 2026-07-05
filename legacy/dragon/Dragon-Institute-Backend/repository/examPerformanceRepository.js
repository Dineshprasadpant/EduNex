import { ExamPerformance } from '../models/examPerformanceModel.js';
import mongoose from 'mongoose';

export async function createInitialPerformanceRecord(batchId, academicYear, examId) {
  const newRecord = new ExamPerformance({
    batchId,
    academicYear,
    examId,
    overallPercentage: 0,
    numberOfExaminees: 0,
    highestScorers: []
  });
  return await newRecord.save();
}

export async function findPerformanceByExamId(examId, batchId) {
  const result =  await ExamPerformance.findOne({ examId, batchId });
  return result;
}

export async function findPerformanceFromExamId(examId) {
  const result =  await ExamPerformance.findOne({ examId});
  return result;
}

export async function findPerformanceById(id) {
  return await ExamPerformance.findById(id).populate({
  path: "highestScorers.studentId",
  select: "_id fullname" 
})
}

export async function findPerformanceByAcademicYear(academicYear, batchId) {
  return await ExamPerformance.find({ academicYear, batchId }).populate({
    path: 'examId',
    select: 'title _id',
}).populate({
  path: 'batchId',
  select: 'batch_name _id',
})  .populate({
  path: "highestScorers.studentId",
  select: "_id fullname" 
});
}

export async function findYearlySummary(academicYear, batchId) {
  return await ExamPerformance.find({ academicYear, batchId }).select('-highestScorers').populate({
    path: 'examId',
    select: 'title _id',
}).populate({
  path: 'batchId',
  select: 'batch_name _id',
})  .populate({
  path: "highestScorers.studentId",
  select: "_id fullname" 
})
}

export async function updatePerformanceRecord(id, updateData) {
  return await ExamPerformance.findByIdAndUpdate(id, updateData, { new: true });
}

export async function deleteAllExceptCurrentYear(academicYear) {
  return await ExamPerformance.deleteMany({ academicYear: { $ne: academicYear } });
}

export async function checkPreviousYearsRecords(academicYear) {
  const count = await ExamPerformance.countDocuments({ academicYear: { $ne: academicYear } });
  return count > 0;
}

export async function getAllPerformanceRecords(batchId) {
  return await ExamPerformance.find({batchId}).populate({
    path: 'examId',
    select: 'title _id',
}).populate({
  path: 'batchId',
  select: 'batch_name _id',
})  .populate({
  path: "highestScorers.studentId",
  select: "_id fullname" 
});
}

export async function getPreviousYearsRecords(academicYear, page = 1, limit = 10) {
  page = parseInt(page)
  const skip = (page - 1) * limit;

  const query = { academicYear: { $ne: academicYear } };

  const [totalCount, records] = await Promise.all([
    ExamPerformance.countDocuments(query),
    ExamPerformance.find(query)
    .populate({
      path: 'examId',
      select: 'title _id',
  }).populate({
    path: 'batchId',
    select: 'batch_name _id',
  })  .populate({
    path: "highestScorers.studentId",
    select: "_id fullname" 
  })
    .skip(skip)
    .limit(limit)
    .lean()
  
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    records,
    meta: {
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

