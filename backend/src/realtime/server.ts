import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/socket.auth.middlware.ts';
import { registerSocketHandlers } from './handlers.ts';
import { RoomStore } from './rooms.ts';
import { RedisRoomStore } from './adapter/redisRoomStore.ts';
import Message from "../models/Message.ts";
import Conversation from "../models/Conversation.ts";
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

setInterval(async () => {
    try {
        const conversations = await Conversation.find({ disappearingTimer: { $ne: null } });
        for (const conv of conversations) {
            const cutoff = new Date(Date.now() - conv.disappearingTimer * 1000);
            await Message.deleteMany({
                conversationId: conv._id,
                createdAt: { $lt: cutoff }
            });
        }
    } catch (err) {
        console.error('Disappearing messages cleanup error:', err);
    }
}, 5 * 60 * 1000); // every 5 minutes

export const initRealtime = (httpServer: any) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 60000,
        maxHttpBufferSize: 1e7,
    });

    let roomStore: any = new RoomStore();

    const useRedis = !!(process.env.REDIS_URL || process.env.USE_REDIS_ROOMS);
    if (useRedis) {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
            const pubClient = new Redis(redisUrl, {
                maxRetriesPerRequest: null,
                retryStrategy: (times: number): number | null => {
                    if (times > 10) return null;
                    return Math.min(times * 200, 2000);
                },
                keepAlive: 5000,
                connectTimeout: 10000,
            });
            const subClient = pubClient.duplicate();

            const handleRedisError = (label: string, err: Error) => {
                if (err.message.includes('ECONNRESET')) {
                    console.warn(`Redis ${label} connection reset:`, err.message);
                } else {
                    console.error(`Redis ${label} error:`, err.message);
                }
            };
            pubClient.on('error', (err: Error) => handleRedisError('pubClient', err));
            subClient.on('error', (err: Error) => handleRedisError('subClient', err));

            io.adapter(createAdapter(pubClient, subClient));
            roomStore = new RedisRoomStore(pubClient);
            console.log('Realtime: using Redis adapter and RedisRoomStore');
        } catch (err) {
            console.error('Realtime: failed to configure Redis adapter, falling back to in-memory store', err);
            roomStore = new RoomStore();
        }
    }

    io.use(socketAuthMiddleware as any);

    io.on('connection', (socket) => {
        registerSocketHandlers(io, socket, roomStore);
    });

    return io;
};