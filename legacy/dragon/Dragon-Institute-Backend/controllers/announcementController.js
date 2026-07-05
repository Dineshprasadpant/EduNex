import * as service from '../services/announcementService.js';

export const createAnnouncement = async (req, res) => {
    try {
        const announcement = await service.createAnnouncement(req.body);
        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAnnouncement = async (req, res) => {
    try {
        const announcement = await service.getAnnouncement(req.params.id);
        res.json(announcement);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getAllAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const announcements = await service.getAllAnnouncements(page, limit);
        res.json({
            data: announcements
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const announcement = await service.updateAnnouncement(
            req.params.id,
            req.body
        );
        res.json(announcement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await service.deleteAnnouncement(req.params.id);
        res.json({ message: 'Announcement deleted successfully', announcement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};