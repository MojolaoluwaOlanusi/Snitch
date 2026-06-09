import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import Sidebar from "../../components/common/Sidebar";
import { SnitchLogo } from "../../components/svgs/snitch";
import {
    Search,
    MoreHorizontal,
    MoreVertical,
    Phone,
    Paperclip,
    Smile,
    Send,
    Video,
    Mic,
    Image as ImageIcon,
    FileText,
    MapPin,
    UserPlus,
    Star,
    Archive,
    Pin,
    BellOff,
    Trash2,
    Check,
    CheckCheck,
    Clock,
    Reply,
    Forward,
    Copy,
    Download,
    Volume2,
    X,
    Search as SearchIcon,
    Play,
    Pause,
    VideoOff,
    MicOff,
    PhoneOff,
    MessageSquare,
    RotateCw,
} from "lucide-react";
import EmojiPicker from "../../components/common/EmojiPicker";
import ReactionEmojiPicker from "../../components/common/ReactionEmojiPicker";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

const NoConversationPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6 bg-white">
        <SnitchLogo className="size-16 animate-bounce text-blue-400" />
        <div className="text-center">
            <h3 className="text-gray-700 text-lg font-medium mb-1">No Conversation Selected</h3>
            <p className="text-gray-500 text-sm">Choose a friend to start chatting</p>
        </div>
    </div>
);

const ChatPage = () => {
    const {
        conversations,
        currentConversation,
        messages,
        selectedConversation,
        isMessagesLoading,
        isConversationsLoading,
        onlineUsers,
        typingUsers,
        getConversations,
        getConversation,
        selectConversation,
        getMessages,
        sendMessage,
        startTyping,
        stopTyping,
        reactToMessage,
        editMessage,
        deleteMessage,
        forwardMessage,
        readMessage,
        pinConversation,
        archiveConversation,
        muteConversation,
        markConversationAsRead,
        clearChat,
        starMessage,
        createGroup,
        addMessage,
        updateMessage,
        removeMessage,
        setOnlineUsers,
        addTypingUser,
        removeTypingUser,
    } = useChatStore();

    const { authUser, socket } = useAuthStore();
    const { initiateCall, searchMessages } = useChatStore();
    const [messageText, setMessageText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [conversationSearchQuery, setConversationSearchQuery] = useState("");
    const [showMenu, setShowMenu] = useState(null);
    const [showConversationMenu, setShowConversationMenu] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [showContactList, setShowContactList] = useState(false);
    const [followingUsers, setFollowingUsers] = useState([]);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [messageToForward, setMessageToForward] = useState(null);
    const [showArchiveSection, setShowArchiveSection] = useState(false);
    const typingTimeoutRef = useRef(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const audioRef = useRef(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnectionRef = useRef(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isVideoMode, setIsVideoMode] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    useEffect(() => {
        getConversations();
        fetchFollowingUsers();
        setupSocketListeners();
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (socket) {
                socket.off('receive_message');
                socket.off('message_sent');
                socket.off('message:edited');
                socket.off('message:deleted');
                socket.off('message:deleted:everyone');
                socket.off('reaction:update');
                socket.off('message:read');
                socket.off('typing:start');
                socket.off('typing:stop');
                socket.off('users_online');
                socket.off('user_online');
                socket.off('user_offline');
                socket.off('message:starred');
                socket.off('webrtc:call:incoming');
                socket.off('webrtc:signal');
                socket.off('webrtc:call:ended');
                socket.off('webrtc:call:participant_left');
            }
        };
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            getMessages(selectedConversation._id);
            markConversationAsRead(selectedConversation._id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchFollowingUsers = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/auth/get-following', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const followingIds = Array.isArray(res.data) ? res.data : (res.data?.following || []);
            
            // Fetch full user details for each following user
            const usersPromises = followingIds.map(async (userId) => {
                try {
                    const userRes = await axiosInstance.get(`/auth/get-user-by-id/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    return userRes.data;
                } catch (error) {
                    console.error(`Error fetching user ${userId}:`, error);
                    return null;
                }
            });
            
            const users = (await Promise.all(usersPromises)).filter(Boolean);
            setFollowingUsers(users);
        } catch (error) {
            console.error('Error fetching following users:', error);
            setFollowingUsers([]);
        }
    };

    const setupSocketListeners = () => {
        if (!socket) return;

        // Request current online users when socket connects
        socket.emit('get_online_users', (users) => {
            setOnlineUsers(users || []);
        });

        socket.on('receive_message', (message) => {
            addMessage(message);
            if (message.conversationId === currentConversation?._id) {
                scrollToBottom();
            }
        });

        socket.on('message_sent', (message) => {
            // Only add if not already in messages to prevent duplicates
            const messages = useChatStore.getState().messages;
            if (!messages.find(m => m._id === message._id)) {
                addMessage(message);
                if (message.conversationId === currentConversation?._id) {
                    scrollToBottom();
                }
            }
        });

        socket.on('message:edited', (message) => {
            updateMessage(message._id, message);
        });

        socket.on('message:deleted', ({ messageId }) => {
            removeMessage(messageId);
        });

        socket.on('message:deleted:everyone', ({ messageId }) => {
            removeMessage(messageId);
        });

        socket.on('reaction:update', ({ messageId, reactions }) => {
            updateMessage(messageId, { reactions });
        });

        socket.on('message:read', ({ messageId, userId }) => {
            updateMessage(messageId, { read: true, status: 'read' });
        });

        socket.on('typing:start', ({ from }) => {
            addTypingUser(from);
            // Clear previous timeout and set new one
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                removeTypingUser(from);
            }, 3000);
        });

        socket.on('typing:stop', ({ from }) => {
            removeTypingUser(from);
        });

        socket.on('users_online', (users) => {
            setOnlineUsers(users);
        });

        socket.on('user_online', (userId) => {
            setOnlineUsers(prev => [...new Set([...prev, userId])]);
        });

        socket.on('user_offline', (userId) => {
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        socket.on('message:starred', ({ messageId, starred }) => {
            updateMessage(messageId, { starred });
        });

        // Call event listeners
        socket.on('webrtc:call:incoming', ({ callId, from, isVideo, metadata }) => {
            const caller = conversations.find(c => c.participants?.some(p => p._id === from))?.participants?.find(p => p._id === from);
            setIncomingCall({ callId, callerId: from, callerName: caller?.displayName || metadata?.callerName || 'Unknown', isVideo });
        });

        socket.on('webrtc:signal', async ({ from, type, data }) => {
            if (type === 'offer' && peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                socket.emit('webrtc:signal', { toUserId: from, type: 'answer', data: answer });
            } else if (type === 'answer' && peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
            } else if (type === 'ice' && peerConnectionRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data));
            }
        });

        socket.on('webrtc:call:ended', () => {
            endCall();
        });

        socket.on('webrtc:call:participant_left', ({ userId }) => {
            if (activeCall?.otherUserId === userId) {
                endCall();
            }
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedFile) return;

        if (editingMessageId) {
            // Edit existing message
            await editMessage({ messageId: editingMessageId, newText: messageText });
            setEditingMessageId(null);
        } else {
            // Send new message
            const messageData = {
                receiverId: selectedConversation?.participants?.find(p => p._id !== authUser._id)?._id,
                conversationId: selectedConversation?._id,
                text: messageText,
                replyTo: replyingTo?._id,
                mentions: [],
            };

            if (selectedFile) {
                messageData.media = [{
                    url: selectedFile.url,
                    mime: selectedFile.type,
                    size: selectedFile.size,
                    filename: selectedFile.name,
                }];
            }

            await sendMessage(messageData);
        }

        setMessageText("");
        setSelectedFile(null);
        setReplyingTo(null);
        setShowEmojiPicker(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFile({
                    file,
                    url: reader.result,
                    type: file.type,
                    size: file.size,
                    name: file.name,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEmojiSelect = (emoji) => {
        setMessageText(prev => prev + emoji.native);
        setShowEmojiPicker(false);
    };

    const handleReaction = async (messageId, reaction) => {
        await reactToMessage({ messageId, reaction });
        setShowReactionPicker(null);
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        setShowMenu(null);
    };

    const handleEdit = (message) => {
        if (message.senderId !== authUser._id) return;
        setEditingMessageId(message._id);
        setMessageText(message.text);
        setShowMenu(null);
        setShowEmojiPicker(false);
    };

    const handleDelete = async (messageId) => {
        const message = messages.find(m => m._id === messageId);
        if (message?.senderId !== authUser._id) return;
        await deleteMessage({ messageId });
        setShowMenu(null);
    };

    const handleForward = (messageId) => {
        const message = messages.find(m => m._id === messageId);
        setMessageToForward(message);
        setShowForwardModal(true);
        setShowMenu(null);
    };

    const handleStar = async (messageId) => {
        await starMessage(messageId);
        setShowMenu(null);
    };

    const handleForwardSubmit = async () => {
        if (!messageToForward || selectedParticipants.length === 0) return;
        // Extract user IDs from selected conversations
        const targetUserIds = selectedParticipants
            .map(convId => {
                const conv = conversations.find(c => c._id === convId);
                if (!conv) return null;
                if (conv.isGroup) {
                    // For groups, get all participant IDs except current user
                    return conv.participants?.filter(p => p._id !== authUser._id).map(p => p._id) || [];
                } else {
                    // For direct messages, get the other user's ID
                    return getOtherUser(conv)?._id;
                }
            })
            .flat()
            .filter(Boolean);
        
        await forwardMessage({ messageId: messageToForward._id, targets: targetUserIds });
        setShowForwardModal(false);
        setMessageToForward(null);
        setSelectedParticipants([]);
        toast.success('Message forwarded successfully');
    };

    const handlePinConversation = async () => {
        const conversation = conversations.find(c => c._id === showConversationMenu);
        const isPinned = conversation?.pinnedBy?.includes(authUser._id);
        await pinConversation(showConversationMenu);
        setShowConversationMenu(null);
    };

    const handleArchiveConversation = async () => {
        await archiveConversation(showConversationMenu);
        setShowConversationMenu(null);
        setShowArchiveSection(true);
    };

    const handleMuteConversation = async (duration) => {
        const conversation = conversations.find(c => c._id === showConversationMenu);
        const isMuted = conversation?.mutedBy?.find(m => m.user === authUser._id);
        if (isMuted) {
            // Unmute by passing null duration
            await muteConversation(showConversationMenu, null);
        } else {
            await muteConversation(showConversationMenu, duration);
        }
        setShowConversationMenu(null);
    };

    const handleClearChat = async () => {
        if (window.confirm('Are you sure you want to clear this chat?')) {
            await clearChat(selectedConversation._id);
            setShowConversationMenu(null);
        }
    };

    const handleSearchMessages = async () => {
        if (searchQuery.trim()) {
            const results = await searchMessages(selectedConversation._id, searchQuery);
            setSearchResults(results);
        }
    };

    const startCall = async (isVideo) => {
        const otherUserId = getOtherUser(selectedConversation)?._id;
        if (!otherUserId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            });
            setLocalStream(stream);
            setIsVideoMode(isVideo);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('webrtc:signal', { toUserId: otherUserId, type: 'ice', data: event.candidate });
                }
            };

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const callId = Date.now().toString();
            setActiveCall({ callId, isVideo, otherUserId });

            socket.emit('webrtc:call:initiate', {
                targets: [otherUserId],
                isVideo,
                metadata: { callerName: authUser.displayName }
            });

            // Send offer through signaling
            setTimeout(() => {
                socket.emit('webrtc:signal', { toUserId: otherUserId, type: 'offer', data: offer });
            }, 100);
        } catch (error) {
            console.error('Error starting call:', error);
            toast.error('Could not access camera/microphone');
        }
    };

    const toggleVideoMode = async () => {
        if (!localStream || !peerConnectionRef.current || !activeCall) return;

        try {
            const otherUserId = activeCall.otherUserId;
            
            if (isVideoMode) {
                // Switch to audio mode - remove video tracks
                localStream.getVideoTracks().forEach(track => {
                    track.stop();
                });
                
                // Create new audio-only stream
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(audioStream);
                setIsVideoMode(false);
                
                // Update peer connection with audio-only stream
                audioStream.getAudioTracks().forEach(track => {
                    peerConnectionRef.current.addTrack(track, audioStream);
                });
                
                // Signal the change to remote
                socket.emit('webrtc:signal', { 
                    toUserId: otherUserId, 
                    type: 'mode_change', 
                    data: { isVideo: false } 
                });
            } else {
                // Switch to video mode - add video tracks
                const videoStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: { facingMode: isFrontCamera ? 'user' : 'environment' } 
                });
                
                // Stop old stream
                localStream.getTracks().forEach(track => track.stop());
                
                setLocalStream(videoStream);
                setIsVideoMode(true);
                
                // Update peer connection with video stream
                videoStream.getTracks().forEach(track => {
                    peerConnectionRef.current.addTrack(track, videoStream);
                });
                
                // Signal the change to remote
                socket.emit('webrtc:signal', { 
                    toUserId: otherUserId, 
                    type: 'mode_change', 
                    data: { isVideo: true } 
                });
            }
        } catch (error) {
            console.error('Error toggling video mode:', error);
            toast.error('Could not switch video mode');
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: incomingCall.isVideo
            });
            setLocalStream(stream);
            setActiveCall({ ...incomingCall });
            setIsVideoMode(incomingCall.isVideo);
            setIncomingCall(null);

            socket.emit('webrtc:call:join', { callId: incomingCall.callId });

            // Set up peer connection after joining
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('webrtc:signal', { toUserId: incomingCall.callerId, type: 'ice', data: event.candidate });
                }
            };

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
            };
        } catch (error) {
            console.error('Error accepting call:', error);
            toast.error('Could not access camera/microphone');
            rejectCall();
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            socket.emit('webrtc:call:leave', { callId: incomingCall.callId });
            setIncomingCall(null);
        }
    };

    const endCall = () => {
        if (activeCall) {
            socket.emit('webrtc:call:end', { callId: activeCall.callId });
        }
        
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        
        setLocalStream(null);
        setRemoteStream(null);
        setActiveCall(null);
        setIncomingCall(null);
    };

    const handleCreateGroup = async () => {
        if (groupName) {
            await createGroup({
                name: groupName,
                participantIds: selectedParticipants.length > 0 ? selectedParticipants : [],
            });
            setShowNewGroupModal(false);
            setGroupName("");
            setSelectedParticipants([]);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setSelectedFile({
                    file: audioBlob,
                    url: audioUrl,
                    type: 'audio/wav',
                    size: audioBlob.size,
                    name: 'voice-message.wav',
                    isVoice: true,
                });
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            window.currentMediaRecorder = mediaRecorder;
        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (window.currentMediaRecorder && window.currentMediaRecorder.state !== 'inactive') {
            window.currentMediaRecorder.stop();
        }
        setIsRecording(false);
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        setRecordingDuration(0);
    };

    const getOtherUser = (conversation) => {
        if (!conversation || !authUser) return null;
        return conversation.participants?.find(p => p._id !== authUser._id);
    };

    const isOnline = (userId) => {
        return Array.isArray(onlineUsers) && onlineUsers.includes(userId);
    };

    const isTyping = (userId) => {
        return Array.isArray(typingUsers) && typingUsers.includes(userId);
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatMessageTime = (date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diff = now - messageDate;
        
        if (diff < 86400000) { // Less than 24 hours
            return formatTime(date);
        } else if (diff < 172800000) { // Less than 2 days
            return 'Yesterday';
        } else if (diff < 604800000) { // Less than 7 days
            const days = Math.floor(diff / 86400000);
            return `${days} days ago`;
        } else {
            return messageDate.toLocaleDateString();
        }
    };

    const getMessageStatusIcon = (message) => {
        if (message.senderId !== authUser._id) return null;
        
        if (message.status === 'read') {
            return <CheckCheck className="w-4 h-4 text-blue-400" />;
        } else if (message.status === 'delivered') {
            return <CheckCheck className="w-4 h-4 text-gray-400" />;
        } else if (message.status === 'sent') {
            return <Check className="w-4 h-4 text-gray-400" />;
        } else if (message.status === 'failed') {
            return <Clock className="w-4 h-4 text-red-400" />;
        }
        return null;
    };

    const renderMessage = (message) => {
        const isOwn = String(message.senderId?._id) === String(authUser?._id);
        console.log(message.senderId?._id);
        console.log(authUser?._id);
        const isDeleted = message.deletedAt || message.deletedForEveryone;

        if (isDeleted) {
            return (
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
                        <p className="text-gray-500 text-sm italic">This message was deleted</p>
                    </div>
                </div>
            );
        }

        return (
            <div
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group relative`}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowMenu(message._id);
                }}
            >
                <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                        isOwn
                            ? 'bg-blue-400 text-white'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {message.replyTo && (
                        <div className="border-l-2 border-gray-400 pl-2 mb-1">
                            <p className="text-xs opacity-75">Replying to: {message.replyTo.text?.substring(0, 30) || 'a message'}...</p>
                        </div>
                    )}


                    {message.location && (
                        <div className="mb-2">
                            <div className="flex items-center gap-2 bg-gray-200 p-2 rounded">
                                <MapPin className="w-5 h-5" />
                                <a
                                    href={`https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm underline"
                                >
                                    {message.location.address || 'Location'}
                                </a>
                            </div>
                        </div>
                    )}

                    {message.contact && (
                        <div className="mb-2">
                            <div className="flex items-center gap-2 bg-gray-200 p-2 rounded">
                                <UserPlus className="w-5 h-5" />
                                <div>
                                    <p className="text-sm font-medium">{message.contact.name}</p>
                                    <p className="text-xs opacity-75">{message.contact.phoneNumber}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {message.text && (
                        <p className="break-words">{message.text}</p>
                    )}

                    {message.isVoiceMessage && (
                        <div className="flex items-center gap-2">
                            <audio
                                ref={isPlayingAudio === message._id ? audioRef : null}
                                src={message.media?.[0]?.url}
                                onTimeUpdate={(e) => setAudioProgress((e.target.currentTime / e.target.duration) * 100)}
                                onEnded={() => {
                                    setIsPlayingAudio(null);
                                    setAudioProgress(0);
                                }}
                                className="hidden"
                            />
                            <button 
                                className="p-2 hover:bg-gray-200 rounded-full"
                                onClick={() => {
                                    if (isPlayingAudio === message._id) {
                                        audioRef.current?.pause();
                                        setIsPlayingAudio(null);
                                    } else {
                                        setIsPlayingAudio(message._id);
                                        setTimeout(() => audioRef.current?.play(), 0);
                                    }
                                }}
                            >
                                {isPlayingAudio === message._id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <div className="flex-1 h-2 bg-gray-300 rounded overflow-hidden">
                                <div 
                                    className="h-full bg-blue-400 rounded transition-all" 
                                    style={{ width: `${isPlayingAudio === message._id ? audioProgress : 0}%` }}
                                />
                            </div>
                            <span className="text-xs">{message.voiceDuration}s</span>
                        </div>
                    )}

                    <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                        {getMessageStatusIcon(message)}
                        {message.editedAt && <span className="text-xs">(edited)</span>}
                    </div>

                    {message.media && message.media.length > 0 && (
                        <div className="mb-2">
                            {message.media.map((media, idx) => (
                                <div key={idx} className="relative">
                                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                                            {Object.entries(message.reactions).map(([userId, reaction]) => (
                                                <span
                                                    key={userId}
                                                    className="text-sm bg-white/80 px-2 py-1 rounded-full shadow"
                                                >
                                                    {reaction}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {media.mime?.startsWith('image/') ? (
                                        <img
                                            src={media.url}
                                            alt="attachment"
                                            className="rounded-lg max-w-full h-auto"
                                        />
                                    ) : media.mime?.startsWith('video/') ? (
                                        <video
                                            src={media.url}
                                            controls
                                            className="rounded-lg max-w-full h-auto"
                                        />
                                    ) : media.mime?.startsWith('audio/') ? (
                                        <audio src={media.url} controls className="w-full" />
                                    ) : (
                                        <div className="flex items-center gap-2 bg-gray-200 p-2 rounded">
                                            <FileText className="w-8 h-8" />
                                            <div>
                                                <p className="text-sm font-medium">{media.filename}</p>
                                                <p className="text-xs opacity-75">{(media.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                    )}
                                    {media.caption && (
                                        <p className="text-sm mt-1">{media.caption}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <div className="relative">
                        <button
                            onClick={() => setShowReactionPicker(message._id)}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <Smile className="w-4 h-4" />
                        </button>
                        {showReactionPicker === message._id && (
                            <div className="absolute top-8 left-0 z-20">
                                <ReactionEmojiPicker
                                    postId={message._id}
                                    onReact={(emoji) => handleReaction(message._id, emoji)}
                                    onClose={() => setShowReactionPicker(null)}
                                    isOpen={true}
                                />
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(showMenu === message._id ? null : message._id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {showMenu === message._id && (
                    <div className={`absolute top-0 ${isOwn ? '-left-48' : '-right-48'} bg-white shadow-lg rounded-lg py-2 z-10 w-48`}>
                        <button
                            onClick={() => handleReply(message)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Reply className="w-4 h-4" />
                            Reply
                        </button>
                        {message.senderId === authUser._id && (
                            <button
                                onClick={() => handleEdit(message)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Edit
                            </button>
                        )}
                        <button
                            onClick={() => handleForward(message._id, [])}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Forward className="w-4 h-4" />
                            Forward
                        </button>
                        <button
                            onClick={() => handleStar(message._id)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Star className="w-4 h-4" />
                            Star
                        </button>
                        {message.senderId === authUser._id && (
                            <button
                                onClick={() => handleDelete(message._id)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                        <button
                            onClick={() => setShowMenu(null)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-white">
            <Sidebar />
            
            {/* Conversation List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">{showArchiveSection ? 'Archived' : 'Chats'}</h2>
                        <div className="flex gap-2">
                            {!showArchiveSection && (
                                <button
                                    onClick={() => setShowArchiveSection(true)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                    title="Archived Chats"
                                >
                                    <Archive className="w-5 h-5 text-gray-600" />
                                </button>
                            )}
                            {showArchiveSection && (
                                <button
                                    onClick={() => setShowArchiveSection(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                    title="Back to Chats"
                                >
                                    <MessageSquare className="w-5 h-5 text-gray-600" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowNewGroupModal(true)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                                title="New Group"
                            >
                                <UserPlus className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={() => setShowContactList(true)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                                title="Contacts"
                            >
                                <UserPlus className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={conversationSearchQuery}
                            onChange={(e) => setConversationSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isConversationsLoading ? (
                        <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                    ) : (
                        conversations.filter(c => {
                            const matchesArchive = showArchiveSection ? c.archivedBy?.includes(authUser._id) : !c.archivedBy?.includes(authUser._id);
                            const matchesSearch = !conversationSearchQuery || 
                                c.participants?.some(p => p.displayName?.toLowerCase().includes(conversationSearchQuery.toLowerCase())) ||
                                (c.isGroup && c.groupName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()));
                            return matchesArchive && matchesSearch;
                        }).map((conversation) => {
                            const otherUser = getOtherUser(conversation);
                            const unreadCount = conversation.unreadCount instanceof Map 
                                ? conversation.unreadCount.get(authUser._id) || 0 
                                : (conversation.unreadCount?.[authUser._id] || 0);
                            const isPinned = conversation.pinnedBy?.includes(authUser._id);

                            return (
                                <div
                                    key={conversation._id}
                                    onClick={() => selectConversation(conversation)}
                                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                        selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                            {conversation.isGroup ? (
                                                <div className="w-full h-full bg-blue-400 flex items-center justify-center text-white font-bold">
                                                    {conversation.groupName?.charAt(0) || 'G'}
                                                </div>
                                            ) : (
                                                <img
                                                    src={otherUser?.avatarUrl || '/avatar.png'}
                                                    alt={otherUser?.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        {isOnline(otherUser?._id) && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-800 truncate">
                                                {conversation.isGroup ? conversation.groupName : otherUser?.displayName}
                                            </h3>
                                            {conversation.lastMessage && (
                                                <span className="text-xs text-gray-500">
                                                    {formatMessageTime(conversation.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 truncate">
                                                {conversation.lastMessage?.text || 'No messages yet'}
                                            </p>
                                            {unreadCount > 0 && (
                                                <span className="bg-blue-400 text-white text-xs rounded-full px-2 py-1">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                {isPinned && <Pin className="w-4 h-4 text-blue-400" />}
                                {conversation.mutedBy?.find(m => m.user === authUser._id) && <BellOff className="w-3 h-3 text-gray-400" />}
                            </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        {selectedConversation.isGroup ? (
                                            <div className="w-full h-full bg-blue-400 flex items-center justify-center text-white font-bold">
                                                {selectedConversation.groupName?.charAt(0) || 'G'}
                                            </div>
                                        ) : (
                                            <img
                                                src={getOtherUser(selectedConversation)?.avatarUrl || '/avatar.png'}
                                                alt={getOtherUser(selectedConversation)?.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    {isOnline(getOtherUser(selectedConversation)?._id) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        {selectedConversation.isGroup
                                            ? selectedConversation.groupName
                                            : getOtherUser(selectedConversation)?.displayName}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {isTyping(getOtherUser(selectedConversation)?._id)
                                            ? 'typing...'
                                            : isOnline(getOtherUser(selectedConversation)?._id)
                                            ? 'online'
                                            : 'offline'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                    onClick={() => startCall(false)}
                                >
                                    <Phone className="w-5 h-5 text-gray-600" />
                                </button>
                                <button 
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                    onClick={() => startCall(true)}
                                >
                                    <Video className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-full">
                                    <Search className="w-5 h-5 text-gray-600" onClick={() => setShowSearch(!showSearch)} />
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                    onClick={() => setShowConversationMenu(selectedConversation._id)}
                                >
                                    <MoreVertical className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {showSearch && (
                            <div 
                                className="p-4 border-b border-gray-200 bg-gray-50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search messages in this conversation..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearchMessages();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSearchMessages}
                                        className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500"
                                    >
                                        <SearchIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSearch(false);
                                            setSearchQuery("");
                                            setSearchResults([]);
                                        }}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto">
                                        {searchResults.map((msg) => (
                                            <div
                                                key={msg._id}
                                                onClick={() => {
                                                    setSearchResults([]);
                                                    setShowSearch(false);
                                                    setSearchQuery("");
                                                }}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        <div 
                            className="flex-1 overflow-y-auto p-4 bg-gray-50"
                            onClick={() => {
                                if (showSearch) {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }
                            }}
                        >
                            {isMessagesLoading ? (
                                <div className="text-center text-gray-500">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => renderMessage(message))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="w-1 h-10 bg-green-500 rounded-full" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-700">
                                            {replyingTo.senderId === authUser._id ? 'You' : getOtherUser(selectedConversation)?.displayName}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {replyingTo.text || (replyingTo.media?.length > 0 ? '📎 Media' : '📍 Location')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        )}

                        {/* File Preview */}
                        {selectedFile && (
                            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {selectedFile.type?.startsWith('image/') ? (
                                            <img src={selectedFile.url} alt="Preview" className="w-16 h-16 object-cover rounded" />
                                        ) : selectedFile.type?.startsWith('video/') ? (
                                            <video src={selectedFile.url} className="w-16 h-16 object-cover rounded" />
                                        ) : selectedFile.isVoice ? (
                                            <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                                                <Mic className="w-8 h-8 text-blue-500" />
                                            </div>
                                        ) : (
                                            <FileText className="w-8 h-8 text-gray-600" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2 hover:bg-gray-100 rounded-full relative"
                                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                >
                                    <Paperclip className="w-5 h-5 text-gray-600" />
                                    {showAttachmentMenu && (
                                        <div className="absolute bottom-12 left-0 bg-white shadow-lg rounded-lg py-2 w-48 z-50">
                                            <button
                                                onClick={() => {
                                                    setShowAttachmentMenu(false);
                                                    fileInputRef.current?.click();
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                Media
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAttachmentMenu(false);
                                                    // Handle document upload
                                                    fileInputRef.current?.click();
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Document
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAttachmentMenu(false);
                                                    // Handle location
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition(
                                                            (position) => {
                                                                setMessageText(prev => prev + `📍 Location: ${position.coords.latitude}, ${position.coords.longitude}`);
                                                            },
                                                            (error) => {
                                                                toast.error('Could not get location');
                                                            }
                                                        );
                                                    } else {
                                                        toast.error('Geolocation not supported');
                                                    }
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <MapPin className="w-4 h-4" />
                                                Location
                                            </button>
                                        </div>
                                    )}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.js,.jsx,.ts,.tsx,.txt,.json"
                                />
                                <div className="relative">
                                    <button
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        <Smile className="w-5 h-5 text-gray-600" />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-12 left-0 z-50">
                                            <div className="bg-white rounded-lg shadow-lg p-2 relative">
                                                <button
                                                    onClick={() => setShowEmojiPicker(false)}
                                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <EmojiPicker
                                                    inputRef={{ current: null }}
                                                    value={messageText}
                                                    setValue={setMessageText}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={messageText}
                                    onChange={(e) => {
                                        setMessageText(e.target.value);
                                        if (e.target.value) {
                                            startTyping({ toUserId: getOtherUser(selectedConversation)?._id });
                                        } else {
                                            stopTyping({ toUserId: getOtherUser(selectedConversation)?._id });
                                        }
                                    }}
                                    onKeyPress={handleKeyPress}
                                />
                                {isRecording ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                                    style={{
                                                        height: `${20 + Math.random() * 20}px`,
                                                        animationDelay: `${i * 0.1}s`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-red-500">{recordingDuration}s</span>
                                        <button
                                            className="p-2 bg-red-500 text-white rounded-full"
                                            onClick={stopRecording}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                        onClick={startRecording}
                                    >
                                        <Mic className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                                <button
                                    className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500"
                                    onClick={handleSendMessage}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <NoConversationPlaceholder />
                )}
            </div>

            {/* Conversation Menu */}
            {showConversationMenu && (() => {
                const conversation = conversations.find(c => c._id === showConversationMenu);
                const isPinned = conversation?.pinnedBy?.includes(authUser._id);
                const isMuted = conversation?.mutedBy?.find(m => m.user === authUser._id);
                return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 w-64">
                        <button
                            onClick={handlePinConversation}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Pin className="w-4 h-4" />
                            {isPinned ? 'Unpin Conversation' : 'Pin Conversation'}
                        </button>
                        <button
                            onClick={handleArchiveConversation}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Archive className="w-4 h-4" />
                            {conversation?.archivedBy?.includes(authUser._id) ? 'Unarchive' : 'Archive'}
                        </button>
                        <button
                            onClick={() => handleMuteConversation(null)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <BellOff className="w-4 h-4" />
                            {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <button
                            onClick={handleClearChat}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Chat
                        </button>
                        <button
                            onClick={() => setShowConversationMenu(null)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                </div>
                );
            })()}

            {/* New Group Modal */}
            {showNewGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-xl font-bold mb-4">Create New Group</h3>
                        <input
                            type="text"
                            placeholder="Group name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateGroup}
                                className="flex-1 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowNewGroupModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forward Modal */}
            {showForwardModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Forward Message</h3>
                            <button
                                onClick={() => {
                                    setShowForwardModal(false);
                                    setMessageToForward(null);
                                    setSelectedParticipants([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-600">{messageToForward?.text || 'Media message'}</p>
                        </div>
                        <div className="space-y-2 mb-4">
                            {conversations.map((conversation) => {
                                const otherUser = getOtherUser(conversation);
                                return (
                                    <div
                                        key={conversation._id}
                                        onClick={() => {
                                            if (selectedParticipants.includes(conversation._id)) {
                                                setSelectedParticipants(selectedParticipants.filter(id => id !== conversation._id));
                                            } else {
                                                setSelectedParticipants([...selectedParticipants, conversation._id]);
                                            }
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                                            selectedParticipants.includes(conversation._id) ? 'bg-blue-100' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            {conversation.isGroup ? (
                                                <div className="w-full h-full bg-blue-400 flex items-center justify-center text-white font-bold">
                                                    {conversation.groupName?.charAt(0) || 'G'}
                                                </div>
                                            ) : (
                                                <img
                                                    src={otherUser?.avatarUrl || '/avatar.png'}
                                                    alt={otherUser?.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {conversation.isGroup ? conversation.groupName : otherUser?.displayName}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleForwardSubmit}
                            disabled={selectedParticipants.length === 0}
                            className="w-full px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Forward ({selectedParticipants.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-96 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            {incomingCall.isVideo ? <Video className="w-12 h-12 text-blue-500" /> : <Phone className="w-12 h-12 text-blue-500" />}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call</h3>
                        <p className="text-gray-600 mb-6">{incomingCall.callerName} is calling you...</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={acceptCall}
                                className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600"
                            >
                                <Phone className="w-6 h-6" />
                            </button>
                            <button
                                onClick={rejectCall}
                                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Call Modal */}
            {activeCall && (
                <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
                    <div className="flex-1 flex flex-col md:flex-row">
                        {/* Local Video */}
                        {localStream && (
                            <div className="flex-1 bg-gray-800 relative">
                                <video
                                    ref={video => {
                                        if (video) video.srcObject = localStream;
                                    }}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                                    You
                                </div>
                            </div>
                        )}
                        {/* Remote Video */}
                        {remoteStream && (
                            <div className="flex-1 bg-gray-800 relative">
                                <video
                                    ref={video => {
                                        if (video) video.srcObject = remoteStream;
                                    }}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                                    {getOtherUser(selectedConversation)?.displayName || 'Remote'}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Call Controls */}
                    <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
                        <button
                            onClick={toggleVideoMode}
                            className={`p-4 ${isVideoMode ? 'bg-blue-500' : 'bg-gray-700'} text-white rounded-full hover:bg-gray-600`}
                            title={isVideoMode ? 'Switch to Audio' : 'Switch to Video'}
                        >
                            <VideoOff className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => {
                                if (localStream) {
                                    localStream.getVideoTracks().forEach(track => {
                                        track.enabled = !track.enabled;
                                    });
                                    setIsVideoOff(!isVideoOff);
                                }
                            }}
                            className={`p-4 ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white rounded-full hover:bg-gray-600`}
                            title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
                        >
                            <VideoOff className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => {
                                if (localStream) {
                                    localStream.getAudioTracks().forEach(track => {
                                        track.enabled = !track.enabled;
                                    });
                                    setIsMicMuted(!isMicMuted);
                                }
                            }}
                            className={`p-4 ${isMicMuted ? 'bg-red-500' : 'bg-gray-700'} text-white rounded-full hover:bg-gray-600`}
                            title={isMicMuted ? 'Unmute' : 'Mute'}
                        >
                            <MicOff className="w-6 h-6" />
                        </button>
                        {isVideoMode && (
                            <button
                                onClick={async () => {
                                    if (localStream) {
                                        const videoTrack = localStream.getVideoTracks()[0];
                                        if (videoTrack) {
                                            const newFacingMode = isFrontCamera ? 'environment' : 'user';
                                            
                                            // Stop current track
                                            videoTrack.stop();
                                            
                                            // Get new stream with flipped camera
                                            try {
                                                const newStream = await navigator.mediaDevices.getUserMedia({
                                                    video: { facingMode: newFacingMode },
                                                    audio: true
                                                });
                                                
                                                // Replace tracks in peer connection
                                                if (peerConnectionRef.current) {
                                                    const senders = peerConnectionRef.current.getSenders();
                                                    senders.forEach(sender => {
                                                        if (sender.track.kind === 'video') {
                                                            sender.replaceTrack(newStream.getVideoTracks()[0]);
                                                        }
                                                    });
                                                }
                                                
                                                setLocalStream(newStream);
                                                setIsFrontCamera(!isFrontCamera);
                                            } catch (error) {
                                                console.error('Error flipping camera:', error);
                                                toast.error('Could not flip camera');
                                            }
                                        }
                                    }
                                }}
                                className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                                title="Flip Camera"
                            >
                                <RotateCw className="w-6 h-6" />
                            </button>
                        )}
                        <button
                            onClick={endCall}
                            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="End Call"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Contact List Modal */}
            {showContactList && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Contacts</h3>
                            <button
                                onClick={() => setShowContactList(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {followingUsers.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={async () => {
                                        const conversation = await getConversation(user._id);
                                        selectConversation(conversation);
                                        setShowContactList(false);
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        <img
                                            src={user.avatarUrl || '/avatar.png'}
                                            alt={user.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{user.displayName}</p>
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                    </div>
                                </div>
                            ))}
                            {followingUsers.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No contacts yet. Follow users to see them here.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
