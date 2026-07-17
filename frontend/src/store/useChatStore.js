import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from 'sonner'
import axiosInstance from "../lib/axios";
import axios from "../lib/axios";

export const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    selectedConversation: null,
    isMessagesLoading: false,
    isConversationsLoading: false,
    onlineUsers: [],
    typingUsers: [],

    // ==================== Real-time Messaging ====================

    sendMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected to chat server"); throw new Error("Socket not connected"); }
        return new Promise((resolve, reject) => {
            socket.emit('send_message', {
                receiverId: data.receiverId, text: data.text, media: data.media || [],
                conversationId: data.conversationId, replyTo: data.replyTo,
                mentions: data.mentions || [], location: data.location,
                contact: data.contact, isVoiceMessage: data.isVoiceMessage,
                voiceDuration: data.voiceDuration, poll: data.poll, event: data.event,
                call: data.call, viewOnce: data.viewOnce,
            }, (ack) => {
                if (!ack?.ok) { toast.error(ack?.error || "Failed to send message"); reject(new Error(ack?.error || "Failed to send")); return; }
                get().getConversations();   // refresh list after sending
                resolve(ack.message);
            });
        });
    },

    reactToMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('reaction:add', { messageId: data.messageId, reaction: data.reaction }, (ack) => {
                if (!ack?.ok) { toast.error("Failed to react to message"); reject(new Error(ack?.error)); return; }
                resolve(ack);
            });
        });
    },

    editMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('message:edit', { messageId: data.messageId, newText: data.newText }, (ack) => {
                if (!ack?.ok) { toast.error("Failed to edit message"); reject(new Error(ack?.error)); return; }
                toast.success("Message edited");
                get().getConversations();   // refresh in case last message changed
                resolve(ack.message);
            });
        });
    },

    // Soft delete – only for the deleting user
    deleteMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        return new Promise((resolve, reject) => {
            socket.emit('message:delete', { messageId: data.messageId }, async (ack) => {
                if (!ack?.ok) { toast.error("Failed to delete"); reject(new Error(ack?.error)); return; }
                // Refresh conversations so the lastMessage updates immediately
                await get().getConversations();
                resolve(ack);
            });
        });
    },

    // Hard delete – for everyone
    deleteForEveryone: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        return new Promise((resolve, reject) => {
            socket.emit('message:delete:everyone', { messageId: data.messageId }, async (ack) => {
                if (!ack?.ok) { toast.error("Failed to delete"); reject(new Error(ack?.error)); return; }
                // Refresh conversations so the lastMessage updates immediately
                await get().getConversations();
                resolve(ack);
            });
        });
    },

    forwardMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('message:forward', { messageId: data.messageId, targets: data.targets }, async (ack) => {
                if (!ack?.ok) { toast.error("Failed to forward"); reject(new Error(ack?.error)); return; }
                await get().getConversations();
                resolve(ack);
            });
        });
    },

    readMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('message:read', { messageId: data.messageId }, (ack) => {
            if (!ack?.ok) console.error('Failed to mark as read');
        });
    },

    startTyping: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('typing:start', { toUserId: data.toUserId });
    },

    stopTyping: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('typing:stop', { toUserId: data.toUserId });
    },

    // ==================== Pin/Unpin Messages ====================

    pinMessage: async ({ messageId, duration }) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('message:pin', { messageId, duration }, (ack) => {
                if (!ack?.ok) { toast.error("Failed to pin message"); reject(new Error(ack?.error)); return; }
                resolve(ack);
            });
        });
    },

    unpinMessage: async (messageId) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('message:unpin', { messageId }, (ack) => {
                if (!ack?.ok) { toast.error("Failed to unpin message"); reject(new Error(ack?.error)); return; }
                resolve(ack);
            });
        });
    },

    // ==================== Poll Voting ====================

    votePoll: async ({ messageId, optionIndex, isMultiple }) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('poll:vote', { messageId, optionIndex, isMultiple }, (ack) => {
                if (!ack?.ok) { toast.error("Failed to vote"); reject(new Error(ack?.error)); return; }
                const { updateMessage, messages } = get();
                const msg = messages.find(m => m._id === messageId);
                if (msg) {
                    // ack.votes is a plain object like { userId: [0] }
                    updateMessage(messageId, {
                        poll: { ...msg.poll, votes: ack.votes }
                    });
                }
                resolve(ack);
            });
        });
    },

    // ==================== Media Upload ====================

    mediaUpload: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('upload:presign', { key: data.key, contentType: data.contentType }, async (ack) => {
                if (!ack?.ok) { toast.error("Upload failed"); reject(new Error(ack?.error)); return; }
                try {
                    const response = await fetch(ack.url, { method: 'PUT', headers: { 'Content-Type': data.contentType }, body: data.file });
                    if (!response.ok) throw new Error('Upload failed');
                    resolve({ publicUrl: ack.publicUrl, key: ack.key });
                } catch (error) { reject(error); }
            });
        });
    },

    // Upload chat media to MinIO
    uploadChatMedia: async ({ file, conversationId, mediaType }) => {
        try {
            const token = localStorage.getItem('access-token');
            const presignRes = await axiosInstance.post('/media/chat-presign', {
                conversationId,
                fileName: file.name || 'sticker.png',
                contentType: file.type || 'image/png',
                mediaType: mediaType || 'stickers',   // 👈 use 'stickers' folder
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (!presignRes.data.ok) throw new Error('Failed to get upload URL');

            await fetch(presignRes.data.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type || 'image/png' },
                body: file,
            });

            return { url: presignRes.data.publicUrl, key: presignRes.data.key };
        } catch (error) {
            console.error('uploadChatMedia error:', error);
            throw error;
        }
    },

    updateLinkPreview: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/message/${data.messageId}/linkPreview-update`, data.linkPreview, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
            console.error('uploadChatMedia error:', error);
            throw error;
        }
    },

    // ==================== Call Management ====================

    initiateCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('webrtc:call:initiate', { targets: data.targets, isVideo: data.isVideo, metadata: data.metadata }, (ack) => {
                if (!ack?.ok) { toast.error("Call initiation failed"); reject(new Error(ack?.error)); return; }
                resolve(ack);
            });
        });
    },

    signal: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('webrtc:signal', { toUserId: data.toUserId, type: data.type, data: data.data });
    },

    muteCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('webrtc:call:control', { callId: data.callId, action: data.muted ? 'mute' : 'unmute', data: { toUserId: data.toUserId } });
    },

    toggleVideoCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('webrtc:call:control', { callId: data.callId, action: data.videoOff ? 'video_off' : 'video_on', data: { toUserId: data.toUserId } });
    },

    leaveCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('webrtc:call:leave', { callId: data.callId }, (ack) => {
            if (ack?.ok) console.log('Left call');
        });
    },

    endCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('webrtc:call:end', { callId: data.callId }, (ack) => {
            if (!ack?.ok) console.error('Failed to end call', ack?.error);
        });
    },

    // ==================== Group Management ====================

    createGroup: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post('/chat/group', data, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
            toast.success('Group created successfully');
            return res.data;
        } catch (error) { console.error('Error creating group:', error); toast.error('Failed to create group'); throw error; }
    },

    joinGroup: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        socket.emit('webrtc:group:join', { groupId: data.groupId }, (ack) => {
            if (ack?.ok) { toast.success("Joined group"); console.log('Participants:', ack.participants); }
        });
    },

    sendGroupMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) { toast.error("Not connected"); return; }
        return new Promise((resolve, reject) => {
            socket.emit('webrtc:group:message', { groupId: data.groupId, text: data.text, media: data.media || [], metadata: data.metadata }, (ack) => {
                if (!ack?.ok) { toast.error("Failed to send group message"); reject(new Error(ack?.error)); return; }
                resolve(ack);
            });
        });
    },

    getRoomParticipants: async (data) => {
        const socket = useAuthStore.getState().socket;
        if (!socket?.connected) return;
        socket.emit('webrtc:room:participants', { roomId: data.roomId }, (ack) => {
            if (ack?.ok) console.log('Participants:', ack.participants);
        });
    },

    addGroupParticipant: async (conversationId, participantIds) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/group/${conversationId}/add`, { participantIds }, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
            return res.data;
        } catch (error) { console.error('Error adding participant:', error); toast.error('Failed to add participant'); }
    },

    removeGroupParticipant: async (conversationId, participantId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/group/${conversationId}/remove`, { participantId }, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
            return res.data;
        } catch (error) { console.error('Error removing participant:', error); toast.error('Failed to remove participant'); }
    },

    updateGroupInfo: async (conversationId, data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/group/${conversationId}`, data, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
            return res.data;
        } catch (error) { console.error('Error updating group info:', error); toast.error('Failed to update group info'); }
    },

    // ==================== Conversation Management (REST API) ====================

    getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/conversations', { headers: { Authorization: `Bearer ${token}` } });
            set({ conversations: res.data, isConversationsLoading: false });
            return res.data;
        } catch (error) { console.error('Error fetching conversations:', error); set({ isConversationsLoading: false }); return []; }
    },

    getConversation: async (userId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/chat/conversation/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            set({ currentConversation: res.data });
            return res.data;
        } catch (error) { console.error('Error getting conversation:', error); toast.error('Failed to get conversation'); return null; }
    },

    selectConversation: (conversation) => {
        set({ selectedConversation: conversation, currentConversation: conversation, messages: [] });
        if (conversation?._id) get().markConversationAsRead(conversation._id);
    },

    getMessages: async (conversationId, before = null) => {
        set({ isMessagesLoading: true });
        try {
            const token = localStorage.getItem('access-token');
            const params = before ? { before, limit: 50 } : { limit: 50 };
            const res = await axiosInstance.get(`/chat/messages/${conversationId}`, { headers: { Authorization: `Bearer ${token}` }, params });
            set({ messages: res.data, isMessagesLoading: false });
            return res.data;
        } catch (error) { console.error('Error fetching messages:', error); set({ isMessagesLoading: false }); return []; }
    },

    searchMessages: async (conversationId, query) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/search/${conversationId}`, { headers: { Authorization: `Bearer ${token}` }, params: { q: query } });
            return res.data;
        } catch (error) { console.error('Error searching messages:', error); toast.error('Failed to search messages'); return []; }
    },

    starMessage: async (messageId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/message/${messageId}/star`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const { authUser } = useAuthStore.getState();
            get().updateMessage(messageId, { starredBy: res.data.starred ? [authUser?._id] : [] });
            return res.data;
        } catch (error) {
            if (error?.response?.status !== 404) toast.error('Failed to star message');
        }
    },

    bookmarkMessage: async (messageId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/message/${messageId}/bookmark`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const { authUser } = useAuthStore.getState();
            get().updateMessage(messageId, { bookmarkedBy: res.data.bookmarked ? [authUser?._id] : [] });
            return res.data;
        } catch (error) {
            if (error?.response?.status !== 404) toast.error('Failed to bookmark message');
        }
    },

    getStarredMessages: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/starred/${conversationId}`, { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
        } catch (error) { console.error('Error fetching starred messages:', error); return []; }
    },

    pinConversation: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${conversationId}/pin`, {}, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
        } catch (error) { console.error('Error pinning conversation:', error); toast.error('Failed to pin conversation'); }
    },

    archiveConversation: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${conversationId}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
        } catch (error) { console.error('Error archiving conversation:', error); toast.error('Failed to archive conversation'); }
    },

    muteConversation: async (conversationId, duration = null) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${conversationId}/mute`, { duration }, { headers: { Authorization: `Bearer ${token}` } });
            await get().getConversations();
        } catch (error) { console.error('Error muting conversation:', error); toast.error('Failed to mute conversation'); }
    },

    markConversationAsRead: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${conversationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const socket = useAuthStore.getState().socket;
            if (socket?.connected) socket.emit('conversation:read', { conversationId });
            await get().getConversations();
        } catch (error) { console.error('Error marking conversation as read:', error); }
    },

    clearChat: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.delete(`/chat/conversation/${conversationId}/clear`, { headers: { Authorization: `Bearer ${token}` } });
            set({ messages: [] });
            toast.success('Chat cleared');
            await get().getConversations();
        } catch (error) { console.error('Error clearing chat:', error); toast.error('Failed to clear chat'); }
    },

    // ==================== Contacts ====================

    getContacts: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/contacts', { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
        } catch (error) { console.error('Error fetching contacts:', error); return []; }
    },

    addContact: async (contactId, nickname = null) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/chat/contact/${contactId}`, { nickname }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Contact added');
            return res.data;
        } catch (error) { console.error('Error adding contact:', error); toast.error('Failed to add contact'); }
    },

    updateContact: async (contactId, data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/contact/${contactId}`, data, { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
        } catch (error) { console.error('Error updating contact:', error); toast.error('Failed to update contact'); }
    },

    deleteContact: async (contactId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.delete(`/chat/contact/${contactId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Contact deleted');
        } catch (error) { console.error('Error deleting contact:', error); toast.error('Failed to delete contact'); }
    },

    downloadChat: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            await axios.get(`/chat/conversation/${data}/export`, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) { console.error('Error downloading chat:', error); toast.error('Failed to download chat'); }
    },

    changeThemeColor: async (data, conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axios.put(`/chat/conversation/${conversationId}/theme`, {"themeColor": data}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Chat theme color changed to ${data}`)
        } catch (error) { console.error('Error changing theme color:', error); toast.error('Failed to change theme color'); }
    },

    // ==================== Socket Event State Updaters ====================

    addMessage: (message) => {
        set((state) => {
            if (state.messages.find(m => m._id === message._id)) return state;
            return { messages: [...state.messages, message] };
        });
    },

    updateMessage: (messageId, updates) => {
        set((state) => ({
            messages: state.messages.map((msg) => msg._id === messageId ? { ...msg, ...updates } : msg)
        }));
    },

    removeMessage: (messageId) => {
        set((state) => ({ messages: state.messages.filter((msg) => msg._id !== messageId) }));
    },

    setOnlineUsers: (users) => { set({ onlineUsers: Array.isArray(users) ? users : [] }); },

    addTypingUser: (userId) => {
        set((state) => ({ typingUsers: state.typingUsers.includes(userId) ? state.typingUsers : [...state.typingUsers, userId] }));
    },

    removeTypingUser: (userId) => {
        set((state) => ({ typingUsers: state.typingUsers.filter((id) => id !== userId) }));
    },
}));