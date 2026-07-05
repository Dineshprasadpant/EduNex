import {
    createBatchService,
    getBatchByIdService,
    getAllBatchesService,
    updateBatchService,
    deleteBatchService,
    addMeetingToBatchService,
    updateMeetingInBatchService,
    removeMeetingFromBatchService,
     cleanupExpiredMeetingsService
  } from '../services/batchService.js';
  
  export const createBatch = async (req, res) => {
    try {
      const batch = await createBatchService(req.body);
      res.status(201).json(batch);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const getBatch = async (req, res) => {
    try {
      const batch = await getBatchByIdService(req.params.id);
      res.json(batch);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };
  
  export const getAllBatches = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await getAllBatchesService(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const updateBatch = async (req, res) => {
    try {
      const batch = await updateBatchService(req.params.id, req.body);
      res.json(batch);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const deleteBatch = async (req, res) => {
    try {
      await deleteBatchService(req.params.id);
      res.status(200).json({ message: "Batches Deleted Sucessfully"});
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };
  
  export const addMeeting = async (req, res) => {
    try {
      const batch = await addMeetingToBatchService(req.params.batchId, req.body);
      res.status(201).json(batch);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const updateMeeting = async (req, res) => {
    try {
      const batch = await updateMeetingInBatchService(
        req.params.batchId,
        req.params.meetingId,
        req.body
      );
      res.json(batch);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const removeMeeting = async (req, res) => {
    try {
      const batch = await removeMeetingFromBatchService(
        req.params.batchId,
        req.params.meetingId
      );
      res.json(batch);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  export const cleanupExpiredMeetingsServices = async (req, res)=> {
    try{
      const result = await cleanupExpiredMeetingsService()
     res.json(result);
    }catch (error) {
      res.status(400).json({ message: error.message });
    }
  }