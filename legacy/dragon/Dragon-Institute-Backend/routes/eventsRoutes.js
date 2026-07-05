import express from 'express';
import * as controller from '../controllers/eventsController.js';
import { authenticateToken, isAdmin, isBoth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, isAdmin, controller.createEvent);
router.get('/', controller.getAllEvents);
router.get('/get/byMonthAndYear', controller.getByMonthAndYear)
router.get('/:id', controller.getEvent);
router.put('/:id', authenticateToken, isAdmin, controller.updateEvent);
router.delete('/:id', authenticateToken, isAdmin, controller.deleteEvent);

export default router;