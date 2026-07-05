import Feedback from '../models/feedBack.js';

export const createFeedback = async (feedbackData) => {
  return await Feedback.create(feedbackData);
};

export const getFeedbacks = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await Feedback.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const getPositiveFeedbacks = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await Feedback.find({ rating: { $gte: 4 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const countFeedbacks = async () => {
  return await Feedback.countDocuments();
};

export const countPositiveFeedbacks = async () => {
  return await Feedback.countDocuments({ rating: { $gte: 4 } });
};


export const deleteFeedback = async (feedbackId) => {
  const result = await Feedback.findByIdAndDelete(feedbackId);
  return result;
};