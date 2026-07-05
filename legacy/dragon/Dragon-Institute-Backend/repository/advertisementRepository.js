import Advertisement from "../models/advertisementModel.js";

export const getAdvertisements = async (page, limit) => {
  const skip = (page - 1) * limit;

  const totalObjects = await Advertisement.countDocuments();

  const totalPages = Math.ceil(totalObjects / limit);

  const currentObjects = await Advertisement.find().skip(skip).limit(limit).exec();

  return {
    totalObjects, 
    totalPages,  
    currentPage: page, 
    currentObjects, 
  };
};

export const getAdvertisementById = async (id) => {
  return await Advertisement.findById(id).exec();
};

export const createAdvertisement = async (ad) => {
  const newAd = new Advertisement(ad);
  return await newAd.save();
};

export const updateAdvertisement = async (id, updatedAd) => {
  return await Advertisement.findByIdAndUpdate(id, updatedAd, { new: true }).exec();
};

export const deleteAdvertisement = async (id) => {
  return await Advertisement.findByIdAndDelete(id).exec();
};