import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from "http";
import cors from 'cors';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import mediaRoutes from './routes/media.js';
import notificationRoutes from './routes/notification.js';
import incognitoRoutes from './routes/incognito.js';
import adminRoutes from './routes/admin.js';
import searchRoutes from './routes/search.js';
import repostsRoutes from './routes/reposts.js';
import chatRoutes from './routes/chat.js';
import './config/env.js';
import { validateTLSConfiguration } from './config/tlsValidation.js';
import path from 'node:path';
import Post from "./models/Post.js";
import {sendPushNotification} from "./utils/pushNotifications.js"
import { fileURLToPath } from 'node:url';
import { initRealtime } from './realtime/server.js';

// Validate TLS configuration before starting
validateTLSConfiguration();

// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// initialize the new realtime socket server (auth middleware is applied inside)
initRealtime(httpServer);
app.use(express.json({ limit: '20mb' }));

const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reposts', repostsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/incognito', incognitoRoutes);
app.use('/api/chat', chatRoutes);

app.use("/assets", express.static("dist/assets", {
    maxAge: "1y",
    immutable: true
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) => {
    res.json(
        {
            auth: true,
            notifications: true,
            posts: true,
            media: true,
            messages: true,
            comments: true,
            reposts: true,
            admin: true,
            incognito: true
        })
});

const PORT = process.env.PORT || 4500;

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in environment variables.');
    process.exit(1);
}

// Validate MongoDB URI uses TLS
if (!MONGO_URI.startsWith('mongodb+srv://') && !MONGO_URI.includes('tls=true')) {
    console.warn('⚠️  WARNING: MongoDB connection does not appear to use TLS. Ensure connection string includes tls=true or uses mongodb+srv:// for Atlas.');
}

mongoose
    .connect(MONGO_URI, {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => {
        httpServer.listen(PORT, () => console.log('Backend listening on', PORT));
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

setInterval(async () => {
    try {
        const now = new Date();
        const postsToPublish = await Post.find({
            scheduledAt: { $lte: now },
            isPublished: false,
        });

        for (const post of postsToPublish) {
            post.isPublished = true;
            await post.save();

            // 🔔 Send push notification to the author
            if (post.author) {
                sendPushNotification(post.author.toString(), {
                    title: 'Your post is live!',
                    body: post.text
                        ? `"${post.text.substring(0, 50)}${post.text.length > 50 ? '...' : ''}" has been published.`
                        : 'Your scheduled post is now visible.',
                    url: `${process.env.CLIENT_URL}/post/${post._id}`,
                }).catch(err => console.error('Push schedule error:', err));
            }

            console.log(`✅ Published scheduled post ${post._id}`);
        }
    } catch (err) {
        console.error('❌ Error publishing scheduled posts:', err);
    }
}, 60_000);

export { app };
