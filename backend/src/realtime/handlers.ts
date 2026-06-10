import { Server, Socket } from 'socket.io';
import { RoomStore } from './rooms.ts';
import Message from '../models/Message.ts';
import Conversation from '../models/Conversation.ts';
import { registerSignaling } from './signaling.ts';

export const registerSocketHandlers = (io: Server, socket: Socket, roomStore: RoomStore) => {
    const userId = socket.data.userId as string;
    const objectUserId = socket.data.userId;
    const user = socket.data.user;

    // ==================== Presence ====================

    socket.join(`user_${userId}`);

    // Broadcast online status
    io.emit('user_online', userId);

    // Send current online users to the connecting socket
    const onlineUsers = Array.from(io.sockets.sockets.values())
        .map((s) => s.data?.userId)
        .filter(Boolean);
    socket.emit('users_online', onlineUsers);

    // Handle request for online users
    socket.on('get_online_users', () => {
        const users = Array.from(io.sockets.sockets.values())
            .map((s) => s.data?.userId)
            .filter(Boolean);
        socket.emit('users_online', users);
    });

    // ==================== Messaging ====================

    socket.on('send_message', async (payload: any, ack?: Function) => {
        try {
            const { receiverId, text, media, conversationId, replyTo, mentions, location, contact, isVoiceMessage, voiceDuration } = payload;

            if (!receiverId && !conversationId) return ack?.({ ok: false, error: 'No receiver or conversation specified' });
            if (!text && (!media || !media.length) && !location && !contact && !isVoiceMessage) {
                return ack?.({ ok: false, error: 'Empty message' });
            }

            // Get or create conversation
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

            // Create message
            const message = await Message.create({
                senderId: userId,
                receiverId,
                conversationId: convId,
                text: text || '',
                media: media || [],
                replyTo,
                mentions: mentions || [],
                location,
                contact,
                isVoiceMessage: isVoiceMessage || false,
                voiceDuration,
                status: 'sent',
            });

            // Populate for delivery
            const populatedMessage = await Message.findById(message._id)
                .populate('senderId', 'username displayName avatarUrl')
                .populate('replyTo')
                .populate('mentions', 'username displayName avatarUrl');

            // Update conversation's last message
            await Conversation.findByIdAndUpdate(convId, {
                lastMessage: message._id,
                updatedAt: new Date()
            });

            // Increment unread count for all participants except sender
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

            // Deliver to receivers
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

            // Send acknowledgment to sender
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

            // Toggle reaction if same emoji
            if (msg.reactions[userId] === payload.reaction) {
                delete msg.reactions[userId];
            } else {
                msg.reactions[userId] = payload.reaction;
            }

            await msg.save();

            // Broadcast to sender and receiver
            const targets = [msg.senderId.toString(), msg.receiverId?.toString()].filter(Boolean);
            const receivers = Array.from(io.sockets.sockets.values())
                .filter((s) => targets.includes(s.data?.userId));
            receivers.forEach((r) => r.emit('reaction:update', { messageId: msg._id, reactions: msg.reactions }));

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

    socket.on('message:delete', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'Message not found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'Not authorized' });

            msg.deletedAt = new Date();
            await msg.save();

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

            const forwardedCount = payload.targets.length;

            for (const targetId of payload.targets) {
                // Get or create conversation
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

                // Update conversation
                await Conversation.findByIdAndUpdate(conv._id, {
                    lastMessage: newMsg._id,
                    updatedAt: new Date()
                });

                // Deliver
                const receivers = Array.from(io.sockets.sockets.values())
                    .filter((s) => s.data?.userId === targetId);
                receivers.forEach((r) => r.emit('receive_message', populated));
            }

            // Update forward count
            msg.forwardedCount = (msg.forwardedCount || 0) + forwardedCount;
            await msg.save();

            ack?.({ ok: true, count: forwardedCount });
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

            const sender = Array.from(io.sockets.sockets.values())
                .filter((s) => s.data?.userId === msg.senderId.toString());
            sender.forEach((s) => s.emit('message:read', { messageId: msg._id, userId }));

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
                msg.starredBy.push(objectUserId);
            }

            await msg.save();

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

    // ==================== Mark Conversation as Read ====================

    socket.on('conversation:read', async (payload: { conversationId: string }, ack?: Function) => {
        try {
            const { conversationId } = payload;

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
        // Cleanup rooms
        try {
            const roomIds: string[] = typeof roomStore.listAllRoomIds === 'function'
                ? roomStore.listAllRoomIds()
                : [];

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
                    // Best-effort per room
                }
            }
        } catch (err) {
            // Best-effort
        }

        // Broadcast offline status
        io.emit('user_offline', userId);
    });
};