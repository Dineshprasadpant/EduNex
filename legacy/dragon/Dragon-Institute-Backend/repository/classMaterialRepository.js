import ClassMaterial from '../models/classMaterial.js';

export const createClassMaterial = async (materialData) => {
  return await ClassMaterial.create(materialData);
};

export const getClassMaterialById = async (materialId) => {
  return await ClassMaterial.findById(materialId);
};

export const updateClassMaterial = async (materialId, updateData) => {
  return await ClassMaterial.findByIdAndUpdate(materialId, updateData, { new: true });
};

export const deleteClassMaterial = async (materialId) => {
  return await ClassMaterial.findByIdAndDelete(materialId);
};

export const getPaginatedClassMaterials = async (batchId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  // Query for materials that include the specified batchId in their batches array
  const query = { batches: batchId };
  
  const total = await ClassMaterial.countDocuments(query);
  const materials = await ClassMaterial.find(query)
  .select("-batches -__v")
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 })
    ;

  return {
    materials,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
};

export const getAllPaginatedClassMaterials = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const total = await ClassMaterial.countDocuments();
    const materials = await ClassMaterial.find()
    .populate({
      path: 'batches',
      select: 'batch_name _id', 
    })
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 })
      ;
  
    return {
      materials,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    };
  };