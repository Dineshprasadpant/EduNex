import * as service from '../services/eventsService.js';

export const createEvent = async (req, res) => {
  try {
    const event = await service.createEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await service.getEvent(req.params.id);
    res.json(event);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getByMonthAndYear = async(req, res)=> {
  try{
    const {month, year} = req.query;
    const events = await service.getByMonthAndYear(month, year);
    res.json({
      data: events
    });
  } catch(error){
    res.status(404).json({ message: error.message });
  }
}

export const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const events = await service.getAllEvents(page, limit);
    res.json({
      data: events,
      page,
      limit,
      total: events.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await service.updateEvent(req.params.id, req.body);
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await service.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted successfully', event });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};