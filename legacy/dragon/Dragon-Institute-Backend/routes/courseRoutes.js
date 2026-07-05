import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticateToken, isAdmin, isUser } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.route('/')
  .get(courseController.getAllCoursesFullDetails)
  .post(authenticateToken, isAdmin, courseController.createCourse);

router.route('/summary')
   .get(courseController.getAllCoursesSummary);

router.route('/getById/:id')
   .get(courseController.getCourseById);

router.route('/deliveryMode/:mode').get(courseController.getByDeliveryMode);

router.route('/:id')
  .patch(authenticateToken, isAdmin, courseController.updateCourse)
  .delete(authenticateToken, isAdmin, courseController.deleteCourse);


export default router;