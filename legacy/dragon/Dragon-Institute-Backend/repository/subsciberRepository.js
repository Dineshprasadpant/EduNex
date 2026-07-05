import Subscriber from '../models/SubscriberModel.js';

export const createSubscriber = async (email) => {
  const subscriber = new Subscriber({ email });
  return await subscriber.save();
};

export const getAllSubscribers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const [subscribers, total] = await Promise.all([
    Subscriber.find().select("_id email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Subscriber.countDocuments()
  ]);

  return {
    data: subscribers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1
    }
  };
};

export const getSubscriberFromName = async(email)=> {
    return await Subscriber.findOne({ email });
}

export const deleteSubscriber = async (email) => {
  const result = await Subscriber.deleteOne({ email });
  return result.deletedCount > 0;
};

export const subscriberExists = async (email) => {
  return await Subscriber.exists({ email });
};