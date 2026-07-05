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
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

export { app };
