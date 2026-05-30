import IORedis from 'ioredis';

/**
 * RedisRoomStore: simple Redis-backed room and participant store.
 * Keys and structures:
 * - room meta: `rtc:room:{roomId}:meta` (hash)
 * - participants set: `rtc:room:{roomId}:participants` (set of userId)
 * - participant data: `rtc:room:{roomId}:participant:{userId}` (hash)
 *
 * This implementation focuses on correctness for multi-instance use rather than extreme performance.
 */

type Participant = {
    userId: string;
    socketId: string;
    joinedAt: number;
    muted?: boolean;
    videoOn?: boolean;
    role?: 'owner' | 'admin' | 'member';
};

type RoomMeta = Record<string, any>;

export class RedisRoomStore {
    private redis: IORedis.Redis;
    private prefix = 'rtc';
    // preloaded Lua script SHA for atomic remove-participant operation
    private removeParticipantSha?: string;
    private removeParticipantScript = `
        -- KEYS: participantsKey, participantHashKey, roomMetaKey, activeKey
        -- ARGV: userId, roomId
        local participantsKey = KEYS[1]
        local participantHashKey = KEYS[2]
        local roomMetaKey = KEYS[3]
        local activeKey = KEYS[4]
        local userId = ARGV[1]
        local roomId = ARGV[2]

        -- remove from participants set and delete participant hash
        redis.call('SREM', participantsKey, userId)
        redis.call('DEL', participantHashKey)

        local remaining = redis.call('SCARD', participantsKey)
        if (remaining == 0) then
            -- no participants left: delete room meta and participants set, and remove from active index
            redis.call('DEL', roomMetaKey)
            redis.call('DEL', participantsKey)
            redis.call('SREM', activeKey, roomId)
            return 1
        end
        return 0
    `;

    // Lua script for atomic createRoom + addParticipant
    private createAndAddScript = `
        -- KEYS: roomMetaKey, participantsKey, participantHashKey, activeKey
        -- ARGV: metadataJson, userId, socketId, joinedAt, muted, videoOn, role, roomId
        local roomMetaKey = KEYS[1]
        local participantsKey = KEYS[2]
        local participantHashKey = KEYS[3]
        local activeKey = KEYS[4]
        local metadataJson = ARGV[1]
        local userId = ARGV[2]
        local socketId = ARGV[3]
        local joinedAt = ARGV[4]
        local muted = ARGV[5]
        local videoOn = ARGV[6]
        local role = ARGV[7]
        local roomId = ARGV[8]

        if metadataJson and metadataJson ~= '' then
            -- store metadata as a JSON string under field 'metadata'
            redis.call('HSET', roomMetaKey, 'metadata', metadataJson)
        end

        -- add participant
        redis.call('SADD', participantsKey, userId)
        redis.call('HSET', participantHashKey, 'userId', userId, 'socketId', socketId, 'joinedAt', joinedAt, 'muted', muted, 'videoOn', videoOn, 'role', role)
        -- ensure room is in active index
        redis.call('SADD', activeKey, roomId)
        return 1
    `;

    constructor(redis?: IORedis.Redis) {
        // cast constructor to any to avoid TS complaints about the ioredis default import
        this.redis = (redis as any) || new (IORedis as any)(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

        // preload scripts (removeParticipant and createAndAdd)
        const preloadScripts = async () => {
            try {
                const sha1 = await this.redis.script('LOAD', this.removeParticipantScript);
                this.removeParticipantSha = sha1 as string;
                console.log('RedisRoomStore: removeParticipant script SHA=', this.removeParticipantSha);
            } catch (err) {
                console.error('RedisRoomStore: failed to preload removeParticipant script', err);
                this.removeParticipantSha = undefined;
            }
            try {
                const sha2 = await this.redis.script('LOAD', this.createAndAddScript);
                this.createAndAddSha = sha2 as string;
                console.log('RedisRoomStore: createAndAdd script SHA=', this.createAndAddSha);
            } catch (err) {
                console.error('RedisRoomStore: failed to preload createAndAdd script', err);
                this.createAndAddSha = undefined;
            }
        };

        // initial preload
        preloadScripts();

        // Reload scripts on Redis reconnect/ready so EVALSHA continues to work after restarts or script eviction
        this.redis.on('ready', () => {
            // run asynchronously and don't block event loop
            preloadScripts().catch((e) => {
                console.error('RedisRoomStore: failed to reload scripts on ready', e);
            });
        });

        // Also attempt reload on connect and reconnect events for robustness
        this.redis.on('connect', () => {
            preloadScripts().then(() => {
                if (this.removeParticipantSha) console.log('RedisRoomStore: removeParticipant script loaded on connect, sha=', this.removeParticipantSha);
                if (this.createAndAddSha) console.log('RedisRoomStore: createAndAdd script loaded on connect, sha=', this.createAndAddSha);
            }).catch((e) => {
                console.error('RedisRoomStore: failed to load scripts on connect', e);
            });
        });

        this.redis.on('reconnecting', () => {
            // try to reload after reconnect
            // schedule a short delay to allow connection stabilization
            setTimeout(() => {
                preloadScripts().catch((e) => console.error('RedisRoomStore: failed to reload script after reconnect', e));
            }, 500);
        });
    }

    private roomMetaKey(roomId: string) {
        return `${this.prefix}:room:${roomId}:meta`;
    }

    private participantsSetKey(roomId: string) {
        return `${this.prefix}:room:${roomId}:participants`;
    }

    private participantKey(roomId: string, userId: string) {
        return `${this.prefix}:room:${roomId}:participant:${userId}`;
    }

    // active rooms index key
    private activeRoomsKey() {
        return `${this.prefix}:active_rooms`;
    }

    // SHA for createAndAdd script
    private createAndAddSha?: string;

    /**
     * Atomically create room metadata (optional) and add a participant.
     * Returns the participant that was added.
     */
    async createRoomAndAddParticipant(roomId: string, metadata: Record<string, any> | undefined, p: Participant) {
        const roomMetaKey = this.roomMetaKey(roomId);
        const participantsKey = this.participantsSetKey(roomId);
        const participantHashKey = this.participantKey(roomId, p.userId);
        const activeKey = this.activeRoomsKey();

        const metadataJson = metadata ? JSON.stringify(metadata) : '';
        const args = [metadataJson, p.userId, p.socketId, String(p.joinedAt), p.muted ? 'true' : 'false', p.videoOn ? 'true' : 'false', p.role || 'member', roomId];

        // Try EVALSHA first
        if (this.createAndAddSha) {
            try {
                await this.redis.evalsha(this.createAndAddSha, 4, roomMetaKey, participantsKey, participantHashKey, activeKey, ...args);
                return p;
            } catch (err: any) {
                const msg = (err && err.message) || '';
                if (!msg.includes('NOSCRIPT')) throw err;
            }
        }

        // Fallback to EVAL
        await this.redis.eval(this.createAndAddScript, 4, roomMetaKey, participantsKey, participantHashKey, activeKey, ...args);
        return p;
    }

    async createRoom(id: string, metadata?: RoomMeta) {
        if (metadata) {
            await this.redis.hset(this.roomMetaKey(id), metadata as any);
        }
        // ensure room is tracked in active rooms set
        await this.redis.sadd(this.activeRoomsKey(), id);
        return { id, metadata };
    }

    async getRoom(id: string) {
        const meta = await this.redis.hgetall(this.roomMetaKey(id));
        if (!meta || Object.keys(meta).length === 0) return undefined;
        const members = await this.redis.smembers(this.participantsSetKey(id));
        const participants: Participant[] = [];
        for (const u of members) {
            const p = await this.redis.hgetall(this.participantKey(id, u));
            if (p && Object.keys(p).length > 0) {
                participants.push({
                    userId: p.userId,
                    socketId: p.socketId,
                    joinedAt: Number(p.joinedAt) || Date.now(),
                    muted: p.muted === 'true',
                    videoOn: p.videoOn === 'true',
                    role: (p.role as any) || 'member',
                });
            }
        }
        return { id, metadata: meta, participants };
    }

    async listAllRoomIds() {
        return this.redis.smembers(this.activeRoomsKey());
    }

    async deleteRoom(id: string) {
        const keys = [this.roomMetaKey(id), this.participantsSetKey(id)];
        const members = await this.redis.smembers(this.participantsSetKey(id));
        for (const u of members) keys.push(this.participantKey(id, u));
        if (keys.length === 0) return false;
        await this.redis.del(...keys);
        await this.redis.srem(this.activeRoomsKey(), id);
        return true;
    }

    async addParticipant(roomId: string, p: Participant) {
        await this.redis.sadd(this.participantsSetKey(roomId), p.userId);
        await this.redis.sadd(this.activeRoomsKey(), roomId);
        await this.redis.hset(this.participantKey(roomId, p.userId), {
            userId: p.userId,
            socketId: p.socketId,
            joinedAt: String(p.joinedAt),
            muted: p.muted ? 'true' : 'false',
            videoOn: p.videoOn ? 'true' : 'false',
            role: p.role || 'member',
        } as any);
        return p;
    }

    async removeParticipant(roomId: string, userId: string) {
        const participantsKey = this.participantsSetKey(roomId);
        const participantHashKey = this.participantKey(roomId, userId);
        const roomMetaKey = this.roomMetaKey(roomId);
        const activeKey = this.activeRoomsKey();

        if (this.removeParticipantSha) {
            try {
                const res = await this.redis.evalsha(this.removeParticipantSha, 4, participantsKey, participantHashKey, roomMetaKey, activeKey, userId, roomId) as number;
                return res === 1;
            } catch (err: any) {
                const msg = (err && err.message) || '';
                if (!msg.includes('NOSCRIPT')) throw err;
            }
        }

        const res = await this.redis.eval(this.removeParticipantScript, 4, participantsKey, participantHashKey, roomMetaKey, activeKey, userId, roomId) as number;
        return res === 1;
    }

    async listParticipants(roomId: string) {
        const members = await this.redis.smembers(this.participantsSetKey(roomId));
        const participants: Participant[] = [];
        for (const u of members) {
            const p = await this.redis.hgetall(this.participantKey(roomId, u));
            if (p && Object.keys(p).length > 0) {
                participants.push({
                    userId: p.userId,
                    socketId: p.socketId,
                    joinedAt: Number(p.joinedAt) || Date.now(),
                    muted: p.muted === 'true',
                    videoOn: p.videoOn === 'true',
                    role: (p.role as any) || 'member',
                });
            }
        }
        return participants;
    }

    async updateParticipant(roomId: string, userId: string, patch: Partial<Participant>) {
        const key = this.participantKey(roomId, userId);
        const exists = await this.redis.exists(key);
        if (!exists) return undefined;
        const toSet: Record<string, string> = {};
        if (patch.socketId) toSet.socketId = patch.socketId;
        if (patch.joinedAt) toSet.joinedAt = String(patch.joinedAt);
        if (typeof patch.muted !== 'undefined') toSet.muted = patch.muted ? 'true' : 'false';
        if (typeof patch.videoOn !== 'undefined') toSet.videoOn = patch.videoOn ? 'true' : 'false';
        if (patch.role) toSet.role = patch.role;
        if (Object.keys(toSet).length > 0) await this.redis.hset(key, toSet as any);
        const p = await this.redis.hgetall(key);
        return {
            userId: p.userId,
            socketId: p.socketId,
            joinedAt: Number(p.joinedAt) || Date.now(),
            muted: p.muted === 'true',
            videoOn: p.videoOn === 'true',
            role: (p.role as any) || 'member',
        } as Participant;
    }
}
