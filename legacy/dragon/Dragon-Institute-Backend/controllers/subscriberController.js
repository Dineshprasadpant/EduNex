import {
    addSubscriber,
    getSubscribers,
    removeSubscriber,
    getSubscriberByName
  } from '../services/subscriberService.js';
  import { recordSubscriber } from './userAnalyticsController.js';
  
  export const createSubscriber = async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
  
      const subscriber = await addSubscriber(email);
      if(subscriber){
      res.status(201).json({message: "Subscriber Added Sucessfully"});
      }
    } catch (error) {
      if (error.message === 'Email already subscribed') {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  };
  
  export const listSubscribers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
      }
  
      const result = await getSubscribers(page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const getSubscriberWithName = async (req, res) => {
    try {
     const email = req.params.email;
      const result = await getSubscriberByName(email);
      if(result){
        res.status(200).json(result);
      } else {
        res.status(404).json({message: "Couldnt find the Subscriber"})
      }
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const deleteSubscriber = async (req, res) => {
    try {
      const { email } = req.params;
      
      const success = await removeSubscriber(email);
      if (!success) {
        return res.status(404).json({ message: 'Subscriber not found' });
      }
      
      res.status(200).json({ message: 'Subscriber deleted successfully' });
    } catch (error) {
      if (error.message === 'Subscriber not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  };