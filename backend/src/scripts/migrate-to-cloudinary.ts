/**
 * Migration Script: Migrate media from S3/MinIO to Cloudinary
 *
 * This script migrates existing media files from S3/MinIO to Cloudinary.
 * It scans the database for media URLs, downloads them, and uploads to Cloudinary.
 *
 * Usage:
 *   npm run migrate-to-cloudinary
 *
 * Environment variables required:
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *   - CLOUDINARY_UPLOAD_FOLDER
 *   - S3_ENDPOINT (for downloading existing files)
 *   - S3_BUCKET
 *   - S3_ACCESS_KEY
 *   - S3_SECRET_KEY
 *   - MONGO_URI
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import Post from '../models/Post.js';
import {User} from '../models/User.js';
import Message from '../models/Message.js';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minio',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minio123',
    },
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    forcePathStyle: true,
});

const bucket = process.env.S3_BUCKET || 'snitch';
const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'snitch';

// Helper: Extract S3 key from URL
function extractS3Key(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const s3Endpoint = process.env.S3_ENDPOINT;

        if (s3Endpoint) {
            const base = `${s3Endpoint.replace(/\/$/, '')}/${bucket}`;
            if (url.startsWith(base)) {
                return url.substring(base.length + 1);
            }
        } else {
            const host = urlObj.host;
            if (host.endsWith('.s3.amazonaws.com')) {
                return urlObj.pathname.replace(/^\//, '');
            }
        }

        // Fallback: try to extract after bucket/
        if (url.includes(`/${bucket}/`)) {
            return url.split(`/${bucket}/`)[1];
        }

        return null;
    } catch (error) {
        console.error('Error extracting S3 key:', error);
        return null;
    }
}

// Helper: Download file from S3
async function downloadFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const response = await s3Client.send(command);
    const chunks: Buffer[] = [];

    const stream = response.Body as Readable;

    return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

// Helper: Upload to Cloudinary
async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    publicId?: string
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const stream = Readable.from(buffer);
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.pipe(uploadStream);
    });
}

// Migrate posts media
async function migratePosts() {
    console.log('🔍 Migrating posts media...');
    const posts = await Post.find({ url: { $exists: true, $ne: null } });

    let migrated = 0;
    let failed = 0;

    for (const post of posts) {
        if (!post.url) continue;

        const s3Key = extractS3Key(post.url);
        if (!s3Key) {
            console.log(`⚠️  Could not extract S3 key from: ${post.url}`);
            failed++;
            continue;
        }

        try {
            console.log(`📥 Downloading from S3: ${s3Key}`);
            const buffer = await downloadFromS3(s3Key);

            console.log(`☁️  Uploading to Cloudinary...`);
            const { url, publicId } = await uploadToCloudinary(
                buffer,
                `${uploadFolder}/posts`,
                `post_${post._id}`
            );

            // Update post with new URL
            post.url = url;
            await post.save();

            console.log(`✅ Migrated post ${post._id}`);
            migrated++;
        } catch (error) {
            console.error(`❌ Failed to migrate post ${post._id}:`, error);
            failed++;
        }
    }

    console.log(`\n📊 Posts migration complete: ${migrated} migrated, ${failed} failed`);
}

// Migrate user avatars
async function migrateUserAvatars() {
    console.log('\n🔍 Migrating user avatars...');
    const users = await User.find({ avatarUrl: { $exists: true, $ne: null } });

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
        if (!user.avatarUrl) continue;

        const s3Key = extractS3Key(user.avatarUrl);
        if (!s3Key) {
            console.log(`⚠️  Could not extract S3 key from: ${user.avatarUrl}`);
            failed++;
            continue;
        }

        try {
            console.log(`📥 Downloading avatar from S3: ${s3Key}`);
            const buffer = await downloadFromS3(s3Key);

            console.log(`☁️  Uploading to Cloudinary...`);
            const { url, publicId } = await uploadToCloudinary(
                buffer,
                `${uploadFolder}/avatars`,
                `avatar_${user._id}`
            );

            // Update user with new URL
            user.avatarUrl = url;
            await user.save();

            console.log(`✅ Migrated avatar for user ${user.username}`);
            migrated++;
        } catch (error) {
            console.error(`❌ Failed to migrate avatar for user ${user.username}:`, error);
            failed++;
        }
    }

    console.log(`\n📊 User avatars migration complete: ${migrated} migrated, ${failed} failed`);
}

// Migrate user cover images
async function migrateUserCovers() {
    console.log('\n🔍 Migrating user cover images...');
    const users = await User.find({ coverImg: { $exists: true, $ne: null } });

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
        if (!user.coverImg) continue;

        const s3Key = extractS3Key(user.coverImg);
        if (!s3Key) {
            console.log(`⚠️  Could not extract S3 key from: ${user.coverImg}`);
            failed++;
            continue;
        }

        try {
            console.log(`📥 Downloading cover from S3: ${s3Key}`);
            const buffer = await downloadFromS3(s3Key);

            console.log(`☁️  Uploading to Cloudinary...`);
            const { url, publicId } = await uploadToCloudinary(
                buffer,
                `${uploadFolder}/covers`,
                `cover_${user._id}`
            );

            // Update user with new URL
            user.coverImg = url;
            await user.save();

            console.log(`✅ Migrated cover for user ${user.username}`);
            migrated++;
        } catch (error) {
            console.error(`❌ Failed to migrate cover for user ${user.username}:`, error);
            failed++;
        }
    }

    console.log(`\n📊 User covers migration complete: ${migrated} migrated, ${failed} failed`);
}

// Migrate message media
async function migrateMessages() {
    console.log('\n🔍 Migrating message media...');

    // Find messages that have media array with at least one item
    const messages = await Message.find({
        $or: [
            { media: { $exists: true, $ne: [] } },
            { 'media.0': { $exists: true } }
        ]
    });

    let migrated = 0;
    let failed = 0;

    for (const message of messages) {
        if (!message.media || !Array.isArray(message.media) || message.media.length === 0) {
            continue;
        }

        let updated = false;

        for (let i = 0; i < message.media.length; i++) {
            const mediaItem = message.media[i];
            if (!mediaItem.url) continue;

            const s3Key = extractS3Key(mediaItem.url);
            if (!s3Key) {
                console.log(`⚠️  Could not extract S3 key from: ${mediaItem.url}`);
                failed++;
                continue;
            }

            try {
                console.log(`📥 Downloading message media from S3: ${s3Key}`);
                const buffer = await downloadFromS3(s3Key);

                console.log(`☁️  Uploading to Cloudinary...`);
                const { url: newUrl, publicId } = await uploadToCloudinary(
                    buffer,
                    `${uploadFolder}/messages`,
                    `message_${message._id}_${Date.now()}_${i}`
                );

                // Update the specific media item's URL
                message.media[i].url = newUrl;
                updated = true;

                console.log(`✅ Migrated media ${i} for message ${message._id}`);
                migrated++;
            } catch (error) {
                console.error(`❌ Failed to migrate media ${i} for message ${message._id}:`, error);
                failed++;
            }
        }

        if (updated) {
            await message.save();
        }
    }

    console.log(`\n📊 Messages migration complete: ${migrated} media items migrated, ${failed} failed`);
}

// Main migration function
async function migrate() {
    try {
        console.log('🚀 Starting migration to Cloudinary...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/snitch');
        console.log('✅ Connected to MongoDB\n');

        // Run migrations
        await migratePosts();
        await migrateUserAvatars();
        await migrateUserCovers();
        await migrateMessages();

        console.log('\n🎉 Migration complete!');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run migration
migrate();