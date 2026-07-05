import mongoose from 'mongoose';
import {
  createNewsService,
  getNewsByIdService,
  getAllNewsService,
  updateNewsService,
  deleteNewsService
} from '../services/newsService.js';

const handleError = (res, error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: 'Invalid news ID' });
  }
  if (error.message === 'News not found') {
    return res.status(404).json({ message: error.message });
  }
  if (error.message.includes('required')) {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: 'Server error', error: error.message });
};

export const createNewsController = async (req, res) => {
  try {
    const news = await createNewsService(req.body);
    res.status(201).json(news);
  } catch (error) {
    handleError(res, error);
  }
};

export const getNewsByIdController = async (req, res) => {
  try {
    const news = await getNewsByIdService(req.params.id);
    res.json(news);
  } catch (error) {
    handleError(res, error);
  }
};

export const getAllNewsController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getAllNewsService({ 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateNewsController = async (req, res) => {
  try {
    const updatedNews = await updateNewsService(req.params.id, req.body);
    res.json(updatedNews);
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteNewsController = async (req, res) => {
  try {
    await deleteNewsService(req.params.id);
    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};