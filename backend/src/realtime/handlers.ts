import { Server, Socket } from 'socket.io';
import { RoomStore } from './rooms.ts';
import Message from '../models/Message.ts';
import Notification from "../models/Notification.ts"
import Conversation from '../models/Conversation.ts';
import {User} from '../models/User.ts';
import { registerSignaling } from './signaling.ts';
import { cacheMessage, cacheOnlineStatus, getOnlineUsers, removeCachedMessage, updateCachedMessage } from '../utils/redisCache.ts';

export const registerSocketHandlers = (io: Server, socket: Socket, roomStore: RoomStore) => {
    const userId = socket.data.userId as string;
    const user = socket.data.user;

    // ==================== Presence ====================

    socket.join(`user_${userId}`);

    io.emit('user_online', userId);

    (async () => {
        try {
            await cacheOnlineStatus(userId, true);
            const cachedOnlineUsers = await getOnlineUsers();
            const fallbackOnlineUsers = Array.from(io.sockets.sockets.values())
                .map((s) => s.data?.userId)
                .filter(Boolean);
            socket.emit('users_online', cachedOnlineUsers.length > 0 ? cachedOnlineUsers : fallbackOnlineUsers);
        } catch (err) {
            const fallbackOnlineUsers = Array.from(io.sockets.sockets.values())
                .map((s) => s.data?.userId)
                .filter(Boolean);
            socket.emit('users_online', fallbackOnlineUsers);
        }
    })();

    socket.on('get_online_users', async () => {
        try {
            const cachedOnlineUsers = await getOnlineUsers();
            const fallbackOnlineUsers = Array.from(io.sockets.sockets.values())
                .map((s) => s.data?.userId)
                .filter(Boolean);
            socket.emit('users_online', cachedOnlineUsers.length > 0 ? cachedOnlineUsers : fallbackOnlineUsers);
        } catch (err) {
            const fallbackOnlineUsers = Array.from(io.sockets.sockets.values())
                .map((s) => s.data?.userId)
                .filter(Boolean);
            socket.emit('users_online', fallbackOnlineUsers);
        }
    });

    // ==================== Messaging ====================

    socket.on('send_message', async (payload: any, ack?: Function) => {
        try {
            const { receiverId, text, media, conversationId, replyTo, mentions, location, contact, isVoiceMessage, voiceDuration } = payload;

            if (!receiverId && !conversationId) return ack?.({ ok: false, error: 'No receiver or conversation specified' });
            if (!text && (!media || !media.length) && !location && !contact && !isVoiceMessage && !payload.call) {
                return ack?.({ ok: false, error: 'Empty message' });
            }

            if (receiverId) {
                const receiver = await User.findById(receiverId);
                if (receiver?.blocked?.some((id: any) => id.toString() === userId)) {
                    return ack?.({ ok: false, error: 'You have been blocked by this user' });
                }
                const sender = await User.findById(userId);
                if (sender?.blocked?.some((id: any) => id.toString() === receiverId)) {
                    return ack?.({ ok: false, error: 'You have blocked this user' });
                }
            }

            let convId = conversationId;
            if (!convId && receiverId) {
                let conversation = await Conversation.findOne({
                    participants: { $all: [userId, receiverId] },
                    isGroup: false,
                });
                if (!conversation) {
                    conversation = await Conversation.create({
                        participants: [userId, receiverId],
                        isGroup: false,
                    });
                }
                convId = conversation._id;
            }

            if (convId) {
                const conversation = await Conversation.findById(convId);
                if (conversation?.isGroup && conversation?.adminOnlyMessages) {
                    if (conversation.admin?.toString() !== userId) {
                        return ack?.({ ok: false, error: 'Only admins can send messages in this group' });
                    }
                }
            }

            const message = await Message.create({
                senderId: userId,
                receiverId,
                conversationId: convId,
                text: text || '',
                media: (media || []).map((m: any) => ({
                    url: m.url,
                    mime: m.mime || 'video/webm',
                    size: m.size || 0,
                    filename: m.filename || 'video',
                    isHexagon: m.isHexagon || false,
                    caption: m.caption || '',
                })),
                replyTo,
                mentions: mentions || [],
                location,
                contact,
                isVoiceMessage: isVoiceMessage || false,
                voiceDuration,
                status: 'sent',
                ...(payload.poll ? { poll: payload.poll } : {}),
                ...(payload.event ? { event: payload.event } : {}),
                ...(payload.call ? { call: payload.call } : {}),
                viewOnce: payload.viewOnce || false,
                viewedBy: [],
            });

            const populatedMessage = await Message.findById(message._id)
                .populate('senderId', 'username displayName avatarUrl')
                .populate('replyTo')
                .populate('mentions', 'username displayName avatarUrl');

            // Create notifications for mentioned users
            if (payload.mentions && payload.mentions.length > 0) {
                for (const mentionId of payload.mentions) {
                    if (mentionId === userId) continue;

                    await Notification.create({
                        type: 'mention',
                        from: userId,
                        to: mentionId,
                        message: message._id,
                        text: `${user.displayName || 'Someone'} mentioned you: "${text?.substring(0, 100)}"`,
                        conversationId: convId,
                        fromAvatarUrl: user.avatarUrl || null,
                    });

                    const mentionedSocket = Array.from(io.sockets.sockets.values())
                        .find((s: any) => s.data?.userId === mentionId);
                    if (mentionedSocket) {
                        mentionedSocket.emit('notification:mention', {
                            messageId: message._id,
                            conversationId: convId,
                            from: userId,
                            text: `${user.displayName || 'Someone'} mentioned you in a message`,
                        });
                    }
                }
            }

            // Inside the mention loop (right after existing mention handling)
            if (payload.text?.includes('@everyone') && convId) {
                const conversation = await Conversation.findById(convId);
                if (conversation?.isGroup) {
                    for (const pid of conversation.participants) {
                        if (pid.toString() === userId) continue;
                        await Notification.create({
                            type: 'mention',
                            from: userId,
                            to: pid,
                            message: message._id,
                            text: `${user.displayName || 'Someone'} mentioned @everyone`,
                            conversationId: convId,
                            fromAvatarUrl: user.avatarUrl || null,
                        });
                    }
                }
            }

            await Conversation.findByIdAndUpdate(convId, {
                lastMessage: message._id,
                updatedAt: new Date()
            });

            const conversation = await Conversation.findById(convId);
            if (conversation) {
                const otherParticipants = conversation.participants
                    .map((p: any) => p.toString())
                    .filter((id: string) => id !== userId);

                for (const pid of otherParticipants) {
                    const currentCount = conversation.unreadCount.get(pid) || 0;
                    conversation.unreadCount.set(pid, currentCount + 1);
                }
                await conversation.save();
            }

            if (convId) {
                await cacheMessage(convId.toString(), populatedMessage).catch(err =>
                    console.error('Redis cache error:', err?.message || err)
                );
            }

            const conversationPopulated = await Conversation.findById(convId).populate('participants');
            if (conversationPopulated) {
                const participantIds = conversationPopulated.participants
                    .map((p: any) => p._id?.toString())
                    .filter((id: string) => id !== userId);

                participantIds.forEach((pid: string) => {
                    const receivers = Array.from(io.sockets.sockets.values())
                        .filter((s) => s.data?.userId === pid);
                    receivers.forEach((rs) => {
                        rs.emit('receive_message', populatedMessage);
                    });
                });
            }

            socket.emit('message_sent', populatedMessage);
            ack?.({ ok: true, message: populatedMessage });

        } catch (err: any) {
            console.error('send_message error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Typing Indicators ====================

    socket.on('typing:start', (payload: { toUserId?: string; roomId?: string }) => {
        if (payload.toUserId) {
            const targets = Array.from(io.sockets.sockets.values())
                .filter((s) => s.data?.userId === payload.toUserId);
            targets.forEach((t) => t.emit('typing:start', { from: userId }));
        } else if (payload.roomId) {
            socket.to(payload.roomId).emit('typing:start', { from: userId });
        }
    });

    socket.on('typing:stop', (payload: { toUserId?: string; roomId?: string }) => {
        if (payload.toUserId) {
            const targets = Array.from(io.sockets.sockets.values())
                .filter((s) => s.data?.userId === payload.toUserId);
            targets.forEach((t) => t.emit('typing:stop', { from: userId }));
        } else if (payload.roomId) {
            socket.to(payload.roomId).emit('typing:stop', { from: userId });
        }
    });

    // ==================== Reactions ====================

    socket.on('reaction:add', async (payload: { messageId: string; reaction: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });

            msg.reactions = msg.reactions || {};

            if (msg.reactions[userId] === payload.reaction) {
                delete msg.reactions[userId];
            } else {
                msg.reactions[userId] = payload.reaction;
            }

            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(
                    msg.conversationId.toString(),
                    payload.messageId,
                    populated
                ).catch(err => console.error('Redis update (reaction) error:', err?.message));
            }

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('reaction:update', { messageId: msg._id, reactions: msg.reactions, userId }));

            ack?.({ ok: true, reactions: msg.reactions });
        } catch (err: any) {
            console.error('reaction:add error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Message Edit & Delete ====================

    socket.on('message:edit', async (payload: { messageId: string; newText: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'Not authorized' });

            msg.text = payload.newText;
            msg.editedAt = new Date();
            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(msg.conversationId.toString(), payload.messageId, populated);
            }

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('message:edited', populated));

            ack?.({ ok: true, message: populated });
        } catch (err: any) {
            console.error('message:edit error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // Soft Delete (Delete for me)
    socket.on('message:delete', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'Not authorized' });

            msg.deletedAt = new Date();
            await msg.save();

            // Update conversation's lastMessage to the previous non‑deleted message
            const latestMessage = await Message.findOne(
                { conversationId: msg.conversationId, deletedForEveryone: { $ne: true } },
                {},
                { sort: { createdAt: -1 } }
            );
            await Conversation.findByIdAndUpdate(msg.conversationId, {
                lastMessage: latestMessage?._id || null
            });

            // Update Redis cache for the deleted message (already present)
            const conversationId = msg.conversationId?.toString();
            if (conversationId) {
                await updateCachedMessage(conversationId, payload.messageId, msg)
                    .catch(err => console.error('Redis update (soft delete) error:', err?.message));
            }

            // Notify participants
            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('message:deleted', { messageId: msg._id }));

            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:delete error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    socket.on('message:delete:everyone', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'Not authorized' });

            msg.deletedForEveryone = true;
            msg.deletedAt = new Date();
            msg.text = '';
            msg.media = [];
            await msg.save();

            // Update conversation's lastMessage
            const latestMessage = await Message.findOne(
                { conversationId: msg.conversationId, deletedForEveryone: { $ne: true } },
                {},
                { sort: { createdAt: -1 } }
            );
            await Conversation.findByIdAndUpdate(msg.conversationId, { lastMessage: latestMessage?._id || null });

            const conversationId = msg.conversationId?.toString();
            if (conversationId) {
                await removeCachedMessage(conversationId, payload.messageId).catch(err =>
                    console.error('Redis remove (hard delete) error:', err?.message)
                );
            }

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('message:deleted:everyone', { messageId: msg._id }));

            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:delete:everyone error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Forward ====================

    socket.on('message:forward', async (payload: { messageId: string; targets: string[] }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId)
                .populate('senderId', 'username displayName avatarUrl');
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });

            for (const targetId of payload.targets) {
                let conv = await Conversation.findOne({
                    participants: { $all: [userId, targetId] },
                    isGroup: false,
                });

                if (!conv) {
                    conv = await Conversation.create({
                        participants: [userId, targetId],
                        isGroup: false,
                    });
                }

                const newMsg = await Message.create({
                    senderId: userId,
                    receiverId: targetId,
                    conversationId: conv._id,
                    text: msg.text || '',
                    media: msg.media || [],
                    forwardedFrom: msg._id,
                    status: 'sent',
                });

                const populated = await Message.findById(newMsg._id)
                    .populate('senderId', 'username displayName avatarUrl');

                await Conversation.findByIdAndUpdate(conv._id, {
                    lastMessage: newMsg._id,
                    updatedAt: new Date()
                });

                if (conv) {
                    await cacheMessage(conv._id.toString(), populated).catch(err =>
                        console.error('Redis cache forward error:', err?.message)
                    );
                }

                const receivers = Array.from(io.sockets.sockets.values())
                    .filter((s) => s.data?.userId === targetId);
                receivers.forEach((r) => r.emit('receive_message', populated));
            }

            msg.forwardedCount = (msg.forwardedCount || 0) + payload.targets.length;
            await msg.save();

            ack?.({ ok: true, count: payload.targets.length });
        } catch (err: any) {
            console.error('message:forward error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Read Receipts ====================

    socket.on('message:read', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });

            msg.readAt = msg.readAt || {};
            msg.readAt[userId] = new Date();
            msg.status = 'read';
            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(
                    msg.conversationId.toString(),
                    msg._id.toString(),
                    populated
                ).catch(err => console.error('Redis update (message:read) error:', err?.message));
            }

            const senderSocket = Array.from(io.sockets.sockets.values())
                .find(s => s.data?.userId === msg.senderId.toString());
            if (senderSocket) {
                senderSocket.emit('message:read', { messageId: msg._id, userId });
            }

            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:read error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Star Message ====================

    socket.on('message:star', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });

            msg.starredBy = msg.starredBy || [];
            const isStarred = msg.starredBy.some((id: any) => id.toString() === userId);

            if (isStarred) {
                msg.starredBy = msg.starredBy.filter((id: any) => id.toString() !== userId);
            } else {
                (msg.starredBy as any[]).push(userId as any);
            }

            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(
                    msg.conversationId.toString(),
                    payload.messageId,
                    populated
                ).catch(err => console.error('Redis update (star) error:', err?.message));
            }

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('message:starred', {
                messageId: msg._id,
                starred: !isStarred,
                userId
            }));

            ack?.({ ok: true, starred: !isStarred });
        } catch (err: any) {
            console.error('message:star error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Pin Message ====================

    socket.on('message:pin', async (payload: { messageId: string; duration: number }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });

            (msg as any).pinned = true;
            (msg as any).pinnedAt = new Date();
            (msg as any).pinnedUntil = payload.duration
                ? new Date(Date.now() + payload.duration * 3600000)
                : undefined;

            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(
                    msg.conversationId.toString(),
                    payload.messageId,
                    populated
                ).catch(err => console.error('Redis update (pin) error:', err?.message));
            }

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('message:pinned', { message: populated }));

            ack?.({ ok: true, message: populated });
        } catch (err: any) {
            console.error('message:pin error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Unpin Message ====================

    socket.on('message:unpin', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });

            (msg as any).pinned = false;
            (msg as any).pinnedAt = undefined;
            (msg as any).pinnedUntil = undefined;
            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(
                    msg.conversationId.toString(),
                    payload.messageId,
                    populated
                ).catch(err => console.error('Redis update (unpin) error:', err?.message));
            }

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('message:unpinned', { messageId: msg._id }));

            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:unpin error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Poll Vote ====================

    socket.on('poll:vote', async (payload: { messageId: string; optionIndex: number }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg || !msg.poll) return ack?.({ ok: false, error: 'Poll not found' });

            if (!(msg.poll as any).votes) {
                (msg.poll as any).votes = new Map();
            }

            const votes = (msg.poll as any).votes as Map<string, number>;

            if (votes.get(userId) === payload.optionIndex) {
                votes.delete(userId);
            } else {
                votes.set(userId, payload.optionIndex);
            }

            msg.markModified('poll.votes');
            await msg.save();

            const populated = await Message.findById(msg._id)
                .populate('senderId', 'username displayName avatarUrl');

            if (msg.conversationId) {
                await updateCachedMessage(
                    msg.conversationId.toString(),
                    payload.messageId,
                    populated
                ).catch(err => console.error('Redis update (poll vote) error:', err?.message));
            }

            const votesObj: Record<string, number> = {};
            votes.forEach((value: number, key: string) => {
                votesObj[key] = value;
            });

            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('poll:updated', { messageId: msg._id, votes: votesObj }));

            ack?.({ ok: true, votes: votesObj });
        } catch (err: any) {
            console.error('poll:vote error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Mark Conversation as Read ====================

    socket.on('conversation:read', async (payload: { conversationId: string }, ack?: Function) => {
        try {
            const { conversationId } = payload;

            const unreadMessages = await Message.find({
                conversationId,
                senderId: { $ne: userId },
                [`readAt.${userId}`]: { $exists: false },
            });

            await Message.updateMany(
                {
                    conversationId,
                    senderId: { $ne: userId },
                    [`readAt.${userId}`]: { $exists: false },
                },
                {
                    $set: {
                        [`readAt.${userId}`]: new Date(),
                        status: 'read',
                    },
                }
            );

            for (const msg of unreadMessages) {
                const populated = await Message.findById(msg._id)
                    .populate('senderId', 'username displayName avatarUrl');

                if (populated && msg.conversationId) {
                    await updateCachedMessage(
                        msg.conversationId.toString(),
                        msg._id.toString(),
                        populated
                    ).catch(err => console.error('Redis update (conversation:read) error:', err?.message));
                }

                const senderId = msg.senderId.toString();
                const senderSocket = Array.from(io.sockets.sockets.values())
                    .find(s => s.data?.userId === senderId);
                if (senderSocket) {
                    senderSocket.emit('message:read', { messageId: msg._id, userId });
                }
            }

            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                conversation.unreadCount.set(userId.toString(), 0);
                await conversation.save();
            }

            ack?.({ ok: true });
        } catch (err: any) {
            console.error('conversation:read error:', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // ==================== Register Signaling ====================

    registerSignaling(io, socket, roomStore);

    // ==================== Disconnect ====================

    socket.on('disconnect', async () => {
        try {
            const roomIds: string[] = typeof roomStore.listAllRoomIds === 'function'
                ? roomStore.listAllRoomIds()
                : [];

            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            for (const roomId of roomIds) {
                try {
                    const participants = roomStore.listParticipants(roomId);
                    const p = participants.find((pp: any) => pp.userId === userId);
                    if (p && p.socketId === socket.id) {
                        roomStore.removeParticipant(roomId, userId);
                        io.to(roomId).emit('webrtc:call:participant_left', { userId });

                        const remaining = roomStore.getRoom(roomId);
                        if (!remaining || remaining.participants?.size === 0) {
                            io.to(roomId).emit('webrtc:call:ended', { roomId });
                            roomStore.deleteRoom(roomId);
                        }
                    }
                } catch (e) {
                }
            }
        } catch (err) {
        }

        await cacheOnlineStatus(userId, false).catch(err =>
            console.error('Redis offline cache error:', err?.message || err)
        );

        io.emit('user_offline', userId);
    });
};