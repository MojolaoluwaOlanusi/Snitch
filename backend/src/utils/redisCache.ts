import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    retryStrategy(times: number): number | null {
        if (times > 10) {
            console.error('Redis cache client: max retries reached, giving up');
            return null;
        }
        return Math.min(times * 200, 2000);
    },
    keepAlive: 5000,
    connectTimeout: 10000,
    enableOfflineQueue: false,
});

redis.on('error', (err: Error) => {
    if (err.message.includes('ECONNRESET')) {
        console.warn('Redis cache client connection reset (will reconnect):', err.message);
        return;
    }
    console.error('Redis cache client error:', err.message);
});
redis.on('connect', () => console.log('Redis cache client connected'));
redis.on('ready', () => console.log('Redis cache client ready'));
redis.on('reconnecting', () => console.log('Redis cache client reconnecting...'));
redis.on('close', () => console.log('Redis cache client connection closed'));

export const cacheMessage = async (conversationId: string, message: any): Promise<void> => {
    try {
        const key = `chat:${conversationId}:messages`;
        await redis.lpush(key, JSON.stringify(message));
        await redis.ltrim(key, 0, 199);
        await redis.expire(key, 86400);
    } catch (error: any) {
        console.error('Redis cacheMessage error:', error?.message || error);
    }
};

export const getCachedMessages = async (conversationId: string, limit: number = 50): Promise<any[]> => {
    try {
        const key = `chat:${conversationId}:messages`;
        const messages: string[] = await redis.lrange(key, 0, limit - 1);
        return messages.map((m: string) => {
            const msg = JSON.parse(m);
            // Ensure array fields are arrays
            if (msg.starredBy && !Array.isArray(msg.starredBy)) msg.starredBy = [];
            if (msg.pinnedBy && !Array.isArray(msg.pinnedBy)) msg.pinnedBy = [];
            if (msg.favoritedBy && !Array.isArray(msg.favoritedBy)) msg.favoritedBy = [];
            if (msg.lockedBy && !Array.isArray(msg.lockedBy)) msg.lockedBy = [];
            if (msg.archivedBy && !Array.isArray(msg.archivedBy)) msg.archivedBy = [];
            return msg;
        });
    } catch (error: any) {
        console.error('Redis getCachedMessages error:', error?.message || error);
        return [];
    }
};

export const removeCachedMessage = async (conversationId: string, messageId: string): Promise<void> => {
    try {
        const key = `chat:${conversationId}:messages`;
        const messages: string[] = await redis.lrange(key, 0, -1);
        for (const msg of messages) {
            const parsed = JSON.parse(msg);
            if (parsed._id === messageId) {
                await redis.lrem(key, 1, msg);
                break;
            }
        }
    } catch (error: any) {
        console.error('Redis removeCachedMessage error:', error?.message || error);
    }
};

export const updateCachedMessage = async (conversationId: string, messageId: string, updatedMessage: any) => {
    try {
        const key = `chat:${conversationId}:messages`;
        const messages = await redis.lrange(key, 0, -1);
        for (let i = 0; i < messages.length; i++) {
            const parsed = JSON.parse(messages[i]);
            if (parsed._id === messageId) {
                await redis.lset(key, i, JSON.stringify(updatedMessage));
                break;
            }
        }
    } catch (err: any) {
        console.error('Redis updateCachedMessage error:', err?.message || err);
    }
};

export const cacheOnlineStatus = async (userId: string, status: boolean): Promise<void> => {
    try {
        if (status) {
            await redis.setex(`user:${userId}:online`, 300, '1');
        } else {
            await redis.del(`user:${userId}:online`);
        }
    } catch (error: any) {
        console.error('Redis cacheOnlineStatus error:', error?.message || error);
    }
};

export const getOnlineUsers = async (): Promise<string[]> => {
    try {
        const keys: string[] = await redis.keys('user:*:online');
        return keys.map((k: string) => k.split(':')[1]);
    } catch (error: any) {
        console.error('Redis getOnlineUsers error:', error?.message || error);
        return [];
    }
};