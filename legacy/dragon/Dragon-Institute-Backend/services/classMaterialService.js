import {
  createClassMaterial,
  getClassMaterialById,
  updateClassMaterial,
  deleteClassMaterial,
  getPaginatedClassMaterials,
  getAllPaginatedClassMaterials
} from '../repository/classMaterialRepository.js';
import { emailService } from '../services/mailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import { deleteFromS3 } from './fileService.js'; 

// Configure Handlebars
handlebars.noConflict();

// Get template path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '../classMaterialNotificationTemplate.html');

// Simple in-memory cache for the compiled template
let materialTemplate = null;

const loadTemplate = () => {
  if (materialTemplate) return materialTemplate;
  
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Validate template size
    if (Buffer.byteLength(templateContent, 'utf8') > 100000) {
      throw new Error('Class material template is too large (>100KB)');
    }
    
    materialTemplate = handlebars.compile(templateContent, {
      noEscape: true,
      strict: false
    });
    
    return materialTemplate;
  } catch (err) {
    console.error('Error loading class material template:', err);
    throw new Error('Failed to load class material template');
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const prepareMaterialEmailContent = (materialData) => {
  const template = loadTemplate();
  const material = materialData.toObject ? materialData.toObject() : {...materialData};

  const renderedHtml = template({
    title: material.title,
    description: material.description,
    batches: material.batches || [],
    uploadedDate: formatDate(material.created_at),
    unsubscribeLink: 'https://yourdomain.com/unsubscribe'
  }).replace(/\s+/g, ' ').trim();

  if (Buffer.byteLength(renderedHtml, 'utf8') > 256000) {
    console.warn('Warning: Large class material email content size may cause delivery issues');
  }

  return {
    subject: `New Class Material: ${material.title}`,
    html: renderedHtml
  };
};

const sendMaterialNotifications = async (material) => {
  try {
    const emailContent = prepareMaterialEmailContent(material);
    console.log(`Class material email size: ${Buffer.byteLength(emailContent.html, 'utf8')} bytes`);
    
    // Send to each batch separately
    const batchResults = await Promise.all(material.batches.map(async batchId => {
      return await emailService.sendBulkEmails({
        target: 'batch',
        batchId: batchId,
        subject: emailContent.subject,
        body: emailContent.html,
        isHtml: true
      });
    }));
    
    const totalSent = batchResults.reduce((sum, result) => sum + (result.sentCount || 0), 0);
    
    return batchResults;
  } catch (err) {
    console.error('Error sending material notifications:', err);
    throw err;
  }
};

export const createClassMaterialService = async (materialData) => {
  // Ensure batches is an array
  if (!Array.isArray(materialData.batches)) {
    materialData.batches = [materialData.batches];
  }

  const material = await createClassMaterial(materialData);
  
  // Send notifications in background (don't await)
  sendMaterialNotifications(material)
    .catch(err => console.error('Background material notification error:', err));
  
  return material;
};
  
  export const getClassMaterialByIdService = async (materialId) => {
    return await getClassMaterialById(materialId);
  };
  
  export const updateClassMaterialService = async (materialId, updateData) => {
    // If updating batches, ensure it's an array
    if (updateData.batches && !Array.isArray(updateData.batches)) {
      updateData.batches = [updateData.batches];
    }
    return await updateClassMaterial(materialId, updateData);
  };
  


export const deleteClassMaterialService = async (materialId) => {
  try {
    // First get the material to access its file URL
    const material = await getClassMaterialById(materialId);
    if (!material) {
      throw new Error('Class material not found');
    }

    // Delete the file from S3 if it exists
    if (material.file_url) {
      await deleteFromS3(material.file_url).catch(error => {
        console.error(`Failed to delete class material file ${material.file_url}:`, error.message);
        // Continue with deletion even if file deletion fails
      });
    }

    // Now delete the material from database
    const deletedMaterial = await deleteClassMaterial(materialId);
    
    return deletedMaterial;
  } catch (error) {
    console.error('Error deleting class material:', error);
    throw error;
  }
};
  
  export const getPaginatedClassMaterialsService = async (batchId, page, limit) => {
    return await getPaginatedClassMaterials(batchId, page, limit);
  };

  export const getAllPaginatedClassMaterialsService = async (page, limit) => {
    return await getAllPaginatedClassMaterials(page, limit);
  };