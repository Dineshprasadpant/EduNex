// controllers/fileController.js
import { uploadToS3, uploadToPublicS3, uploadToPrivateS3, deleteFromS3, deleteFromS3ByKey, generateSignedUploadUrl, generateSignedDownloadUrl } from '../services/fileService.js';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Default to public bucket for backward compatibility
    const result = await uploadToPublicS3(req.file);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'File upload failed'
    });
  }
};

export const uploadToPublicBucket = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const result = await uploadToPublicS3(req.file);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Public upload error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Public file upload failed'
    });
  }
};

export const uploadToPrivateBucket = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const result = await uploadToPrivateS3(req.file);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Private upload error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Private file upload failed'
    });
  }
};

export const generateUploadUrl = async (req, res) => {
  try {
    const { fileName, contentType, expiresIn } = req.body;

    // Validate required fields
    if (!fileName) {
      return res.status(400).json({ 
        success: false, 
        message: 'fileName is required' 
      });
    }

    if (!contentType) {
      return res.status(400).json({ 
        success: false, 
        message: 'contentType is required' 
      });
    }

    // Validate expiresIn if provided
    if (expiresIn && (isNaN(expiresIn) || expiresIn < 60 || expiresIn > 86400)) {
      return res.status(400).json({ 
        success: false, 
        message: 'expiresIn must be between 60 and 86400 seconds (1 minute to 24 hours)' 
      });
    }

    const result = await generateSignedUploadUrl(fileName, contentType, expiresIn);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Generate upload URL error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate upload URL',
    });
  }
};

export const generateDownloadUrl = async (req, res) => {
  try {
    const { key, expiresIn } = req.body;

    // Validate required fields
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        message: 'key is required' 
      });
    }

    // Validate expiresIn if provided
    if (expiresIn && (isNaN(expiresIn) || expiresIn < 60 || expiresIn > 86400)) {
      return res.status(400).json({ 
        success: false, 
        message: 'expiresIn must be between 60 and 86400 seconds (1 minute to 24 hours)' 
      });
    }

    const result = await generateSignedDownloadUrl(key, expiresIn);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Generate download URL error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate download URL',
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { s3Url } = req.body;

    if (!s3Url) {
      return res.status(400).json({ success: false, message: 's3Url is required' });
    }

    const result = await deleteFromS3(s3Url);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'File deletion failed',
    });
  }
};

export const deleteFileByKey = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ success: false, message: 'key is required' });
    }
    const bucket = 'private';
    const result = await deleteFromS3ByKey(key, bucket);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete by key error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'File deletion failed',
    });
  }
};

export const deleteFileByUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'url is required' });
    }

    const result = await deleteFromS3(url);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete by URL error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'File deletion failed',
    });
  }
};
