// frontend/src/components/CallModal.jsx
import { useEffect, useRef } from 'react';
import {
    Phone,
    PhoneOff,
    Video,
    VideoOff,
    Mic,
    MicOff,
    RotateCw,
    MonitorUp,
    Maximize2,
    Minimize2,
    UserPlus,
} from 'lucide-react';
import { useCallStore } from '../../store/useCallStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { toast } from 'sonner';

const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const CallModal = () => {
    const {
        incomingCall,
        activeCall,
        isRinging,
        callAnswered,
        callDuration,
        localStream,
        remoteStreams,
        isMicMuted,
        isVideoOff,
        isVideoMode,
        isFrontCamera,
        isSharingScreen,
        isCallMinimized,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        flipCamera,
        shareScreen,
        toggleMinimize,
        setIsVideoMode,
    } = useCallStore();

    const { authUser } = useAuthStore();
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef(new Map());

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote streams
    useEffect(() => {
        remoteStreams.forEach((stream, userId) => {
            const el = remoteVideoRefs.current.get(userId);
            if (el) el.srcObject = stream;
        });
    }, [remoteStreams]);

    // If no call is active or incoming, render nothing
    if (!incomingCall && !activeCall) return null;

    // ===== Incoming Call Modal =====
    if (incomingCall && !activeCall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-base-100 rounded-2xl p-8 w-[90%] max-w-xs text-center shadow-2xl">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        {incomingCall.isVideo ? (
                            <Video className="w-10 h-10 text-primary" />
                        ) : (
                            <Phone className="w-10 h-10 text-primary" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-base-content mb-1">
                        {incomingCall.isGroupCall
                            ? `Group Call: ${incomingCall.metadata?.groupName || 'Group'}`
                            : `Incoming ${incomingCall.isVideo ? 'Video' : 'Audio'} Call`}
                    </h3>
                    <p className="text-base-content/60 mb-6">
                        {incomingCall.isGroupCall
                            ? `${incomingCall.callerName} is calling the group`
                            : `${incomingCall.callerName} is calling...`}
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={rejectCall}
                            className="p-4 bg-error text-primary-content rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                        <button
                            onClick={acceptCall}
                            className="p-4 bg-success text-primary-content rounded-full hover:bg-green-600 transition-colors shadow-lg"
                        >
                            <Phone className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== Active Call UI =====
    if (activeCall) {
        // Minimized state
        if (isCallMinimized) {
            return (
                <div
                    className="fixed bottom-4 right-4 z-50 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                    style={{ width: '300px', height: '200px' }}
                    onClick={toggleMinimize}
                >
                    {isVideoMode && remoteStreams.size > 0 ? (
                        Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                            <video
                                key={userId}
                                ref={(el) => {
                                    if (el) remoteVideoRefs.current.set(userId, el);
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ))
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <Phone className="w-12 h-12 text-primary-content" />
                            <p className="text-primary-content text-sm mt-2">
                                {formatCallDuration(callDuration)}
                            </p>
                        </div>
                    )}
                    {isVideoMode && localStream && (
                        <div className="absolute top-2 right-2 w-16 h-20 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>
            );
        }

        // Full screen call UI
        return (
            <div className="fixed inset-0 z-50 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative w-full h-full">
                    {/* Video streams */}
                    {isVideoMode && remoteStreams.size > 0 ? (
                        remoteStreams.size === 1 ? (
                            Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                                <video
                                    key={userId}
                                    ref={(el) => {
                                        if (el) remoteVideoRefs.current.set(userId, el);
                                    }}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ))
                        ) : (
                            <div
                                className={`w-full h-full p-4 grid gap-2 ${
                                    remoteStreams.size === 2
                                        ? 'grid-cols-2'
                                        : remoteStreams.size <= 4
                                            ? 'grid-cols-2'
                                            : 'grid-cols-3'
                                }`}
                            >
                                {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                                    <div key={userId} className="relative rounded-xl overflow-hidden bg-gray-800">
                                        <video
                                            ref={(el) => {
                                                if (el) remoteVideoRefs.current.set(userId, el);
                                            }}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-primary-content text-xs">
                                            {userId === authUser?._id ? 'You' : 'Participant'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="w-24 h-24 bg-primary/80 rounded-full flex items-center justify-center mb-4">
                                <Phone className="w-12 h-12 text-primary-content" />
                            </div>
                            <p className="text-primary-content text-lg font-medium">
                                {activeCall.otherUserId ? 'Call in progress' : 'Group call'}
                            </p>
                            <p className="text-base-content/50 text-sm">
                                {isVideoMode ? 'Video call' : 'Audio call'}
                            </p>
                            {callAnswered ? (
                                <div className="mt-6 w-64">
                                    <div className="flex items-center justify-center gap-2">
                                        <Mic className={`w-5 h-5 ${isMicMuted ? 'text-error' : 'text-primary-content'}`} />
                                        <p className="text-primary-content text-sm">{formatCallDuration(callDuration)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6">
                                    <p className="text-primary-content text-lg animate-pulse">Ringing...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Local video (picture-in-picture) */}
                    {isVideoMode && localStream && (
                        <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Call controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 md:px-6 md:py-3 flex-wrap justify-center">
                        <button
                            onClick={toggleMute}
                            className={`p-2 md:p-3 rounded-full transition-colors ${
                                isMicMuted
                                    ? 'bg-error text-primary-content'
                                    : 'bg-base-100/20 text-primary-content hover:bg-base-100/30'
                            }`}
                        >
                            {isMicMuted ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-2 md:p-3 rounded-full transition-colors ${
                                isVideoOff
                                    ? 'bg-error text-primary-content'
                                    : 'bg-base-100/20 text-primary-content hover:bg-base-100/30'
                            }`}
                            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                        >
                            {isVideoOff ? <VideoOff className="w-4 h-4 md:w-5 md:h-5" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                        {isVideoMode && (
                            <button
                                onClick={flipCamera}
                                className="p-2 md:p-3 rounded-full bg-base-100/20 text-primary-content hover:bg-base-100/30"
                            >
                                <RotateCw className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        )}
                        <button
                            onClick={shareScreen}
                            className={`p-2 md:p-3 rounded-full transition-colors ${
                                isSharingScreen
                                    ? 'bg-primary text-primary-content'
                                    : 'bg-base-100/20 text-primary-content hover:bg-base-100/30'
                            }`}
                        >
                            <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={() => {
                                // Add participant – you can emit an event or open a modal
                                toast.info('Add participant feature coming soon');
                            }}
                            className="p-2 md:p-3 rounded-full bg-base-100/20 text-primary-content hover:bg-base-100/30"
                            title="Add participant"
                        >
                            <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={endCall}
                            className="p-2 md:p-3 rounded-full bg-error text-primary-content hover:bg-red-600"
                        >
                            <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>

                    {/* Minimize button */}
                    <button
                        onClick={toggleMinimize}
                        className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-primary-content hover:bg-black/60"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CallModal;