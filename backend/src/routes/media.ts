import express from 'express';
import jwt from 'jsonwebtoken';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import s3 from '../config/s3Client.ts';

const router = express.Router();

// lightweight auth middleware used across routes in this project
async function authMiddleware(req: any, res: any, next: any) {
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
router.post('/upload-url', async (req, res) => {
    const { contentType, folder } = req.body;
    if (!contentType) return res.status(400).json({ error: 'missing contentType' });

    const id = randomUUID();
    const ext = (contentType || 'bin').split('/').pop();
    const key = `${folder || 'uploads'}/${Date.now()}-${id}.${ext}`;
    const bucket = process.env.S3_BUCKET || 'snitch-dev';

    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });

    try {
        const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
        const baseUrl = process.env.S3_ENDPOINT
            ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}`
            : `https://${bucket}.s3.amazonaws.com`;

        res.json({ uploadUrl, key, publicUrl: `${baseUrl}/${key}` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Authenticated presign endpoint - enforces user-owned key prefix and tighter validation
router.post('/presign', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.userId;
        const { key: clientKey, contentType, expiresInSeconds, bucket: bucketIn } = req.body;
        const bucket = bucketIn || process.env.S3_BUCKET || 'snitch-dev';

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

        const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
        const url = await getSignedUrl(s3, cmd, { expiresIn: expires });

        const baseUrl = process.env.S3_ENDPOINT ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}` : `https://${bucket}.s3.amazonaws.com`;

        res.json({ ok: true, url, bucket, key, publicUrl: `${baseUrl}/${key}`, expiresInSeconds: expires });
    } catch (err: any) {
        console.error('presign error', err);
        res.status(500).json({ ok: false, error: err?.message || 'presign_error' });
    }
});

export default router;
