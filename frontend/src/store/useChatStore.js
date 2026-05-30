import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create(() => ({

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
        const socket = useAuthStore.getState().socket;
        socket.emit('webrtc:group:create', { metadata: { topic: data.topic } }, (ack) => {
            console.log(ack);
            toast.success("Successfully created group");
        });
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

}));
