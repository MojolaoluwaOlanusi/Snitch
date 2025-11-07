import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server  } from 'socket.io';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import mediaRoutes from './routes/media';
import messagesRoutes from './routes/messages';
import incognitoRoutes from './routes/incognito';
import adminRoutes from './routes/admin';
import repostsRoutes from './routes/reposts';
import commentsRoutes from './routes/comments';
import path from "node:path";
dotenv.config();
const app = express();
require('dotenv').config();
app.use(cors());
app.use(express.json({limit:'20mb'}));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/reposts', repostsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/incognito', incognitoRoutes);

app.get('/api/health', (req,res)=>res.json({ok:true}));
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' , methods: ["GET","POST"]} });

globalThis.io = io;

const PORT = process.env.PORT || 4500;

io.on('connection', s=> console.log('socket connected', s.id));

mongoose.connect(process.env.MONGO_URI || 'mongodb://Mojolaoluwa:Darasimi_2010@ac-e1zdj3f-shard-00-00.xagjpbm.mongodb.net:27017,ac-e1zdj3f-shard-00-01.xagjpbm.mongodb.net:27017,ac-e1zdj3f-shard-00-02.xagjpbm.mongodb.net:27017/?ssl=true&replicaSet=atlas-e1zdj3f-shard-0&authSource=admin&retryWrites=true&w=majority').then(()=> {
    server.listen(PORT, ()=> console.log('Backend listening on', PORT));
}).catch(e=>{ console.error(e); process.exit(1); });

io.on("connection", socket => {
    console.log("socket connected:", socket.id);
});

const clientBuildPath = path.join(__dirname, '..', 'frontend', 'build');
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
        // { from, to, text, media, createdAt }
        io.to(`user:${data.to}`).emit('message:receive', data);
        io.to(`user:${data.from}`).emit('message:sent', data);
        // optionally persist here in a controller
    });

    socket.on('comment:create', (payload) => {
        // payload: { postId, comment }
        io.emit('comment:new', payload); // broadcast; refine later
    });

    socket.on('post:like', (payload) => {
        io.emit('post:liked', payload);
    });

    socket.on('notification:send', (payload) => {
        io.to(`user:${payload.to}`).emit('notification:new', payload);
    });

    socket.on('disconnect', () => {
        // cleanup if needed
    });
});

module.exports = {app, io};