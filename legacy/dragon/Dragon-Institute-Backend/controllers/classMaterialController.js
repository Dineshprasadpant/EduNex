import {
    getClassMaterialByIdService,
    updateClassMaterialService,
    getPaginatedClassMaterialsService,
    createClassMaterialService,
    deleteClassMaterialService,
    getAllPaginatedClassMaterialsService
  } from '../services/classMaterialService.js';
  
  export const getClassMaterial = async (req, res) => {
    try {
      const material = await getClassMaterialByIdService(req.params.id);
      if (!material) {
        return res.status(404).json({ message: 'Class material not found' });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const createClassMaterial = async (req, res) => {
    try {
      const { title, description, file_url, batches } = req.body;
      if (!title || !description || !file_url || !batches) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      const material = await createClassMaterialService(req.body);
      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const updateClassMaterial = async (req, res) => {
    try {
      const material = await updateClassMaterialService(req.params.id, req.body);
      if (!material) {
        return res.status(404).json({ message: 'Class material not found' });
      }
      res.json(material);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const deleteClassMaterial = async (req, res) => {
    try {
      const material = await deleteClassMaterialService(req.params.id);
      if (!material) {
        return res.status(404).json({ message: 'Class material not found' });
      }
      res.json({ message: 'Class material deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const getClassMaterials = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await getPaginatedClassMaterialsService(
        req.params.batchId,
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const getAllClassMaterials = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await getAllPaginatedClassMaterialsService(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };