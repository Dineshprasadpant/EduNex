import express from 'express';
import * as examController from '../controllers/examController.js';
import { authenticateToken, isAdmin, isBoth } from '../middlewares/authMiddleware.js';
const router = express.Router();

// Create exam
router.post('/', authenticateToken, isBoth, examController.createExam);

// Get exams by multiple IDs
router.post('/by-ids', authenticateToken, examController.getExamsByIds);

// Get exams by batch ID with pagination
router.get('/batch/:batchId', authenticateToken, examController.getExamsByBatch);

// Get all exams with pagination
router.get('/', authenticateToken, isBoth, examController.getPaginatedExams);

// Update an exam
router.put('/:examId', authenticateToken, isBoth, examController.updateExam);

// Delete an exam
router.delete('/:examId', authenticateToken, isBoth, examController.deleteExam);



export default router;