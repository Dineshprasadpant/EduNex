import {
    getAdvertisements as getAdsRepo,
    getAdvertisementById,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
  } from "../repository/advertisementRepository.js";
    import { deleteFromS3 } from './fileService.js'; // Adjust path as needed
  
  export const getAdvertisements = async (page = 1, limit = 10) => {
    return await getAdsRepo(page, limit);
  };
  
  export const getAdvertisement = async (id) => {
    return await getAdvertisementById(id);
  };
  
  export const createAd = async (ad) => {
    return await createAdvertisement(ad);
  };
  
  export const updateAd = async (id, updatedAd) => {
    return await updateAdvertisement(id, updatedAd);
  };
  


export const deleteAd = async (id) => {
  try {
    // First get the advertisement to access its image URL
    const advertisement = await getAdvertisementById(id);
    if (!advertisement) {
      throw new Error('Advertisement not found');
    }

    // Delete the image from S3 if it exists
    if (advertisement.imageUrl) {
      await deleteFromS3(advertisement.imageUrl).catch(error => {
        console.error(`Failed to delete advertisement image ${advertisement.imageUrl}:`, error.message);
        // Continue with deletion even if image deletion fails
      });
    }

    // Now delete the advertisement from database
    const deletedAd = await deleteAdvertisement(id);
    
    return deletedAd;
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    throw error;
  }
};