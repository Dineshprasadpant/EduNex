// services/fileService.js
import { S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import path from 'path';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AMAZONWS_REGION,
  credentials: {
    accessKeyId: process.env.AMAZONWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AMAZONWS_SECRET_ACCESS_KEY,
  },
});

// Configure bucket names
const PUBLIC_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const PRIVATE_BUCKET_NAME = process.env.AWS_S3_BUCKET_FILE_NAME;

/**
 * Upload file to public AWS S3 bucket
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Upload result with public URL
 */
export const uploadToPublicS3 = async (file) => {
  try {
    const timestamp = Date.now();
    const randomString = Math.floor(Math.random() * 1000000000);
    
    // Create unique filename similar to the old format
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    const fileNameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
    const public_id = `${fileNameWithoutExt}-${timestamp}-${randomString}`;
    const key = `user-uploads/${public_id}.${fileExtension}`;
    
    // Upload file to public S3 bucket
    const uploadParams = {
      Bucket: PUBLIC_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Generate public URL for public bucket
    const publicUrl = `https://${PUBLIC_BUCKET_NAME}.s3.${process.env.AMAZONWS_REGION}.amazonaws.com/${key}`;
    
    return {
      success: true,
      message: 'File uploaded successfully to public bucket',
      data: {
        url: publicUrl,
        key: key,
        public_id: public_id,
        format: fileExtension,
        size: file.size,
        original_filename: file.originalname,
        bucket: 'public'
      }
    };
  } catch (error) {
    console.error('Public S3 upload error:', error);
    throw new Error('Failed to upload file to public S3 bucket');
  }
};

/**
 * Upload file to private AWS S3 bucket
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Upload result with key only (no public URL)
 */
export const uploadToPrivateS3 = async (file) => {
  try {
    const timestamp = Date.now();
    const randomString = Math.floor(Math.random() * 1000000000);
    
    // Create unique filename similar to the old format
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    const fileNameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
    const public_id = `${fileNameWithoutExt}-${timestamp}-${randomString}`;
    const key = `user-uploads/${public_id}.${fileExtension}`;
    
    // Upload file to private S3 bucket
    const uploadParams = {
      Bucket: PRIVATE_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Return only the key for private bucket (no public URL)
    return {
      success: true,
      message: 'File uploaded successfully to private bucket',
      data: {
        key: key,
        public_id: public_id,
        format: fileExtension,
        size: file.size,
        original_filename: file.originalname,
        bucket: 'private'
      }
    };
  } catch (error) {
    console.error('Private S3 upload error:', error);
    throw new Error('Failed to upload file to private S3 bucket');
  }
};

/**
 * Generate a signed URL for direct upload to private S3 bucket
 * @param {string} fileName - Original file name
 * @param {string} contentType - MIME type of the file
 * @param {number} expiresIn - URL expiration time in seconds (default from env or 3600 = 1 hour)
 * @returns {Promise<Object>} - Signed URL and file details
 */
export const generateSignedUploadUrl = async (fileName, contentType, expiresIn = null) => {
  try {
    const timestamp = Date.now();
    const randomString = Math.floor(Math.random() * 1000000000);
    
    // Create unique filename similar to the old format
    const fileExtension = path.extname(fileName).toLowerCase().substring(1);
    const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
    const public_id = `${fileNameWithoutExt}-${timestamp}-${randomString}`;
    const key = `user-uploads/${public_id}.${fileExtension}`;
    
    // Use environment variable for default expiration, fallback to 3600 seconds (1 hour)
    const defaultExpiresIn = parseInt(process.env.S3_UPLOAD_URL_EXPIRY) || 3600;
    const finalExpiresIn = expiresIn || defaultExpiresIn;
    
    // Create the PutObject command for private bucket
    const putObjectCommand = new PutObjectCommand({
      Bucket: PRIVATE_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    
    // Generate signed URL
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: finalExpiresIn
    });
    
    return {
      success: true,
      message: 'Signed URL generated successfully for private bucket',
      data: {
        signedUrl: signedUrl,
        key: key,
      }
    };
  } catch (error) {
    console.error('Signed URL generation error:', error);
    throw new Error('Failed to generate signed URL for upload');
  }
};

/**
 * Generate a signed URL for downloading/viewing a file from private bucket
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default from env or 3600 = 1 hour)
 * @returns {Promise<Object>} - Signed URL for download
 */
export const generateSignedDownloadUrl = async (key, expiresIn = null) => {
  try {
    // Import GetObjectCommand for downloads
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    // Use environment variable for default expiration, fallback to 3600 seconds (1 hour)
    const defaultExpiresIn = parseInt(process.env.S3_DOWNLOAD_URL_EXPIRY) || 3600;
    const finalExpiresIn = expiresIn || defaultExpiresIn;
    
    // Create the GetObject command for private bucket
    const getObjectCommand = new GetObjectCommand({
      Bucket: PRIVATE_BUCKET_NAME,
      Key: key,
    });
    
    // Generate signed URL
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: finalExpiresIn
    });
    
    return {
      success: true,
      message: 'Signed download URL generated successfully',
      data: {
        signedUrl: signedUrl,
      }
    };
  } catch (error) {
    console.error('Signed download URL generation error:', error);
    throw new Error('Failed to generate signed URL for download');
  }
};

/**
 * Delete file from S3 (works with both public and private buckets)
 * @param {string} s3Url - S3 URL or key
 * @returns {Promise<Object>} - Delete result
 */
export const deleteFromS3 = async (s3Url) => {
  try {
    let bucketName, objectKey;
    
    // Check if it's a URL or just a key
    if (s3Url.startsWith('http')) {
      const url = new URL(s3Url);
      
      if (url.hostname.includes('.s3.amazonaws.com')) {
        bucketName = url.hostname.split('.s3.amazonaws.com')[0];
        objectKey = decodeURIComponent(url.pathname.substring(1));
      } else if (url.hostname.includes('.s3.')) {
        bucketName = url.hostname.split('.s3.')[0];
        objectKey = decodeURIComponent(url.pathname.substring(1));
      } else {
        const pathParts = url.pathname.substring(1).split('/');
        bucketName = pathParts[0];
        objectKey = decodeURIComponent(pathParts.slice(1).join('/'));
      }
    } else {
      // If it's just a key, we need to determine which bucket it's in
      // You might want to store bucket information in your database
      // For now, we'll try both buckets
      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: PRIVATE_BUCKET_NAME,
          Key: s3Url
        }));
        bucketName = PRIVATE_BUCKET_NAME;
        objectKey = s3Url;
      } catch (err) {
        try {
          await s3Client.send(new HeadObjectCommand({
            Bucket: PUBLIC_BUCKET_NAME,
            Key: s3Url
          }));
          bucketName = PUBLIC_BUCKET_NAME;
          objectKey = s3Url;
        } catch (err2) {
          return { success: false, message: 'File not found in either bucket' };
        }
      }
    }

    // Delete the file
    const deleteParams = {
      Bucket: bucketName,
      Key: objectKey,
    };
    
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    
    return {
      success: true,
      message: 'File deleted successfully',
      bucket: bucketName
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    
    // More specific error messages
    if (error.name === 'NoSuchBucket') {
      throw new Error('S3 bucket does not exist');
    } else if (error.name === 'AccessDenied') {
      throw new Error('Permission denied to delete file');
    }
    
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Delete file from S3 by key (more efficient than URL parsing)
 * @param {string} key - S3 object key
 * @param {string} bucket - Optional bucket name (public or private)
 * @returns {Promise<Object>} - Delete result
 */
export const deleteFromS3ByKey = async (key, bucket = null) => {
  try {
    let bucketName;
    
    // If bucket is specified, use it
    if (bucket === 'public' || bucket === PUBLIC_BUCKET_NAME) {
      bucketName = PUBLIC_BUCKET_NAME;
    } else if (bucket === 'private' || bucket === PRIVATE_BUCKET_NAME) {
      bucketName = PRIVATE_BUCKET_NAME;
    } else {
      // If bucket is not specified, try to determine which bucket it's in
      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: PRIVATE_BUCKET_NAME,
          Key: key
        }));
        bucketName = PRIVATE_BUCKET_NAME;
      } catch (err) {
        try {
          await s3Client.send(new HeadObjectCommand({
            Bucket: PUBLIC_BUCKET_NAME,
            Key: key
          }));
          bucketName = PUBLIC_BUCKET_NAME;
        } catch (err2) {
          return { success: false, message: 'File not found in either bucket' };
        }
      }
    }

    // Delete the file
    const deleteParams = {
      Bucket: bucketName,
      Key: key,
    };
    
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    
    return {
      success: true,
      message: 'File deleted successfully',
      data: {
        key: key,
        bucket: bucketName
      }
    };
  } catch (error) {
    console.error('S3 delete by key error:', error);
    
    // More specific error messages
    if (error.name === 'NoSuchBucket') {
      throw new Error('S3 bucket does not exist');
    } else if (error.name === 'NoSuchKey') {
      throw new Error('File not found');
    } else if (error.name === 'AccessDenied') {
      throw new Error('Permission denied to delete file');
    }
    
    throw new Error('Failed to delete file from S3');
  }
};

// Legacy function for backward compatibility
export const uploadToS3 = uploadToPublicS3;