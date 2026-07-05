import express from 'express';
import {
  getClassMaterial,
  createClassMaterial,
  updateClassMaterial,
  deleteClassMaterial,
  getClassMaterials,
  getAllClassMaterials
} from '../controllers/classMaterialController.js';
import { authenticateToken, isAdmin, isBoth, isUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, isBoth, getAllClassMaterials);
router.get('/:id', authenticateToken, isBoth, getClassMaterial);
router.post('/', authenticateToken, isBoth, createClassMaterial);
router.put('/:id',authenticateToken, isBoth, updateClassMaterial);
router.delete('/:id',authenticateToken, isBoth, deleteClassMaterial);
router.get('/batch/:batchId', authenticateToken, isUser,getClassMaterials);

export default router;