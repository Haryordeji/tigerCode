// src/services/upload.service.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createMedia } from '../src/models/media.model';

// Base directory for file uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Supported file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/gif',
  'application/pdf'
];

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface UploadResult {
  id: string;
  filePath: string;
  originalName: string;
  contentType: string;
}

/**
 * Upload a file and create a media record
 */
export async function uploadFile(
  file: UploadedFile,
  entityType: string,
  entityId: string,
  mediaType: string
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  
  // Generate a unique filename
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  
  // Create subfolder for entity type
  const entityDir = path.join(UPLOAD_DIR, entityType);
  if (!fs.existsSync(entityDir)) {
    fs.mkdirSync(entityDir, { recursive: true });
  }
  
  // Full path to save the file
  const filePath = path.join(entityDir, fileName);
  
  // Write the file
  fs.writeFileSync(filePath, file.buffer);
  
  // Get the relative path for storage in the database
  const relativeFilePath = `/uploads/${entityType}/${fileName}`;
  
  // Create media record in database
  const media = await createMedia({
    entity_type: entityType,
    entity_id: entityId,
    media_type: mediaType,
    file_path: relativeFilePath,
    original_name: file.originalname,
    content_type: file.mimetype
  });
  
  return {
    id: media.id,
    filePath: relativeFilePath,
    originalName: file.originalname,
    contentType: file.mimetype
  };
}

/**
 * Delete a file from storage
 */
export function deleteFile(filePath: string): boolean {
  try {
    // Convert relative DB path to actual file path
    const actualPath = path.join(
      __dirname, 
      '../../', 
      filePath.startsWith('/') ? filePath.substring(1) : filePath
    );
    
    if (fs.existsSync(actualPath)) {
      fs.unlinkSync(actualPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}