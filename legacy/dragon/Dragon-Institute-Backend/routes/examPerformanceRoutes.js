import express from 'express';
import {
  handleInitializePerformanceRecord,
  handleUpdateStudentPerformance,
  handleGetPerformanceByYear,
  handleGetPerformanceById,
  handleGetYearlySummary,
  handleCheckPreviousYearsData,
  handleCleanupPreviousYearsData,
  handleGetAllPerformanceData,
  getPreviousYearData
} from '../controllers/examPerformanceController.js';
import Batch from '../models/batchModel.js';
import { ExamPerformance } from '../models/examPerformanceModel.js';
import Exam from '../models/exams.js';
import User from '../models/user.js';
import { authenticateToken, isAdmin, isBoth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Initialize a new performance record (for a new academic year)
router.post('/initialize', handleInitializePerformanceRecord);

// Update student performance data
router.post('/update', handleUpdateStudentPerformance);

// Get performance data by academic year
router.get('/year/:academicYear/:batchId', authenticateToken, isAdmin, handleGetPerformanceByYear);

// Get performance data by record ID
router.get('/:id', authenticateToken, isAdmin, handleGetPerformanceById);

// Get yearly summary (without highest scorers)
router.get('/summary/:academicYear/:batchId', authenticateToken, isAdmin, handleGetYearlySummary);

// Check if previous years data exists
router.get('/check-previous/:academicYear', authenticateToken, isAdmin, handleCheckPreviousYearsData);

// Cleanup previous years data
router.delete('/cleanup/:academicYear', authenticateToken, isAdmin, handleCleanupPreviousYearsData);

// Get all performance data (for analytics)
router.get('/getByBatchId/:batchId', authenticateToken, isAdmin, handleGetAllPerformanceData);

router.get('/getPreviousYearRecords/:academicYear', authenticateToken, isAdmin, getPreviousYearData);

router.post('/seed-performance-data', async (req, res) => {
  try {
    // Validate required parameters
    const { count, academicYear } = req.body;
    if (!count || !academicYear) {
      return res.status(400).json({ 
        success: false,
        message: 'Count and academicYear are required parameters'
      });
    }

    // Get required references
    const [batches, exams, students] = await Promise.all([
      Batch.find().limit(5),
      Exam.find().limit(5),
      User.find({ role: 'user' }).limit(20)
    ]);

    if (!batches.length || !exams.length || !students.length) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 5 batches, 5 exams and 20 students in database'
      });
    }

    const performanceRecords = [];
    const recordsToCreate = Math.min(count, 50); // Limit to 50 records max

    for (let i = 0; i < recordsToCreate; i++) {
      const batch = batches[Math.floor(Math.random() * batches.length)];
      const exam = [...Array(24)]
  .map(() => Math.floor(Math.random() * 16).toString(16))
  .join('');
      
      // Generate random performance data
      const overallPercentage = Math.random() * 40 + 60; // Between 60-100%
      const numberOfExaminees = Math.floor(Math.random() * 50) + 10; // 10-60 students
      
      // Generate highest scorers (3-10 students)
      const highestScorersCount = Math.floor(Math.random() * 8) + 3;
      const highestScorers = [];
      
      // Take random students and assign percentages (80-100%)
      const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
      const maxScorers = Math.min(highestScorersCount, shuffledStudents.length);
for (let j = 0; j < maxScorers; j++) {
  if (shuffledStudents[j]?._id) {
    highestScorers.push({
      studentId: shuffledStudents[j]._id.toString(),
      percentage: Math.random() * 20 + 80
    });
  }
}


      // Sort highest scorers by percentage (descending)
      highestScorers.sort((a, b) => b.percentage - a.percentage);

      performanceRecords.push({
        batchId: batch._id,
        examId: exam,
        academicYear,
        overallPercentage,
        numberOfExaminees,
        highestScorers
      });
    }

    // Insert all records at once
    console.log(performanceRecords)
    const result = await ExamPerformance.insertMany(performanceRecords);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${result.length} performance records`,
      data: result
    });

  } catch (error) {
    console.error('Error seeding performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed performance data',
      error: error.message
    });
  }
});

export default router;