import express from 'express';
import {
  createNewsController,
  getNewsByIdController,
  getAllNewsController,
  updateNewsController,
  deleteNewsController
} from '../controllers/newsController.js';
import { authenticateToken, isAdmin, isBoth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, isAdmin,createNewsController);
router.get('/:id', getNewsByIdController);
router.get('/', getAllNewsController);
router.put('/:id', authenticateToken, isAdmin, updateNewsController);
router.delete('/:id', authenticateToken, isAdmin, deleteNewsController);

export default router;