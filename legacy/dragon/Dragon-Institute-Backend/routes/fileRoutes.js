
// routes/fileRoutes.js
import express from 'express';
import { uploadFile, uploadToPublicBucket, uploadToPrivateBucket, deleteFile, deleteFileByKey, deleteFileByUrl, upload, generateUploadUrl, generateDownloadUrl } from '../controllers/fileController.js';
import { authenticateToken, isUser, isBoth, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Upload single file (defaults to public bucket for backward compatibility)
router.post('/upload', authenticateToken, isUser, upload.single('file'), uploadFile);

// Upload to public bucket (publicly accessible files)
router.post('/upload/public', authenticateToken, isUser, upload.single('file'), uploadToPublicBucket);

// Upload to private bucket (requires signed URLs for access)
router.post('/upload/private', authenticateToken, isUser, upload.single('file'), uploadToPrivateBucket);

// Generate signed URL for direct S3 upload to private bucket
router.post('/generate-upload-url', authenticateToken, isAdmin, generateUploadUrl);

// Generate signed URL for downloading/viewing files from private bucket
router.post('/generate-download-url', authenticateToken, isUser, generateDownloadUrl);

// Delete file by s3Url (works with both public and private buckets)
router.post('/delete', authenticateToken, isAdmin, deleteFile);

// Delete file by key (more efficient, can specify bucket)
router.post('/delete/key', authenticateToken, isAdmin, deleteFileByKey);

// Delete file by URL (alternative to /delete endpoint)
router.post('/delete/url', authenticateToken, isAdmin, deleteFileByUrl);

export default router;