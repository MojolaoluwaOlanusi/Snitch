import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3 from '../config/s3Client.js';
import {
    IStorageService,
    UploadOptions,
    UploadResult,
    DeleteResult,
    TransformOptions,
    PresignedUrlResult,
} from '../types/storage.js';

/**
 * S3 Storage Service
 *
 * Implements the IStorageService interface for S3-compatible storage (S3, MinIO, R2).
 * Handles file uploads, deletions, URL generation, and presigned URLs for S3.
 */
export class S3Service implements IStorageService {
    private bucket: string;
    private endpoint: string;

    constructor() {
        this.bucket = process.env.S3_BUCKET || 'snitch';
        this.endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';

        console.log('[S3Service] Initialized with bucket:', this.bucket, 'endpoint:', this.endpoint);
    }

    /**
     * Upload a file to S3
     * @param file - File as Buffer or string (URL/base64)
     * @param options - Upload options
     * @returns Promise resolving to upload result
     */
    async uploadFile(file: Buffer | string, options: UploadOptions): Promise<UploadResult> {
        try {
            const {
                folder = 'uploads',
                publicId,
                contentType = 'application/octet-stream',
                fileName,
            } = options;

            // Generate key from folder and publicId or fileName
            const key = publicId
                ? `${folder}/${publicId}`
                : `${folder}/${fileName || Date.now()}`;

            // 🔥 Fix: Handle both Buffer and string types
            let body: Buffer;
            if (typeof file === 'string') {
                // If it's a string, assume it's base64 encoded data
                // Remove data URL prefix if present (e.g., "data:image/png;base64,")
                const base64Data = file.includes('base64,')
                    ? file.split('base64,')[1]
                    : file;
                body = Buffer.from(base64Data, 'base64');
            } else {
                // If it's already a Buffer, use it directly
                body = file;
            }

            // Upload to S3
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            });

            await s3.send(command);

            // Generate public URL
            const url = `${this.endpoint}/${this.bucket}/${key}`;

            return {
                url,
                secureUrl: url,
                publicId: key,
                key,
                bytes: body.length,
            };
        } catch (error) {
            console.error('[S3Service] Upload failed:', error);
            throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete a file from S3
     * @param publicId - Unique identifier of the file to delete (S3 key)
     * @returns Promise resolving to delete result
     */
    async deleteFile(publicId: string): Promise<DeleteResult> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: publicId,
            });

            await s3.send(command);

            return {
                ok: true,
                message: 'File deleted successfully',
            };
        } catch (error) {
            console.error('[S3Service] Delete failed:', error);
            return {
                ok: false,
                message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get a public URL for a file
     * For S3, transformations are not supported natively, so we return the direct URL
     * @param publicId - Unique identifier of the file (S3 key)
     * @param options - Optional transformation options (not supported for S3)
     * @returns Public URL string
     */
    getFileUrl(publicId: string, options?: TransformOptions): string {
        // S3 doesn't support transformations natively
        // Return the direct URL
        return `${this.endpoint}/${this.bucket}/${publicId}`;
    }

    /**
     * Generate a presigned URL for direct client uploads
     * @param key - Storage key for the file
     * @param contentType - Content type of the file
     * @param options - Additional upload options
     * @returns Promise resolving to presigned URL result
     */
    async generatePresignedUrl(
        key: string,
        contentType: string,
        options?: UploadOptions
    ): Promise<PresignedUrlResult> {
        try {
            const { folder = 'uploads' } = options || {};
            const fullKey = folder ? `${folder}/${key}` : key;

            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
                ContentType: contentType,
            });

            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

            const publicUrl = `${this.endpoint}/${this.bucket}/${fullKey}`;

            return {
                ok: true,
                uploadUrl,
                publicUrl,
                key: fullKey,
                expiresIn: 3600,
                message: 'Presigned URL generated successfully',
            };
        } catch (error) {
            console.error('[S3Service] Presigned URL generation failed:', error);
            return {
                ok: false,
                message: `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get the S3 client instance for advanced operations
     * @returns S3Client instance
     */
    getS3Client() {
        return s3;
    }
}

export default S3Service;