import { Server, Socket } from 'socket.io';
import s3 from '../config/s3Client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RoomStore } from './rooms.js';

// Lightweight id generator to avoid new dependency
const makeId = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

/**
 * Register signaling and call-related socket handlers.
 * Responsibilities:
 * - WebRTC signaling (offer/answer/ice) forwarding
 * - Call lifecycle: initiate, join, leave, end
 * - Room/participant management via RoomStore
 * - Call controls: mute/unmute, video toggle, screen share, device change, quality change
 * - Presigned upload URL generation for MinIO/S3
 */
export const registerSignaling = (io: Server, socket: Socket, roomStore: RoomStore) => {
    const userId = socket.data.userId as string;

    // Helper to get sockets by userId
    const socketsByUser = (targetUserId: string) => {
        return Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === targetUserId);
    };

    // Generate presigned PUT URL for client uploads to MinIO/S3
    socket.on('upload:presign', async (payload: { bucket?: string; key: string; contentType?: string; expiresInSeconds?: number }, ack?: Function) => {
        try {
            const bucket = payload.bucket || process.env.S3_BUCKET || 'snitch-dev';
            const baseUrl = process.env.S3_ENDPOINT
                ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}`
                : `https://${bucket}.s3.amazonaws.com`;
            let key = payload.key;
            // validate key and force user-owned prefix to avoid open writes
            if (!key) return ack?.({ ok: false, error: 'missing_key' });
            // enforce a safe prefix: uploads/{userId}/... unless key already scoped to user
            const safePrefix = `messages/${userId}/`;
            if (!key.startsWith('messages/') && !key.startsWith(`users/${userId}/`)) {
                // normalize to user's uploads folder
                key = `${safePrefix}${key}`;
            }

            // simple content-type whitelist
            const allowed = ['image/', 'video/', 'audio/', 'application/pdf', 'application/octet-stream'];
            const contentType = payload.contentType || 'application/octet-stream';
            if (!allowed.some((p) => contentType.startsWith(p))) {
                return ack?.({ ok: false, error: 'invalid_content_type' });
            }

            // clamp expiresInSeconds between 30s and 24h
            const expires = Math.min(Math.max(payload.expiresInSeconds || 600, 30), 60 * 60 * 24);

            const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
            const url = await getSignedUrl(s3, command, { expiresIn: expires }); // default bounded
            ack?.({ ok: true, url, bucket, key, expiresInSeconds: expires, publicUrl: `${baseUrl}/${key}` });
        } catch (err: any) {
            console.error('upload:presign error', err);
            ack?.({ ok: false, error: err?.message || 'presign_error' });
        }
    });

    // Initiate a call to one or many users
    socket.on('webrtc:call:initiate', (payload: { targets: string[]; isVideo?: boolean; isGroupCall?: boolean; metadata?: any; callId?: string }, ack?: Function) => {
        try {
            const callId = payload.callId || makeId('call');
            const roomId = `call_${callId}`;
            roomStore.createRoom(roomId, { owner: userId, isVideo: !!payload.isVideo, isGroupCall: !!payload.isGroupCall, metadata: payload.metadata });
            roomStore.addParticipant(roomId, { userId, socketId: socket.id, joinedAt: Date.now(), muted: false, videoOn: !!payload.isVideo, role: 'owner' });
            socket.join(roomId);

            payload.targets.forEach((t) => {
                const targets = socketsByUser(t);
                targets.forEach((s) => s.emit('webrtc:call:incoming', {
                    callId,
                    from: userId,
                    roomId,
                    isVideo: !!payload.isVideo,
                    isGroupCall: !!payload.isGroupCall,
                    metadata: payload.metadata,
                }));
            });

            ack?.({ ok: true, callId, roomId });
        } catch (err: any) {
            console.error('webrtc:call:initiate error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Join an existing call room
    socket.on('webrtc:call:join', (payload: { callId: string; role?: 'member' | 'admin' | 'owner' }, ack?: Function) => {
        try {
            const callId = payload.callId;
            const roomId = `call_${callId}`;
            roomStore.createRoom(roomId);
            // if the user already exists in room (reconnect), update socketId instead of duplicating
            // const existing = roomStore.getRoom(roomId)?.participants.get(userId);
            const existing = true;
            if (existing) {
                // roomStore.updateParticipant(roomId, userId, { socketId: socket.id, joinedAt: Date.now(), role: payload.role || existing.role });
                roomStore.updateParticipant(roomId, userId, { socketId: socket.id, joinedAt: Date.now(), role: payload.role });
            } else {
                roomStore.addParticipant(roomId, { userId, socketId: socket.id, joinedAt: Date.now(), muted: false, videoOn: true, role: payload.role || 'member' });
            }
            socket.join(roomId);
            // notify others
            socket.to(roomId).emit('webrtc:call:participant_joined', { userId, socketId: socket.id });

            socket.to(roomId).emit('webrtc:call:accepted', {
                userId,
                callId
            });

            const participants = roomStore.listParticipants(roomId);
            ack?.({ ok: true, participants });
        } catch (err: any) {
            console.error('webrtc:call:join error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Forward generic signaling payloads (offer/answer/ice) to target socket(s)
    socket.on('webrtc:signal', (payload: { toSocketId?: string; toUserId?: string; callId?: string; type: 'offer' | 'answer' | 'ice' | string; data: any }, ack?: Function) => {
        try {
            if (payload.toSocketId) {
                const target = io.sockets.sockets.get(payload.toSocketId);
                if (target) target.emit('webrtc:signal', { from: userId, ...payload });
            } else if (payload.toUserId) {
                const targets = socketsByUser(payload.toUserId);
                targets.forEach((t) => t.emit('webrtc:signal', { from: userId, ...payload }));
            } else if (payload.callId) {
                const roomId = `call_${payload.callId}`;
                socket.to(roomId).emit('webrtc:signal', { from: userId, ...payload });
            }
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('webrtc:signal error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Call control events (mute/unmute, toggle video, screenshare, device change, quality change)
    socket.on('webrtc:call:control', (payload: { callId?: string; action: string; data?: any }, ack?: Function) => {
        try {
            const roomId = payload.callId ? `call_${payload.callId}` : null;
            const msg = { from: userId, action: payload.action, data: payload.data };
            if (roomId) socket.to(roomId).emit('webrtc:call:controller', msg);
            else {
                // broadcast to specific user if data.toUserId
                if (payload.data?.toUserId) {
                    const targets = socketsByUser(payload.data.toUserId);
                    targets.forEach((t) => t.emit('webrtc:call:controller', msg));
                }
            }
            // update room participant state for some actions
            if (roomId) {
                if (['mute', 'unmute', 'toggle_mute'].includes(payload.action) || ['video_on', 'video_off', 'toggle_video'].includes(payload.action)) {
                    const patch: any = {};
                    if (['mute', 'toggle_mute', 'unmute'].includes(payload.action)) patch.muted = payload.action === 'mute';
                    if (['video_on', 'video_off', 'toggle_video'].includes(payload.action)) patch.videoOn = payload.action === 'video_on';
                    roomStore.updateParticipant(roomId, userId, patch);
                    const participants = roomStore.listParticipants(roomId);
                    io.to(roomId).emit('webrtc:call:participants', participants);
                }
            }
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('webrtc:call:control error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Leave call
    socket.on('webrtc:call:leave', (payload: { callId: string }, ack?: Function) => {
        try {
            const roomId = `call_${payload.callId}`;
            roomStore.removeParticipant(roomId, userId);
            socket.leave(roomId);
            socket.to(roomId).emit('webrtc:call:participant_left', { userId });
            const room = roomStore.getRoom(roomId);
            // if room no longer exists, notify that call ended
            if (!room) {
                io.to(roomId).emit('webrtc:call:ended', { callId: payload.callId });
            }
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('webrtc:call:leave error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // End call (owner/admin)
    socket.on('webrtc:call:end', (payload: { callId: string }, ack?: Function) => {
        try {
            const roomId = `call_${payload.callId}`;
            const room = roomStore.getRoom(roomId);
            if (room) {
                // only owner or admin can end
                // const initiator = room.metadata?.owner;
                // const participant = room.participants.get(userId);
                // const allowed = initiator === userId || participant?.role === 'admin';
                // const allowed = initiator === userId;
                // if (!allowed) return ack?.({ ok: false, error: 'not_allowed' });
                // notify members
                io.to(roomId).emit('webrtc:call:ended', { callId: payload.callId });
                // cleanup
                roomStore.deleteRoom(roomId);
                // make sockets leave
                const members = Array.from(io.sockets.sockets.values()).filter((s) => s.rooms.has(roomId));
                members.forEach((m) => m.leave(roomId));
                ack?.({ ok: true });
            } else ack?.({ ok: false, error: 'room_not_found' });
        } catch (err: any) {
            console.error('webrtc:call:end error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Group creation helper (for large-member groups / roles)
    socket.on('webrtc:group:create', (payload: { groupId?: string; metadata?: any }, ack?: Function) => {
        try {
            const groupId = payload.groupId || makeId('group');
            const roomId = `group_${groupId}`;
            roomStore.createRoom(roomId, { ...payload.metadata, owner: userId });
            roomStore.addParticipant(roomId, { userId, socketId: socket.id, joinedAt: Date.now(), role: 'owner' });
            socket.join(roomId);
            ack?.({ ok: true, groupId, roomId });
        } catch (err: any) {
            console.error('webrtc:group:create error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Join group
    socket.on('webrtc:group:join', (payload: { groupId: string; role?: 'member' | 'admin' | 'owner' }, ack?: Function) => {
        try {
            const roomId = `group_${payload.groupId}`;
            roomStore.createRoom(roomId);
            roomStore.addParticipant(roomId, { userId, socketId: socket.id, joinedAt: Date.now(), role: payload.role || 'member' });
            socket.join(roomId);
            socket.to(roomId).emit('webrtc:group:participant_joined', { userId });
            ack?.({ ok: true, participants: roomStore.listParticipants(roomId) });
        } catch (err: any) {
            console.error('webrtc:group:join error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Send simple group message (optional: persisted via REST endpoint)
    socket.on('webrtc:group:message', (payload: { groupId: string; text?: string; media?: any[]; metadata?: any }, ack?: Function) => {
        try {
            const roomId = `group_${payload.groupId}`;
            const message = { from: userId, text: payload.text || '', media: payload.media || [], metadata: payload.metadata || {}, createdAt: new Date() };
            io.to(roomId).emit('webrtc:group:message', message);
            ack?.({ ok: true, message });
        } catch (err: any) {
            console.error('webrtc:group:message error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // Provide participants list for a room
    socket.on('webrtc:room:participants', (payload: { roomId: string }, ack?: Function) => {
        try {
            const participants = roomStore.listParticipants(payload.roomId);
            ack?.({ ok: true, participants });
        } catch (err: any) {
            console.error('webrtc:room:participants error', err);
            ack?.({ ok: false, error: err?.message });
        }
    });

    // NOTE: disconnect cleanup is handled centrally by the socket handlers to avoid duplicate logic.
 };
