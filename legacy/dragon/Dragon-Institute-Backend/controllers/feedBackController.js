import {
    createFeedback as createFeedbackService,
    getFeedbacks as getFeedbacksService,
    getPositiveFeedbacks as getPositiveFeedbacksService
  } from '../services/feedBackService.js';
  import {deleteFeedbackService} from '../services/feedBackService.js';
  
  export const createFeedback = async (req, res) => {
    try {
      const feedback = await createFeedbackService(req.body);
      res.status(201).json({
        status: 'success',
        data: feedback
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message
      });
    }
  };
  
  export const getFeedbacks = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await getFeedbacksService(page, limit);
      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message
      });
    }
  };
  
  export const getPositiveFeedbacks = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await getPositiveFeedbacksService(page, limit);
      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message
      });
    }
  };

  
  export const deleteFeedback = async (req, res) => {
    try {
      const { id } = req.params;
      
      await deleteFeedbackService(id);
      
      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } catch (error) {
      res.status(error.message === 'Feedback not found' ? 404 : 400).json({
        success: false,
        message: error.message || 'Failed to delete feedback'
      });
    }
  };