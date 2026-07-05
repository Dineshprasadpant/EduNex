import {
    createSubscriber,
    getAllSubscribers,
    deleteSubscriber,
    subscriberExists,
    getSubscriberFromName
  } from '../repository/subsciberRepository.js';
import {recordSubscriber} from "../controllers/userAnalyticsController.js"
  
  export const addSubscriber = async (email) => {
    if (await subscriberExists(email)) {
      throw new Error('Email already subscribed');
    }
  
    const newSubscriber = await createSubscriber(email);
    
    // Track the subscription in analytics
    await recordSubscriber();
    
    return newSubscriber;
  };
  
  export const getSubscribers = async (page, limit) => {
    return await getAllSubscribers(page, limit);
  };

  export const getSubscriberByName = async(email) => {
    return await getSubscriberFromName(email);
  }
  
  export const removeSubscriber = async (email) => {
    const exists = await subscriberExists(email);
    if (!exists) {
      throw new Error('Subscriber not found');
    }
    return await deleteSubscriber(email);
  };