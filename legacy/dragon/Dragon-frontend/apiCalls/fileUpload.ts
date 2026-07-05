import Cookies from "js-cookie";
import toast from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface UploadUrlResponse {
  success: boolean;
  message?: string;
  data: {
    signedUrl: string;
    public_id: string;
    key: string;
    format: string;
    original_filename: string;
    expiresIn: number;
    expiresAt: string;
    bucket: string;
  };
}

interface DownloadUrlResponse {
  success: boolean;
  message?: string;
  data: {
    signedUrl: string;
  };
}

interface FileUploadResult {
  success: boolean;
  data: {
    url: string;
    fileKey: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    public_id?: string;
    format?: string;
    bucket?: string;
  };
  message?: string;
}

// File size limits in bytes
const FILE_SIZE_LIMITS = {
  // Documents
  'application/pdf': 100 * 1024 * 1024, // 100 MB - For comprehensive course materials, textbooks
  'application/msword': 50 * 1024 * 1024, // 50 MB - For large documents with embedded media
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 50 * 1024 * 1024, // 50 MB
  'application/vnd.ms-powerpoint': 100 * 1024 * 1024, // 100 MB - For presentations with videos/images
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 100 * 1024 * 1024, // 100 MB
  'application/vnd.ms-excel': 50 * 1024 * 1024, // 50 MB - For large datasets, grade sheets
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 50 * 1024 * 1024, // 50 MB
  
  // Images
  'image/png': 25 * 1024 * 1024, // 25 MB - For high-quality educational images
  'image/jpeg': 25 * 1024 * 1024, // 25 MB
  'image/svg+xml': 5 * 1024 * 1024, // 5 MB - For complex vector graphics
  'image/gif': 20 * 1024 * 1024, // 20 MB - For educational animations
  'image/webp': 25 * 1024 * 1024, // 25 MB - Modern image format
  
  // Videos
  'video/mp4': 500 * 1024 * 1024, // 500 MB - For educational videos, lectures
  'video/webm': 500 * 1024 * 1024, // 500 MB
  'video/avi': 500 * 1024 * 1024, // 500 MB
  'video/mov': 500 * 1024 * 1024, // 500 MB
  'video/wmv': 500 * 1024 * 1024, // 500 MB
  
  // Audio
  'audio/mp3': 50 * 1024 * 1024, // 50 MB - For audio lectures, podcasts
  'audio/wav': 100 * 1024 * 1024, // 100 MB - For high-quality audio
  'audio/ogg': 50 * 1024 * 1024, // 50 MB
  'audio/m4a': 50 * 1024 * 1024, // 50 MB
  
  // Archives
  'application/zip': 200 * 1024 * 1024, // 200 MB - For course packages, assignments
  'application/x-rar-compressed': 200 * 1024 * 1024, // 200 MB
  'application/x-7z-compressed': 200 * 1024 * 1024, // 200 MB
  
  // Code files
  'text/plain': 10 * 1024 * 1024, // 10 MB - For code files, scripts
  'application/json': 10 * 1024 * 1024, // 10 MB
  'text/html': 10 * 1024 * 1024, // 10 MB
  'text/css': 10 * 1024 * 1024, // 10 MB
  'application/javascript': 10 * 1024 * 1024, // 10 MB
  'text/xml': 10 * 1024 * 1024, // 10 MB
  
  // E-books and educational formats
  'application/epub+zip': 100 * 1024 * 1024, // 100 MB - For e-books
  'application/x-mobipocket-ebook': 100 * 1024 * 1024, // 100 MB
  'application/vnd.amazon.ebook': 100 * 1024 * 1024, // 100 MB
};

export const uploadFile = async (file: File) => {
  // Check file type and size
  const fileType = file.type;
  const fileSize = file.size;
  
  // Get the appropriate size limit for the file type
  const sizeLimit = FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS];
  
  if (!sizeLimit) {
    toast.error('Invalid file type. Supported formats: Documents (PDF, Word, PowerPoint, Excel), Images (PNG, JPEG, SVG, GIF, WebP), Videos (MP4, WebM, AVI, MOV, WMV), Audio (MP3, WAV, OGG, M4A), Archives (ZIP, RAR, 7Z), Code files, and E-books.');
    throw new Error('Invalid file type');
  }

  if (fileSize > sizeLimit) {
    const maxSizeInMB = sizeLimit / (1024 * 1024);
    toast.error(`Maximum file size reached. Maximum allowed: ${maxSizeInMB} MB`);
    throw new Error(`File size exceeds the maximum limit of ${maxSizeInMB} MB`);
  }

  const formData = new FormData();
  formData.append('file', file);

  const authToken = Cookies.get('token');
  if (!authToken) {
    toast.error('Authentication token not found');
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  } catch (error) {
    toast.error('Failed to upload file');
    throw error;
  }
};

export const deleteUploadedFile = async (s3Url: string) => {
  try {
    const authToken = Cookies.get('token');
    if (!authToken) {
      toast.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${BASE_URL}/files/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ s3Url }), 
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const uploadFilev2 = async (file: File): Promise<FileUploadResult> => {
  // Check file type and size
  const fileType = file.type;
  const fileSize = file.size;
  
  // Get the appropriate size limit for the file type
  const sizeLimit = FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS];
  
  if (!sizeLimit) {
    toast.error('Invalid file type. Supported formats: Documents (PDF, Word, PowerPoint, Excel), Images (PNG, JPEG, SVG, GIF, WebP), Videos (MP4, WebM, AVI, MOV, WMV), Audio (MP3, WAV, OGG, M4A), Archives (ZIP, RAR, 7Z), Code files, and E-books.');
    throw new Error('Invalid file type');
  }

  if (fileSize > sizeLimit) {
    const maxSizeInMB = sizeLimit / (1024 * 1024);
    toast.error(`Maximum file size reached. Maximum allowed: ${maxSizeInMB} MB`);
    throw new Error(`File size exceeds the maximum limit of ${maxSizeInMB} MB`);
  }

  const authToken = Cookies.get('token');
  if (!authToken) {
    toast.error('Authentication token not found');
    throw new Error('Authentication token not found');
  }

  try {
    // Step 1: Generate pre-signed upload URL
    const uploadUrlResponse = await generateUploadUrlv2(file.name, file.type);
    
    if (!uploadUrlResponse.success) {
      throw new Error(uploadUrlResponse.message || 'Failed to generate upload URL');
    }

    // Step 2: Upload file directly to S3
    const uploadResult = await uploadToS3v2(file, uploadUrlResponse.data.signedUrl, uploadUrlResponse.data.key, {
      public_id: uploadUrlResponse.data.public_id,
      format: uploadUrlResponse.data.format,
      bucket: uploadUrlResponse.data.bucket,
    });
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.message || 'Failed to upload file to S3');
    }

    return uploadResult;
  } catch (error) {
    toast.error('Failed to upload file');
    throw error;
  }
};


export const deleteUploadedFilev2 = async (fileKey: string) => {
  try {
    const authToken = Cookies.get('token');
    if (!authToken) {
      toast.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${BASE_URL}/files/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ key: fileKey }), // Send the file key instead of s3Url
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Generates a pre-signed upload URL for S3
 * @param fileName Name of the file to upload
 * @param contentType MIME type of the file
 * @param expiresIn Expiration time in seconds (default: 3600)
 * @returns Promise with upload URL and file key
 */
export const generateUploadUrlv2 = async (
  fileName: string, 
  contentType: string, 
  expiresIn: number = 3600
): Promise<UploadUrlResponse> => {
  const authToken = Cookies.get('token');
  if (!authToken) {
    toast.error('Authentication token not found');
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${BASE_URL}/files/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        fileName,
        contentType,
        expiresIn,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Generate upload URL error:', error);
    throw error;
  }
};

/**
 * Generates a pre-signed download URL for S3
 * @param key S3 file key
 * @returns Promise with download URL
 */
export const generateDownloadUrlv2 = async (key: string): Promise<DownloadUrlResponse> => {
  const authToken = Cookies.get('token');
  if (!authToken) {
    toast.error('Authentication token not found');
    throw new Error('Authentication token not found');
  }

  try {
    const response = await fetch(`${BASE_URL}/files/generate-download-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        key,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate download URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Generate download URL error:', error);
    throw error;
  }
};

/**
 * Uploads a file directly to S3 using a pre-signed URL
 * @param file File to upload
 * @param uploadUrl Pre-signed upload URL
 * @returns Promise with upload result
 */
export const uploadToS3v2 = async (file: File, signedUrl: string, fileKey?: string, metadata?: {
  public_id?: string;
  format?: string;
  bucket?: string;
}): Promise<FileUploadResult> => {
  try {
    // Ensure the file is read as binary data
    
    const fileBuffer = await file.arrayBuffer();
    
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: fileBuffer, // Send as binary data
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3 upload failed:', response.status, errorText);
      throw new Error(`Failed to upload file to S3: ${response.status} ${errorText}`);
    }


    return {
      success: true,
      data: {
        url: fileKey || '', // Return the file key to store in database
        fileKey: fileKey || '', // Use the passed fileKey parameter
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        public_id: metadata?.public_id,
        format: metadata?.format,
        bucket: metadata?.bucket,
      },
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

