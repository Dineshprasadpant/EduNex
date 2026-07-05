import express from 'express';
import * as questionSheetController from '../controllers/questionSheetController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authenticateToken, isAdmin, isBoth, BasicAuthenticatation } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.get('/', authenticateToken, isBoth,questionSheetController.getAllQuestionSheets);
router.get('/:id', BasicAuthenticatation,questionSheetController.getQuestionSheetById);
router.post('/',  authenticateToken, isBoth, questionSheetController.createQuestionSheet);
router.put('/:id',authenticateToken, isBoth, questionSheetController.updateQuestionSheet);
router.delete('/:id',authenticateToken, isBoth, questionSheetController.deleteQuestionSheet);
router.post('/:examId/submit',BasicAuthenticatation, questionSheetController.submitExamResults);

export default router;