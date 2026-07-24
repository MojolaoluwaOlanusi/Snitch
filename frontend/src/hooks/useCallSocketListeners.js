import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useCallStore } from '../store/useCallStore.js';

export const useCallSocketListeners = () => {
    const { socket } = useAuthStore();
    const callStore = useCallStore();

    useEffect(() => {
        if (!socket) return;

        const onIncoming = (data) => callStore.handleIncomingCall(data);
        const onSignal = (data) => callStore.handleSignal(data);
        const onCallEnded = () => callStore.handleCallEnded();
        const onParticipantLeft = (data) => callStore.handleParticipantLeft(data.userId);
        const onParticipantJoined = (data) => callStore.handleParticipantJoined(data.userId);

        socket.on('webrtc:call:incoming', onIncoming);
        socket.on('webrtc:signal', onSignal);
        socket.on('webrtc:call:ended', onCallEnded);
        socket.on('webrtc:call:participant_left', onParticipantLeft);
        socket.on('webrtc:call:participant_joined', onParticipantJoined);

        return () => {
            socket.off('webrtc:call:incoming', onIncoming);
            socket.off('webrtc:signal', onSignal);
            socket.off('webrtc:call:ended', onCallEnded);
            socket.off('webrtc:call:participant_left', onParticipantLeft);
            socket.off('webrtc:call:participant_joined', onParticipantJoined);
        };
    }, [socket]);
};