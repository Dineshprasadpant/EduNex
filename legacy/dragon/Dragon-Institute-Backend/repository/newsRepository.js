import NewsModel from '../models/newsModel.js';

export const createNews = async (newsData) => {
  return await NewsModel.create(newsData);
};

export const findNewsById = async (id) => {
  return await NewsModel.findById(id);
};

export const findAllNewsPaginated = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    NewsModel.find()
      .select("_id title publishedDate publisher image content")
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(limit),
    NewsModel.countDocuments()
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
};

export const updateNewsById = async (id, updateData) => {
  return await NewsModel.findByIdAndUpdate(id, updateData, { 
    new: true, 
    runValidators: true 
  });
};

export const deleteNewsById = async (id) => {
  return await NewsModel.findByIdAndDelete(id);
};