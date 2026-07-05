import {
  createInitialPerformanceRecord,
  findPerformanceByExamId,
  updatePerformanceRecord,
  findPerformanceByAcademicYear,
  findPerformanceById,
  findYearlySummary,
  checkPreviousYearsRecords,
  deleteAllExceptCurrentYear,
  getAllPerformanceRecords,
  getPreviousYearsRecords,
  findPerformanceFromExamId
} from '../repository/examPerformanceRepository.js';

export async function initializePerformanceRecord(batchId, academicYear, examId) {

  const existingRecord = await findPerformanceByExamId(examId, batchId);

  if (existingRecord) {
    throw new Error('Performance record for this exam already exists');
  }
  
  return await createInitialPerformanceRecord(batchId, academicYear, examId);
}

export async function updateStudentPerformance(examId, studentId, percentage) {
  const performanceRecord = await findPerformanceFromExamId(examId);
  
  if (!performanceRecord) {
    throw new Error('Performance record not found for this exam');
  }

  // Calculate new overall percentage
  const totalPercentage = performanceRecord.overallPercentage * performanceRecord.numberOfExaminees;
  const newNumberOfExaminees = performanceRecord.numberOfExaminees + 1;
  const newOverallPercentage = (totalPercentage + percentage) / newNumberOfExaminees;

  // Update highest scorers
  let highestScorers = [...performanceRecord.highestScorers];
  
  // Check if student already in highest scorers
  const existingStudentIndex = highestScorers.findIndex(s => s.studentId === studentId);
  
  if (existingStudentIndex !== -1) {
    // Update existing entry if new percentage is higher
    if (percentage > highestScorers[existingStudentIndex].percentage) {
      highestScorers[existingStudentIndex].percentage = percentage;
    }
  } else {
    // Add new entry if there's space or if percentage is higher than the lowest
    if (highestScorers.length < 10) {
      highestScorers.push({ studentId, percentage });
    } else {
      const lowestScorer = highestScorers.reduce((lowest, current) => 
        current.percentage < lowest.percentage ? current : lowest, highestScorers[0]);
      
      if (percentage > lowestScorer.percentage) {
        highestScorers = highestScorers.filter(s => s !== lowestScorer);
        highestScorers.push({ studentId, percentage });
      }
    }
  }

  // Sort highest scorers in descending order
  highestScorers.sort((a, b) => b.percentage - a.percentage);

  // Update the record
  return await updatePerformanceRecord(performanceRecord._id, {
    overallPercentage: newOverallPercentage,
    numberOfExaminees: newNumberOfExaminees,
    highestScorers
  });
}

export async function getPerformanceByYear(academicYear, batchId) {
  return await findPerformanceByAcademicYear(academicYear, batchId);
}

export async function getPerformanceById(id) {
  return await findPerformanceById(id);
}

export async function getYearlySummary(academicYear, batchId) {
  return await findYearlySummary(academicYear, batchId);
}

export async function checkForPreviousYearsRecords(academicYear) {
  return await checkPreviousYearsRecords(academicYear);
}

export async function cleanupPreviousYearsData(academicYear) {
  return await deleteAllExceptCurrentYear(academicYear);
}

export async function getPreviousYearsData(academicYear, page , limit) {
  return await getPreviousYearsRecords(academicYear, page , limit);
}

export async function getAllPerformanceData(batchId) {
  return await getAllPerformanceRecords(batchId);
}