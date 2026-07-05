import AnnouncementModel from '../models/announcement.js';

export const createAnnouncement = async (announcementData) => {
    const announcement = new AnnouncementModel(announcementData);
    return await announcement.save();
};

export const getAnnouncementById = async (id) => {
    return await AnnouncementModel.findOne({ 
        _id: id 
    });
};

export const getAllAnnouncements = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const total = await AnnouncementModel.countDocuments();


    const announcements = await AnnouncementModel.find()
        .select("title content _id announcedDate image")
        .sort({ announcedDate: -1 })
        .skip(skip)
        .limit(limit);

    return {
        total, 
        page,  
        limit, 
        announcements, 
    };
};


export const updateAnnouncement = async (id, updateData) => {
    return await AnnouncementModel.findOneAndUpdate(
        { _id: id},
        updateData,
        { new: true, runValidators: true }
    );
};

export const deleteAnnouncement = async (id) => {
    return await AnnouncementModel.findOneAndDelete({ 
        _id: id 
    });
};