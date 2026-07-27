/**
 * Storage Service Type Definitions
 * 
 * This file defines the common interface for all storage services (S3, Cloudinary, etc.)
 * ensuring that different storage backends can be used interchangeably.
 */

/**
 * Upload options for storage services
 */
export interface UploadOptions {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any;
    tags?: string[];
    context?: Record<string, string>;
    contentType?: string;
    fileName?: string;
    expiresInSeconds?: number;
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
    /** Public URL of the uploaded file */
    url: string;
    /** Secure URL (HTTPS) of the uploaded file */
    secureUrl: string;
    /** Unique identifier for the file in the storage service */
    publicId: string;
    /** File format/extension */
    format?: string;
    /** Width of the file (for images/videos) */
    width?: number;
    /** Height of the file (for images/videos) */
    height?: number;
    /** File size in bytes */
    bytes?: number;
    /** Timestamp when the file was created */
    createdAt?: string;
    /** Storage-specific key (for S3) */
    key?: string;
}

/**
 * Result of a file deletion operation
 */
export interface DeleteResult {
    /** Whether the deletion was successful */
    ok: boolean;
    /** Message or error details */
    message?: string;
}

/**
 * Transformation options for generating URLs
 */
export interface TransformOptions {
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    /** Crop mode (fill, fit, crop, etc.) */
    crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'limit' | 'pad';
    /** Quality (1-100) */
    quality?: number;
    /** Format to convert to (webp, jpg, png, etc.) */
    format?: string;
    /** Additional transformation options */
    [key: string]: any;
}

/**
 * Result of generating a presigned URL
 */
export interface PresignedUrlResult {
    /** Whether the operation was successful */
    ok: boolean;
    /** Presigned URL for direct upload */
    uploadUrl?: string;
    /** Public URL after upload */
    publicUrl?: string;
    /** Storage key for the file */
    key?: string;
    /** Expiration time in seconds */
    expiresIn?: number;
    /** Message or error details */
    message?: string;
}

/**
 * Common interface for all storage services
 * All storage implementations (S3, Cloudinary, etc.) must implement this interface
 */
export interface IStorageService {
    /**
     * Upload a file to the storage service
     * @param file - File as Buffer or string (URL/base64)
     * @param options - Upload options
     * @returns Promise resolving to upload result
     */
    uploadFile(file: Buffer | string, options: UploadOptions): Promise<UploadResult>;

    /**
     * Delete a file from the storage service
     * @param publicId - Unique identifier of the file to delete
     * @returns Promise resolving to delete result
     */
    deleteFile(publicId: string): Promise<DeleteResult>;

    /**
     * Get a public URL for a file
     * @param publicId - Unique identifier of the file
     * @param options - Optional transformation options
     * @returns Public URL string
     */
    getFileUrl(publicId: string, options?: TransformOptions): string;

    /**
     * Generate a presigned URL for direct client uploads
     * @param key - Storage key for the file
     * @param contentType - Content type of the file
     * @param options - Additional options
     * @returns Promise resolving to presigned URL result
     */
    generatePresignedUrl(key: string, contentType: string, options?: UploadOptions): Promise<PresignedUrlResult>;
}
