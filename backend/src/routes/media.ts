import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const router = express.Router();

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minio',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minio123',
    },
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    forcePathStyle: true, // ✅ Required for MinIO
});

router.post('/upload-url', async (req, res) => {
    const { contentType, folder } = req.body;
    if (!contentType)
        return res.status(400).json({ error: 'missing contentType' });

    const id = randomUUID();
    const ext = (contentType || 'bin').split('/').pop();
    const key = `${folder || 'uploads'}/${Date.now()}-${id}.${ext}`;
    const bucket = process.env.S3_BUCKET || 'snitch-dev';

    const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    try {
        const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });

        // ✅ Dynamically choose correct public URL
        const baseUrl = process.env.S3_ENDPOINT
            ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}`
            : `https://${bucket}.s3.amazonaws.com`;

        res.json({
            uploadUrl,
            key,
            publicUrl: `${baseUrl}/${key}`,
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
