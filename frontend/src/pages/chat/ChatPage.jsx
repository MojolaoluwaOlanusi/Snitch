// @ts-nocheck
import {useEffect, useRef, useState, useCallback} from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import Sidebar from "../../components/common/Sidebar";
import GroupInfoModal from "../../components/common/GroupInfoModal";
import { SnitchLogo } from "../../components/svgs/snitch";
import {
    Search, MoreHorizontal, MoreVertical, Phone, Paperclip, Smile, Send,
    Video, Mic, Image as ImageIcon, FileText, MapPin, UserPlus, Star,
    Archive, Pin, BellOff, Trash2, Check, CheckCheck, Clock, Reply,
    Forward, Copy, X, Search as SearchIcon, Play, Pause, VideoOff,
    MicOff, PhoneOff, MessageCircle, RotateCw, MonitorUp, Users,
    Minimize2, Maximize2, Camera, MessageSquare, User, Contact,
    BarChart3, Calendar, Lock, Shield, Flag, Download, ExternalLink,
    Heart, UserCheck, UserX, VolumeX, Eye, EyeOff, StarOff, VideoIcon,
    StopCircle, Unlock, Hexagon, Edit, Volume2
} from "lucide-react";
import EmojiPicker from "../../components/common/EmojiPicker";
import MessageReactionEmojiPicker from "../../components/common/MessageReactionEmojiPicker";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ==================== Sub-Components ====================

const NoConversationPlaceholder = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-8">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <SnitchLogo className="size-14 text-blue-400" />
        </div>
        <h3 className="text-gray-800 text-xl font-bold mb-2">Snitch Chat</h3>
        <p className="text-gray-500 text-sm text-center max-w-xs">Select a conversation or start a new one to begin messaging</p>
    </div>
);

const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-4 py-1">
        <div className="flex gap-1">
            {[0, 150, 300].map((delay, i) => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                />
            ))}
        </div>
        <span className="text-xs text-gray-400 ml-1">typing</span>
    </div>
);

const AudioWaveform = ({ isActive, isMuted }) => (
    <div className="flex items-center justify-center gap-[2px] h-12 px-2">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className={`w-[3px] rounded-full transition-all duration-200 ${isActive && !isMuted ? 'bg-blue-400' : 'bg-gray-300'}`}
                style={{
                    height: isActive && !isMuted ? `${12 + Math.sin(i * 0.8) * 10 + Math.random() * 8}px` : '6px',
                    animation: isActive && !isMuted ? `wave 0.${4 + (i % 3)}s ease-in-out infinite alternate` : 'none'
                }}
            />
        ))}
    </div>
);

const EmptyChatPlaceholder = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
        </div>
    </div>
);

const RecordingWaveform = ({ duration }) => (
    <div className="flex items-center gap-2 bg-red-50 rounded-full px-4 py-1.5">
        <div className="flex items-center gap-[1px]">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="w-[2px] bg-red-400 rounded-full animate-pulse"
                    style={{
                        height: `${10 + Math.random() * 16}px`,
                        animationDelay: `${i * 0.1}s`
                    }}
                />
            ))}
        </div>
        <span className="text-xs text-red-500 font-medium">{duration}s</span>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
    </div>
);

const getLastSeen = (lastSeenDate) => {
    if (!lastSeenDate) return 'last seen recently';

    const now = new Date();
    const lastSeen = new Date(lastSeenDate);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'last seen just now';
    if (diffMins < 60) return `last seen ${diffMins} min ago`;
    if (diffHours === 1) return 'last seen 1 hour ago';
    if (diffHours < 24) return `last seen ${diffHours} hours ago`;
    if (diffDays === 1) return 'last seen yesterday';
    if (diffDays < 7) return `last seen ${diffDays} days ago`;
    if (diffWeeks === 1) return 'last seen 1 week ago';
    if (diffWeeks < 4) return `last seen ${diffWeeks} weeks ago`;
    if (diffMonths === 1) return 'last seen 1 month ago';
    if (diffMonths < 12) return `last seen ${diffMonths} months ago`;
    if (diffYears === 1) return 'last seen 1 year ago';
    return `last seen ${diffYears} years ago`;
};

// ==================== Main Component ====================

const ChatPage = () => {
    const {
        conversations, selectedConversation, messages,
        isMessagesLoading, isConversationsLoading,
        onlineUsers, typingUsers,
        getConversations, getConversation, selectConversation,
        getMessages, sendMessage, startTyping, stopTyping,
        reactToMessage, editMessage, deleteMessage, deleteForEveryone, forwardMessage,
        starMessage, pinConversation, archiveConversation,
        muteConversation, markConversationAsRead, clearChat,
        createGroup, addMessage, updateMessage, removeMessage,
        setOnlineUsers, addTypingUser, removeTypingUser,
        searchMessages, pinMessage, unpinMessage, votePoll,
    } = useChatStore();

    const { authUser, socket } = useAuthStore();
    const navigate = useNavigate();

    // --- State ---
    const [showPollVoters, setShowPollVoters] = useState(null);
    const [pollVoterDetails, setPollVoterDetails] = useState({});
    const [loadingPollVoters, setLoadingPollVoters] = useState(false);
    const [callAnswered, setCallAnswered] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(null); // stores messageId
    const [hoveredHexagonId, setHoveredHexagonId] = useState(null);
    const [voicePlaybackRates, setVoicePlaybackRates] = useState({});
    const [playingVoiceId, setPlayingVoiceId] = useState(null);
    const [voiceCurrentTimes, setVoiceCurrentTimes] = useState({});
    const [voiceDurations, setVoiceDurations] = useState({});
    const [voiceProgressWidths, setVoiceProgressWidths] = useState({});
    const [showVoiceMenu, setShowVoiceMenu] = useState(null);
    const [showHexagonRecordModal, setShowHexagonRecordModal] = useState(false);
    const [showAddToCallModal, setShowAddToCallModal] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showVideoRecordModal, setShowVideoRecordModal] = useState(false);
    const [quickFilter, setQuickFilter] = useState('all');
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [isRecordingHexagon, setIsRecordingHexagon] = useState(false);
    const [hexagonStream, setHexagonStream] = useState(null);
    const hexagonVideoRef = useRef(null);
    const [messageText, setMessageText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [reactionPickerPos, setReactionPickerPos] = useState({ top: 0, left: 0 });
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [conversationSearchQuery, setConversationSearchQuery] = useState("");
    const [showMenu, setShowMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showConversationMenu, setShowConversationMenu] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [videoStream, setVideoStream] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [showContactList, setShowContactList] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [messageToForward, setMessageToForward] = useState(null);
    const [forwardTargets, setForwardTargets] = useState([]);
    const [showArchiveSection, setShowArchiveSection] = useState(false);
    const [showLockedSection, setShowLockedSection] = useState(false);
    const [showFavoritesSection, setShowFavoritesSection] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showPinDurationModal, setShowPinDurationModal] = useState(null);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [showShareContactModal, setShowShareContactModal] = useState(false);
    const [contactToShare, setContactToShare] = useState(null);
    const [shareTargets, setShareTargets] = useState([]);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaItems, setMediaItems] = useState([]);
    const [showStarredModal, setShowStarredModal] = useState(false);
    const [starredMessages, setStarredMessages] = useState([]);
    const [showGroupsInCommonModal, setShowGroupsInCommonModal] = useState(false);
    const [groupsInCommon, setGroupsInCommon] = useState([]);
    const [showLockChatModal, setShowLockChatModal] = useState(false);
    const [lockPassword, setLockPassword] = useState('');
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [showMediaViewer, setShowMediaViewer] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlockedBy, setIsBlockedBy] = useState(false);
    const [isChatRestricted, setIsChatRestricted] = useState(false);

    // Call state
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [screenStream, setScreenStream] = useState(null);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isCallMinimized, setIsCallMinimized] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isVideoMode, setIsVideoMode] = useState(true);

    // --- Refs ---
    const callTimerRef = useRef(null);
    const callTimeoutRef = useRef(null);
    const hexagonTimers = useRef({});
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const audioRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef(new Map());
    const socketListenersAttached = useRef(false);
    const emojiPickerRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const replyRef = useRef(null);
    const fileRef = useRef(null);
    const attachmentRef = useRef(null);
    const conversationRef = useRef(null);
    const callRef = useRef(null);
    const activeCallRef = useRef(null);
    const newGroupRef = useRef(null);
    const forwardMessageRef = useRef(null);
    const contactListRef = useRef(null);
    const contactInfoRef = useRef(null);
    const pollRef = useRef(null);
    const eventRef = useRef(null);
    const shareContactRef = useRef(null);
    const pinDurationRef = useRef(null);
    const mediaRef = useRef(null);
    const starredRef = useRef(null);
    const groupsRef = useRef(null);
    const lockRef = useRef(null);
    const unlockRef = useRef(null);
    const mediaViewerRef = useRef(null);
    const videoPreviewRef = useRef(null);
    const addedMessageIds = useRef(new Set());
    const groupAvatarColors = useRef(new Map());

    // ==================== Socket Setup ====================

    const setupSocketListeners = useCallback(() => {
        if (!socket || socketListenersAttached.current) return;
        socketListenersAttached.current = true;

        socket.on('receive_message', (message) => {
            if (addedMessageIds.current.has(message._id)) return;
            addedMessageIds.current.add(message._id);
            addMessage(message);
            if (message.conversationId === useChatStore.getState().selectedConversation?._id) scrollToBottom();
            getConversations();
        });

        socket.on('message_sent', (message) => {
            if (addedMessageIds.current.has(message._id)) return;
            addedMessageIds.current.add(message._id);
            if (!useChatStore.getState().messages.find(m => m._id === message._id)) {
                addMessage(message);
                scrollToBottom();
            }
        });

        socket.on('message:edited', (message) => updateMessage(message._id, message));
        socket.on('message:deleted', ({ messageId }) => removeMessage(messageId));
        socket.on('message:deleted:everyone', ({ messageId }) => removeMessage(messageId));
        socket.on('reaction:update', ({ messageId, reactions }) => updateMessage(messageId, { reactions }));
        socket.on('message:read', ({ messageId }) => {
            updateMessage(messageId, { status: 'read' });
        });
        socket.on('message:pinned', ({ message }) => {
            setPinnedMessages(prev => [
                ...prev.filter(m => m._id !== message._id),
                message
            ]);
            updateMessage(
                message._id,
                { pinned: true }
            );
        });
        socket.on('message:unpinned', ({ messageId }) => {
            setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
            updateMessage(
                messageId,
                { pinned: false }
            );
        });
        socket.on('poll:updated', ({ messageId, votes }) => {
            const { messages, updateMessage } = useChatStore.getState();
            const message = messages.find(m => m._id === messageId);
            if (message) {
                updateMessage(messageId, {
                    poll: { ...message.poll, votes }
                });
            }
        });

        socket.on('typing:start', ({ from }) => {
            addTypingUser(from);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => removeTypingUser(from), 5000);
        });
        socket.on('typing:stop', ({ from }) => {
            removeTypingUser(from);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        });
        socket.on('users_online', (users) => setOnlineUsers(Array.isArray(users) ? users : []));
        socket.on('user_online', (userId) => setOnlineUsers(prev => [
            ...new Set([
                ...prev,
                userId
            ])
        ]));
        socket.on('user_offline', (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId)));
        socket.on('message:starred', ({ messageId, starred }) => {
            const uid = useAuthStore.getState().authUser?._id;
            updateMessage(messageId, {
                starredBy: starred ? [uid] : []
            });
        });
        socket.on('webrtc:call:incoming', ({ callId, from, isVideo, metadata }) => {
            const conv = conversations.find(c => c.participants?.some(p => p._id === from));
            const caller = conv?.participants?.find(p => p._id === from);
            setIncomingCall({
                callId,
                callerId: from,
                callerName: caller?.displayName || metadata?.callerName || 'Unknown',
                isVideo
            });
        });
        socket.on('webrtc:signal', async ({ from, type, data }) => {
            const pc = peerConnectionsRef.current.get(from);
            if (!pc) return;
            try {
                if (type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('webrtc:signal', {
                        toUserId: from,
                        type: 'answer',
                        data: answer
                    });
                } else if (type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                } else if (type === 'ice' && data) {
                    await pc.addIceCandidate(new RTCIceCandidate(data));
                }
            } catch (e) {
                console.error('Signal error:', e);
            }
        });
        socket.on('webrtc:call:ended', () => cleanupCall());
        socket.on('webrtc:call:participant_left', ({ userId }) => {
            setRemoteStreams(prev => {
                const n = new Map(prev);
                n.delete(userId);
                return n;
            });
            const pc = peerConnectionsRef.current.get(userId);
            if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(userId);
            }
        });
        socket.on('webrtc:call:participant_joined', ({ userId }) => {
            toast.success(`${userId} joined`, { icon: '👋' });
        });
    }, [socket]);

    const cleanupSocketListeners = useCallback(() => {
        if (!socket) return; socketListenersAttached.current = false;
        [
            'receive_message',
            'message_sent',
            'message:edited',
            'message:deleted',
            'message:deleted:everyone',
            'reaction:update',
            'message:read',
            'message:pinned',
            'message:unpinned',
            'poll:updated',
            'typing:start',
            'typing:stop',
            'users_online',
            'user_online',
            'user_offline',
            'message:starred',
            'webrtc:call:incoming',
            'webrtc:signal',
            'webrtc:call:ended',
            'webrtc:call:participant_left',
            'webrtc:call:participant_joined'
        ].forEach(e => socket.off(e));
    }, [socket]);

    useEffect(() => {
        getConversations(); fetchContacts();
        if (socket?.connected) {
            setupSocketListeners();
            socket.emit('get_online_users');
        }
        const onConnect = () => {
            setupSocketListeners();
            socket?.emit('get_online_users');
            getConversations();
        };
        socket?.on('connect', onConnect);
        return () => {
            cleanupSocketListeners();
            socket?.off('connect', onConnect);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        };
    }, [socket?.id]);

    // Handle contact link from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const contactId = params.get('contact');
        if (contactId && authUser?._id) {
            handleOpenContactLink(contactId);
            // Clean the URL
            window.history.replaceState({}, document.title, '/chat');
        }
    }, [authUser?._id]);

    const handleOpenContactLink = async (contactId) => {
        try {
            const conv = await getConversation(contactId);
            if (conv) {
                selectConversation(conv);
                toast.success('Conversation opened');
            }
        } catch (error) {
            toast.error('Could not open conversation');
        }
    };

    useEffect(() => {
        if (selectedConversation?._id) {
            getMessages(selectedConversation._id);
            markConversationAsRead(selectedConversation._id);
            checkBlockStatus();
            checkChatRestriction();
        }
    }, [selectedConversation?._id]);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const contactId = params.get('contact');
        if (contactId && authUser) {
            handleContactLink(contactId);
        }
    }, [authUser]);
    useEffect(() => {
        const handleClick = (e) => {
            if (showVoiceMenu && !e.target.closest('.voice-more-btn')) {
                setShowVoiceMenu(null);
            }
        };
        if (showVoiceMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [showVoiceMenu]);
    useEffect(() => {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    }, [localStream]);
    useEffect(() => {
        remoteStreams.forEach((stream, userId) => {
            const el = remoteVideoRefs.current.get(userId);
            if (el) el.srcObject = stream;
        });
    }, [remoteStreams]);

    // Outside click handlers
    useEffect(() => {
        const h = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
        };
        if (showEmojiPicker) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showEmojiPicker]);
    useEffect(() => {
        const h = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(null);
        };
        if (showMenu) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showMenu]);
    useEffect(() => {
        const h = (e) => {
            if (attachmentRef.current && !attachmentRef.current.contains(e.target)) setShowAttachmentMenu(false);
        };
        if (showAttachmentMenu) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showAttachmentMenu]);
    useEffect(() => {
        const h = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
        };
        if (showSearch) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showSearch]);
    useEffect(() => {
        const h = (e) => {
            if (contactInfoRef.current && !contactInfoRef.current.contains(e.target)) setShowContactInfo(false);
        };
        if (showContactInfo) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showContactInfo]);

    // ==================== Helpers ====================

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const getOtherUser = (conversation) => {
        if (!conversation?.participants || !authUser) return null;
        return conversation.participants.find(p => p._id !== authUser._id);
    };
    const isOnline = (userId) => Array.isArray(onlineUsers) && onlineUsers.includes(userId);
    const isTyping = (userId) => Array.isArray(typingUsers) && typingUsers.includes(userId);
    const getIsOwn = (message) => {
        if (!message || !authUser) return false;
        const senderId = message.senderId?._id || message.senderId;
        return String(senderId) === String(authUser._id);
    };
    const formatTime = (date) => new Date(date).toLocaleTimeString(
        [],
        {
            hour: '2-digit',
            minute: '2-digit'
        }
    );
    const formatMessageTime = (date) => {
        const now = new Date();
        const d = new Date(date);
        const diff = now - d;
        if (diff < 86400000) return formatTime(date);
        if (diff < 172800000) return 'Yesterday';
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return d.toLocaleDateString();
    };
    const getMessageStatusIcon = (message) => {
        if (!getIsOwn(message)) return null;

        switch (message.status) {
            case 'read':
                return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
            case 'delivered':
                return <CheckCheck className="w-3.5 h-3.5 text-gray-500" />;
            case 'sent':
                return <Check className="w-3.5 h-3.5 text-gray-500" />;
            case 'sending':
                return <Clock className="w-3.5 h-3.5 text-gray-400" />;
            case 'failed':
                return <Clock className="w-3.5 h-3.5 text-red-400" />;
            default:
                return null;
        }
    };

    const getGroupAvatarColor = (groupId) => {
        if (!groupAvatarColors.current.has(groupId)) {
            const shades =
                [
                    'from-blue-400 to-blue-500',
                    'from-blue-500 to-blue-600',
                    'from-indigo-400 to-indigo-500',
                    'from-cyan-400 to-cyan-500',
                    'from-sky-400 to-sky-500',
                    'from-blue-600 to-indigo-500',
                    'from-blue-500 to-cyan-500',
                    'from-blue-400 to-indigo-400'
                ];
            groupAvatarColors.current.set(
                groupId,
                shades[Math.floor(Math.random() * shades.length)]
            );
        }
        return groupAvatarColors.current.get(groupId);
    };

    const formatCallDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Share contact as a clickable link
    const handleShareContactAsActualLink = (user) => {
        setContactToShare(user);
        setShareTargets([]);
        setShowShareContactModal(true);
    };

    const handleSearchInput = (value) => {
        setSearchQuery(value);
        if (searchTimeout) clearTimeout(searchTimeout);

        if (value.trim()) {
            const timeout = setTimeout(async () => {
                const results = await searchMessages(selectedConversation._id, value);
                setSearchResults(results || []);
            }, 500);
            setSearchTimeout(timeout);
        } else {
            setSearchResults([]);
        }
    };

    const handleDeleteForMe = async (messageId) => {
        await deleteMessage({ messageId }); // this should only soft-delete (set deletedAt)
        setShowMenu(null);
        toast.success('Message deleted');
    };

    const handleDeleteForEveryone = async (messageId) => {
        await deleteForEveryone({ messageId }); // new function for hard delete
        setShowMenu(null);
        toast.success('Message deleted for everyone');
    };

    const formatVoiceTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVoicePlay = (messageId, url) => {
        const audio = audioRef.current;
        if (!audio) return;

        // If the same audio is already loaded, and we want to resume
        if (playingVoiceId === messageId && audio.src === url) {
            if (audio.paused) {
                audio.play();
                setPlayingVoiceId(messageId);
            } else {
                audio.pause();
                setPlayingVoiceId(null);
            }
            return;
        }

        // Otherwise load and play new audio
        audio.pause();
        audio.src = url;
        audio.play().catch(() => {});
        setPlayingVoiceId(messageId);

        audio.onloadedmetadata = () => {
            setVoiceDurations(prev => ({ ...prev, [messageId]: audio.duration }));
        };
        audio.ontimeupdate = () => {
            setVoiceCurrentTimes(prev => ({ ...prev, [messageId]: audio.currentTime }));
            if (audio.duration) {
                setVoiceProgressWidths(prev => ({ ...prev, [messageId]: (audio.currentTime / audio.duration) * 100 }));
            }
        };
        audio.onended = () => {
            setPlayingVoiceId(null);
            setVoiceProgressWidths(prev => ({ ...prev, [messageId]: 0 }));
            setVoiceCurrentTimes(prev => ({ ...prev, [messageId]: 0 }));
        };
    };

    const handleProgressClick = (e, messageId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (audioRef.current && playingVoiceId === messageId) {
            const duration = audioRef.current.duration;
            if (duration) {
                audioRef.current.currentTime = percent * duration;
                setVoiceProgressWidths(prev => ({
                    ...prev,
                    [messageId]: percent * 100
                }));
            }
        }
    };

    const handleVoiceDownload = (url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'voice-message.webm';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleContactLink = async (contactId) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/contact/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                selectConversation(res.data);
            }
        } catch (error) {
            toast.error('Could not open conversation');
        }
    };

    // Share contact as link
    const handleShareContactAsLink = (user) => {
        // const link = `${window.location.origin}/chat?contact=${user._id}`;
        // setMessageText(prev => prev + `👤 Chat with ${user.displayName}: ${link}`);
        // toast.success('Contact link copied to message');
        setContactToShare(user);
        setShareTargets([]);
        setShowShareContactModal(true);
    };

    const getFilteredConversationsInHeader = () => {
        return conversations.filter(c => {
            // Section filters
            if (showArchiveSection) return Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id);
            if (showLockedSection) return Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id);
            if (showFavoritesSection) return Array.isArray(c.favoritedBy) && c.favoritedBy.includes(authUser?._id);

            // Exclude archived/locked from main list
            if (Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id)) return false;
            if (Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id)) return false;

            // Quick filters (only when in main "Chats" view)
            if (quickFilter === 'unread') {
                const unread = c.unreadCount instanceof Map
                    ? c.unreadCount.get(authUser?._id) || 0
                    : (c.unreadCount?.[authUser?._id] || 0);
                if (unread === 0) return false;
            }
            if (quickFilter === 'favorites') {
                if (!Array.isArray(c.favoritedBy) && c.favoritedBy.includes(authUser?._id)) return false;
            }
            if (quickFilter === 'groups') {
                if (!c.isGroup) return false;
            }

            // Search filter
            const matchesSearch = !conversationSearchQuery ||
                c.participants?.some(p => p.displayName?.toLowerCase().includes(conversationSearchQuery.toLowerCase())) ||
                (c.isGroup && c.groupName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()));
            return matchesSearch;
        });
    };

    // Scroll to message
    const scrollToMessage = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-yellow-50');
            setTimeout(() => el.classList.remove('bg-yellow-50'), 2000);
        }
    };

// Hexagon video recording
    const startHexagonRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setHexagonStream(stream);
            setIsRecordingHexagon(true);
            setShowHexagonRecordModal(true); // Show the modal
            setTimeout(() => {
                if (hexagonVideoRef.current) {
                    hexagonVideoRef.current.srcObject = stream;
                    hexagonVideoRef.current.play();
                }
            }, 100);

            const mr = new MediaRecorder(stream);
            const chunks = [];
            mr.ondataavailable = e => chunks.push(e.data);
            mr.onstop = () => {
                const blob = new Blob(chunks, {
                    type: 'video/webm'
                });
                const url = URL.createObjectURL(blob);
                setSelectedFile({
                    file: blob,
                    url,
                    type: 'video/webm',
                    size: blob.size,
                    name: 'hexagon-video.webm',
                    isHexagon: true
                });
                stream.getTracks().forEach(t => t.stop());
                setIsRecordingHexagon(false);
                setHexagonStream(null);
                setShowHexagonRecordModal(false);
            };
            mr.start();
            window._hexagonRecorder = mr;
        } catch (error) {
            toast.error('Camera access denied');
        }
    };

    const stopHexagonRecording = () => {
        if (window._hexagonRecorder?.state !== 'inactive') {
            window._hexagonRecorder?.stop();
        }
        setIsRecordingHexagon(false);
        setShowHexagonRecordModal(false);
    };

    const sendCallSummary = async (type, duration, status) => {
        if (!selectedConversation) return;
        try {
            await sendMessage({
                receiverId: getOtherUser(selectedConversation)?._id,
                conversationId: selectedConversation._id,
                text: '',
                call: { type, duration, status, callerId: authUser?._id },
            });
        } catch (error) { /* fail silently */ }
    };

    const renderTextWithLinks = (text) => {
        if (!text) return text;
        const urlRegex = /(https?:\/\/\S+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                // Check if it's an internal chat contact link
                if (part.includes('/chat?contact=')) {
                    return (
                        <span
                            key={i}
                            className="underline cursor-pointer text-blue-300 hover:text-blue-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                const contactId = new URL(part).searchParams.get('contact');
                                if (contactId) handleOpenContactLink(contactId);
                            }}
                        >
                        {part}
                    </span>
                    );
                }
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline">
                        {part}
                    </a>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/contacts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // res.data is array of Contact objects with populated contactId
            const users = res.data.map(c => c.contactId).filter(Boolean);
            setContacts(users);
        } catch (error) {
            setContacts([]);
        }
    };

    const fetchPollVoterDetails = async (votes) => {
        if (!votes) return;
        setLoadingPollVoters(true);
        const userIds = Object.keys(votes);
        const details = {};
        const token = localStorage.getItem('access-token');

        await Promise.all(
            userIds.map(async (uid) => {
                try {
                    const res = await axiosInstance.get(`/auth/get-user-by-id/${uid}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    details[uid] = res.data.displayName || res.data.username || uid;
                } catch {
                    details[uid] = uid; // fallback to ID
                }
            })
        );
        setPollVoterDetails(details);
        setLoadingPollVoters(false);
    };

    const checkBlockStatus = async () => {
        const other = getOtherUser(selectedConversation);
        if (!other || !authUser) return;
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/block-status/${other._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsBlocked(res.data.isBlocked || false);
            setIsBlockedBy(res.data.isBlockedBy || false);
        } catch (error) {
            /* silent */
        }
    };

    const checkChatRestriction = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/check-restriction', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsChatRestricted(res.data.restricted || false);
        } catch (error) { setIsChatRestricted(false); }
    };

    // ==================== Send Message ====================

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedFile) return;
        if (isChatRestricted) { toast.error('You are restricted from chatting'); return; }
        if (isBlocked) { toast.error('You have blocked this user. Unblock to send messages.'); return; }
        if (isBlockedBy) { toast.error('You have been blocked by this user'); return; }

        if (editingMessageId) {
            await editMessage({ messageId: editingMessageId, newText: messageText });
            setEditingMessageId(null);
        } else {
            const tempId = `temp_${Date.now()}`;
            addedMessageIds.current.add(tempId);

            // Use blob URL for instant preview
            const optimisticMessage = {
                _id: tempId,
                senderId: { _id: authUser?._id, displayName: authUser?.displayName },
                text: messageText,
                conversationId: selectedConversation?._id,
                createdAt: new Date().toISOString(),
                status: 'sending',
                media: selectedFile ? [{
                    url: selectedFile.url, // temporary blob
                    mime: selectedFile.type,
                    size: selectedFile.size,
                    filename: selectedFile.name,
                    isHexagon: selectedFile.isHexagon || false,
                    isVoice: selectedFile.isVoice || false,
                }] : [],
                replyTo: replyingTo || undefined,
            };

            addMessage(optimisticMessage);
            scrollToBottom();

            try {
                let finalMedia = null;

                // Upload to MinIO if there's a file
                if (selectedFile) {
                    const mediaType = selectedFile.isVoice ? 'audio' :
                        selectedFile.isHexagon ? 'hexagonvideo' :
                            selectedFile.type?.startsWith('image/') ? 'images' :
                                selectedFile.type?.startsWith('video/') ? 'videos' : 'documents';

                    const uploadResult = await useChatStore.getState().uploadChatMedia({
                        file: selectedFile.file,
                        conversationId: selectedConversation._id,
                        mediaType,
                    });

                    finalMedia = [{
                        url: uploadResult.url, // permanent MinIO URL
                        mime: selectedFile.type,
                        size: selectedFile.size,
                        filename: selectedFile.name,
                        isHexagon: selectedFile.isHexagon || false,
                        isVoice: selectedFile.isVoice || false,
                    }];
                }

                // Send message with final URLs
                const result = await sendMessage({
                    receiverId: getOtherUser(selectedConversation)?._id,
                    conversationId: selectedConversation?._id,
                    text: messageText,
                    replyTo: replyingTo?._id || undefined,
                    media: finalMedia,
                    isVoiceMessage: selectedFile?.isVoice || false,
                    voiceDuration: selectedFile?.isVoice ? recordingDuration : undefined,
                });

                if (result?._id) {
                    removeMessage(tempId);
                    addedMessageIds.current.add(result._id);
                    addMessage(result);
                }
            } catch (error) {
                updateMessage(tempId, { status: 'failed' });
                if (error?.message?.includes('blocked')) toast.error('You have been blocked by this user');
                else toast.error('Failed to send message');
            }
        }

        setMessageText("");
        setSelectedFile(null);
        setReplyingTo(null);
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        const otherId = getOtherUser(selectedConversation)?._id;
        if (otherId && e.target.value) startTyping({ toUserId: otherId });
        else if (otherId) stopTyping({ toUserId: otherId });
    };
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setSelectedFile({
            file,
            url: reader.result,
            type: file.type,
            size: file.size,
            name: file.name
        });
        reader.readAsDataURL(file);
    };
    const handleEmojiSelect = (emoji) => {
        setMessageText(prev => prev + emoji.native);
    };

    // ==================== Message Actions ====================

    const handleReaction = async (messageId, reaction) => {
        await reactToMessage({ messageId, reaction });
        setShowReactionPicker(null);
    };
    const handleReply = (message) => {
        setReplyingTo(message);
        setShowMenu(null);
        messageInputRef.current?.focus();
    };
    const handleEdit = (message) => {
        if (!getIsOwn(message)) return;
        setEditingMessageId(message._id);
        setMessageText(message.text || '');
        setShowMenu(null);
        messageInputRef.current?.focus();
    };
    const handleDelete = async (messageId) => {
        await deleteMessage({ messageId });
        setShowMenu(null);
    };
    const handleResendMessage = async (message) => {
        // Remove the failed message from the UI
        removeMessage(message._id);

        // Restore the text
        setMessageText(message.text || '');

        // Try to restore the media if it was a blob (not yet uploaded)
        if (message.media && message.media.length > 0) {
            const mediaItem = message.media[0];
            // If the URL is a blob (starts with "blob:"), it might still be valid
            if (mediaItem.url && mediaItem.url.startsWith('blob:')) {
                // Try to fetch the blob to see if it's still valid
                try {
                    const response = await fetch(mediaItem.url);
                    if (response.ok) {
                        const blob = await response.blob();
                        setSelectedFile({
                            file: blob,
                            url: mediaItem.url,
                            type: mediaItem.mime || blob.type,
                            size: mediaItem.size || blob.size,
                            name: mediaItem.filename || 'file',
                            isVoice: message.isVoiceMessage || false,
                            isHexagon: mediaItem.isHexagon || false,
                        });
                    } else {
                        toast.info('Media is no longer available. Please re-attach it.');
                    }
                } catch {
                    toast.info('Media is no longer available. Please re-attach it.');
                }
            } else {
                // It's an uploaded URL – we can't use the file object directly, so just set the text
                toast.info('The original media can’t be recovered. Please re-attach it.');
            }
        }

        // Optionally focus the input
        messageInputRef.current?.focus();
    };
    const handleForward = (messageId) => {
        const msg = messages.find(m => m._id === messageId);
        if (!msg) return;
        setMessageToForward(msg);
        setForwardTargets([]);
        setShowForwardModal(true);
        setShowMenu(null);
    };
    const handleStar = async (messageId) => {
        await starMessage(messageId);
        setShowMenu(null);
    };
    const handleCopy = (text) => {
        if (navigator.clipboard && text) {
            navigator.clipboard.writeText(text).then(() => toast.success('Copied'));
        }
        setShowMenu(null);
    };
    const handleReportMessage = async (messageId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post(`/chat/message/${messageId}/report`, {
                reason: 'Inappropriate'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Message reported');
        } catch (error) {
            toast.error('Failed to report');
        }
        setShowMenu(null);
    };
    const handlePinMessage = (messageId) => {
        setShowPinDurationModal(messageId);
        setShowMenu(null);
    };
    const handlePinDurationSelect = async (duration) => {
        const messageId = showPinDurationModal;
        if (!messageId) return;
        if (duration === null) {
            await unpinMessage(messageId);
            toast.success('Message unpinned');
        } else {
            await pinMessage({
                messageId,
                duration
            });
            toast.success(`Pinned for ${duration}h`);
        }
        setShowPinDurationModal(null);
    };
    const handleForwardSubmit = async () => {
        if (!messageToForward || forwardTargets.length === 0) return;
        try {
            await forwardMessage({
                messageId: messageToForward._id,
                targets: forwardTargets
            });
            setShowForwardModal(false);
            setMessageToForward(null);
            setForwardTargets([]);
            toast.success('Forwarded');
        } catch (error) {
            toast.error('Failed to forward');
        }
    };
    const handleContextMenu = (e, messageId) => {
        e.preventDefault();
        setMenuPosition({
            x: e.clientX,
            y: e.clientY
        });
        setShowMenu(messageId);
    };

    // ==================== Poll & Event ====================

    const handleCreatePoll = async () => {
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
            toast.error('Add a question and at least 2 options');
            return;
        }
        await sendMessage({
            receiverId: getOtherUser(selectedConversation)?._id,
            conversationId: selectedConversation?._id,
            text: `📊 Poll: ${pollQuestion}`,
            poll: {
                question: pollQuestion,
                options: pollOptions.filter(o => o.trim()),
                votes: {}
            }
        });
        setShowPollModal(false);
        setPollQuestion('');
        setPollOptions(['', '']);
    };
    const handleCreateEvent = async () => {
        if (!eventName.trim() || !eventDate) {
            toast.error('Event name and date required');
            return;
        }
        await sendMessage({
            receiverId: getOtherUser(selectedConversation)?._id,
            conversationId: selectedConversation?._id,
            text: `📅 Event: 
            ${eventName}\nDate: 
            ${eventDate}
            ${eventTime ? `\nTime: 
            ${eventTime}` : ''}
            ${eventLocation ? `\nLocation: 
            ${eventLocation}` : ''}`,
            event: {
                name: eventName,
                date: eventDate,
                time: eventTime,
                location: eventLocation
            }
        });
        setShowEventModal(false);
        setEventName('');
        setEventDate('');
        setEventTime('');
        setEventLocation('');
    };
    const handlePollVote = async (messageId, optionIndex) => {
        await votePoll({
            messageId,
            optionIndex
        });
    };

    // ==================== Share Contact ====================

    const handleShareContactOpen = (user) => {
        setContactToShare(user);
        setShareTargets([]);
        setShowShareContactModal(true);
    };

    const handleShareContactConfirm = async () => {
        if (!contactToShare || shareTargets.length === 0) {
            toast.error('Select at least one conversation');
            return;
        }

        const contactLink = `${window.location.origin}/chat?contact=${contactToShare._id}`;

        for (const targetId of shareTargets) {
            const conv = conversations.find(c => c._id === targetId || c.participants?.some(p => p._id === targetId));
            const receiverId = conv?.isGroup ? undefined : targetId;
            const conversationId = conv?.isGroup ? conv._id : undefined;

            await sendMessage({
                receiverId,
                conversationId,
                text: `👤 Contact: ${contactToShare.displayName}\nTap to chat: ${contactLink}`,
                contact: {
                    name: contactToShare.displayName,
                    userId: contactToShare._id,
                    username: contactToShare.username,
                    avatarUrl: contactToShare.avatarUrl
                },
            });
        }

        setShowShareContactModal(false);
        setContactToShare(null);
        setShareTargets([]);
        toast.success(`Contact shared to ${shareTargets.length} conversation(s)`);
    };
    // ==================== Recording ====================

    const startRecording = async () => {
        try {
            // Clear any existing interval first
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            const chunks = [];
            mr.ondataavailable = e => chunks.push(e.data);
            mr.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setSelectedFile({
                    file: blob,
                    url: URL.createObjectURL(blob),
                    type: 'audio/webm',
                    size: blob.size,
                    name: 'voice-message.webm',
                    isVoice: true
                });
                stream.getTracks().forEach(t => t.stop());
                // Clear the interval when recording stops naturally
                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                    recordingIntervalRef.current = null;
                }
            };
            mr.start();
            setIsRecording(true);
            setRecordingDuration(0);
            // Start a fresh interval
            recordingIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
            window._mediaRecorder = mr;
        } catch (error) {
            toast.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (window._mediaRecorder?.state !== 'inactive') {
            window._mediaRecorder?.stop();
        }
        setIsRecording(false);
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        // Do not reset recordingDuration here if we want to keep the final duration for the file
    };

    // ==================== Camera & Video ====================

    const handleCameraCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            setVideoStream(stream);
            setShowVideoRecordModal(true);
        } catch (error) {
            toast.error('Camera access denied');
        }
    };
    const stopVideoRecording = () => {
        if (videoStream) {
            videoStream.getTracks().forEach(t => t.stop());
            setVideoStream(null);
        }
        setIsRecordingVideo(false);
    };
    const takePhoto = () => {
        if (!videoStream || !videoPreviewRef.current) return;
        const video = videoPreviewRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            setSelectedFile({
                file: blob,
                url,
                type: 'image/png',
                size: blob.size,
                name: 'camera-photo.png'
            });
            videoStream.getTracks().forEach(t => t.stop());
            setVideoStream(null);
            setShowVideoRecordModal(false);
        }, 'image/png');
    };

    // ==================== Call Functions ====================
    // [Keep your existing call functions unchanged]

    const createPeerConnection = (targetUserId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302'
                }
            ]
        });
        pc.onicecandidate = e => {
            if (e.candidate) socket?.emit('webrtc:signal', {
                toUserId: targetUserId,
                type: 'ice',
                data: e.candidate
            });
        };
        pc.ontrack = e => {
            setRemoteStreams(prev => {
                const n = new Map(prev);
                n.set(targetUserId, e.streams[0]);
                return n;
            });
        };
        pc.onconnectionstatechange = () => {
            if (['disconnected','failed'].includes(pc.connectionState)) {
                setRemoteStreams(prev => {
                    const n = new Map(prev);
                    n.delete(targetUserId);
                    return n;
                });
            }
        };
        peerConnectionsRef.current.set(targetUserId, pc);
        return pc;
    };
    const startCall = async (isVideo) => {
        const otherId = getOtherUser(selectedConversation)?._id;
        if (!otherId) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            });
            setLocalStream(stream);
            setIsVideoMode(isVideo);
            setIsVideoOff(false);
            setIsMicMuted(false);
            const pc = createPeerConnection(otherId);
            stream.getTracks().forEach(t => pc.addTrack(t, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const callId = Date.now().toString();
            setActiveCall({
                callId,
                isVideo,
                otherUserId: otherId
            });
            setCallAnswered(false);
            startCallTimer();
            callTimeoutRef.current = setTimeout(() => {
                if (activeCall && !callAnswered) {
                    endCall();
                    sendCallSummary(isVideo ? 'video' : 'audio', callDuration, 'no_answer');
                    toast('Call ended – no answer');
                }
            }, 60000);
            socket?.emit('webrtc:call:initiate', {
                targets: [otherId],
                isVideo,
                metadata: {
                    callerName: authUser?.displayName
                }
            });
            setTimeout(() => {
                socket?.emit('webrtc:signal', {
                    toUserId: otherId,
                    type: 'offer',
                    data: offer
                });
            }, 500);
        } catch (error) {
            toast.error('Camera/mic access denied');
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
            setIsVideoMode(incomingCall.isVideo);
            setIsVideoOff(false);
            setIsMicMuted(false);
            const pc = createPeerConnection(incomingCall.callerId);
            stream.getTracks().forEach(t => pc.addTrack(t, stream));
            setActiveCall({
                callId: incomingCall.callId,
                isVideo: incomingCall.isVideo,
                otherUserId: incomingCall.callerId
            });
            setCallAnswered(true);
            clearTimeout(callTimeoutRef.current);
            startCallTimer();
            setIncomingCall(null);
            socket?.emit('webrtc:call:join', {
                callId: incomingCall.callId
            });
        } catch (error) {
            toast.error('Camera/mic access denied');
            rejectCall();
        }
    };
    const rejectCall = () => {
        if (incomingCall) {
            socket?.emit('webrtc:call:leave', {
                callId: incomingCall.callId
            });
            setIncomingCall(null);
        }
    };
    const cleanupCall = () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());
        peerConnectionsRef.current.forEach(pc => pc.close()); peerConnectionsRef.current.clear();
        if (activeCall) {
            const status = callAnswered ? 'ended' : 'missed';
            sendCallSummary(activeCall.isVideo ? 'video' : 'audio', callDuration, status);
        }
        stopCallTimer();
        clearTimeout(callTimeoutRef.current);
        setLocalStream(null);
        setRemoteStreams(new Map());
        setScreenStream(null);
        setActiveCall(null);
        setIncomingCall(null);
        setIsSharingScreen(false);
        setIsCallMinimized(false);
    };
    const endCall = () => {
        if (activeCall) {
            socket?.emit('webrtc:call:end', {
                callId: activeCall.callId
            });
        }
        cleanupCall();
    };
    const startCallTimer = () => {
        setCallDuration(0);
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };
    const stopCallTimer = () => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
    };
    const toggleVideoMode = async () => {
        if (!localStream || !activeCall) return;
        try {
            if (isVideoMode) {
                localStream.getVideoTracks().forEach(t => t.stop());
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                const pc = peerConnectionsRef.current.get(activeCall.otherUserId);
                const sender = pc?.getSenders().find(s => s.track?.kind === 'audio');
                if (sender) await sender.replaceTrack(audioStream.getAudioTracks()[0]);
                setLocalStream(audioStream);
                setIsVideoMode(false);
                setIsVideoOff(true);
            } else {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        facingMode: isFrontCamera ? 'user' : 'environment'
                    }
                });
                const pc = peerConnectionsRef.current.get(activeCall.otherUserId);
                const videoTrack = videoStream.getVideoTracks()[0];
                const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) await sender.replaceTrack(videoTrack);
                else pc?.addTrack(videoTrack, videoStream);
                const audioSender = pc?.getSenders().find(s => s.track?.kind === 'audio');
                if (audioSender) await audioSender.replaceTrack(videoStream.getAudioTracks()[0]);
                setLocalStream(videoStream);
                setIsVideoMode(true);
                setIsVideoOff(false);
            }
        } catch (error) {
            toast.error('Could not switch');
        }
    };
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => {
                t.enabled = !t.enabled;
            });
            setIsMicMuted(!isMicMuted);
        }
    };
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => {
                t.enabled = !t.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };
    const flipCamera = async () => {
        if (!localStream || !isVideoMode) return;
        try {
            localStream.getVideoTracks().forEach(t => t.stop());
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: isFrontCamera ? 'environment' : 'user'
                },
                audio: true
            });
            const pc = peerConnectionsRef.current.get(activeCall?.otherUserId);
            const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) await sender.replaceTrack(newStream.getVideoTracks()[0]);
            setLocalStream(newStream);
            setIsFrontCamera(!isFrontCamera);
        } catch (error) {
            toast.error('Could not flip camera');
        }
    };
    const shareScreen = async () => {
        if (!activeCall) return;
        try {
            if (isSharingScreen) {
                if (screenStream) screenStream.getTracks().forEach(t => t.stop());
                setIsSharingScreen(false);
                const pc = peerConnectionsRef.current.get(activeCall.otherUserId);
                const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender && localStream) {
                    const vt = localStream.getVideoTracks()[0];
                    if (vt) await sender.replaceTrack(vt);
                }
            } else {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });
                setScreenStream(stream);
                setIsSharingScreen(true);
                stream.getVideoTracks()[0].onended = () => {
                    setIsSharingScreen(false);
                    const pc = peerConnectionsRef.current.get(activeCall.otherUserId);
                    const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && localStream) {
                        const vt = localStream.getVideoTracks()[0];
                        if (vt) sender.replaceTrack(vt);
                    }
                };
                const pc = peerConnectionsRef.current.get(activeCall.otherUserId);
                const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) await sender.replaceTrack(stream.getVideoTracks()[0]);
                else pc?.addTrack(stream.getVideoTracks()[0], stream);
            }
        } catch (error) {
            toast.error('Could not share screen');
        }
    };
    const toggleCallMinimize = () => {
        setIsCallMinimized(!isCallMinimized);
    };

    // ==================== Conversation Actions ====================

    const handlePinConversation = async () => {
        await pinConversation(showConversationMenu);
        setShowConversationMenu(null);
    };
    const handleArchiveConversation = async () => {
        await archiveConversation(showConversationMenu);
        setShowConversationMenu(null);
    };
    const handleMuteConversation = async (duration) => {
        await muteConversation(showConversationMenu, duration);
        setShowConversationMenu(null);
    };
    const handleClearChat = async () => {
        if (window.confirm('Clear this chat?')) {
            await clearChat(selectedConversation?._id);
            setShowConversationMenu(null);
        }
    };
    const handleSearchMessages = async () => {
        if (!searchQuery.trim() || !selectedConversation) return;
        const results = await searchMessages(selectedConversation._id, searchQuery);
        setSearchResults(results || []);
    };
    const handleCreateGroup = async () => {
        if (!groupName.trim()) return;
        await createGroup({
            name: groupName,
            participantIds: selectedParticipants
        });
        setShowNewGroupModal(false);
        setGroupName("");
        setSelectedParticipants([]);
    };
    const handleBlockContact = async () => {
        const user = getOtherUser(selectedConversation);
        if (!user) return;
        try {
            const token = localStorage.getItem('access-token');
            if (isBlocked) {
                await axiosInstance.post(`/auth/unblock/${user._id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsBlocked(false);
                toast.success('Contact unblocked');
            } else {
                await axiosInstance.post(`/auth/block/${user._id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsBlocked(true);
                toast.success('Contact blocked');
            }
        } catch (error) {
            toast.error('Failed');
        }
        setShowConversationMenu(null);
    };
    const handleReportContact = async () => {
        const user = getOtherUser(selectedConversation);
        if (!user) return;
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post(`/auth/report-user/${user._id}`, {
                reason: 'Reported from chat'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Contact reported');
        } catch (error) {
            toast.error('Failed to report');
        }
        setShowConversationMenu(null);
    };
    const handleGoToProfile = () => {
        const user = getOtherUser(selectedConversation);
        if (user?.username) navigate(`/profile/${user.username}`);
    };
    const handleLockChatOpen = () => {
        setLockPassword('');
        setShowLockChatModal(true);
        setShowContactInfo(false);
    };
    const handleLockChatConfirm = async () => {
        if (!lockPassword.trim()) {
            toast.error('Enter password');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${selectedConversation?._id}/lock`, {
                password: lockPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Chat locked');
            setShowLockChatModal(false);
            await getConversations();
        } catch (error) {
            toast.error('Failed to lock');
        }
    };
    const handleUnlockChat = async () => {
        if (!unlockPassword.trim()) {
            toast.error('Enter password');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            // Try to unlock any locked conversation with this password
            const res = await axiosInstance.post('/chat/unlock-all',
                { password: unlockPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Chats unlocked');
            setShowUnlockModal(false);
            setUnlockPassword('');
            setShowLockedSection(true); // Now show locked section
            await getConversations();
        } catch (error) {
            toast.error('Wrong password');
        }
    };
    const handleAddToFavorites = async () => {
        const convId = selectedConversation?._id;
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${convId}/favorite`, {}, { headers: { Authorization: `Bearer ${token}` } });
            // Update local state
            const updatedConversations = conversations.map(c => {
                if (c._id === convId) {
                    const isFav = c.favoritedBy?.includes(authUser?._id);
                    return {
                        ...c,
                        favoritedBy: isFav
                            ? c.favoritedBy.filter(id => id !== authUser?._id)
                            : [...(c.favoritedBy || []), authUser?._id]
                    };
                }
                return c;
            });
            set({ conversations: updatedConversations }); // if using useChatStore directly? Actually you'd need to use the store's set.
            // But easier: just call getConversations()
            await getConversations();
            toast.success('Updated');
        } catch (error) { toast.error('Failed'); }
    };
    // ==================== Media, Starred, Groups Modals ====================

    const handleOpenMedia = () => {
        const allMedia = messages.filter(m => m.media && m.media.length > 0).flatMap(m => m.media.map(
            media => ({
                ...media,
                messageId: m._id
            })
        ));
        setMediaItems(allMedia);
        setShowMediaModal(true);
    };
    const handleOpenStarred = async () => {
        if (!selectedConversation) return;
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/starred/${selectedConversation._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStarredMessages(res.data || []); setShowStarredModal(true);
        } catch (error) {
            toast.error('Failed to load starred');
        }
    };
    const handleOpenGroupsInCommon = () => {
        const other = getOtherUser(selectedConversation);
        if (!other) return;
        const common = conversations.filter(
            c => c.isGroup && c.participants?.some(p => p._id === other._id) && c.participants?.some(
                p => p._id === authUser?._id));
        setGroupsInCommon(common);
        setShowGroupsInCommonModal(true);
    };
    const goToConversation = ({url}) => {
        navigate(url);
    };

    // ==================== Conversation Filtering ====================

    const getFilteredConversations = () => {
        return conversations.filter(c => {
            if (showArchiveSection) return Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id);
            if (showLockedSection) return Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id);
            if (showFavoritesSection) return Array.isArray(c.favoritedBy) && c.favoritedBy.includes(authUser?._id);
            if (Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id)) return false;
            if (Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id)) return false;
            const matchesSearch = !conversationSearchQuery || c.participants?.some(
                p => p.displayName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()))
                ||
                (c.isGroup && c.groupName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()));
            return matchesSearch;
        });
    };

    const sortedConversations = [...getFilteredConversationsInHeader()].sort((a, b) => {
        const aPinned = a.pinnedBy?.includes(authUser?._id) ? 1 : 0;
        const bPinned = b.pinnedBy?.includes(authUser?._id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(
            b.lastMessage?.createdAt || b.updatedAt || 0
        ).getTime() - new Date(
            a.lastMessage?.createdAt || a.updatedAt || 0
        ).getTime();
    });

    const unreadCount = conversations.filter(
        c => {
            const unread = c.unreadCount instanceof Map ? c.unreadCount.get(authUser?._id)
                ||
                0 : (c.unreadCount?.[authUser?._id] || 0);
            return unread > 0 && !Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id);
        }).length;
    const favoritesCount = conversations.filter(
        c => Array.isArray(c.favoritedBy) && c.favoritedBy.includes(authUser?._id)
    ).length;
    const groupsCount = conversations.filter(
        c => c.isGroup && !Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id)
    ).length;

    // ==================== Render Message ====================

    const renderMessage = (message) => {
        if (!message) return null;
        const isOwn = getIsOwn(message);
        const isDeleted = message.deletedAt || message.deletedForEveryone;
        const isStarred = Array.isArray(message.starredBy) && message.starredBy.includes(authUser?._id);

        if (isDeleted) {
            return (
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
                    <div className="bg-gray-100 rounded-xl px-4 py-2">
                        <p className="text-gray-400 text-xs italic">This message was deleted</p>
                    </div>
                </div>
            );
        }

        // ==================== HEXAGON VIDEO - Standalone Container (No Chat Bubble) ====================
        const hasHexagonVideo = message.media && message.media.length > 0 && message.media[0]?.isHexagon;

        const AudioPlayer = ({message,src}) => (
            <div className="py-1.5" style={{ width: '100%', minWidth: '250px' }}>
                <div className="flex items-center gap-2">
                    {/* Play/Pause Button */}
                    <button
                        className="p-1.5 rounded-full hover:bg-white/20 flex-shrink-0"
                        onClick={() => handleVoicePlay(message._id, src)}
                    >
                        {playingVoiceId === message._id ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                    </button>

                    {/* Current Time */}
                    <span className={`text-xs flex-shrink-0 w-10 text-right tabular-nums ${isOwn ? 'text-white' : 'text-gray-600'}`}>
                {formatVoiceTime(voiceCurrentTimes[message._id] || 0)}
            </span>

                    {/* Progress Bar */}
                    <div
                        className={`flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer relative ${
                            isOwn ? 'bg-white/30' : 'bg-gray-200'
                        }`}
                        onClick={(e) => handleProgressClick(e, message._id)}
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-100 ${
                                isOwn ? 'bg-white' : 'bg-gray-500'
                            }`}
                            style={{ width: `${voiceProgressWidths[message._id] || 0}%` }}
                        />
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow cursor-pointer hover:scale-125 transition-transform ${
                                isOwn ? 'bg-white' : 'bg-gray-600'
                            }`}
                            style={{ left: `calc(${voiceProgressWidths[message._id] || 0}% - 6px)` }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const bar = e.currentTarget.parentElement;
                                const onMove = (moveEvent) => {
                                    const rect = bar.getBoundingClientRect();
                                    const percent = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                                    if (audioRef.current && playingVoiceId === message._id) {
                                        audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
                                        setVoiceProgressWidths(prev => ({ ...prev, [message._id]: percent }));
                                    }
                                };
                                const onUp = () => {
                                    document.removeEventListener('mousemove', onMove);
                                    document.removeEventListener('mouseup', onUp);
                                };
                                document.addEventListener('mousemove', onMove);
                                document.addEventListener('mouseup', onUp);
                            }}
                        />
                    </div>

                    {/* Duration */}
                    <span className={`text-xs flex-shrink-0 w-10 tabular-nums ${isOwn ? 'text-white' : 'text-gray-600'}`}>
                {formatVoiceTime(voiceDurations[message._id] || message.voiceDuration || 0)}
            </span>

                </div>
            </div>
        )

        if (hasHexagonVideo) {
            const hexMedia = message.media[0];
            return (
                <div
                    className={`flex items-end mb-3 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                    onContextMenu={(e) => handleContextMenu(e, message._id)}
                >
                    {/* Action buttons */}
                    <div
                        className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'order-1 mr-1' : 'order-2 ml-1'}`}
                    >
                        <button onClick={
                            (e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setReactionPickerPos({ top: rect.top - 60, left: rect.left });
                                setShowReactionPicker(message._id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                            title="React"
                        >
                            <Smile className="w-4 h-4 text-gray-400" />
                        </button>
                        <button onClick={
                            (e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition(
                                    {
                                        x: rect.left,
                                        y: rect.bottom + 4
                                    });
                                setShowMenu(message._id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                            title="More"
                        >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Hexagon Video Container - with colored outline */}
                    <div className={`relative ${isOwn ? 'order-2' : 'order-1'}`}>
                        {/* Pinned indicator */}
                        {message.pinned && (
                            <div className="absolute -top-5 left-0 flex items-center gap-1 z-10">
                                <Pin className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] text-blue-400">Pinned</span>
                            </div>
                        )}

                        {/* Outer hexagon - this creates the colored border */}
                        <div
                            className={`w-[216px] h-[216px] flex items-center justify-center ${
                                isOwn ? 'bg-emerald-500' : 'bg-gray-200'
                            }`}
                            style={{
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                            }}
                        >
                            {/* Inner hexagon - slightly smaller, contains the video */}
                            <div
                                className="w-[208px] h-[208px] cursor-pointer relative group/hex"
                                style={{
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }}
                                onMouseEnter={() => {
                                    setHoveredHexagonId(message._id);
                                    const vid = document.getElementById(`hex-vid-${message._id}`);
                                    if (vid) {
                                        vid.muted = true;
                                        vid.currentTime = 0;
                                        vid.play().catch(() => {});
                                        hexagonTimers.current[message._id] = setTimeout(() => {
                                            vid.pause();
                                            vid.currentTime = 0;
                                        }, 10000);
                                    }
                                }}
                                onMouseLeave={() => {
                                    setHoveredHexagonId(null);
                                    const vid = document.getElementById(`hex-vid-${message._id}`);
                                    if (vid) {
                                        vid.pause();
                                        vid.currentTime = 0;
                                    }
                                    clearTimeout(hexagonTimers.current[message._id]);
                                }}
                                onClick={() => setShowMediaViewer(hexMedia)}
                            >
                                <video
                                    id={`hex-vid-${message._id}`}
                                    src={hexMedia.url}
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/hex:opacity-100 transition-opacity">
                                    <Play className="w-10 h-10 text-white drop-shadow-lg" />
                                </div>
                            </div>
                        </div>

                        {/* Time and status below hexagon */}
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-emerald-100' : 'justify-end text-gray-400'}`}>
                            {message.editedAt && <span className="text-[10px]">edited</span>}
                            {isStarred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            {message.status === 'failed' && isOwn && (
                                <button
                                    onClick={() => handleResendMessage(message)}
                                    className="text-[10px] text-red-400 hover:text-red-500 underline"
                                >
                                    Resend
                                </button>
                            )}
                            <span className="text-[10px]">{formatMessageTime(message.createdAt)}</span>
                            {getMessageStatusIcon(message)}
                        </div>

                        {/* Reactions on hexagon */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                            <div className={`absolute -top-2 ${isOwn ? '-left-2' : '-right-2'} flex gap-0.5`}>
                                {Object.values(message.reactions).slice(0, 3).map((r, i) => (
                                    <span
                                        key={i}
                                        className="text-xs bg-white shadow px-1.5 py-0.5 rounded-full border"
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reaction picker */}
                    {showReactionPicker === message._id && (
                        <div
                            className="fixed z-50"
                            style={{
                                top: Math.min(reactionPickerPos.top, window.innerHeight - 300),
                                left: Math.min(reactionPickerPos.left, window.innerWidth - 320)
                            }}
                        >
                            <MessageReactionEmojiPicker
                                postId={message._id}
                                onReact={(emoji) => handleReaction(message._id, emoji)}
                                onClose={() => setShowReactionPicker(null)}
                                isOpen={true}
                            />
                        </div>
                    )}
                </div>
            );
        }

        // ==================== REGULAR MESSAGE (Chat Bubble) ====================
        return (
            <div
                className={`flex items-end mb-1 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                onContextMenu={(e) => handleContextMenu(e, message._id)}
            >
                <div
                    className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'order-1 mr-1' : 'order-2 ml-1'}`}
                >
                    <button
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setReactionPickerPos(
                                {
                                    top: rect.top - 60,
                                    left: rect.left
                                }
                            );
                            setShowReactionPicker(message._id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="React"
                    >
                        <Smile className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition(
                                {
                                    x: rect.left,
                                    y: rect.bottom + 4
                                }
                            );
                            setShowMenu(message._id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="More"
                    >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* OUTER CONTAINER - voice messages get fixed 280px width */}
                <div
                    className={`relative ${isOwn ? 'order-2' : 'order-1'} ${message.isVoiceMessage && !message.text ? 'voice-bubble-container' : 'max-w-[70%]'}`}
                >
                    {message.pinned && <div className="absolute -top-4 left-2 flex items-center gap-1">
                        <Pin className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-blue-400">
                            Pinned
                        </span>
                    </div>}

                    {/* INNER BUBBLE */}
                    <div
                        className={`rounded-xl px-3 py-2 shadow-sm ${isOwn ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'} ${message.isVoiceMessage && !message.text ? 'w-full' : ''}`}>
                        {/* Poll */}
                        {message.poll?.question && (
                            <div className="mb-2 bg-white/10 rounded-lg p-2" style={{ minWidth: '180px' }}>
                                <p className="font-semibold text-sm mb-2">📊 {message.poll.question}</p>
                                <div className="space-y-1">
                                    {message.poll?.question && (
                                        <div className="mb-2 rounded-lg p-3" style={{ minWidth: '220px', backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }}>
                                            {/* Poll Question */}
                                            {/*<p className="font-semibold text-sm mb-3">📊 {message.poll.question}</p>*/}

                                            {/* Poll Options */}
                                            <div className="space-y-2">
                                                {message.poll?.options?.map((opt, i) => {
                                                    // Calculate votes
                                                    const votes = message.poll?.votes || {};
                                                    const voteEntries = Object.entries(votes);
                                                    const totalVotes = voteEntries.length;
                                                    const optionVotes = voteEntries.filter(([, v]) => v === i).length;
                                                    const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;

                                                    // Check if current user voted for this option
                                                    const userVotedForThis = voteEntries.some(([uid, v]) => uid === authUser?._id && v === i);
                                                    const hasVoted = voteEntries.some(([uid]) => uid === authUser?._id);

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handlePollVote(message._id, i)}
                                                            className={`w-full text-left rounded-lg transition-all relative overflow-hidden ${
                                                                hasVoted ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                                                            }`}
                                                            style={{ minHeight: '36px' }}
                                                        >
                                                            {/* Background progress bar */}
                                                            {totalVotes > 0 && (
                                                                <div
                                                                    className={`absolute inset-0 rounded-lg transition-all duration-500 ${userVotedForThis ? 'bg-white/30' : 'bg-white/10'}`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            )}

                                                            {/* Option content */}
                                                            <div className="relative px-3 py-2.5 flex items-center justify-between z-10">
                                                                <span className={`text-xs font-medium ${userVotedForThis ? 'font-bold' : ''}`}>
                                                                    {opt}
                                                                </span>
                                                                <span className={`text-xs ml-2 flex-shrink-0 ${userVotedForThis ? 'font-bold' : ''}`}>
                                                                    {totalVotes > 0 ? `${percentage}%` : ''}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Total votes */}
                                            {Object.keys(message.poll?.votes || {}).length > 0 && (
                                                <p
                                                    className="text-[10px] opacity-60 mt-2 text-center cursor-pointer hover:underline"
                                                    onClick={() => {
                                                        setShowPollVoters(message._id);
                                                        fetchPollVoterDetails(message.poll.votes);
                                                    }}
                                                >
                                                    {Object.keys(message.poll.votes).length} vote(s) – see details
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Event */}
                        {message.event?.name && (
                            <div className="mb-2 bg-white/10 rounded-lg p-2">
                                <p className="font-semibold text-sm">📅 {message.event.name}</p>
                                <p className="text-xs opacity-80">
                                    Date: {message.event.date}{message.event.time ? ` • Time: 
                                    ${message.event.time}` : ''}{message.event.location ? ` • Location: 
                                    ${message.event.location}` : ''}
                                </p>
                            </div>
                        )}

                        {/* Contact */}
                        {message.contact && (
                            <div
                                className="mb-2 bg-white/10 rounded-lg p-2.5 cursor-pointer hover:bg-white/20 transition-colors"
                                onClick={async () => {
                                    if (message.contact.userId) {
                                        try {
                                            const conv = await getConversation(message.contact.userId);
                                            if (conv) selectConversation(conv);
                                            else toast.error('Could not open conversation');
                                        } catch { toast.error('Failed'); }
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                                        {message.contact.avatarUrl ?
                                            <img src={message.contact.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                {message.contact.name?.charAt(0) || '?'}
                                            </div>
                                        }
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">{message.contact.name}</p>
                                        {message.contact.username && <p className="text-[10px] opacity-75">@{message.contact.username}</p>}
                                    </div>
                                </div>
                                <p className="text-[10px] opacity-60 text-center mt-1 border-t border-white/10 pt-1">
                                    Tap to open conversation
                                </p>
                            </div>
                        )}

                        {/* Regular Media (skip hexagon videos and voice messages) */}
                        {message.media && message.media.length > 0 && message.media.map((m, i) => {
                            if (m.isHexagon) return null;
                            // Skip audio for voice messages - they use the custom player
                            if (message.isVoiceMessage && m.mime?.startsWith('audio/')) return null;

                            return (
                                <div
                                    key={i}
                                    className={`mb-1 ${message.isVoiceMessage ? '' : 'max-w-[240px] cursor-pointer'}`}
                                    onClick={() => {
                                        if (!message.isVoiceMessage) setShowMediaViewer(m);
                                    }}
                                >
                                    {m.mime?.startsWith('image/') ? <img src={m.url} alt="" className="rounded-lg w-full" loading="lazy" /> :
                                        m.mime?.startsWith('video/') ? (message.isVoiceMessage ?
                                                <div className="w-40 h-40 rounded-full overflow-hidden relative">
                                                    <video src={m.url} className="w-full h-full object-cover" />
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <Play className="w-8 h-8 text-white drop-shadow-lg" />
                                                    </div>
                                                </div> :
                                                <video src={m.url} className="rounded-lg w-full" />) :
                                                m.mime?.startsWith('audio/') ? <audio src={m.url}  controls className="w-full" /> :
                                                <div
                                                    className="flex items-center gap-2 bg-white/20 p-2 rounded"
                                                >
                                                    <FileText className="w-6 h-6" />
                                                    <span className="text-xs truncate">{m.filename || 'File'}</span>
                                                </div>
                                    }
                                </div>
                            );
                        })}

                        {/* Voice Message - Full Featured Player */}
                        {message.isVoiceMessage && message.media?.[0] && (
                            <div className="py-1.5" style={{ width: '100%', minWidth: '250px' }}>
                                <div className="flex items-center gap-2">
                                    {/* Play/Pause Button */}
                                    <button
                                        className="p-1.5 rounded-full hover:bg-white/20 flex-shrink-0"
                                        onClick={() => handleVoicePlay(message._id, message.media[0].url)}
                                    >
                                        {playingVoiceId === message._id ? (
                                            <Pause className="w-5 h-5" />
                                        ) : (
                                            <Play className="w-5 h-5" />
                                        )}
                                    </button>

                                    {/* Current Time */}
                                    <span className={`text-xs flex-shrink-0 w-10 text-right tabular-nums ${isOwn ? 'text-white' : 'text-gray-600'}`}>
                                        {formatVoiceTime(voiceCurrentTimes[message._id] || 0)}
                                    </span>

                                    {/* Progress Bar */}
                                    <div
                                        className={`flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer relative ${
                                            isOwn ? 'bg-white/30' : 'bg-gray-200'
                                        }`}
                                        onClick={(e) => handleProgressClick(e, message._id)}
                                    >
                                        <div
                                            className={`h-full rounded-full transition-all duration-100 ${
                                                isOwn ? 'bg-white' : 'bg-gray-500'
                                            }`}
                                            style={{ width: `${voiceProgressWidths[message._id] || 0}%` }}
                                        />
                                        <div
                                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow cursor-pointer hover:scale-125 transition-transform ${
                                                isOwn ? 'bg-white' : 'bg-gray-600'
                                            }`}
                                            style={{ left: `calc(${voiceProgressWidths[message._id] || 0}% - 6px)` }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                const bar = e.currentTarget.parentElement;
                                                const onMove = (moveEvent) => {
                                                    const rect = bar.getBoundingClientRect();
                                                    const percent = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                                                    if (audioRef.current && playingVoiceId === message._id) {
                                                        audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
                                                        setVoiceProgressWidths(prev => ({ ...prev, [message._id]: percent }));
                                                    }
                                                };
                                                const onUp = () => {
                                                    document.removeEventListener('mousemove', onMove);
                                                    document.removeEventListener('mouseup', onUp);
                                                };
                                                document.addEventListener('mousemove', onMove);
                                                document.addEventListener('mouseup', onUp);
                                            }}
                                        />
                                    </div>

                                    {/* Duration */}
                                    <span className={`text-xs flex-shrink-0 w-10 tabular-nums ${isOwn ? 'text-white' : 'text-gray-600'}`}>
                                        {formatVoiceTime(voiceDurations[message._id] || message.voiceDuration || 0)}
                                    </span>

                                    {/* Speed Button */}
                                    <div className="relative flex-shrink-0">
                                        <button
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-white/20 ${
                                                isOwn ? 'text-white' : 'text-gray-600'
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowVoiceMenu(showVoiceMenu === message._id ? null : message._id);
                                            }}
                                        >
                                            {voicePlaybackRates[message._id] || 1}x
                                        </button>
                                        {showVoiceMenu === message._id && (
                                            <div
                                                className={`absolute bottom-full mb-1 bg-white rounded-lg shadow-lg border py-1 w-20 z-30 ${isOwn ? 'right-0' : 'left-0'}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {[0.5, 1, 1.5, 2].map(speed => (
                                                    <button
                                                        key={speed}
                                                        onClick={() => {
                                                            if (audioRef.current) {
                                                                audioRef.current.playbackRate = speed;
                                                            }
                                                            setVoicePlaybackRates(prev => ({ ...prev, [message._id]: speed }));
                                                            setShowVoiceMenu(null);
                                                        }}
                                                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                                                            voicePlaybackRates[message._id] === speed || (!voicePlaybackRates[message._id] && speed === 1)
                                                                ? 'text-blue-500 font-medium'
                                                                : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {speed}x
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        className={`p-1 hover:bg-white/20 rounded-full flex-shrink-0 ${isOwn ? 'text-white' : 'text-gray-600'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVoiceDownload(message.media[0].url);
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {message.replyTo && (
                            <div
                                className={`flex items-stretch mb-1 cursor-pointer rounded-sm overflow-hidden ${isOwn ? 'bg-emerald-600' : 'bg-gray-100'}`}
                                onClick={() => {
                                    const targetEl = document.getElementById(`msg-${message.replyTo._id}`);
                                    if (targetEl) {
                                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        targetEl.classList.add('bg-yellow-50/50');
                                        setTimeout(() => targetEl.classList.remove('bg-yellow-50/50'), 2000);
                                    }
                                }}
                            >
                                {/* Colored bar on the left */}
                                <div className={`w-1 flex-shrink-0 ${isOwn ? 'bg-emerald-300' : 'bg-gray-400'}`} />

                                {/* Reply content */}
                                <div className="px-3 py-1.5 flex-1 min-w-0">
                                    <p className={`text-[11px] font-semibold truncate ${isOwn ? 'text-emerald-100' : 'text-gray-500'}`}>
                                        {message.replyTo.senderId?._id === authUser?._id ? 'You' : message.replyTo.senderId?.displayName || 'User'}
                                    </p>
                                    <p className={`text-[11px] truncate ${isOwn ? 'text-emerald-50/80' : 'text-gray-500'}`}>
                                        {
                                            message.replyTo.text?.substring(0, 80) ||
                                            (message.replyTo.media?.length > 0 ? '📎 Media' : message.replyTo.isVoiceMessage ? '🎤 Voice message' : 'Message')
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Text */}
                        {message.text && !message.poll?.question && !message.event?.name && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {renderTextWithLinks(message.text)}
                            </p>
                        )}

                        {message.call && (
                            <div className="flex items-center gap-2 py-1">
                                <Phone className="w-4 h-4" />
                                <span className="text-xs">
                                    {message.call.type === 'video' ? 'Video' : 'Audio'} call
                                    {' · '}
                                    {formatCallDuration(message.call.duration)}
                                    {message.call.status === 'missed' && ' (Missed)'}
                                    {message.call.status === 'no_answer' && ' (No answer)'}
                                </span>
                            </div>
                        )}

                        {/* Meta */}
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-emerald-100' : 'justify-end text-gray-400'}`}>
                            {message.editedAt && <span className="text-[10px]">edited</span>}
                            {isStarred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            {message.status === 'failed' && isOwn && (
                                <button
                                    onClick={() => handleResendMessage(message)}
                                    className="text-[10px] text-red-400 hover:text-red-500 underline"
                                >
                                    Resend
                                </button>
                            )}
                            <span className="text-[10px]">{formatMessageTime(message.createdAt)}</span>
                            {getMessageStatusIcon(message)}
                        </div>
                    </div>

                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className={`absolute -bottom-2 ${isOwn ? 'left-2' : 'right-2'} flex gap-0.5`}>
                            {
                                Object.values(message.reactions).slice(0, 3).map((r, i) =>
                                    <span
                                        key={i}
                                        className="text-xs bg-white shadow px-1.5 py-0.5 rounded-full border"
                                    >
                                        {r}
                                    </span>
                                )
                            }
                        </div>
                    )}

                </div>

                {/* Reaction picker */}
                {showReactionPicker === message._id && (
                    <div
                        className="fixed z-50"
                        style={{
                            top: Math.min(reactionPickerPos.top, window.innerHeight - 300),
                            left: Math.min(reactionPickerPos.left, window.innerWidth - 320)
                        }}
                    >
                        <MessageReactionEmojiPicker
                            postId={message._id}
                            onReact={(emoji) => handleReaction(message._id, emoji)}
                            onClose={() => setShowReactionPicker(null)}
                            isOpen={true}
                        />
                    </div>
                )}
            </div>
        );
    };

    // ==================== RENDER ====================

    return (
        <div className="w-full flex h-screen bg-white overflow-hidden">
            <Sidebar />

            {/* ========== Conversation List ========== */}
            <div
                className="w-full md:w-[380px] lg:w-[420px] border-r border-gray-100 flex flex-col bg-white"
            >
                <div
                    className="p-4 border-b border-gray-100"
                >
                    <div
                        className="flex items-center justify-between mb-3"
                    >
                        <h2
                            className="text-xl font-bold text-gray-800"
                        >
                            {showArchiveSection ? 'Archived' : showLockedSection ? 'Locked' : showFavoritesSection ? 'Favorites' : 'Chats'}
                        </h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => {
                                    setShowArchiveSection(false);
                                    setShowLockedSection(false);
                                    selectConversation(null);
                                    setShowFavoritesSection(false);
                                }}
                                className={`p-2 rounded-full transition-colors ${!showArchiveSection&&!showLockedSection&&!showFavoritesSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`}
                                title="All Chats"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowArchiveSection(true);
                                    setShowLockedSection(false);
                                    setShowFavoritesSection(false);
                                }}
                                className={`p-2 rounded-full transition-colors ${showArchiveSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`}
                                title="Archived"
                            >
                                <Archive className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                // Don't show locked section yet - ask for password first
                                setShowUnlockModal(true);
                                }}
                                className={`p-2 rounded-full transition-colors ${showLockedSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`}
                                title="Locked Chats"
                            >
                                <Lock className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowFavoritesSection(true);
                                    setShowArchiveSection(false);
                                    setShowLockedSection(false);
                                }}
                                className={`p-2 rounded-full transition-colors ${showFavoritesSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`}
                                title="Favorites"
                            >
                                <Heart className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowNewGroupModal(true)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="New Group"
                            >
                                <Users className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div
                        className="relative"
                    >
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
                        />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:bg-white transition-all"
                            value={conversationSearchQuery}
                            onChange={(e) => setConversationSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                {!showArchiveSection && !showLockedSection && !showFavoritesSection && (
                    <div className="flex gap-2 px-4 py-2 border-b border-gray-50 overflow-x-auto">
                        <button
                            onClick={() => setQuickFilter('all')}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'all' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setQuickFilter('unread')}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'unread' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            Unread {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button
                            onClick={() => setQuickFilter('favorites')}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'favorites' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            Favorites {favoritesCount > 0 && `(${favoritesCount})`}
                        </button>
                        <button
                            onClick={() => setQuickFilter('groups')}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'groups' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            Groups {groupsCount > 0 && `(${groupsCount})`}
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    {
                        isConversationsLoading ?
                            <div className="p-8 text-center text-gray-400">
                                Loading...
                            </div> :
                            sortedConversations.length === 0 ?
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No conversations
                                </div> :
                                sortedConversations.map((conv) => {
                                    const other = getOtherUser(conv);
                                    const unread = conv.unreadCount instanceof Map ? conv.unreadCount.get(authUser?._id) || 0 : (conv.unreadCount?.[authUser?._id] || 0);
                                    const isPinned = Array.isArray(conv.pinnedBy) && conv.pinnedBy.includes(authUser?._id); const isSelected = selectedConversation?._id === conv._id;
                                    const isMuted = conv.mutedBy?.find(m => m.user === authUser?._id);
                                    return (
                                        <div
                                            key={conv._id}
                                            onClick={() => selectConversation(conv)}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-r-2 border-blue-400' : ''}`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div
                                                    className={`w-12 h-12 rounded-full overflow-hidden ${conv.isGroup ? `bg-gradient-to-br ${getGroupAvatarColor(conv._id)}` : (other?.avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-blue-500')}`}
                                                >
                                                    {
                                                        conv.isGroup ?
                                                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                                                {conv.groupName?.charAt(0) || 'G'}
                                                            </div> :
                                                            <img src={other?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                    }
                                                </div>
                                                {
                                                    isOnline(other?._id) &&
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="flex items-center justify-between"
                                                >
                                                    <h3
                                                        className="font-semibold text-gray-800 truncate text-sm"
                                                    >
                                                        {conv.isGroup ? conv.groupName : other?.displayName || 'Unknown'}
                                                    </h3>
                                                    {conv.lastMessage &&
                                                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                                                            {formatMessageTime(conv.lastMessage.createdAt)}
                                                        </span>
                                                    }
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p
                                                        className="text-xs text-gray-500 truncate">
                                                        {isTyping(other?._id) ?
                                                            <span className="text-blue-400 italic">
                                                                typing...
                                                            </span> :
                                                            isMuted ?
                                                                <span className="flex items-center gap-1">
                                                                    <VolumeX className="w-3 h-3" />
                                                                    {conv.lastMessage?.text || 'No messages'}
                                                                </span> :
                                                                conv.lastMessage?.text || 'No messages'}
                                                    </p>
                                                    <div
                                                        className="flex items-center gap-1 flex-shrink-0 ml-2"
                                                    >
                                                        {isPinned && <Pin className="w-3 h-3 text-blue-400" />}
                                                        {unread > 0 &&
                                                            <span
                                                                className="bg-blue-400 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                                                            >
                                                                {unread > 99 ? '99+' : unread}
                                                            </span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                    })}
                </div>
            </div>

            {/* ========== Chat Area ========== */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                {isChatRestricted ? (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center p-8">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-10 h-10 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Chat Access Restricted</h3>
                            <p className="text-gray-500 text-sm">
                                You have been reported multiple times and cannot access chats at this time.
                            </p>
                        </div>
                    </div>
                ) : selectedConversation ? (<>
                    {/* Header */}
                    <div
                        className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                         onClick={() => {
                             if (selectedConversation?.isGroup) {
                                 setShowGroupInfo(true);
                             } else {
                                 setShowContactInfo(true);
                             }
                         }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className={`w-10 h-10 rounded-full overflow-hidden ${selectedConversation.isGroup ? `bg-gradient-to-br ${getGroupAvatarColor(selectedConversation._id)}` : (getOtherUser(selectedConversation)?.avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-blue-500')}`}
                                >
                                    {selectedConversation.isGroup ?
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                            {selectedConversation.groupName?.charAt(0) || 'G'}
                                        </div> :
                                        <img src={getOtherUser(selectedConversation)?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                    }
                                </div>
                                {isOnline(getOtherUser(selectedConversation)?._id) &&
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                }
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">
                                    {selectedConversation.isGroup ? selectedConversation.groupName : getOtherUser(selectedConversation)?.displayName || 'Unknown'}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {isTyping(getOtherUser(selectedConversation)?._id)
                                        ? 'typing...'
                                        : isOnline(getOtherUser(selectedConversation)?._id)
                                            ? 'online'
                                            : getLastSeen(getOtherUser(selectedConversation)?.lastSeen)
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startCall(false);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <Phone className="w-5 h-5 text-gray-500" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startCall(true);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <Video className="w-5 h-5 text-gray-500" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSearch(!showSearch);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <Search className="w-5 h-5 text-gray-500" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowConversationMenu(selectedConversation._id);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <MoreVertical className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Blocked UI */}
                    {(isBlocked || isBlockedBy) && (
                        <div
                            className={`px-4 py-3 text-center text-sm ${isBlockedBy ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}
                        >
                            {isBlockedBy ? 'You have been blocked by this user' : 'You have blocked this user. Unblock to send messages.'}
                        </div>
                    )}

                    {/* Pinned messages bar */}
                        {pinnedMessages.length > 0 && (
                            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 cursor-pointer">
                                {pinnedMessages.map((msg, idx) => (
                                    <div
                                        key={msg._id}
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                        onClick={() => scrollToMessage(msg._id)}
                                    >
                                        <Pin className="w-4 h-4" />
                                        <span>{msg.text?.substring(0, 30) || 'Media message'}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                    {/* Search */}
                    <AnimatePresence>
                        {
                            showSearch &&
                            (
                                <motion.div
                                    ref={searchRef}
                                    initial={{
                                        height: 0,
                                        opacity: 0
                                    }}
                                    animate={{
                                        height: 'auto',
                                        opacity: 1
                                    }}
                                    exit={{
                                        height: 0,
                                        opacity: 0
                                    }}
                                    className="bg-white border-b border-gray-100 overflow-hidden"
                                >
                                    <div className="p-3 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                            value={searchQuery}
                                            onChange={(e) => handleSearchInput(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                setShowSearch(false);
                                                setSearchResults([]);
                                                setSearchQuery('');
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-full"
                                        >
                                            <X className="w-5 h-5 text-gray-400" />
                                        </button>
                                    </div>
                                    {searchResults.length > 0 &&
                                        <div className="max-h-48 overflow-y-auto px-4 pb-3">
                                            {searchResults.map(msg => (
                                                <div
                                                    key={msg._id}
                                                    className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-600"
                                                    onClick={() => {
                                                        setShowSearch(false);
                                                        setSearchResults([]);
                                                        setSearchQuery('');
                                                        setTimeout(() => scrollToMessage(msg._id), 200);
                                                    }}
                                                >
                                                    {msg.text?.substring(0, 100)}
                                                </div>
                                            ))}
                                        </div>
                                    }
                                </motion.div>
                            )
                        }
                    </AnimatePresence>

                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto py-4 space-y-0.5"
                    >
                        {isMessagesLoading ?
                            <div className="text-center text-gray-400 mt-20">
                                Loading messages...
                            </div> :
                            messages.length === 0 ?
                                <EmptyChatPlaceholder /> :
                                <>
                                    {messages.map((message) =>
                                        <div
                                            key={message._id}
                                            id={`msg-${message._id}`}
                                        >
                                            {renderMessage(message)}
                                        </div>
                                    )}
                                    {isTyping(getOtherUser(selectedConversation)?._id) && <TypingIndicator />}
                                    <div ref={messagesEndRef} />
                                </>
                        }
                    </div>

                    {/* Reply Preview */}
                    <AnimatePresence>
                        {replyingTo && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center gap-3"
                            >
                                {/* Colored bar */}
                                <div className="w-1 h-10 bg-blue-400 rounded-full flex-shrink-0" />

                                {/* Reply info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-blue-400">
                                        {replyingTo.senderId?._id === authUser?._id ? 'You' : replyingTo.senderId?.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {
                                            replyingTo.text?.substring(0, 60) || (
                                                replyingTo.media?.length > 0 ? '📎 Media' : replyingTo.isVoiceMessage ? '🎤 Voice message' : 'Message'
                                            )
                                        }
                                    </p>
                                </div>

                                {/* Cancel reply */}
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full flex-shrink-0"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Video Recording Preview */}
                    <AnimatePresence>
                        {
                            isRecordingVideo && (
                                <motion.div
                                    ref={fileRef}
                                    initial={{
                                        y: 20,
                                        opacity: 0
                                    }}
                                    animate={{
                                        y: 0,
                                        opacity: 1
                                    }}
                                    exit={{
                                        y: 20,
                                        opacity: 0
                                    }}
                                    className="px-4 py-2 bg-black border-t border-gray-700"
                                >
                                    <div
                                        className="flex items-center gap-3"
                                    >
                                        <video
                                            ref={videoPreviewRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-32 h-24 rounded-lg object-cover"
                                        />
                                        <div
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
                                            />
                                            <span className="text-white text-sm">
                                                Recording
                                            </span>
                                        </div>
                                        <div className="flex gap-2 ml-auto">
                                            <button
                                                onClick={takePhoto}
                                                className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-200"
                                            >
                                                <Camera className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={stopVideoRecording}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <StopCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }
                    </AnimatePresence>

                    {/* File Preview */}

                    <AnimatePresence>
                        {
                            selectedFile && !isRecordingVideo && (
                                <motion.div
                                    ref={fileRef}
                                    initial={{
                                        y: 20,
                                        opacity: 0
                                    }}
                                    animate={{
                                        y: 0,
                                        opacity: 1
                                    }}
                                    exit={{
                                        y: 20,
                                        opacity: 0
                                    }}
                                    className="px-4 py-2 bg-white border-t border-gray-100"
                                >
                                    <div
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedFile.type?.startsWith('image/') ?
                                                <img
                                                    src={selectedFile.url}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                /> :
                                                selectedFile.type?.startsWith('video/') ?
                                                    <video
                                                        src={selectedFile.url}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    /> :
                                                    selectedFile.isVoice ?
                                                        <div
                                                            className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
                                                        >
                                                            <Mic className="w-6 h-6 text-blue-400" />
                                                        </div> :
                                                        <div
                                                            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"
                                                        >
                                                            <FileText className="w-6 h-6 text-gray-400" />
                                                        </div>
                                            }
                                            <div>
                                                <p className="text-xs font-medium text-gray-700">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        }
                    </AnimatePresence>

                    {/* Message Input */}
                    {!(isBlocked || isBlockedBy) && (
                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                            {isRecording &&
                                <div className="mb-2">
                                    <RecordingWaveform duration={recordingDuration} />
                                </div>
                            }
                            <div className="flex items-end gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <Paperclip className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <AnimatePresence>
                                        {showAttachmentMenu && (
                                            <motion.div
                                                ref={attachmentRef}
                                                initial={{
                                                    opacity: 0,
                                                    y: 10
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: 10
                                                }}
                                                className="absolute bottom-12 left-0 bg-white rounded-xl shadow-xl border py-1 w-48 z-50"
                                            >
                                                {
                                                    [
                                                        {
                                                            Icon: ImageIcon,
                                                            label: 'Photo/Video',
                                                            action: () => fileInputRef.current?.click()
                                                        },
                                                        {
                                                            Icon: Hexagon,
                                                            label: 'Hexagon Video',
                                                            action: () => {
                                                                startHexagonRecording();
                                                                setShowAttachmentMenu(false);
                                                            }
                                                        },
                                                        {
                                                            Icon: Camera,
                                                            label: 'Take Photo',
                                                            action: () => {
                                                                handleCameraCapture();
                                                                setShowAttachmentMenu(false);
                                                            }
                                                        },
                                                        {
                                                            Icon: FileText,
                                                            label: 'Document',
                                                            action: () => fileInputRef.current?.click()
                                                        },
                                                        {
                                                            Icon: MapPin,
                                                            label: 'Location',
                                                            action: () => {
                                                                if (navigator.geolocation)
                                                                    navigator.geolocation.getCurrentPosition((pos) => setMessageText(prev => prev + `📍 ${pos.coords.latitude}, ${pos.coords.longitude}`), () => toast.error('Location unavailable'));
                                                                setShowAttachmentMenu(false);
                                                            }
                                                        },
                                                        {
                                                            Icon: Contact,
                                                            label: 'Contact',
                                                            action: () => {
                                                                setShowContactList(true);
                                                                setShowAttachmentMenu(false);
                                                            }
                                                        },
                                                        {
                                                            Icon: BarChart3,
                                                            label: 'Poll',
                                                            action: () => {
                                                                setShowPollModal(true);
                                                                setShowAttachmentMenu(false);
                                                            }
                                                        },
                                                        {
                                                            Icon: Calendar,
                                                            label: 'Event',
                                                            action: () => {
                                                                setShowEventModal(true);
                                                                setShowAttachmentMenu(false);
                                                            }
                                                        }
                                                    ].map((item, i) => {
                                                        const IconComponent = item.Icon;
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={item.action}
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                                            >
                                                                <IconComponent className="w-4 h-4" />
                                                                {item.label}
                                                            </button>
                                                        );
                                                    })
                                                }
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={messageInputRef}
                                        value={messageText}
                                        onChange={(e) => {
                                            setMessageText(e.target.value);
                                            const otherId = getOtherUser(selectedConversation)?._id;
                                            if (otherId && e.target.value) startTyping({ toUserId: otherId });
                                            else if (otherId) stopTyping(
                                                { toUserId: otherId }
                                            );
                                            const el = e.target;
                                            el.style.height = 'auto';
                                            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:bg-white transition-all"
                                        rows={1}
                                        style={{
                                            minHeight: '40px',
                                            maxHeight: '120px'
                                        }}
                                    />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <Smile className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <AnimatePresence>
                                        {
                                            showEmojiPicker && (
                                                <motion.div
                                                    ref={emojiPickerRef}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                        scale: 0.95
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                        scale: 1
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: 10,
                                                        scale: 0.95
                                                    }}
                                                    className="absolute bottom-12 right-0 z-50"
                                                >
                                                    <EmojiPicker
                                                        inputRef={messageInputRef}
                                                        value={messageText}
                                                        setValue={setMessageText}
                                                    />
                                                </motion.div>
                                            )
                                        }
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {/* Mic button - always visible when not actively recording */}
                                            {!isRecording && (
                                                <button
                                                    onClick={startRecording}
                                                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-gray-100 rounded-full transition-colors"
                                                    title="Record voice message"
                                                >
                                                    <Mic className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Stop recording button - shows when recording */}
                                            {isRecording && (
                                                <button
                                                    onClick={stopRecording}
                                                    className="p-2.5 bg-red-400 text-white rounded-full hover:bg-red-500 transition-colors animate-pulse"
                                                    title="Stop recording"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Send button - only shows when there's text or file */}
                                            {(messageText.trim() || selectedFile) && (
                                                <button
                                                    onClick={handleSendMessage}
                                                    className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-sm"
                                                    title="Send message"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>) :
                    <NoConversationPlaceholder />
                }
            </div>

            {/* ========== Contact Info Panel ========== */}
            <AnimatePresence>
                {
                    showContactInfo && selectedConversation && !selectedConversation.isGroup && (() => {
                        const user = getOtherUser(selectedConversation);
                        if (!user) return null;
                        return (
                            <motion.div
                                ref={contactInfoRef}
                                initial={{
                                    x: 300,
                                    opacity: 0
                                }}
                                animate={{
                                    x: 0,
                                    opacity: 1
                                }}
                                exit={{
                                    x: 300,
                                    opacity: 0
                                }}
                                className="w-[350px] border-l border-gray-100 bg-white overflow-y-auto flex-shrink-0 z-40"
                            >
                                <div className="p-6">
                                    <div
                                        className="flex items-center justify-between mb-6"
                                    >
                                        <h3 className="font-bold text-lg">
                                            Contact Info
                                        </h3>
                                        <button
                                            onClick={() => setShowContactInfo(false)}
                                            className="p-2 hover:bg-gray-100 rounded-full"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="text-center mb-6">
                                        <div
                                            className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden"
                                        >
                                            {
                                                user?.avatarUrl ?
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    /> :
                                                    <div
                                                        className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold"
                                                    >
                                                        {user?.displayName?.charAt(0) || '?'}
                                                    </div>
                                            }
                                        </div>
                                        <h4
                                            className="font-bold text-lg"
                                        >
                                            {user?.displayName}
                                        </h4>
                                        <p className="text-gray-500 text-sm">
                                            @{user?.username}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {user?.bio || 'No bio'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <button
                                            onClick={handleGoToProfile}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Go to Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleOpenMedia();
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            Media, Links & Docs
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleShareContactAsActualLink(user);
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Share Contact Link
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleOpenStarred();
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <Star className="w-4 h-4" />
                                            Starred Messages
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleOpenGroupsInCommon();
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <Users className="w-4 h-4" />
                                            Groups in Common
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleShareContactOpen(user);
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <Contact className="w-4 h-4" />
                                            Share Contact
                                        </button>
                                        {/* Fix: Use selectedConversation or find the conversation */}
                                        {selectedConversation?.lockedBy?.includes(authUser?._id) ? (
                                            <button
                                                onClick={() => {
                                                    setShowContactInfo(false);
                                                    handleUnlockChat();
                                                }}
                                                className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                            >
                                                <Unlock className="w-4 h-4" />
                                                Unlock Chat
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setShowContactInfo(false);
                                                    handleLockChatOpen();
                                                }}
                                                className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                            >
                                                <Lock className="w-4 h-4" />
                                                Lock Chat
                                            </button>
                                        )}
                                        {/* Fix: Use selectedConversation directly */}
                                        <button
                                            onClick={() => {
                                                handleAddToFavorites();
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        >
                                            <Heart
                                                className={`w-4 h-4 ${selectedConversation?.favoritedBy?.includes(authUser?._id) ? 'fill-red-400 text-red-400' : ''}`}
                                            />
                                            {selectedConversation?.favoritedBy?.includes(authUser?._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleBlockContact();
                                                setShowContactInfo(false);
                                            }}
                                            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm ${isBlocked ? 'hover:bg-green-50 text-green-500' : 'hover:bg-red-50 text-red-500'}`}
                                        >
                                            {isBlocked ?
                                                <>
                                                    <UserCheck className="w-4 h-4" />
                                                    Unblock Contact
                                                </> :
                                                <>
                                                    <UserX className="w-4 h-4" />
                                                    Block Contact
                                                </>
                                            }
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleReportContact();
                                                setShowContactInfo(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-red-50 rounded-xl flex items-center gap-3 text-sm text-red-500"
                                        >
                                            <Flag className="w-4 h-4" />
                                            Report Contact
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()
                }
            </AnimatePresence>

            {/* ========== Context Menu ========== */}
            <AnimatePresence>
                {
                    showMenu && (() => {
                        const message = messages.find(m => m._id === showMenu);
                        if (!message) return null;
                        const isOwn = getIsOwn(message);
                        const isStarred = message.starredBy?.includes(authUser?._id);
                        return (
                            <motion.div
                                ref={menuRef}
                                initial={{
                                    opacity: 0,
                                    scale: 0.95
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95
                                }}
                                className="fixed z-50 bg-white rounded-xl shadow-xl border py-1 w-56"
                                style={{
                                    left: Math.min(menuPosition.x, window.innerWidth - 240),
                                    top: Math.min(menuPosition.y, window.innerHeight - 450)
                                }}
                                onClick={() => setShowMenu(null)}
                            >
                                <button
                                    onClick={() => handleReply(message)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                >
                                    <Reply className="w-4 h-4" />
                                    Reply
                                </button>
                                {isOwn && message.text &&
                                    <button
                                        onClick={() => handleEdit(message)}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                }
                                <button
                                    onClick={() => handleForward(message._id)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                >
                                    <Forward className="w-4 h-4" />
                                    Forward
                                </button>
                                <button
                                    onClick={() => handleStar(message._id)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                >
                                    {isStarred ?
                                        <>
                                            <StarOff className="w-4 h-4" />
                                            Unstar
                                        </> :
                                        <>
                                            <Star className="w-4 h-4" />
                                            Star
                                        </>
                                    }
                                </button>
                                <button
                                    onClick={() => handleCopy(message.text || '')}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </button>
                                <button
                                    onClick={() => handlePinMessage(message._id)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                >
                                    <Pin className="w-4 h-4" />
                                    {message.pinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                    onClick={() => handleReportMessage(message._id)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"
                                >
                                    <Flag className="w-4 h-4" />
                                    Report
                                </button>
                                {isOwn && (
                                    <button onClick={() => setShowDeleteModal(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-500">
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                )}
                            </motion.div>
                        );
                    })()
                }
            </AnimatePresence>

            {/* ========== Conversation Menu ========== */}
            <AnimatePresence>
                {
                    showConversationMenu && (() => {
                        const conv = conversations.find(c => c._id === showConversationMenu);
                        const isPinned = conv?.pinnedBy?.includes(authUser?._id);
                        const isMuted = conv?.mutedBy?.find(m => m.user === authUser?._id);
                        return (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                                onClick={() => setShowConversationMenu(null)}
                            >
                                <motion.div
                                    ref={conversationRef}
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    className="bg-white rounded-xl shadow-xl p-2 w-64"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={handlePinConversation}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <Pin className="w-4 h-4" />
                                        {isPinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button
                                        onClick={handleArchiveConversation}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <Archive className="w-4 h-4" />
                                        {conv?.archivedBy?.includes(authUser?._id) ? 'Unarchive' : 'Archive'}
                                    </button>
                                    <button
                                        onClick={() => handleMuteConversation(isMuted ? null : 8)}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <BellOff className="w-4 h-4" />
                                        {isMuted ? 'Unmute' : 'Mute'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleShareContactOpen(getOtherUser(selectedConversation));
                                            setShowConversationMenu(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <Contact className="w-4 h-4" />
                                        Share Contact
                                    </button>
                                    <button
                                        onClick={handleClearChat}
                                        className="w-full px-4 py-2.5 text-left hover:bg-red-50 rounded-lg flex items-center gap-3 text-sm text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Clear Chat
                                    </button>
                                    <button
                                        onClick={() => setShowConversationMenu(null)}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-400 mt-1 border-t"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </motion.div>
                            </motion.div>
                        );
                    })()
                }
            </AnimatePresence>

            {/* ========== ALL MODALS (Pin, Poll, Event, Share, Media, Starred, Groups, Lock, Unlock, MediaViewer, Forward, NewGroup, ContactList, Calls) ========== */}

            {/* Pin Duration Modal */}
            <AnimatePresence>
                {
                    showPinDurationModal && (
                        <motion.div
                            ref={pinDurationRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowPinDurationModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-80 shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">
                                    Pin Message
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    How long?
                                </p>
                                <div className="space-y-2">
                                    {
                                        [
                                            { label: '24 hours', value: 24 },
                                            { label: '7 days', value: 168 },
                                            { label: '30 days', value: 720 },
                                            { label: 'Unpin', value: null, danger: true }
                                        ].map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePinDurationSelect(opt.value)}
                                                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${opt.danger ? 'text-red-500 hover:bg-red-50' : 'hover:bg-gray-50 text-gray-600'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))
                                    }
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Poll Modal */}
            <AnimatePresence>
                {
                    showPollModal && (
                        <motion.div
                            ref={pollRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowPollModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">
                                    Create Poll
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Question"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                />
                                {pollOptions.map((opt, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        placeholder={`Option ${i + 1}`}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-2"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...pollOptions]; newOpts[i] = e.target.value; setPollOptions(newOpts);
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={() => setPollOptions([...pollOptions, ''])}
                                    className="text-blue-400 text-sm mb-4 hover:text-blue-500"
                                >
                                    + Add Option
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreatePoll}
                                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
                                    >
                                        Create Poll
                                    </button>
                                    <button
                                        onClick={() => setShowPollModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Event Modal */}
            <AnimatePresence>
                {
                    showEventModal && (
                        <motion.div
                            ref={eventRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowEventModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">
                                    Create Event
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Event name"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                />
                                <input
                                    type="date"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                                <input
                                    type="time"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Location (optional)"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-4"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreateEvent}
                                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
                                    >
                                        Create Event
                                    </button>
                                    <button
                                        onClick={() => setShowEventModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Share Contact Modal */}
            <AnimatePresence>
                {
                    showShareContactModal && contactToShare && (
                        <motion.div
                            ref={shareContactRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowShareContactModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-3">
                                    Share Contact
                                </h3>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        {contactToShare.avatarUrl ?
                                            <img
                                                src={contactToShare.avatarUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            /> :
                                            <div
                                                className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold"
                                            >
                                                {contactToShare.displayName?.charAt(0)}
                                            </div>
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {contactToShare.displayName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            @{contactToShare.username}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Select conversations to share this contact with:
                                </p>
                                <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                                    {conversations.map(conv => {
                                        const other = getOtherUser(conv);
                                        const targetId = conv.isGroup ? conv._id : other?._id;
                                        // Do not allow sharing to the contact's own conversation
                                        if (!targetId || targetId === contactToShare?._id) return null;
                                        return (
                                            <div
                                                key={conv._id}
                                                onClick={() => setShareTargets(
                                                    prev => prev.includes(targetId) ?
                                                        prev.filter(id => id !== targetId) :
                                                        [
                                                            ...prev,
                                                            targetId
                                                        ]
                                                )}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${shareTargets.includes(targetId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    {conv.isGroup ?
                                                        <div
                                                            className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs"
                                                        >
                                                            {conv.groupName?.charAt(0) || 'G'}
                                                        </div> :
                                                        <img
                                                            src={other?.avatarUrl || '/avatar.png'}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    }
                                                </div>
                                                <span className="text-sm">
                                                    {conv.isGroup ? conv.groupName : other?.displayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleShareContactConfirm}
                                        disabled={shareTargets.length === 0}
                                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400"
                                    >
                                        Share ({shareTargets.length})
                                    </button>
                                    <button
                                        onClick={() => setShowShareContactModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Media Modal */}
            <AnimatePresence>
                {
                    showMediaModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowMediaModal(false)}
                        >
                            <motion.div
                                ref={mediaRef}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Media, Links & Docs
                                    </h3>
                                    <button
                                        onClick={() => setShowMediaModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {mediaItems.length === 0 ?
                                    <p className="text-center text-gray-400 py-8">
                                        No media shared yet
                                    </p> : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {mediaItems.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
                                                    onClick={() => {
                                                        setShowMediaModal(false);
                                                        setShowMediaViewer(item);
                                                    }}
                                                >
                                                    {item.mime?.startsWith('image/') ?
                                                        <img
                                                            src={item.url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        /> :
                                                        item.mime?.startsWith('video/') ?
                                                            <video
                                                                src={item.url}
                                                                className="w-full h-full object-cover"
                                                            /> :
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <FileText className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                    }</div>
                                            ))}
                                        </div>
                                    )
                                }
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Starred Messages Modal */}
            <AnimatePresence>
                {
                    showStarredModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowStarredModal(false)}
                        >
                            <motion.div
                                ref={starredRef}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Starred Messages
                                    </h3>
                                    <button
                                        onClick={() => setShowStarredModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {starredMessages.length === 0 ?
                                    <p className="text-center text-gray-400 py-8">
                                        No starred messages
                                    </p> :
                                    starredMessages.map(msg => (
                                        <div
                                            key={msg._id}
                                            className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                            onClick={() => {
                                                setShowStarredModal(false);
                                                setTimeout(() => scrollToMessage(msg._id), 300);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                <span className="text-xs text-gray-400">
                                                    {formatMessageTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {msg.text?.substring(0, 100)}
                                            </p>
                                        </div>
                                    ))
                                }
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Groups in Common Modal */}
            <AnimatePresence>
                {
                    showGroupsInCommonModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowGroupsInCommonModal(false)}
                        >
                            <motion.div
                                ref={groupsRef}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-[400px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Groups in Common
                                    </h3>
                                    <button
                                        onClick={() => setShowGroupsInCommonModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {groupsInCommon.length === 0 ?
                                    <p className="text-center text-gray-400 py-8">
                                        No groups in common
                                    </p> :
                                    groupsInCommon.map(group => (
                                        <div
                                            key={group._id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                            onClick={() => {
                                                selectConversation(group);
                                                setShowGroupsInCommonModal(false);
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold"
                                            >
                                                {group.groupName?.charAt(0) || 'G'}
                                            </div>
                                            <span className="text-sm font-medium">
                                                {group.groupName}
                                            </span>
                                        </div>
                                    ))
                                }
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Lock Chat Modal */}
            <AnimatePresence>
                {
                    showLockChatModal && (
                        <motion.div
                            ref={lockRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowLockChatModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-80 shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Lock Chat
                                    </h3>
                                    <button
                                        onClick={() => setShowLockChatModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Enter your login password to lock this chat.
                                </p>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-4"
                                    value={lockPassword}
                                    onChange={(e) => setLockPassword(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLockChatConfirm}
                                        className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500"
                                    >
                                        Lock Chat
                                    </button>
                                    <button
                                        onClick={() => setShowLockChatModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Unlock Modal */}
            <AnimatePresence>
                {
                    showUnlockModal && (
                        <motion.div
                            ref={unlockRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowUnlockModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-80 shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Unlock Chats
                                    </h3>
                                    <button
                                        onClick={() => setShowUnlockModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Enter your login password to access locked chats.
                                </p>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-4"
                                    value={unlockPassword}
                                    onChange={(e) => setUnlockPassword(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUnlockChat}
                                        className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500"
                                    >
                                        Unlock
                                    </button>
                                    <button
                                        onClick={() => setShowUnlockModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Media Viewer Modal */}
            <AnimatePresence>
                {
                    showMediaViewer && (
                        <motion.div
                            ref={mediaViewerRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                            onClick={() => setShowMediaViewer(null)}
                        >
                            <button
                                onClick={() => setShowMediaViewer(null)}
                                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            {showMediaViewer.mime?.startsWith('image/') ?
                                <img
                                    src={showMediaViewer.url}
                                    alt=""
                                    className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain"
                                    onClick={e => e.stopPropagation()}
                                /> :
                                showMediaViewer.mime?.startsWith('video/') ?
                                    <video
                                        src={showMediaViewer.url}
                                        controls
                                        className="max-w-[90vw] max-h-[90vh] rounded-xl"
                                        onClick={e => e.stopPropagation()}
                                    /> :
                                    <div
                                        className="bg-white rounded-xl p-8 text-center"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-lg font-medium">
                                            {showMediaViewer.filename || 'File'}
                                        </p>
                                        <a
                                            href={showMediaViewer.url}
                                            download className="text-blue-400 hover:text-blue-500 mt-2 inline-block"
                                        >
                                            <Download className="w-5 h-5 inline mr-1" />
                                            Download
                                        </a>
                                    </div>
                            }
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Forward Modal */}
            <AnimatePresence>
                {
                    showForwardModal && (
                        <motion.div
                            ref={forwardMessageRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowForwardModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-3">
                                    Forward Message
                                </h3>
                                <div
                                    className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-500"
                                >
                                    {messageToForward?.text?.substring(0, 100) || 'Media message'}
                                </div>
                                <div
                                    className="space-y-1 mb-4"
                                >
                                    {conversations.map(conv => {
                                        const other = getOtherUser(conv);
                                        const targetId = conv.isGroup ? conv._id : other?._id;
                                        if (!targetId) return null;
                                        return (
                                            <div
                                                key={conv._id}
                                                onClick={() => setForwardTargets(prev =>
                                                    prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId]
                                                )}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${forwardTargets.includes(targetId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 overflow-hidden flex items-center justify-center text-white font-bold"
                                                >
                                                    {
                                                        conv.isGroup ? (conv.groupName?.[0] || 'G') :
                                                            <img
                                                                src={other?.avatarUrl || '/avatar.png'}
                                                                alt="" className="w-full h-full object-cover"
                                                            />
                                                    }
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {conv.isGroup ? conv.groupName : other?.displayName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={handleForwardSubmit}
                                    disabled={forwardTargets.length === 0}
                                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400"
                                >
                                    Forward ({forwardTargets.length})
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* New Group Modal */}
            <AnimatePresence>
                {
                    showNewGroupModal && (
                        <motion.div
                            ref={newGroupRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowNewGroupModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">
                                    New Group
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Group name"
                                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    autoFocus
                                />
                                <div
                                    className="max-h-48 overflow-y-auto mb-4"
                                >
                                    {
                                        contacts.map(user => (
                                            <div
                                                key={user._id}
                                                onClick={() => setSelectedParticipants(
                                                    prev => prev.includes(user._id) ?
                                                        prev.filter(id => id !== user._id) :
                                                        [
                                                            ...prev,
                                                            user._id
                                                        ]
                                                )}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${selectedParticipants.includes(user._id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    <img
                                                        src={user.avatarUrl || '/avatar.png'}
                                                        alt="" className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-sm">
                                                    {user.displayName}
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreateGroup}
                                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
                                    >
                                        Create ({selectedParticipants.length})
                                    </button>
                                    <button
                                        onClick={() => setShowNewGroupModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Contact List Modal */}
            <AnimatePresence>
                {
                    showContactList && (
                        <motion.div
                            ref={contactListRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={async () => {
                                if (activeCall) {
                                    // Invite to ongoing call
                                    socket?.emit('webrtc:call:initiate', {
                                        targets: [user._id],
                                        isVideo: isVideoMode,
                                        metadata: {
                                            callerName: authUser?.displayName,
                                            callId: activeCall.callId
                                        }
                                    });
                                    toast.success(`Invited ${user.displayName} to call`);
                                } else {
                                    const conv = await getConversation(user._id);
                                    if (conv) selectConversation(conv);
                                }
                                setShowContactList(false);
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">
                                    New Chat
                                </h3>
                                {
                                    contacts.length === 0 ?
                                        <p className="text-center text-gray-400 py-8">
                                            No contacts yet
                                        </p> :
                                        contacts.map(user => (
                                            <div
                                                key={user._id}
                                                onClick={
                                                async () => {
                                                    const conv = await getConversation(user._id);
                                                    if (conv) selectConversation(conv);
                                                    setShowContactList(false);
                                                }}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden"
                                                >
                                                    <img
                                                        src={user.avatarUrl || '/avatar.png'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {user.displayName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                }
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Incoming Call */}
            <AnimatePresence>
                {
                    incomingCall && (
                        <motion.div
                            ref={callRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{
                                    scale: 0.9,
                                    y: 20
                                }}
                                animate={{
                                    scale: 1,
                                    y: 0
                                }}
                                className="bg-white rounded-2xl p-8 w-80 text-center shadow-2xl"
                            >
                                <div
                                    className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    {
                                        incomingCall.isVideo ?
                                            <Video className="w-10 h-10 text-blue-400" /> :
                                            <Phone className="w-10 h-10 text-blue-400" />
                                    }
                                </div>
                                <h3 className="text-xl font-bold mb-1">
                                    Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {incomingCall.callerName} is calling...
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={rejectCall}
                                        className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                        <PhoneOff className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={acceptCall}
                                        className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg"
                                    >
                                        <Phone className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Active Call */}
            <AnimatePresence>
                {
                    activeCall && (
                        <motion.div
                            ref={activeCallRef}
                            initial={{
                                opacity: 0,
                                scale: 0.9
                            }}
                            animate={
                            isCallMinimized ?
                                {
                                    opacity: 1,
                                    scale: 1,
                                    width: 300,
                                    height: 200,
                                    bottom: 20,
                                    right: 20,
                                    position: 'fixed'
                                } :
                                {
                                    opacity: 1,
                                    scale: 1,
                                    width: '100%',
                                    height: '100%',
                                    inset: 0,
                                    position: 'fixed'
                                }
                            }
                            className="z-50 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="relative w-full h-full">
                                {isVideoMode && remoteStreams.size > 0 ? (
                                    remoteStreams.size === 1 ? (
                                        // Single user - full screen
                                        Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                                            <video
                                                key={userId}
                                                ref={(el) => {
                                                    if (el) {
                                                        remoteVideoRefs.current.set(userId, el);
                                                        el.srcObject = stream;
                                                    }
                                                }}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        ))
                                    ) : (
                                        // Multiple users - grid layout
                                        <div className={`w-full h-full p-4 grid gap-2 ${
                                            remoteStreams.size === 2 ? 'grid-cols-2' :
                                                remoteStreams.size <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                                        }`}>
                                            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                                                <div key={userId} className="relative rounded-xl overflow-hidden bg-gray-800">
                                                    <video
                                                        ref={(el) => {
                                                            if (el) {
                                                                remoteVideoRefs.current.set(userId, el);
                                                                el.srcObject = stream;
                                                            }
                                                        }}
                                                        autoPlay
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                                                        {userId === authUser?._id ? 'You' : 'Participant'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    // No video - audio call UI
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                        <div className="w-24 h-24 bg-blue-400 rounded-full flex items-center justify-center mb-4">
                                            <Phone className="w-12 h-12 text-white" />
                                        </div>
                                        <p className="text-white text-lg font-medium">{getOtherUser(selectedConversation)?.displayName || 'Call'}</p>
                                        <p className="text-gray-400 text-sm">{isVideoMode ? 'Video call' : 'Audio call'}</p>
                                        <div className="mt-6 w-64">
                                            <AudioWaveform isActive={true} isMuted={isMicMuted} />
                                            <p className="text-white text-sm mt-2">{formatCallDuration(callDuration)}</p>
                                        </div>
                                    </div>
                                )}
                                {
                                    isVideoMode && localStream && (
                                        <div
                                            className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg"
                                        >
                                            <video
                                                ref={(el) => {
                                                    localVideoRef.current = el;
                                                    if (el && localStream) el.srcObject = localStream;
                                                }}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )
                                }
                                <div
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-6 py-3"
                                >
                                    <button
                                        onClick={toggleMute}
                                        className={`p-3 rounded-full transition-colors ${isMicMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                    >
                                        {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={toggleVideo}
                                        className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                                    >
                                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={toggleVideo}
                                        disabled={!isVideoMode}
                                        className={`p-3 rounded-full transition-colors ${!isVideoMode ? 'opacity-30 pointer-events-none' : ''} ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                    >
                                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                    </button>
                                    {
                                        isVideoMode &&
                                        <button
                                            onClick={flipCamera}
                                            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
                                        >
                                            <RotateCw className="w-5 h-5" />
                                        </button>
                                    }
                                    <button
                                        onClick={shareScreen}
                                        className={`p-3 rounded-full transition-colors ${isSharingScreen ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                    >
                                        <MonitorUp className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowAddToCallModal(true)}
                                        className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                                        title="Add participant"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={endCall}
                                        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
                                    >
                                        <PhoneOff className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={toggleCallMinimize}
                                    className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/60"
                                >
                                    {
                                        isCallMinimized ?
                                            <Maximize2 className="w-5 h-5" /> :
                                            <Minimize2 className="w-5 h-5" />
                                    }
                                </button>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onTimeUpdate={(e) => {
                    const a = e.currentTarget;
                    if (a.duration) setAudioProgress((a.currentTime / a.duration) * 100);
                }}
                onEnded={() => {
                    setIsPlayingAudio(null);
                    setAudioProgress(0);
                }}
                className="hidden"
            />

            <style>{`
                @keyframes wave {
                    0% { height: 8px; }
                    100% { height: 36px; }
                }
                .hexagon-sent {
                    filter: drop-shadow(0 0 0 3px #10b981) drop-shadow(0 1px 2px rgba(0,0,0,0.1));
                }
                .hexagon-received {
                    filter: drop-shadow(0 0 0 3px #e5e7eb) drop-shadow(0 1px 2px rgba(0,0,0,0.1));
                }
                .voice-bubble-container {
                    min-width: 270px !important;
                    max-width: 270px !important;
                    width: 270px !important;
                    flex-shrink: 0 !important;
                    flex-grow: 0 !important;
                }
            `}</style>

            {/* Group Info Modal */}
            <GroupInfoModal
                isOpen={showGroupInfo}
                onClose={() => setShowGroupInfo(false)}
                conversationId={selectedConversation?._id}
            />

            {/* Video Recording Modal */}
            <AnimatePresence>
                {showVideoRecordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-50 flex flex-col"
                    >
                        <div className="flex-1 relative">
                            <video
                                ref={(el) => {
                                    if (el) {
                                        videoPreviewRef.current = el;
                                        if (videoStream) el.srcObject = videoStream;
                                    }
                                }}
                                autoPlay muted playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                            <button
                                onClick={() => {
                                    if (videoStream) {
                                        videoStream.getTracks().forEach(t => t.stop());
                                        setVideoStream(null);
                                    }
                                    setShowVideoRecordModal(false);
                                }}
                                className="p-4 bg-white/20 rounded-full text-white hover:bg-white/40"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <button
                                onClick={takePhoto}
                                className="p-6 bg-white rounded-full hover:bg-gray-200 shadow-xl"
                            >
                                <Camera className="w-8 h-8 text-gray-800" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add to Call Modal */}
            <AnimatePresence>
                {
                    showAddToCallModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
                            onClick={() => setShowAddToCallModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 max-h-[70vh] overflow-y-auto shadow-xl z-[61]"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">
                                    Add to Call
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {contacts.map(user => (
                                        <div key={user._id}
                                            onClick={() => {
                                                socket?.emit('webrtc:call:initiate', {
                                                    targets: [user._id],
                                                    isVideo: isVideoMode,
                                                    metadata: {
                                                        callerName: authUser?.displayName,
                                                        callId: activeCall?.callId
                                                    }
                                                });
                                                toast.success(`Invited ${user.displayName}`);
                                                setShowAddToCallModal(false);
                                            }}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                <img
                                                    src={user.avatarUrl || '/avatar.png'}
                                                    alt="" className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-sm font-medium">{user.displayName}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowAddToCallModal(false)}
                                        className="w-full mt-4 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Hexagon Video Recording Modal */}
            <AnimatePresence>
                {showHexagonRecordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
                    >
                        {/* Outer hexagon - border */}
                        <div
                            className="w-[336px] h-[336px] md:w-[336px] md:h-[336px] flex items-center justify-center bg-emerald-500"
                            style={{
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                            }}
                        >
                            {/* Inner hexagon - video */}
                            <div
                                className="w-[324px] h-[324px] relative"
                                style={{
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }}
                            >
                                <video
                                    ref={hexagonVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Recording info and controls below hexagon */}
                        <div className="flex flex-col items-center gap-3 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-white text-lg font-medium">Recording Hexagon</span>
                            </div>
                            <button
                                onClick={stopHexagonRecording}
                                className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg"
                            >
                                <StopCircle className="w-5 h-5" />
                                <span>Stop Recording</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Message Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowDeleteModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 w-80 shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">Delete Message</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Choose how you want to delete this message.
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        handleDeleteForMe(showDeleteModal);
                                        setShowDeleteModal(null);
                                    }}
                                    className="w-full py-2.5 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete for me
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteForEveryone(showDeleteModal);
                                        setShowDeleteModal(null);
                                    }}
                                    className="w-full py-2.5 rounded-xl font-medium hover:bg-red-50 flex items-center justify-center gap-2 text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete for everyone
                                </button>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="mt-2 w-full py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showPollVoters && (() => {
                    const msg = messages.find(m => m._id === showPollVoters);
                    if (!msg || !msg.poll) return null;
                    return (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => { setShowPollVoters(null); setPollVoterDetails({}); }}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Poll Voters</h3>
                                    <button onClick={() => { setShowPollVoters(null); setPollVoterDetails({}); }}
                                            className="p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {loadingPollVoters ? (
                                    <p className="text-center text-gray-400 py-4">Loading...</p>
                                ) : (
                                    msg.poll.options.map((opt, idx) => {
                                        const voters = Object.entries(msg.poll.votes || {})
                                            .filter(([, option]) => option === idx)
                                            .map(([uid]) => uid);
                                        return (
                                            <div key={idx} className="mb-3">
                                                <p className="font-semibold text-sm mb-1">{opt}</p>
                                                {voters.length === 0 ? (
                                                    <p className="text-xs text-gray-400 ml-2">No votes</p>
                                                ) : (
                                                    <ul className="text-xs text-gray-600 ml-2 space-y-0.5">
                                                        {voters.map(uid => (
                                                            <li key={uid} className="flex items-center gap-2">
                                                                <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                                    {/* tiny avatar if available – optional */}
                                                                </div>
                                                                {pollVoterDetails[uid] || uid}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <button
                                    onClick={() => { setShowPollVoters(null); setPollVoterDetails({}); }}
                                    className="mt-4 w-full py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};

export default ChatPage;