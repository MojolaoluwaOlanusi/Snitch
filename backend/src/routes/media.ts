import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
const router = express.Router();
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minio', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minio123' }, endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: !!process.env.S3_ENDPOINT });
router.post('/upload-url', async (req,res)=>{ const { contentType, folder } = req.body; if(!contentType) return res.status(400).json({ error:'missing' }); const id = randomUUID(); const ext = (contentType||'bin').split('/').pop(); const key = `${folder||'uploads'}/${Date.now()}-${id}.${ext}`; const cmd = new PutObjectCommand({ Bucket: process.env.S3_BUCKET || 'snitch-dev', Key: key, ContentType: contentType }); try{ const url = await getSignedUrl(s3, cmd, { expiresIn: 300 }); res.json({ uploadUrl: url, key, publicUrl: `https://${process.env.S3_BUCKET||'snitch-dev'}.s3.amazonaws.com/${key}` }); }catch(e:any){ res.status(500).json({ error: e.message }); } });
export default router;
