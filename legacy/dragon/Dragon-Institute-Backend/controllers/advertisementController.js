import {
    getAdvertisements as getAdsService,
    getAdvertisement,
    createAd,
    updateAd,
    deleteAd,
  } from "../services/advertisementService.js";
  
  export const getAdvertisements = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
  
    const ads = await getAdsService(page, limit);
    res.json(ads);
  };
  
  export const getAdvertisementById = async (req, res) => {
    const ad = await getAdvertisement(req.params.id);
    if (ad) {
      res.json(ad);
    } else {
      res.status(404).json({ message: "Advertisement not found" });
    }
  };
  
  export const createAdvertisement = async (req, res) => {
    const newAd = await createAd(req.body);
    res.status(201).json(newAd);
  };
  
  export const updateAdvertisement = async (req, res) => {
    const updatedAd = await updateAd(req.params.id, req.body);
    if (updatedAd) {
      res.json(updatedAd);
    } else {
      res.status(404).json({ message: "Advertisement not found" });
    }
  };
  
  export const deleteAdvertisement = async (req, res) => {
    await deleteAd(req.params.id);
    res.status(204).send();
  };