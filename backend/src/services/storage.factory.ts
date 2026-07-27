import { IStorageService } from '../types/storage.js';
import { CloudinaryService } from './cloudinary.service.js';
import { S3Service } from './s3.service.js';

/**
 * Storage Factory
 * 
 * Factory class that returns the appropriate storage service based on environment configuration.
 * Uses the USE_CLOUDINARY environment variable to determine which storage backend to use.
 */
export class StorageFactory {
    private static instance: IStorageService | null = null;

    /**
     * Get the appropriate storage service based on environment configuration
     * @returns Storage service instance (Cloudinary or S3)
     */
    static getStorageService(): IStorageService {
        // Return cached instance if available
        if (this.instance) {
            return this.instance;
        }

        const useCloudinary = process.env.USE_CLOUDINARY === 'true';

        if (useCloudinary) {
            console.log('[StorageFactory] Using Cloudinary for media storage');
            this.instance = new CloudinaryService();
        } else {
            console.log('[StorageFactory] Using S3/MinIO/R2 for media storage');
            this.instance = new S3Service();
        }

        return this.instance;
    }

    /**
     * Reset the cached instance (useful for testing or switching storage at runtime)
     */
    static resetInstance(): void {
        this.instance = null;
    }

    /**
     * Check if Cloudinary is currently enabled
     * @returns true if Cloudinary is enabled, false otherwise
     */
    static isCloudinaryEnabled(): boolean {
        return process.env.USE_CLOUDINARY === 'true';
    }

    /**
     * Get the current storage backend name
     * @returns Name of the current storage backend ('cloudinary' or 's3')
     */
    static getStorageBackend(): string {
        return this.isCloudinaryEnabled() ? 'cloudinary' : 's3';
    }
}

export default StorageFactory;
