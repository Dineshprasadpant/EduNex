import Batch from '../models/batchModel.js';
import moment from "moment-timezone";

export const createBatch = async (batchData) => {
  return await Batch.create(batchData);
};

export const getBatchById = async (id) => {
  return await Batch.findById(id).populate('course');
};

export const getAllBatches = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await Batch.countDocuments();
  const batches = await Batch.find()
    .populate({
      path: 'course',
      select: 'title _id', 
    })
    .select('-scheduled_meetings')
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: batches,
    meta: {
      total,
      page,
      limit,
      hasNext: page * limit < total,
      hasPrev: page > 1,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const updateBatch = async (id, updateData) => {
  return await Batch.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).populate('course');
};

export const deleteBatch = async (id) => {
  return await Batch.findByIdAndDelete(id);
};

export const addMeetingToBatch = async (id, meetingData) => {
  return await Batch.findByIdAndUpdate(
    id,
    { $push: { scheduled_meetings: meetingData } },
    { new: true }
  ).populate('course');
};

export const updateMeetingInBatch = async (batchId, meetingId, meetingData) => {
  return await Batch.findOneAndUpdate(
    { _id: batchId, 'scheduled_meetings._id': meetingId },
    { $set: { 
      'scheduled_meetings.$.title': meetingData.title,
      'scheduled_meetings.$.meeting_link': meetingData.meeting_link,
      'scheduled_meetings.$.date': meetingData.date,
      'scheduled_meetings.$.time': meetingData.time,
      'scheduled_meetings.$.expiryTime': meetingData.expiryTime,
      'scheduled_meetings.$.duration_minutes': meetingData.duration_minutes
    } },
    { new: true }
  ).populate('course');
};

export const removeMeetingFromBatch = async (batchId, meetingId) => {
  return await Batch.findByIdAndUpdate(
    batchId,
    { $pull: { scheduled_meetings: { _id: meetingId } } },
    { new: true }
  ).populate('course');
};

export const removeExpiredMeetings = async () => {
  
      const nepalTime = moment().tz("Asia/Kathmandu");
  
      // Extract the components of Nepal time
      const year = nepalTime.format("YYYY");
      const month = nepalTime.format("MM");
      const day = nepalTime.format("DD");
      const hour = nepalTime.format("HH");
      const minute = nepalTime.format("mm");
      const second = nepalTime.format("ss");
      const millisecond = nepalTime.format("SSS");
      // Format as if it were UTC time (but using Nepal's actual time components)
      const now = `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+00:00`;
    //  return {
    //   message: "sucess"
    //  }
  return await Batch.updateMany(
    { 'scheduled_meetings.expiryTime': { $lt: now } },
    { $pull: { scheduled_meetings: { expiryTime: { $lt: now } } } }
  );
};