import express from "express";
import {
  getAdvertisements,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
} from "../controllers/advertisementController.js";
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.get("/", getAdvertisements);
router.get("/:id", getAdvertisementById);
router.post("/",authenticateToken, isAdmin, createAdvertisement);
router.put("/:id",authenticateToken, isAdmin, updateAdvertisement);
router.delete("/:id", authenticateToken, isAdmin, deleteAdvertisement);

export default router;