import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.ts';
import postRoutes from './routes/posts.ts';
import mediaRoutes from './routes/media.ts';
import messagesRoutes from './routes/messages.ts';
import incognitoRoutes from './routes/incognito.ts';
import adminRoutes from './routes/admin.ts';
import repostsRoutes from './routes/reposts.ts';
import commentsRoutes from './routes/comments.ts';
import './config/env.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/reposts', repostsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/incognito', incognitoRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

globalThis.io = io;

const PORT = process.env.PORT || 4500;

io.on('connection', (s) => console.log('socket connected', s.id));

mongoose
    .connect(process.env.MONGO_URI!)
    .then(() => {
        server.listen(PORT, () => console.log('Backend listening on', PORT));
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);

    socket.on('join', (userId) => {
        if (!userId) return;
        socket.join(`user:${userId}`);
    });

    socket.on('message:send', (data) => {
        io.to(`user:${data.to}`).emit('message:receive', data);
        io.to(`user:${data.from}`).emit('message:sent', data);
    });

    socket.on('comment:create', (payload) => {
        io.emit('comment:new', payload);
    });

    socket.on('post:like', (payload) => {
        io.emit('post:liked', payload);
    });

    socket.on('notification:send', (payload) => {
        io.to(`user:${payload.to}`).emit('notification:new', payload);
    });
});

export { app, io };
