import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import {
    IStorageService,
    UploadOptions,
    UploadResult,
    DeleteResult,
    TransformOptions,
    PresignedUrlResult,
} from '../types/storage.js';

/**
 * Cloudinary Storage Service
 * 
 * Implements the IStorageService interface for Cloudinary media storage.
 * Handles file uploads, deletions, URL generation, and presigned URLs for Cloudinary.
 */
export class CloudinaryService implements IStorageService {
    private cloudName: string;
    private apiKey: string;
    private apiSecret: string;
    private uploadFolder: string;

    constructor() {
        // Initialize Cloudinary configuration from environment variables
        this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
        this.apiKey = process.env.CLOUDINARY_API_KEY || '';
        this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';
        this.uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'snitch';

        if (!this.cloudName || !this.apiKey || !this.apiSecret) {
            console.warn('[CloudinaryService] Missing required environment variables. Cloudinary may not work properly.');
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: this.cloudName,
            api_key: this.apiKey,
            api_secret: this.apiSecret,
            secure: true,
        });

        console.log('[CloudinaryService] Initialized with cloud:', this.cloudName);
    }

    /**
     * Upload a file to Cloudinary
     * @param file - File as Buffer or string (URL/base64)
     * @param options - Upload options
     * @returns Promise resolving to upload result
     */
    async uploadFile(file: Buffer | string, options: UploadOptions): Promise<UploadResult> {
        try {
            const {
                folder = this.uploadFolder,
                publicId,
                resourceType = 'auto',
                transformation,
                tags = [],
                context = {},
                contentType,
                fileName,
            } = options;

            // Build upload options
            const uploadOptions: any = {
                folder,
                resource_type: resourceType,
                tags,
                context,
            };

            if (publicId) {
                uploadOptions.public_id = publicId;
            }

            if (transformation) {
                uploadOptions.transformation = transformation;
            }

            let result;

            if (file instanceof Buffer) {
                // Upload Buffer/stream using upload_stream
                result = await new Promise((resolve, reject) => {
                    const stream = Readable.from(file);
                    const uploadStream = cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.pipe(uploadStream);
                });
            } else if (typeof file === 'string') {
                // Upload URL or base64 string
                if (file.startsWith('http://') || file.startsWith('https://')) {
                    // Upload from URL
                    result = await cloudinary.uploader.upload(file, uploadOptions);
                } else {
                    // Upload base64 string
                    result = await cloudinary.uploader.upload(file, uploadOptions);
                }
            } else {
                throw new Error('Invalid file type. Expected Buffer or string.');
            }

            // Return standardized upload result
            return {
                url: result.url,
                secureUrl: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                createdAt: result.created_at,
            };
        } catch (error) {
            console.error('[CloudinaryService] Upload failed:', error);
            throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete a file from Cloudinary
     * @param publicId - Unique identifier of the file to delete
     * @returns Promise resolving to delete result
     */
    async deleteFile(publicId: string): Promise<DeleteResult> {
        try {
            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result === 'ok' || result.result === 'not found') {
                return {
                    ok: true,
                    message: result.result === 'ok' ? 'File deleted successfully' : 'File not found (already deleted)',
                };
            } else {
                return {
                    ok: false,
                    message: `Failed to delete file: ${result.result}`,
                };
            }
        } catch (error) {
            console.error('[CloudinaryService] Delete failed:', error);
            return {
                ok: false,
                message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get a public URL for a file with optional transformations
     * @param publicId - Unique identifier of the file
     * @param options - Optional transformation options
     * @returns Public URL string
     */
    getFileUrl(publicId: string, options?: TransformOptions): string {
        const transformationOptions: any = {
            secure: true,
        };

        if (options) {
            const transformations: any[] = [];

            if (options.width || options.height || options.crop) {
                transformations.push({
                    width: options.width,
                    height: options.height,
                    crop: options.crop || 'fill',
                });
            }

            if (options.quality) {
                transformations.push({ quality: options.quality });
            }

            if (options.format) {
                transformations.push({ fetch_format: options.format });
            }

            // Add any additional transformation options
            Object.keys(options).forEach(key => {
                if (
                    !['width', 'height', 'crop', 'quality', 'format'].includes(key) &&
                    options[key] !== undefined
                ) {
                    transformations.push({ [key]: options[key] });
                }
            });

            if (transformations.length > 0) {
                transformationOptions.transformation = transformations;
            }
        }

        return cloudinary.url(publicId, transformationOptions);
    }

    /**
     * Generate a presigned URL for direct client uploads
     * For Cloudinary, this generates signed upload parameters
     * @param key - Storage key for the file (used as publicId)
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
            const {
                folder = this.uploadFolder,
                resourceType = 'auto',
                tags = [],
                context = {},
            } = options || {};

            // Generate timestamp for signature
            const timestamp = Math.round(Date.now() / 1000);

            // Build parameters to sign
            const paramsToSign: any = {
                timestamp,
                folder,
                resource_type: resourceType,
            };

            if (tags.length > 0) {
                paramsToSign.tags = tags.join(',');
            }

            if (Object.keys(context).length > 0) {
                paramsToSign.context = Object.entries(context)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('|');
            }

            // Generate signature
            const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret);

            // Build upload URL
            const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

            // Build public URL (will be available after upload)
            const publicId = folder ? `${folder}/${key}` : key;
            const publicUrl = this.getFileUrl(publicId);

            return {
                ok: true,
                uploadUrl,
                publicUrl,
                key: publicId,
                expiresIn: 3600, // 1 hour
                message: 'Signed upload parameters generated successfully',
            };
        } catch (error) {
            console.error('[CloudinaryService] Presigned URL generation failed:', error);
            return {
                ok: false,
                message: `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get the Cloudinary API instance for advanced operations
     * @returns Cloudinary v2 API instance
     */
    getCloudinaryInstance() {
        return cloudinary;
    }
}

export default CloudinaryService;
