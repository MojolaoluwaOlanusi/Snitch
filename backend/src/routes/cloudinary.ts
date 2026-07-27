import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { StorageFactory } from '../services/storage.factory.js';

const router = express.Router();

// Auth middleware
async function authMiddleware(req: Request, res: Response, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'unauthorized' });
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'DevelopmentSecret');
        req.userId = decoded.id || decoded.userId || decoded._id;
        next();
    } catch (e: any) {
        console.log('Auth error in cloudinary route:', e.message || e);
        return res.status(401).json({ error: 'invalid' });
    }
}

/**
 * POST /api/cloudinary/sign-upload
 * 
 * Generates signed upload parameters for Cloudinary direct client uploads.
 * This endpoint is used when the frontend wants to upload directly to Cloudinary
 * using signed parameters instead of unsigned presets.
 */
router.post('/sign-upload', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { folder, publicId, resourceType } = req.body;

        // Only allow this endpoint if Cloudinary is enabled
        if (!StorageFactory.isCloudinaryEnabled()) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Cloudinary is not enabled. Set USE_CLOUDINARY=true in environment variables.' 
            });
        }

        const storageService = StorageFactory.getStorageService();
        
        // Generate timestamp for signature
        const timestamp = Math.round(Date.now() / 1000);

        // Build parameters to sign
        const paramsToSign: any = {
            timestamp,
            folder: folder || 'snitch',
        };

        if (publicId) {
            paramsToSign.public_id = publicId;
        }

        if (resourceType) {
            paramsToSign.resource_type = resourceType;
        }

        // Get Cloudinary instance to generate signature
        const cloudinaryService = storageService as any;
        const cloudinaryInstance = cloudinaryService.getCloudinaryInstance();
        
        const signature = cloudinaryInstance.utils.api_sign_request(
            paramsToSign, 
            process.env.CLOUDINARY_API_SECRET || ''
        );

        res.json({
            ok: true,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            timestamp,
            signature,
            folder: folder || 'snitch',
            publicId: publicId || undefined,
            resourceType: resourceType || 'auto',
        });
    } catch (error: any) {
        console.error('[Cloudinary] Sign upload error:', error);
        res.status(500).json({ 
            ok: false, 
            error: error.message || 'Failed to generate signed upload parameters' 
        });
    }
});

/**
 * POST /api/cloudinary/upload
 * 
 * Server-side upload endpoint for Cloudinary.
 * Use this when you want the server to handle the upload instead of the client.
 */
router.post('/upload', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { file, folder, publicId, resourceType, contentType } = req.body;

        if (!file) {
            return res.status(400).json({ ok: false, error: 'File is required' });
        }

        // Only allow this endpoint if Cloudinary is enabled
        if (!StorageFactory.isCloudinaryEnabled()) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Cloudinary is not enabled. Set USE_CLOUDINARY=true in environment variables.' 
            });
        }

        const storageService = StorageFactory.getStorageService();

        // Convert base64 to Buffer if needed
        let fileBuffer: Buffer;
        if (typeof file === 'string') {
            if (file.startsWith('data:')) {
                // Remove data URL prefix
                const base64Data = file.split(',')[1];
                fileBuffer = Buffer.from(base64Data, 'base64');
            } else {
                fileBuffer = Buffer.from(file, 'base64');
            }
        } else {
            fileBuffer = Buffer.from(file);
        }

        const result = await storageService.uploadFile(fileBuffer, {
            folder: folder || 'snitch',
            publicId,
            resourceType: resourceType || 'auto',
            contentType,
        });

        res.json({
            ok: true,
            url: result.url,
            secureUrl: result.secureUrl,
            publicId: result.publicId,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
        });
    } catch (error: any) {
        console.error('[Cloudinary] Upload error:', error);
        res.status(500).json({ 
            ok: false, 
            error: error.message || 'Failed to upload to Cloudinary' 
        });
    }
});

/**
 * DELETE /api/cloudinary/delete
 * 
 * Delete a file from Cloudinary.
 */
router.delete('/delete', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({ ok: false, error: 'Public ID is required' });
        }

        // Only allow this endpoint if Cloudinary is enabled
        if (!StorageFactory.isCloudinaryEnabled()) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Cloudinary is not enabled. Set USE_CLOUDINARY=true in environment variables.' 
            });
        }

        const storageService = StorageFactory.getStorageService();
        const result = await storageService.deleteFile(publicId);

        res.json(result);
    } catch (error: any) {
        console.error('[Cloudinary] Delete error:', error);
        res.status(500).json({ 
            ok: false, 
            error: error.message || 'Failed to delete from Cloudinary' 
        });
    }
});

/**
 * GET /api/cloudinary/url
 * 
 * Generate a Cloudinary URL with transformations.
 */
router.get('/url', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { publicId, width, height, crop, quality, format } = req.query;

        if (!publicId) {
            return res.status(400).json({ ok: false, error: 'Public ID is required' });
        }

        // Only allow this endpoint if Cloudinary is enabled
        if (!StorageFactory.isCloudinaryEnabled()) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Cloudinary is not enabled. Set USE_CLOUDINARY=true in environment variables.' 
            });
        }

        const storageService = StorageFactory.getStorageService();
        const url = storageService.getFileUrl(
            publicId as string,
            {
                width: width ? parseInt(width as string) : undefined,
                height: height ? parseInt(height as string) : undefined,
                crop: crop as any,
                quality: quality ? parseInt(quality as string) : undefined,
                format: format as string,
            }
        );

        res.json({ ok: true, url });
    } catch (error: any) {
        console.error('[Cloudinary] URL generation error:', error);
        res.status(500).json({ 
            ok: false, 
            error: error.message || 'Failed to generate Cloudinary URL' 
        });
    }
});

export default router;
