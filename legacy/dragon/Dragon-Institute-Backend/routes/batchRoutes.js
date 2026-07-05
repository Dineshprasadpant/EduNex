import express from 'express';
import {
  createBatch,
  getBatch,
  getAllBatches,
  updateBatch,
  deleteBatch,
  addMeeting,
  updateMeeting,
  removeMeeting,
  cleanupExpiredMeetingsServices
} from '../controllers/batchController.js';
import { authenticateToken, isAdmin, isBoth, isUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Batch CRUD routes
router.post('/',authenticateToken, isBoth, createBatch);
router.get('/', authenticateToken, isBoth,getAllBatches);
router.get('/:id', authenticateToken, getBatch);
router.put('/:id', authenticateToken, isBoth, updateBatch);
router.delete('/:id',authenticateToken, isBoth, deleteBatch);

// Meeting management routes
router.post('/:batchId/meetings', authenticateToken, isBoth, addMeeting);
router.put('/:batchId/meetings/:meetingId', authenticateToken, isBoth,updateMeeting);
router.delete('/:batchId/meetings/:meetingId', authenticateToken, isBoth, removeMeeting);
router.post('/cleanExpiredMeetings', cleanupExpiredMeetingsServices);

export default router;