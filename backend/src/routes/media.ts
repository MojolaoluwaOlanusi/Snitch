import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { StorageFactory } from '../services/storage.factory.js';

const router = express.Router();

// lightweight auth middleware used across routes in this project
async function authMiddleware(req: Request, res: Response, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'unauthorized' });
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'DevelopmentSecret');
        req.userId = decoded.id || decoded.userId || decoded._id;
        next();
    } catch (e: any) {
        console.log('Auth error in media presign:', e.message || e);
        return res.status(401).json({ error: 'invalid' });
    }
}

// Back-compat endpoint (keeps behavior similar to earlier code)
router.post('/upload-url', async (req: Request, res: Response) => {
    const { contentType, folder } = req.body;
    if (!contentType) return res.status(400).json({ error: 'missing contentType' });

    const storageService = StorageFactory.getStorageService();
    const id = randomUUID();
    const ext = (contentType || 'bin').split('/').pop();
    const key = `${Date.now()}-${id}.${ext}`;

    try {
        const result = await storageService.generatePresignedUrl(key, contentType, {
            folder: folder || 'uploads',
        });

        if (!result.ok) {
            return res.status(500).json({ error: result.message });
        }

        res.json({ uploadUrl: result.uploadUrl, key: result.key, publicUrl: result.publicUrl });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Authenticated presign endpoint - enforces user-owned key prefix and tighter validation
router.post('/presign', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { key: clientKey, contentType, expiresInSeconds } = req.body;
        const storageService = StorageFactory.getStorageService();

        // basic validation
        if (!contentType) return res.status(400).json({ ok: false, error: 'missing_content_type' });

        const allowedPrefixes = ['image/', 'video/', 'audio/', 'application/pdf', 'application/octet-stream'];
        if (!allowedPrefixes.some((p) => contentType.startsWith(p))) return res.status(400).json({ ok: false, error: 'invalid_content_type' });

        // normalize / force user-scoped key
        let key = clientKey;
        if (!key) {
            const id = randomUUID();
            const ext = (contentType || 'bin').split('/').pop();
            key = `messages/${userId}/${Date.now()}-${id}.${ext}`;
        } else {
            if (!key.startsWith('messages/') && !key.startsWith(`users/${userId}/`)) key = `messages/${userId}/${key}`;
        }

        const expires = Math.min(Math.max(Number(expiresInSeconds) || 600, 30), 60 * 60 * 24);

        const result = await storageService.generatePresignedUrl(key, contentType, {
            folder: 'messages',
            expiresInSeconds: expires,
        });

        if (!result.ok) {
            return res.status(500).json({ ok: false, error: result.message });
        }

        res.json({ ok: true, url: result.uploadUrl, key: result.key, publicUrl: result.publicUrl, expiresInSeconds: expires });
    } catch (err: any) {
        console.error('presign error', err);
        res.status(500).json({ ok: false, error: err?.message || 'presign_error' });
    }
});

// Chat media presign - organizes by conversation and media type
router.post('/chat-presign', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { conversationId, fileName, contentType, mediaType } = req.body;
        const storageService = StorageFactory.getStorageService();

        if (!contentType || !conversationId || !mediaType) {
            return res.status(400).json({ ok: false, error: 'missing required fields' });
        }

        // Generate folder structure: messages/{conversationId}/{mediaType}/{date}/
        const dateFolder = new Date().toISOString().split('T')[0]; // "2024-01-15"
        const ext = fileName ? fileName.split('.').pop() : contentType.split('/').pop();
        const uniqueName = `${Date.now()}-${randomUUID()}.${ext}`;
        const key = `${conversationId}/${mediaType}/${dateFolder}/${uniqueName}`;

        const result = await storageService.generatePresignedUrl(key, contentType, {
            folder: 'messages',
            resourceType: mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'raw' : 'image',
        });

        if (!result.ok) {
            return res.status(500).json({ ok: false, error: result.message });
        }

        res.json({
            ok: true,
            uploadUrl: result.uploadUrl,
            key: result.key,
            publicUrl: result.publicUrl,
        });
    } catch (err: any) {
        console.error('chat-presign error', err);
        res.status(500).json({ ok: false, error: err?.message || 'presign_error' });
    }
});

// Wallpaper presign (authenticated)
router.post('/wallpaper-presign', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { conversationId, fileName, contentType } = req.body;
        const storageService = StorageFactory.getStorageService();

        if (!contentType || !conversationId) {
            return res.status(400).json({ ok: false, error: 'missing required fields' });
        }

        // Allow only images
        if (!contentType.startsWith('image/')) {
            return res.status(400).json({ ok: false, error: 'invalid content type, only images allowed' });
        }

        const ext = fileName ? fileName.split('.').pop() : contentType.split('/').pop();
        const uniqueName = `${Date.now()}-${randomUUID()}.${ext}`;
        const key = `wallpapers/${conversationId}/${uniqueName}`;

        const result = await storageService.generatePresignedUrl(key, contentType, {
            folder: 'wallpapers',
            resourceType: 'image',
        });

        if (!result.ok) {
            return res.status(500).json({ ok: false, error: result.message });
        }

        res.json({
            ok: true,
            uploadUrl: result.uploadUrl,
            key: result.key,
            publicUrl: result.publicUrl,
        });
    } catch (err: any) {
        console.error('wallpaper-presign error', err);
        res.status(500).json({ ok: false, error: err?.message || 'presign_error' });
    }
});

export default router;
