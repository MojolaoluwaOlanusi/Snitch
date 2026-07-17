import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from "http";
import cors from 'cors';
import authRoutes from './routes/auth.ts';
import postRoutes from './routes/posts.ts';
import mediaRoutes from './routes/media.ts';
import notificationRoutes from './routes/notification.ts';
import incognitoRoutes from './routes/incognito.ts';
import adminRoutes from './routes/admin.ts';
import searchRoutes from './routes/search.ts';
import repostsRoutes from './routes/reposts.ts';
import chatRoutes from './routes/chat.ts';
import './config/env.ts';
import path from 'node:path';
import Post from "./models/Post.ts";
import {sendPushNotification} from "./utils/pushNotifications.ts"
import { fileURLToPath } from 'node:url';
import { initRealtime } from './realtime/server.ts';

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
    process.env.CLIENT_BUILD_URL,
    process.env.ADMIN_BUILD_URL,
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

mongoose
    .connect(MONGO_URI)
    .then(() => {
        httpServer.listen(PORT, () => console.log('Backend listening on', PORT));
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
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
