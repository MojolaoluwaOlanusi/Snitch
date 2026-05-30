import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/socket.auth.middlware.ts';
import { registerSocketHandlers } from './handlers.ts';
import { RoomStore } from './rooms.ts';
import { RedisRoomStore } from './adapter/redisRoomStore.ts';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';

export const initRealtime = (httpServer: any) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        },
        // tune socket.io for production readiness
        pingInterval: 25000,
        pingTimeout: 60000,
        maxHttpBufferSize: 1e7, // 10MB for socket messages (prefer presigned for larger files)
    });

    let roomStore: any = new RoomStore();

    // configure Redis adapter and Redis-backed room store when REDIS_URL or USE_REDIS_ROOMS is set
    const useRedis = !!(process.env.REDIS_URL || process.env.USE_REDIS_ROOMS);
    if (useRedis) {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
            // @ts-ignore
            const pubClient = new IORedis(redisUrl);
            const subClient = pubClient.duplicate();
            io.adapter(createAdapter(pubClient, subClient));
            roomStore = new RedisRoomStore(pubClient);
            console.log('Realtime: using Redis adapter and RedisRoomStore');
        } catch (err) {
            console.error('Realtime: failed to configure Redis adapter, falling back to in-memory store', err);
            roomStore = new RoomStore();
        }
    }

    // attach auth middleware
    io.use(socketAuthMiddleware as any);

    io.on('connection', (socket) => {
        // register per-socket handlers
        registerSocketHandlers(io, socket, roomStore);
    });

    // expose for tests or other modules
    return io;
};
