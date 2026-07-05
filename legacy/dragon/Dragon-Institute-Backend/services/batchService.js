import {
    createBatch,
    getBatchById,
    getAllBatches,
    updateBatch,
    deleteBatch,
    addMeetingToBatch,
    updateMeetingInBatch,
    removeMeetingFromBatch,
    removeExpiredMeetings
  } from '../repository/batchRepository.js';
  
  export const createBatchService = async (batchData) => {
    if (!batchData.course) {
      throw new Error('Course is required');
    }
    return await createBatch(batchData);
  };
  
  export const getBatchByIdService = async (batchId) => {
    const batch = await getBatchById(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return batch;
  };
  
  export const getAllBatchesService = async (page, limit) => {
    return await getAllBatches(page, limit);
  };
  
  export const updateBatchService = async (batchId, updateData) => {
    // Prevent updating scheduled_meetings through this endpoint
    if (updateData.scheduled_meetings) {
      delete updateData.scheduled_meetings;
    }
    
    const batch = await updateBatch(batchId, updateData);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return batch;
  };
  
  export const deleteBatchService = async (batchId) => {
    const batch = await deleteBatch(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return batch;
  };
  
  export const addMeetingToBatchService = async (batchId, meetingData) => {
    if (!meetingData.expiryTime || !meetingData.date || !meetingData.time) {
      throw new Error('Meeting date, time and expiryTime are required');
    }
  
    const meetingWithId = {
      ...meetingData
    };
  
    const batch = await addMeetingToBatch(batchId, meetingWithId);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return batch;
  };
  
  export const updateMeetingInBatchService = async (batchId, meetingId, meetingData) => {
    const batch = await updateMeetingInBatch(batchId, meetingId, meetingData);
    if (!batch) {
      throw new Error('Batch or meeting not found');
    }
    return batch;
  };
  
  export const removeMeetingFromBatchService = async (batchId, meetingId) => {
    const batch = await removeMeetingFromBatch(batchId, meetingId);
    if (!batch) {
      throw new Error('Batch or meeting not found');
    }
    return batch;
  };
  
  export const cleanupExpiredMeetingsService = async () => {
    return await removeExpiredMeetings();
  };