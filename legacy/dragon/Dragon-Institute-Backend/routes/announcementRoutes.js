import express from 'express';
import * as controller from '../controllers/announcementController.js';
import { authenticateToken, isAdmin, isBoth, isUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, isAdmin, controller.createAnnouncement);
router.get('/', controller.getAllAnnouncements);
router.get('/:id', controller.getAnnouncement);
router.put('/:id', authenticateToken, isAdmin,controller.updateAnnouncement);
router.delete('/:id', authenticateToken, isAdmin,controller.deleteAnnouncement);

export default router;