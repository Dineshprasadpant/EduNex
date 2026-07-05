import EventModel from '../models/eventsModel.js';

export const createEvent = async (eventData) => {
  const event = new EventModel(eventData);
  return await event.save();
};

export const getEventById = async (id) => {
  return await EventModel.findById(id);
};

export const getByMonthAndYear = async (month, year) => {
  try {
    console.log(month, year)
    return EventModel.find({ month, year })
      .select("_id title description event_type start_date end_date organizer");
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};


export const getAllEvents = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await EventModel.find()
    .select("_id title description event_type organizer start_date end_date")
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);
};

export const updateEvent = async (id, updateData) => {
  return await EventModel.findByIdAndUpdate(id, updateData, { 
    new: true, 
    runValidators: true 
  });
};

export const deleteEvent = async (id) => {
  return await EventModel.findByIdAndDelete(id);
};