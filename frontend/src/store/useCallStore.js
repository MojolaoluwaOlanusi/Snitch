// frontend/src/store/useCallStore.js
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore.js';
import { toast } from 'sonner';

export const useCallStore = create((set, get) => ({
    // ===== State =====
    incomingCall: null,           // { callId, callerId, callerName, isVideo, isGroupCall, metadata }
    activeCall: null,             // { callId, isVideo, otherUserId, isGroupCall }
    isRinging: false,
    callAnswered: false,
    callDuration: 0,
    localStream: null,
    remoteStreams: new Map(),
    peerConnections: new Map(),
    isMicMuted: false,
    isVideoOff: false,
    isFrontCamera: true,
    isVideoMode: true,
    isSharingScreen: false,
    screenStream: null,
    isCallMinimized: false,
    callTimerRef: null,
    callTimeoutRef: null,

    // ===== Actions =====

    setIncomingCall: (call) => set({ incomingCall: call }),

    setActiveCall: (call) => set({ activeCall: call }),

    setIsRinging: (value) => set({ isRinging: value }),

    setCallAnswered: (value) => set({ callAnswered: value }),

    setCallDuration: (value) => set({ callDuration: value }),

    setLocalStream: (stream) => set({ localStream: stream }),

    setRemoteStreams: (updater) => {
        set((state) => ({
            remoteStreams: typeof updater === 'function'
                ? updater(state.remoteStreams)
                : updater
        }));
    },

    setPeerConnections: (updater) => {
        set((state) => ({
            peerConnections: typeof updater === 'function'
                ? updater(state.peerConnections)
                : updater
        }));
    },

    setIsMicMuted: (value) => set({ isMicMuted: value }),

    setIsVideoOff: (value) => set({ isVideoOff: value }),

    setIsFrontCamera: (value) => set({ isFrontCamera: value }),

    setIsVideoMode: (value) => set({ isVideoMode: value }),

    setIsSharingScreen: (value) => set({ isSharingScreen: value }),

    setScreenStream: (stream) => set({ screenStream: stream }),

    setIsCallMinimized: (value) => set({ isCallMinimized: value }),

    setCallTimerRef: (ref) => set({ callTimerRef: ref }),

    setCallTimeoutRef: (ref) => set({ callTimeoutRef: ref }),

    // ===== Peer Connection Helpers =====

    createPeerConnection: (targetUserId) => {
        const socket = useAuthStore.getState().socket;
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket?.emit('webrtc:signal', {
                    toUserId: targetUserId,
                    type: 'ice',
                    data: e.candidate,
                });
            }
        };

        pc.ontrack = (e) => {
            get().setRemoteStreams((prev) => {
                const newMap = new Map(prev);
                newMap.set(targetUserId, e.streams[0]);
                return newMap;
            });
        };

        pc.onconnectionstatechange = () => {
            if (['disconnected', 'failed'].includes(pc.connectionState)) {
                get().setRemoteStreams((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(targetUserId);
                    return newMap;
                });
            }
        };

        get().setPeerConnections((prev) => {
            const newMap = new Map(prev);
            newMap.set(targetUserId, pc);
            return newMap;
        });

        return pc;
    },

    // ===== Call Actions =====

    startCall: async (isVideo, selectedConversation, getOtherUser) => {
        const socket = useAuthStore.getState().socket;
        const authUser = useAuthStore.getState().authUser;

        if (!selectedConversation) return;

        const isGroup = selectedConversation.isGroup;
        let targets;
        if (isGroup) {
            targets = selectedConversation.participants
                .map(p => p._id)
                .filter(id => id !== authUser?._id);
        } else {
            const otherId = getOtherUser(selectedConversation)?._id;
            if (!otherId) return;
            targets = [otherId];
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo,
            });

            get().setLocalStream(stream);
            get().setIsVideoMode(isVideo);
            get().setIsVideoOff(false);
            get().setIsMicMuted(false);

            for (const targetId of targets) {
                const pc = get().createPeerConnection(targetId);
                stream.getTracks().forEach(t => pc.addTrack(t, stream));
            }

            const firstTarget = targets[0];
            if (firstTarget) {
                const pc = get().peerConnections.get(firstTarget);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
            }

            const callId = Date.now().toString();
            get().setActiveCall({
                callId,
                isVideo,
                otherUserId: isGroup ? null : targets[0],
                isGroupCall: isGroup,
            });
            get().setCallAnswered(false);
            get().setIsRinging(true);

            // Start timer
            get().startCallTimer();

            // Timeout
            const timeout = setTimeout(() => {
                if (get().isRinging && !get().callAnswered) {
                    get().endCall();
                    toast.error('Call ended – no answer');
                }
            }, 60000);
            get().setCallTimeoutRef(timeout);

            socket?.emit('webrtc:call:initiate', {
                targets,
                isVideo,
                isGroupCall: isGroup,
                metadata: {
                    callerName: authUser?.displayName,
                    groupName: selectedConversation.groupName,
                },
            });

            setTimeout(() => {
                for (const targetId of targets) {
                    const pc = get().peerConnections.get(targetId);
                    if (pc && pc.localDescription) {
                        socket?.emit('webrtc:signal', {
                            toUserId: targetId,
                            type: 'offer',
                            data: pc.localDescription,
                        });
                    }
                }
            }, 500);

        } catch (error) {
            toast.error('Camera/mic access denied');
            console.error('startCall error:', error);
        }
    },

    acceptCall: async () => {
        const { incomingCall } = get();
        const socket = useAuthStore.getState().socket;
        if (!incomingCall) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: incomingCall.isVideo,
            });

            get().setLocalStream(stream);
            get().setIsVideoMode(incomingCall.isVideo);
            get().setIsVideoOff(false);
            get().setIsMicMuted(false);

            const pc = get().createPeerConnection(incomingCall.callerId);
            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            get().setActiveCall({
                callId: incomingCall.callId,
                isVideo: incomingCall.isVideo,
                otherUserId: null,
                isGroupCall: incomingCall.isGroupCall,
            });
            get().setCallAnswered(true);
            get().setIsRinging(false);
            get().setIncomingCall(null);

            // Clear timeout
            const timeout = get().callTimeoutRef;
            if (timeout) clearTimeout(timeout);
            get().setCallTimeoutRef(null);

            get().startCallTimer();

            socket?.emit('webrtc:call:join', { callId: incomingCall.callId });

        } catch (error) {
            toast.error('Camera/mic access denied');
            get().rejectCall();
        }
    },

    rejectCall: () => {
        const { incomingCall } = get();
        const socket = useAuthStore.getState().socket;
        if (incomingCall) {
            socket?.emit('webrtc:call:leave', { callId: incomingCall.callId });
            get().setIncomingCall(null);
        }
    },

    endCall: () => {
        const { activeCall } = get();
        const socket = useAuthStore.getState().socket;
        if (activeCall) {
            socket?.emit('webrtc:call:end', { callId: activeCall.callId });
        }
        get().cleanupCall();
    },

    cleanupCall: () => {
        const {
            localStream, screenStream, peerConnections, callTimerRef, callTimeoutRef,
            activeCall, callAnswered, isRinging, isVideoMode, callDuration,
        } = get();

        // Send call summary if needed (handled elsewhere)
        if (activeCall) {
            const status = callAnswered ? 'ended' : 'missed';
            // The summary is sent from ChatPage when the call ends
        }

        // Stop timer
        if (callTimerRef) {
            clearInterval(callTimerRef);
        }
        if (callTimeoutRef) {
            clearTimeout(callTimeoutRef);
        }

        // Clean streams
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());

        // Close peer connections
        peerConnections.forEach(pc => pc.close());

        // Reset state
        get().setLocalStream(null);
        get().setRemoteStreams(new Map());
        get().setPeerConnections(new Map());
        get().setScreenStream(null);
        get().setActiveCall(null);
        get().setIncomingCall(null);
        get().setIsRinging(false);
        get().setCallAnswered(false);
        get().setCallDuration(0);
        get().setIsSharingScreen(false);
        get().setIsCallMinimized(false);
        get().setIsMicMuted(false);
        get().setIsVideoOff(false);
        get().setCallTimerRef(null);
        get().setCallTimeoutRef(null);
    },

    startCallTimer: () => {
        let duration = 0;
        const interval = setInterval(() => {
            duration++;
            get().setCallDuration(duration);
        }, 1000);
        get().setCallTimerRef(interval);
    },

    toggleMute: () => {
        const { localStream, isMicMuted } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach(t => {
                t.enabled = !t.enabled;
            });
            get().setIsMicMuted(!isMicMuted);
        }
    },

    toggleVideo: () => {
        const { localStream, isVideoOff } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach(t => {
                t.enabled = !t.enabled;
            });
            get().setIsVideoOff(!isVideoOff);
        }
    },

    flipCamera: async () => {
        const { localStream, isVideoMode, isFrontCamera } = get();
        if (!localStream || !isVideoMode) return;

        try {
            localStream.getVideoTracks().forEach(t => t.stop());
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: isFrontCamera ? 'environment' : 'user',
                },
                audio: true,
            });

            const pc = get().peerConnections.get(get().activeCall?.otherUserId);
            const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                await sender.replaceTrack(newStream.getVideoTracks()[0]);
            }
            get().setLocalStream(newStream);
            get().setIsFrontCamera(!isFrontCamera);
        } catch (error) {
            toast.error('Could not flip camera');
        }
    },

    shareScreen: async () => {
        const { activeCall, isSharingScreen, screenStream, localStream } = get();
        if (!activeCall) return;

        try {
            if (isSharingScreen) {
                if (screenStream) screenStream.getTracks().forEach(t => t.stop());
                get().setIsSharingScreen(false);
                get().setScreenStream(null);

                const pc = get().peerConnections.get(activeCall.otherUserId);
                const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender && localStream) {
                    const vt = localStream.getVideoTracks()[0];
                    if (vt) await sender.replaceTrack(vt);
                }
            } else {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });
                get().setScreenStream(stream);
                get().setIsSharingScreen(true);

                stream.getVideoTracks()[0].onended = () => {
                    get().setIsSharingScreen(false);
                    get().setScreenStream(null);
                    const pc = get().peerConnections.get(activeCall.otherUserId);
                    const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && localStream) {
                        const vt = localStream.getVideoTracks()[0];
                        if (vt) sender.replaceTrack(vt);
                    }
                };

                const pc = get().peerConnections.get(activeCall.otherUserId);
                const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(stream.getVideoTracks()[0]);
                } else {
                    pc?.addTrack(stream.getVideoTracks()[0], stream);
                }
            }
        } catch (error) {
            toast.error('Could not share screen');
        }
    },

    toggleMinimize: () => {
        get().setIsCallMinimized(!get().isCallMinimized);
    },

    // ===== Incoming Call from Socket =====

    handleIncomingCall: (data) => {
        const { callId, from, isVideo, metadata } = data;
        // We need to fetch the caller's name from the conversation, but we'll set it later
        // For now, just store the incoming call
        get().setIncomingCall({
            callId,
            callerId: from,
            callerName: metadata?.callerName || 'Unknown',
            isVideo,
            isGroupCall: metadata?.isGroupCall || false,
            metadata,
        });
        // The name will be updated when we have the conversation data
    },

    // ===== Signal Handling =====

    handleSignal: async (data) => {
        const { from, type, data: signalData } = data;
        const pc = get().peerConnections.get(from);
        if (!pc) return;

        try {
            if (type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signalData));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const socket = useAuthStore.getState().socket;
                socket?.emit('webrtc:signal', {
                    toUserId: from,
                    type: 'answer',
                    data: answer,
                });
            } else if (type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signalData));
            } else if (type === 'ice' && signalData) {
                await pc.addIceCandidate(new RTCIceCandidate(signalData));
            }
        } catch (e) {
            console.error('Signal error:', e);
        }
    },

    // ===== Participant Joined =====

    handleParticipantJoined: (userId) => {
        const { activeCall, localStream, isRinging, callTimeoutRef } = get();

        // Ignore self
        if (userId === useAuthStore.getState().authUser?._id) return;

        toast.success(`${userId} joined`, { icon: '👋' });

        // Transition from ringing to in-call
        if (activeCall && localStream) {
            if (isRinging) {
                get().setIsRinging(false);
                get().setCallAnswered(true);
                if (callTimeoutRef) {
                    clearTimeout(callTimeoutRef);
                    get().setCallTimeoutRef(null);
                }
            }

            // Create peer connection and send offer
            const pc = get().createPeerConnection(userId);
            localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                const socket = useAuthStore.getState().socket;
                socket?.emit('webrtc:signal', { toUserId: userId, type: 'offer', data: offer });
            });
        }
    },

    // ===== Participant Left =====

    handleParticipantLeft: (userId) => {
        get().setRemoteStreams((prev) => {
            const n = new Map(prev);
            n.delete(userId);
            return n;
        });
        const pc = get().peerConnections.get(userId);
        if (pc) {
            pc.close();
            get().setPeerConnections((prev) => {
                const n = new Map(prev);
                n.delete(userId);
                return n;
            });
        }
    },

    // ===== Call Ended from Socket =====

    handleCallEnded: () => {
        get().cleanupCall();
        toast.info('Call ended');
    },
}));