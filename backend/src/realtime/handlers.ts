import { Server, Socket } from 'socket.io';
import { RoomStore } from './rooms.ts';
import Message from '../models/Message.ts';
import Conversation from '../models/Conversation.ts';
import { registerSignaling } from './signaling.ts';

export const registerSocketHandlers = (io: Server, socket: Socket, roomStore: RoomStore) => {
    const userId = socket.data.userId as string;

    // presence
    socket.join(`user_${userId}`);
    io.to('presence').emit('user_online', userId);
    io.emit('user_online', userId);

    // expose online users list to the connecting socket
    const onlineUsers = Array.from(io.sockets.sockets.values()).map((s) => s.data?.userId).filter(Boolean);
    socket.emit('users_online', onlineUsers);

    // basic chat messaging with ack and persistence
    socket.on('send_message', async (payload: any, ack?: Function) => {
        try {
            // payload: { receiverId, text, media?: [{url,mime,size}], conversationId, replyTo, mentions, location, contact, isVoiceMessage, voiceDuration, viewOnce }
            const { receiverId, text, media, conversationId, replyTo, mentions, location, contact, isVoiceMessage, voiceDuration, viewOnce } = payload;
            // basic validation
            if (!receiverId && !conversationId) return ack?.({ ok: false, error: 'invalid_payload' });
            if (!text && (!media || !media.length) && !location && !contact && !isVoiceMessage) return ack?.({ ok: false, error: 'invalid_payload' });

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

            const message = await Message.create({
                senderId: userId,
                receiverId,
                conversationId: convId,
                text: text || '',
                media: media || [],
                replyTo,
                mentions,
                location,
                contact,
                isVoiceMessage,
                voiceDuration,
                viewOnce,
                status: 'sent',
            });

            // Update conversation's last message
            await Conversation.findByIdAndUpdate(convId, { lastMessage: message._id });

            // Increment unread count for receiver
            const conversation = await Conversation.findById(convId);
            if (conversation && receiverId) {
                const unreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
                conversation.unreadCount.set(receiverId.toString(), unreadCount + 1);
                await conversation.save();
            }

            // deliver to receiver if online
            if (receiverId) {
                const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === receiverId);
                receivers.forEach((rs) => rs.emit('receive_message', message));
            } else if (convId) {
                // Group chat - send to all participants except sender
                const conv = await Conversation.findById(convId).populate('participants');
                if (conv) {
                    const participantIds = conv.participants.map((p: any) => p._id.toString()).filter((id: string) => id !== userId);
                    participantIds.forEach((pid: string) => {
                        const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === pid);
                        receivers.forEach((rs) => rs.emit('receive_message', message));
                    });
                }
            }

            // also emit to sender for acknowledgement
            socket.emit('message_sent', message);

            ack?.({ ok: true, message });
        } catch (err: any) {
            console.error('send_message error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // typing indicator
    socket.on('typing:start', (payload: { toUserId?: string; roomId?: string }) => {
        if (payload.toUserId) {
            const targets = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === payload.toUserId);
            targets.forEach((t) => t.emit('typing:start', { from: userId }));
        } else if (payload.roomId) {
            socket.to(payload.roomId).emit('typing:start', { from: userId });
        }
    });

    socket.on('typing:stop', (payload: { toUserId?: string; roomId?: string }) => {
        if (payload.toUserId) {
            const targets = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === payload.toUserId);
            targets.forEach((t) => t.emit('typing:stop', { from: userId }));
        } else if (payload.roomId) {
            socket.to(payload.roomId).emit('typing:stop', { from: userId });
        }
    });

    // reactions
    socket.on('reaction:add', async (payload: { messageId: string; reaction: string }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            msg.reactions = msg.reactions || {};
            msg.reactions[userId] = payload.reaction;
            await msg.save();
            // broadcast update
            const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === msg.receiverId || s.data?.userId === msg.senderId);
            receivers.forEach((r) => r.emit('reaction:update', { messageId: msg._id, reactions: msg.reactions }));
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('reaction:add error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // message edit
    socket.on('message:edit', async (payload: { messageId: string; newText: string }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'not_allowed' });
            msg.text = payload.newText;
            msg.editedAt = new Date();
            await msg.save();
            const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === msg.receiverId || s.data?.userId === msg.senderId);
            receivers.forEach((r) => r.emit('message:edited', msg));
            ack?.({ ok: true, message: msg });
        } catch (err: any) {
            console.error('message:edit error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // message delete
    socket.on('message:delete', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'not_allowed' });
            msg.deletedAt = new Date();
            await msg.save();
            const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === msg.receiverId || s.data?.userId === msg.senderId);
            receivers.forEach((r) => r.emit('message:deleted', { messageId: msg._id }));
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:delete error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // forward/copy/share - simple broadcast to target(s)
    socket.on('message:forward', async (payload: { messageId: string; targets: string[] }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            for (const t of payload.targets) {
                const newMsg = await Message.create({
                    senderId: userId,
                    receiverId: t,
                    text: msg.text,
                    media: msg.media || [],
                });
                const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === t);
                receivers.forEach((r) => r.emit('receive_message', newMsg));
            }
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:forward error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // read receipts
    socket.on('message:read', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            msg.readAt = msg.readAt || {};
            msg.readAt[userId] = new Date();
            msg.status = 'read';
            await msg.save();
            const other = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === msg.senderId.toString());
            other.forEach((o) => o.emit('message:read', { messageId: msg._id, userId }));
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:read error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // star message
    socket.on('message:star', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            msg.starredBy = msg.starredBy || [];
            const isStarred = msg.starredBy.includes(userId);
            if (isStarred) {
                msg.starredBy = msg.starredBy.filter((id: any) => id.toString() !== userId);
            } else {
                msg.starredBy.push(userId);
            }
            await msg.save();
            const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === msg.senderId.toString() || s.data?.userId === msg.receiverId?.toString());
            receivers.forEach((r) => r.emit('message:starred', { messageId: msg._id, starred: !isStarred, userId }));
            ack?.({ ok: true, starred: !isStarred });
        } catch (err: any) {
            console.error('message:star error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // delete for everyone
    socket.on('message:delete:everyone', async (payload: { messageId: string }, ack?: Function) => {
        try {
            const msg: any = await Message.findById(payload.messageId);
            if (!msg) return ack?.({ ok: false, error: 'message_not_found' });
            if (msg.senderId.toString() !== userId) return ack?.({ ok: false, error: 'not_allowed' });
            msg.deletedForEveryone = true;
            msg.deletedAt = new Date();
            await msg.save();
            const receivers = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === msg.receiverId?.toString() || s.data?.userId === msg.senderId.toString());
            receivers.forEach((r) => r.emit('message:deleted:everyone', { messageId: msg._id }));
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('message:delete:everyone error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // mark conversation as read
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
                        status: "read",
                    },
                }
            );

            // Update unread count
            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                conversation.unreadCount.set(userId.toString(), 0);
                await conversation.save();
            }

            ack?.({ ok: true });
        } catch (err: any) {
            console.error('conversation:read error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // blocking
    socket.on('user:block', async (payload: { targetId: string }, ack?: Function) => {
        // For now just emit an event and rely on REST route to persist block list
        try {
            const target = payload.targetId;
            const targets = Array.from(io.sockets.sockets.values()).filter((s) => s.data?.userId === target);
            targets.forEach((t) => t.emit('user:block', { by: userId }));
            ack?.({ ok: true });
        } catch (err: any) {
            console.error('user:block error', err);
            ack?.({ ok: false, error: err.message });
        }
    });

    // register signaling events
    registerSignaling(io, socket, roomStore);

    socket.on('disconnect', () => {
        // cleanup: remove this socket's association from any rooms
        (async () => {
            try {
                const roomIds: string[] = (typeof roomStore.listAllRoomIds === 'function') ? roomStore.listAllRoomIds() : [];
                for (const roomId of roomIds) {
                    try {
                        const participants = roomStore.listParticipants(roomId);
                        const p = participants.find((pp: any) => pp.userId === userId);
                        if (p && p.socketId === socket.id) {
                            roomStore.removeParticipant(roomId, userId);
                            io.to(roomId).emit('webrtc:call:participant_left', { userId });
                            const after = roomStore.getRoom(roomId);
                            if (!after) {
                                io.to(roomId).emit('webrtc:call:ended', { roomId });
                            }
                        }
                    } catch (e) {
                        // best-effort per-room
                    }
                }
            } catch (err) {
                // best-effort
            }
        })();

        io.to('presence').emit('user_offline', userId);
        io.emit('user_offline', userId);
    });
};
