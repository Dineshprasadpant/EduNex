import express from 'express';
import {
  createSubscriber,
  listSubscribers,
  deleteSubscriber,
  getSubscriberWithName
} from '../controllers/subscriberController.js';
import { authenticateToken, isAdmin, isUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', createSubscriber);
router.get('/',  authenticateToken, isAdmin,listSubscribers);
router.get('/getUser/:email',  authenticateToken, isAdmin,getSubscriberWithName);

router.delete('/:email',  authenticateToken, isAdmin, deleteSubscriber);

export default router;