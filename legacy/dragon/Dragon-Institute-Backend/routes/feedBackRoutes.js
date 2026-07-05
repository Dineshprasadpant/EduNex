import express from 'express';
import {
  createFeedback,
  getFeedbacks,
  getPositiveFeedbacks,
  deleteFeedback
} from '../controllers/feedBackController.js';
import { authenticateToken, isAdmin, isBoth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/', authenticateToken, isAdmin, getFeedbacks);
router.get('/positive', getPositiveFeedbacks);
router.delete('/:id',  authenticateToken, isAdmin, deleteFeedback);

export default router;