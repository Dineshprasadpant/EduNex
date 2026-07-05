import express from 'express';
import {
  register,
  login,
  verifyUserStatus,
  getUnverifiedUsers,
  getVerifiedUsers,
  updateUser,
  deleteUser,
  resetPassword,
  searchUsersByFullname,
  getUserInformation,
  updateUserPlan,
  registerTeacherController

} from '../controllers/userController.js';
import { authenticateToken, isAdmin, isUser } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Public routes
const upload = multer();

router.post(
  '/register',
  upload.fields([
    { name: 'citizenship', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 }
  ]),
  register
);
router.post('/login', login);
router.get('/search', searchUsersByFullname);
router.get('/userInfo/:userId', getUserInformation)

// Protected admin routes
router.get('/unverified',  authenticateToken, isAdmin, getUnverifiedUsers);
router.get('/verified',  authenticateToken, isAdmin, getVerifiedUsers);
router.put('/:userId',  authenticateToken, isAdmin, updateUser);
router.delete('/:userId',  authenticateToken, isAdmin, deleteUser);
router.post('/:userId/reset-password',  authenticateToken, isAdmin, resetPassword);
router.post('/registerTeachers', authenticateToken, isAdmin, registerTeacherController);

// User verification
router.put('/verify/:userId/batch/:batchId',  authenticateToken, isAdmin, verifyUserStatus);
router.put('/:id/plan', authenticateToken, isUser, updateUserPlan);

export default router;