import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";

export const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    selectedConversation: null,
    isMessagesLoading: false,
    isConversationsLoading: false,
    onlineUsers: [],
    typingUsers: [],

    sendMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('send_message', { receiverId: data.receiverId, text: data.text, media: data.media }, (ack) => {
            if (!ack || !ack.ok) return (
                toast.error("Failed to send message!")
            )
            if (!ack || !ack.ok) {
                console.error("Failed to send message");
            }
            console.log('message sent', ack.message);
            toast.success("Sent message");
        });
    },

    reactToMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('reaction:add', { messageId: data.messageId, reaction: data.reaction }, (ack) => {
            if (!ack.ok) console.error('reaction failed', ack.error);
            if (!ack.ok) return (
                toast.error("Failed to react to message!")
            );
            console.log('reacted to message');
            toast.success("Reacted to message");
        });
    },

    editMessage: async (data) =>  {
        const socket = useAuthStore.getState().socket;
        socket.emit('message:edit', { messageId: data.messageId, newText: data.newText }, (ack) => {
            if (!ack.ok) return console.error('Failed to edit message', ack.error);
            if (!ack.ok) return (
                toast.error("Failed to edit message!")
            );
            console.log('Edited', ack.message);
            toast.success("Edited message");
        });
    },

    deleteMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('message:delete', { messageId: data.messageId }, (ack) => {
            if (!ack.ok) return console.error('Failed to delete message', ack.error);
            if (!ack.ok) return (
                toast.error("Failed to delete message")
            );
            console.log('message deleted');
            toast.success("Successfully deleted message");
        });
    },

    forwardMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('message:forward', { messageId: data.messageId, targets: data.targets }, (ack) => {
            if (!ack.ok) console.error('Failed to forward message', ack.error);
            else console.log('Forwarded message');
            if (!ack.ok) return (
                toast.error("Failed to forward message")
            );
            toast.success("Forwarded message");
        });
    },

    readMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('message:read', { messageId: data.messageId }, (ack) => {
            if (!ack.ok) console.error('Failed to read message');
            if (!ack.ok) return (
                toast.error("Failed to read message")
            );
            console.log("Successfully read message");
            toast.success("Read message");
        });
    },

    startTyping: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('typing:start', { toUserId: data.toUserId });
    },

    stopTyping: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('typing:stop', { toUserId: data.toUserId });
    },

    mediaUpload: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('upload:presign', { key: data.key, contentType: data.contentType }, (ack) => {
            if (!ack.ok) return console.error('presign failed', ack.error);
            toast.success(ack.publicUrl);
            fetch(ack.url, { method: 'PUT', headers: { 'Content-Type': data.contentType }, body: data.file })
                .then((r) => { if (!r.ok) throw new Error('upload failed'); console.log('Successfully uploaded'); })
                .catch(console.error);
        });
    },

    initiateCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:call:initiate', { targets: data.targets, isVideo: data.isVideo }, (ack) => {
            if (!ack.ok) return console.error('Call initialization failed', ack.error);
            const { callId, roomId } = ack;
            console.log('Call created', callId, roomId);
            toast.success("Call created");
            // continue to create local RTCPeerConnection and gather ICE, then send offer via webrtc:signal
        });
    },

    signal: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:signal', { toSocketId: data.toSocketId, type: data.type, data: { sdp: data.sdp.sdp } });
    },

    muteCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:call:control', { data, action: 'mute' });
    },

    toggleVideo: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:call:control', { data, action: 'toggle_video' });
    },

    leaveCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:call:leave', { data }, (ack) => {
            if (ack.ok) return (
                toast.success("Successfully left call")
            );
            if (!ack.ok) return (
                toast.error("Failed to leave call")
            );
        });
    },

    endCall: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:call:end', { data }, (ack) => {
            if (ack.ok) return (
                toast.success("Successfully ended call")
            );
            if (!ack.ok) return (
                toast.error("Failed to end call")
            );
            if (!ack.ok) console.error(ack.error);
        });
    },

    createGroup: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post('/chat/group', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            toast.success('Group created successfully');
            return res.data;
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Failed to create group');
        }
    },

    joinGroup: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:group:join', { groupId: data.groupId }, (ack) => {
            console.log(ack.participants);
            toast.success("Successfully joined group");
        });
    },

    sendGroupMessage: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:group:message', { groupId: data.groupId, text: data.text, media: data.media, metadata: data.metadata }, (ack) => {
            if (!ack || !ack.ok) return (
                toast.error("Failed to send group message!")
            )
            if (!ack || !ack.ok) {
                console.error("Failed to send message");
            }
            console.log('group message sent', ack.message);
            toast.success("Sent group message");
        });
    },

    getRoomParticipants: async (data) => {
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:room:participants', { roomId: data.roomId }, (ack) => {
            if (ack.ok) console.log('participants', ack.participants);
        });
    },

    // Conversation management
    getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ conversations: res.data, isConversationsLoading: false });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            set({ isConversationsLoading: false });
        }
    },

    getConversation: async (userId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/chat/conversation/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ currentConversation: res.data });
            return res.data;
        } catch (error) {
            console.error('Error getting conversation:', error);
            toast.error('Failed to get conversation');
        }
    },

    selectConversation: (conversation) => {
        set({ selectedConversation: conversation, currentConversation: conversation });
    },

    getMessages: async (conversationId, before = null) => {
        set({ isMessagesLoading: true });
        try {
            const token = localStorage.getItem('access-token');
            const params = before ? { before } : {};
            const res = await axiosInstance.get(`/chat/messages/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            set({ messages: res.data, isMessagesLoading: false });
            return res.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            set({ isMessagesLoading: false });
        }
    },

    searchMessages: async (conversationId, query) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/search/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { q: query }
            });
            return res.data;
        } catch (error) {
            console.error('Error searching messages:', error);
            toast.error('Failed to search messages');
        }
    },

    starMessage: async (messageId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/message/${messageId}/star`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (error) {
            console.error('Error starring message:', error);
            toast.error('Failed to star message');
        }
    },

    getStarredMessages: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/starred/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (error) {
            console.error('Error fetching starred messages:', error);
        }
    },

    pinConversation: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/conversation/${conversationId}/pin`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            return res.data;
        } catch (error) {
            console.error('Error pinning conversation:', error);
            toast.error('Failed to pin conversation');
        }
    },

    archiveConversation: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/conversation/${conversationId}/archive`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            return res.data;
        } catch (error) {
            console.error('Error archiving conversation:', error);
            toast.error('Failed to archive conversation');
        }
    },

    muteConversation: async (conversationId, duration = null) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/conversation/${conversationId}/mute`, { duration }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            return res.data;
        } catch (error) {
            console.error('Error muting conversation:', error);
            toast.error('Failed to mute conversation');
        }
    },

    markConversationAsRead: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${conversationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    },

    clearChat: async (conversationId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.delete(`/chat/conversation/${conversationId}/clear`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ messages: [] });
            toast.success('Chat cleared');
        } catch (error) {
            console.error('Error clearing chat:', error);
            toast.error('Failed to clear chat');
        }
    },

    addGroupParticipant: async (conversationId, participantIds) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/group/${conversationId}/add`, { participantIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            return res.data;
        } catch (error) {
            console.error('Error adding participant:', error);
            toast.error('Failed to add participant');
        }
    },

    removeGroupParticipant: async (conversationId, participantId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/group/${conversationId}/remove`, { participantId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            return res.data;
        } catch (error) {
            console.error('Error removing participant:', error);
            toast.error('Failed to remove participant');
        }
    },

    updateGroupInfo: async (conversationId, data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/group/${conversationId}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await get().getConversations();
            return res.data;
        } catch (error) {
            console.error('Error updating group info:', error);
            toast.error('Failed to update group info');
        }
    },

    // Contacts
    getContacts: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/contacts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    },

    addContact: async (contactId, nickname = null) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/chat/contact/${contactId}`, { nickname }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Contact added');
            return res.data;
        } catch (error) {
            console.error('Error adding contact:', error);
            toast.error('Failed to add contact');
        }
    },

    updateContact: async (contactId, data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(`/chat/contact/${contactId}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (error) {
            console.error('Error updating contact:', error);
            toast.error('Failed to update contact');
        }
    },

    deleteContact: async (contactId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.delete(`/chat/contact/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Contact deleted');
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error('Failed to delete contact');
        }
    },

    // Socket event handlers
    addMessage: (message) => {
        set((state) => ({
            messages: [...state.messages, message]
        }));
    },

    updateMessage: (messageId, updates) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === messageId ? { ...msg, ...updates } : msg
            )
        }));
    },

    removeMessage: (messageId) => {
        set((state) => ({
            messages: state.messages.filter((msg) => msg._id !== messageId)
        }));
    },

    setOnlineUsers: (users) => {
        set({ onlineUsers: users });
    },

    addTypingUser: (userId) => {
        set((state) => ({
            typingUsers: [...state.typingUsers, userId]
        }));
    },

    removeTypingUser: (userId) => {
        set((state) => ({
            typingUsers: state.typingUsers.filter((id) => id !== userId)
        }));
    },

}));
