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
dotenv.config();
const app = express();
app.use(cors()); app.use(express.json({limit:'20mb'}));
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
const io = new Server(server, { cors: { origin: '*' } });
globalThis.io = io;
io.on('connection', s=> console.log('socket connected', s.id));
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://Mojolaoluwa:Darasimi_2010@ac-e1zdj3f-shard-00-00.xagjpbm.mongodb.net:27017,ac-e1zdj3f-shard-00-01.xagjpbm.mongodb.net:27017,ac-e1zdj3f-shard-00-02.xagjpbm.mongodb.net:27017/?ssl=true&replicaSet=atlas-e1zdj3f-shard-0&authSource=admin&retryWrites=true&w=majority').then(()=> {
  server.listen(PORT, ()=> console.log('Backend listening on', PORT));
}).catch(e=>{ console.error(e); process.exit(1); });

io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);
});
