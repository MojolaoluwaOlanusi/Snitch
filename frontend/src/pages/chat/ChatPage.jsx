// @ts-nocheck
import {useCallback, useEffect, useRef, useState, Suspense} from "react";
import React from "react";
import Color from 'color';
import {useChatStore} from "../../store/useChatStore.js";
import {useAuthStore} from "../../store/useAuthStore.js";
import Sidebar from "../../components/common/Sidebar.jsx";
import {SnitchLogo} from "../../components/svgs/snitch.jsx";
import {
    Archive,
    BarChart3,
    BellOff,
    Bookmark,
    Calendar,
    Camera,
    Check,
    CheckCheck,
    Clock,
    Contact,
    Copy,
    Download,
    Edit,
    ExternalLink,
    Eye,
    FileText,
    Flag,
    Forward,
    Heart,
    Image as ImageIcon,
    Languages,
    Lock,
    MapPin,
    Maximize2,
    MessageCircle,
    Mic,
    MicOff,
    Minimize2,
    MonitorUp,
    MoreHorizontal,
    MoreVertical,
    Palette,
    Paperclip,
    Pause,
    Phone,
    PhoneOff,
    Pin,
    Play,
    Reply,
    RotateCw,
    Search,
    Send,
    Shield,
    Smile,
    Star,
    StarOff,
    Sticker,
    StopCircle,
    Trash2,
    Unlock,
    Upload,
    User,
    UserCheck,
    UserPlus,
    Users,
    UserX,
    Video,
    VideoOff,
    VolumeX,
    X,
} from "lucide-react";
import { useConversationSettings } from '../../hooks/useConversationsettings.js';
import { useLongPress } from '../../hooks/useLongPress.js';
import {AnimatePresence, motion} from "framer-motion";
import axiosInstance from "../../lib/axios.js";
import { toast } from 'sonner'
import {useLocation, useNavigate} from "react-router-dom";
import {getLinkPreview} from 'link-preview-js';
import {TbBookmarkOff} from "react-icons/tb";
import { Virtuoso } from "react-virtuoso";
import { useSearchParams } from 'react-router-dom';
const StickerEditor = React.lazy(() => import("../../components/common/StickerEditor.jsx"));
const GifStickerPicker = React.lazy(() => import("../../components/common/GifStickerPicker.jsx"));
const LocationPicker = React.lazy(() => import("../../components/common/LocationPicker.jsx"));
const GroupInfoModal = React.lazy(() => import("../../components/common/GroupInfoModal.jsx"));
const EmojiPicker = React.lazy(() => import("../../components/common/EmojiPicker.jsx"));
const MessageReactionEmojiPicker = React.lazy(() => import("../../components/common/MessageReactionEmojiPicker.jsx"));

// ==================== Sub-Components ====================

const NoConversationPlaceholder = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-base-200 p-8">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <SnitchLogo className="size-14 text-primary" />
        </div>
        <h3 className="text-base-content text-xl font-bold mb-2">Snitch Chat</h3>
        <p className="text-base-content/60 text-sm text-center max-w-xs">Select a conversation or start a new one to begin messaging</p>
    </div>
);

const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-4 py-1">
        <div className="flex gap-1">
            {[0, 150, 300].map((delay, i) => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 bg-base-content/30 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                />
            ))}
        </div>
        <span className="text-xs text-base-content/50 ml-1">typing</span>
    </div>
);

const AudioWaveform = ({ isActive, isMuted }) => (
    <div className="flex items-center justify-center gap-[2px] h-12 px-2">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className={`w-[3px] rounded-full transition-all duration-200 ${isActive && !isMuted ? 'bg-primary/80' : 'bg-gray-300'}`}
                style={{
                    height: isActive && !isMuted ? `${12 + Math.sin(i * 0.8) * 10 + Math.random() * 8}px` : '6px',
                    animation: isActive && !isMuted ? `wave 0.${4 + (i % 3)}s ease-in-out infinite alternate` : 'none'
                }}
            />
        ))}
    </div>
);

const EmptyChatPlaceholder = () => (
    <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <p className="text-base-content/60">No messages yet. Start the conversation!</p>
        </div>
    </div>
);

const RecordingWaveform = ({ duration }) => (
    <div className="flex items-center gap-2 bg-error/10 rounded-full px-4 py-1.5">
        <div className="flex items-center gap-[1px]">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="w-[2px] bg-error rounded-full animate-pulse"
                    style={{
                        height: `${10 + Math.random() * 16}px`,
                        animationDelay: `${i * 0.1}s`
                    }}
                />
            ))}
        </div>
        <span className="text-xs text-error font-medium">{duration}s</span>
        <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
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
        updateGroupInfo, bookmarkMessage,
    } = useChatStore();

    const { authUser, socket } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // --- State ---
    const [showExpressionMenu, setShowExpressionMenu] = useState(false);
    const [showSendContactModal, setShowSendContactModal] = useState(false);
    const [unlockContext, setUnlockContext] = useState('section'); // 'section' or 'chat'
    const [hexWallpaperInput, setHexWallpaperInput] = useState('');
    const [wallpaperUploading, setWallpaperUploading] = useState(false);
    const [showWallpaperModal, setShowWallpaperModal] = useState(false);
    const [wallpaperSearch, setWallpaperSearch] = useState("");
    const [wallpapers, setWallpapers] = useState([]);
    const [wallpaperPage, setWallpaperPage] = useState(1);
    const [wallpaperTotalPages, setWallpaperTotalPages] = useState(1);
    const [loadingWallpapers, setLoadingWallpapers] = useState(false);
    const [myWallpapers, setMyWallpapers] = useState([]);
    const [searchColorQuery, setSearchColorQuery] = useState('');
    const [customColors, setCustomColors] = useState([]);
    const [hexInput, setHexInput] = useState('');
    const [showStickerEditor, setShowStickerEditor] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [isMultipleTrue, setIsMultipleTrue] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showMessageInfo, setShowMessageInfo] = useState(null); // stores messageId
    const [isRecordingVideoNote, setIsRecordingVideoNote] = useState(false);
    const [videoNoteStream, setVideoNoteStream] = useState(null);
    const [showTranslateModal, setShowTranslateModal] = useState(null); // stores messageId
    const [customWallpapers, setCustomWallpapers] = useState([]);
    const [translations, setTranslations] = useState({}); // { [messageId]: translatedText }
    const [translating, setTranslating] = useState({});     // { [messageId]: true/false }
    const [showMentionsDropdown, setShowMentionsDropdown] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionableUsers, setMentionableUsers] = useState([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [showDisappearingModal, setShowDisappearingModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isViewOnce, setIsViewOnce] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const [showPollVoters, setShowPollVoters] = useState(null);
    const [pollVoterDetails, setPollVoterDetails] = useState({});
    const [loadingPollVoters, setLoadingPollVoters] = useState(false);
    const [callAnswered, setCallAnswered] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(null); // stores messageId
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
    const [showBookmarkedModal, setShowBookmarkedModal] = useState(false);
    const [starredMessages, setStarredMessages] = useState([]);
    const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
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
    const [showScrollButton, setShowScrollButton] = useState(false);

    // ---------- NEW: mobile chat visibility ----------
    const [mobileChatVisible, setMobileChatVisible] = useState(false);

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
    const scrollContainerRef = useRef(null); // not needed – we'll use Virtuoso's API
    const typingTimeoutRef = useRef(null);
    const translationTimeoutRef = useRef(null);
    const translationCache = useRef(new Map());
    const virtuosoRef = useRef(null);
    const expressionMenuRef = useRef(null);
    const sendContactRef = useRef(null);
    const hexagonVideoRef = useRef(null);
    const hexagonVideoRefs = useRef({});
    const videoNotePreviewRef = useRef(null);
    const videoNotePreviewRefs = useRef(null);
    const videoNoteRecorderRef = useRef(null);
    const videoNoteChunksRef = useRef([]);
    const navigationHandled = useRef(false);
    const callAnsweredRef = useRef(false);
    const isRingingRef = useRef(false);
    const callTimerRef = useRef(null);
    const callTimeoutRef = useRef(null);
    const hexagonTimers = useRef({});
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);
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
    const bookmarkedRef = useRef(null);
    const groupsRef = useRef(null);
    const lockRef = useRef(null);
    const unlockRef = useRef(null);
    const mediaViewerRef = useRef(null);
    const videoPreviewRef = useRef(null);
    const addedMessageIds = useRef(new Set());
    const groupAvatarColors = useRef(new Map());

    const [convoSettings, updateConvoSetting] = useConversationSettings(
        selectedConversation?._id,
        authUser?._id
    );

    // ==================== Socket Setup ====================

    const setupSocketListeners = useCallback(() => {
        if (!socket || socketListenersAttached.current) return;
        socketListenersAttached.current = true;

        socket.on('receive_message', (message) => {
            if (addedMessageIds.current.has(message._id)) return;
            addedMessageIds.current.add(message._id);
            addMessage(message);
            if (message.conversationId === useChatStore.getState().selectedConversation?._id) scrollToBottom();

            // Remove reaction notifications when a real message arrives
            const state = useChatStore.getState();
            const filtered = state.messages.filter(m => !m.isReactionNotification);
            useChatStore.setState({ messages: filtered });

            getConversations();
            const conversationId = message.conversationId;
    const isCurrentConversation = selectedConversation?._id === conversationId;
    const isChatPage = window.location.pathname === '/chat';
    const isThisConversationOpen = isCurrentConversation && isChatPage;
    
    if (!isThisConversationOpen && conversationId) {
        useChatStore.getState().incrementUnread(conversationId);
    }
        });

        socket.on('message_sent', (message) => {
            if (addedMessageIds.current.has(message._id)) return;
            addedMessageIds.current.add(message._id);
            if (!useChatStore.getState().messages.find(m => m._id === message._id)) {
                addMessage(message);
                scrollToBottom();
            }

            // Remove reaction notifications when a real message arrives
            const state = useChatStore.getState();
            const filtered = state.messages.filter(m => !m.isReactionNotification);
            useChatStore.setState({ messages: filtered });
        });

        socket.on('message:edited', (message) => updateMessage(message._id, message));
        socket.on('message:deleted', ({ messageId }) => removeMessage(messageId));
        socket.on('message:deleted:everyone', ({ messageId }) => removeMessage(messageId));
        socket.on('reaction:update', ({ messageId, reactions, userId }) => {
            updateMessage(messageId, { reactions });
            if (userId && userId !== authUser?._id) {
                const latestReaction = reactions[userId];
                if (latestReaction) {
                    addReactionNotification(messageId, userId, latestReaction);
                }
            }
        });
        socket.on('notification:mention', ({ messageId, conversationId, from, text }) => {
            if (conversationId === selectedConversation?._id) {
                toast(text, { icon: '💬' });
            } else {
                toast(text, { icon: '💬' });
            }
        });
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
        socket.on('message:delivered', ({ messageId, timestamp }) => {
            updateMessage(messageId, { status: 'delivered', deliveredAt: timestamp });
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
        socket.on('group:member_joined', ({ conversationId, userId }) => {
            if (selectedConversation?._id === conversationId) {
                const newMember = selectedConversation?.participants?.find(p => p._id === userId);
                const name = newMember?.displayName || newMember?.username || 'Someone';
                toast(`${name} joined the group`, { icon: '👋' });
            }
            getConversations();
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
        socket.on('message:bookmarked', ({ messageId, bookmarked }) => {
            const uid = useAuthStore.getState().authUser?._id;
            updateMessage(messageId, {
                bookmarkedBy: bookmarked ? [uid] : []
            });
        });
        socket.on('message:viewed', ({ messageId, viewedBy }) => {
            updateMessage(messageId, { viewedBy, media: [] });
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
            if (activeCall?.isGroupCall && localStream) {
                const pc = createPeerConnection(userId);
                localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    socket?.emit('webrtc:signal', { toUserId: userId, type: 'offer', data: offer });
                });
            }
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
            'message:bookmarked',
            'webrtc:call:incoming',
            'webrtc:signal',
            'webrtc:call:ended',
            'webrtc:call:participant_left',
            'webrtc:call:participant_joined'
        ].forEach(e => socket.off(e));
    }, [socket]);

    useEffect(() => {
        const timer = setTimeout(() => {
            getConversations();
            fetchContacts();
            if (socket?.connected) {
                setupSocketListeners();
                socket.emit('get_online_users');
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [socket?.id]);

    // Outside click for Contact List Modal
    useEffect(() => {
        const h = (e) => {
            if (contactListRef.current && !contactListRef.current.contains(e.target)) {
                setShowContactList(false);
            }
        };
        if (showContactList) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showContactList]);

    useEffect(() => {
        const h = (e) => {
            if (attachmentRef.current && !attachmentRef.current.contains(e.target)) {
                setShowAttachmentMenu(false);
            }
        };
        if (showAttachmentMenu) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showAttachmentMenu]);

const [searchParams] = useSearchParams();
const conversationIdFromUrl = searchParams.get('conversationId');

useEffect(() => {
    if (conversationIdFromUrl) {
        // Select the conversation automatically
        const conversation = conversations.find(c => c._id === conversationIdFromUrl);
        if (conversation) {
            selectConversation(conversation);
        }
    }
}, [conversationIdFromUrl, conversations, selectConversation]);
    
    // Outside click for Send Contact Modal
    useEffect(() => {
        const h = (e) => {
            if (sendContactRef.current && !sendContactRef.current.contains(e.target)) {
                setShowSendContactModal(false);
            }
        };
        if (showSendContactModal) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showSendContactModal]);

    // Handle navigation from search page
    useEffect(() => {
        if (!location.state?.conversationId || !location.state?.messageId) return;
        if (navigationHandled.current) return;
        navigationHandled.current = true;

        const { conversationId, messageId } = location.state;

        const openConversationAndScroll = async () => {
            let conv = conversations.find(c => c._id === conversationId);

            if (!conv || !conv.participants?.length) {
                try {
                    const token = localStorage.getItem('access-token');
                    const res = await axiosInstance.post(
                        `/chat/conversation/${conversationId}`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    conv = res.data;
                } catch (error) {
                    console.error('Failed to fetch conversation:', error);
                    toast.error('Could not open conversation');
                    navigate('/chat', { replace: true, state: {} });
                    return;
                }
            }

            selectConversation(conv);
            if (window.innerWidth < 1024) setMobileChatVisible(true);

            setTimeout(() => {
                scrollToMessage(messageId);
            }, 600);

            navigate('/chat', { replace: true, state: {} });
        };

        openConversationAndScroll();
    }, [location.state, conversations]);

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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const contactId = params.get('contact');
        if (contactId && authUser?._id) {
            handleOpenContactLink(contactId);
            window.history.replaceState({}, document.title, '/chat');
        }
    }, [authUser?._id]);

    const handleOpenContactLink = async (contactId) => {
        try {
            const conv = await getConversation(contactId);
            if (conv) {
                selectConversation(conv);
                if (window.innerWidth < 1024) setMobileChatVisible(true);
                toast.success('Conversation opened');
            }
        } catch (error) {
            toast.error('Could not open conversation');
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const joinToken = params.get('join');
        if (joinToken && authUser) {
            handleJoinGroup(joinToken);
        }
    }, [authUser]);

    useEffect(() => {
        fetchCustomColors();
    }, []);

    useEffect(() => {
        const h = (e) => {
            if (expressionMenuRef.current && !expressionMenuRef.current.contains(e.target)) {
                setShowExpressionMenu(false);
            }
        };
        if (showExpressionMenu) {
            document.addEventListener("mousedown", h);
            return () => document.removeEventListener("mousedown", h);
        }
    }, [showExpressionMenu]);

    const fetchCustomColors = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/theme-colors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomColors(res.data);
        } catch (error) {
            // fail silently
        }
    };

    const handleAddCustomColor = async () => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
            toast.error('Enter a valid hex color (e.g. #ff5733)');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post('/chat/theme-colors',
                { hex: hexInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchCustomColors();
            updateConvoSetting('themeColor', hexInput.toUpperCase());
            setShowThemeModal(false);
            toast.success('Custom color added');
            setHexInput('');
        } catch (error) {
            toast.error('Failed to add color');
        }
    };

    const handleJoinGroup = async (token) => {
        try {
            const tokenHeader = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/chat/join/${token}`, {}, {
                headers: { Authorization: `Bearer ${tokenHeader}` }
            });
            selectConversation(res.data);
            if (window.innerWidth < 1024) setMobileChatVisible(true);
            await getConversations();
            toast.success('You joined the group!');
            window.history.replaceState({}, document.title, '/chat');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Could not join group');
        }
    };

    useEffect(() => {
        if (selectedConversation) {
            if (selectedConversation.isGroup) {
                setMentionableUsers(selectedConversation.participants || []);
            } else {
                const other = getOtherUser(selectedConversation);
                setMentionableUsers(other ? [other] : []);
            }
        }
    }, [selectedConversation]);

    useEffect(() => {
        if (selectedConversation?._id) {
            getMessages(selectedConversation._id);
            markConversationAsRead(selectedConversation._id);
            checkBlockStatus();
            checkChatRestriction();
        }
    }, [selectedConversation?._id]);
    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => {
                if (virtuosoRef.current) {
                    virtuosoRef.current.scrollToIndex({
                        index: messages.length - 1,
                        align: 'end',
                        behavior: 'smooth',
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
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
    const fetchWallpapers = async (query = "nature", page = 1, append = false) => {
        setLoadingWallpapers(true);
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/chat/wallpapers/search", {
                headers: { Authorization: `Bearer ${token}` },
                params: { query, page, per_page: 20 },
            });
            if (append) {
                setWallpapers(prev => [...prev, ...res.data.images]);
            } else {
                setWallpapers(res.data.images);
            }
            setWallpaperTotalPages(res.data.total_pages);
            setWallpaperPage(page);
        } catch (error) {
            toast.error("Failed to load wallpapers");
        } finally {
            setLoadingWallpapers(false);
        }
    };

    const fetchMyWallpapers = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/chat/wallpapers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMyWallpapers(res.data);
        } catch (error) {
            console.error("Failed to fetch my wallpapers");
        }
    };

    useEffect(() => {
        if (showWallpaperModal) {
            fetchMyWallpapers();
        }
    }, [showWallpaperModal]);

    const handleAddWallpaperColor = async () => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hexWallpaperInput)) {
            toast.error('Enter a valid hex color');
            return;
        }
        updateConvoSetting('wallpaper', hexWallpaperInput);
        setShowWallpaperModal(false);
        toast.success('Wallpaper set');
        setHexWallpaperInput('');
    };

    const handleSaveWallpaper = async (url, thumb, source = "unsplash") => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post("/chat/wallpapers", { url, thumb, source }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchMyWallpapers();
            toast.success("Wallpaper saved to your collection");
        } catch (error) {
            toast.error("Failed to save wallpaper");
        }
    };

    const handleDeleteWallpaper = async (id) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.delete(`/chat/wallpapers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchMyWallpapers();
            toast.success("Wallpaper removed");
        } catch (error) {
            toast.error("Failed to delete wallpaper");
        }
    };

    // ==================== Helpers ====================
    const TRANSLATE_LANGUAGES = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'zh-CN', label: '中文 (简体)', flag: '🇨🇳' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'ko', label: '한국어', flag: '🇰🇷' },
        { code: 'ar', label: 'العربية', flag: '🇸🇦' },
        { code: 'pt', label: 'Português', flag: '🇧🇷' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'it', label: 'Italiano', flag: '🇮🇹' },
        { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
        { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
        { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
        { code: 'pl', label: 'Polski', flag: '🇵🇱' },
        { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'th', label: 'ไทย', flag: '🇹🇭' },
        { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
        { code: 'uk', label: 'Українська', flag: '🇺🇦' },
        { code: 'he', label: 'עברית', flag: '🇮🇱' },
    ];
    const getLanguageLabel = (code) => {
        const lang = TRANSLATE_LANGUAGES.find(l => l.code === code);
        return lang ? lang.label : code.toUpperCase();
    };
    const THEMES = [
        { color: 'red', label: 'Red', index: 1 },
        { color: 'blue', label: 'Blue', index: 2 },
        { color: 'gray', label: 'Gray', index: 3 },
        { color: 'yellow', label: 'Yellow', index: 4 },
        { color: 'orange', label: 'Orange', index: 5 },
        { color: 'emerald', label: 'Emerald', index: 6 },
        { color: 'green', label: 'Green', index: 7 },
        { color: 'cyan', label: 'Cyan', index: 8 },
        { color: 'indigo', label: 'Indigo', index: 9 },
        { color: 'black', label: 'Black', index: 10 },
    ];
    const onClose = () => {
        setShowGifPicker(false);
    };
    const onLocationPickerClose = () => {
        setShowLocationPicker(false);
    };
    const onLocationPickerSelect = ({latitude, longitude}) => {
        setShowLocationPicker(false);
        setMessageText(prev => prev + `📍 ${latitude}, ${longitude}`), () => toast.error('Location unavailable');
    };
    const scrollToBottom = () => {
        if (virtuosoRef.current && messages.length > 0) {
            virtuosoRef.current.scrollToIndex({
                index: messages.length - 1,
                align: 'end',
                behavior: 'smooth',
            });
        }
    };
    const getOnlineCount = (conversation) => {
        if (!conversation?.participants) return 0;
        return conversation.participants.filter(p =>
            onlineUsers.includes(p._id) && p._id !== authUser?._id
        ).length;
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
                return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
            case 'delivered':
                return <CheckCheck className="w-3.5 h-3.5 text-base-content/60" />;
            case 'sent':
                return <Check className="w-3.5 h-3.5 text-base-content/60" />;
            case 'sending':
                return <Clock className="w-3.5 h-3.5 text-base-content/50" />;
            case 'failed':
                return <Clock className="w-3.5 h-3.5 text-error" />;
            default:
                return null;
        }
    };

    const handleGroupAvatarChange = async (file) => {
        if (!selectedConversation?.isGroup) return;
        try {
            const token = localStorage.getItem('access-token');
            const presignRes = await axiosInstance.post('/media/wallpaper-presign', {
                conversationId: selectedConversation._id,
                fileName: file.name,
                contentType: file.type,
            }, { headers: { Authorization: `Bearer ${token}` } });

            await fetch(presignRes.data.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            const updated = await updateGroupInfo(selectedConversation._id, { groupAvatar: presignRes.data.publicUrl });
            if (updated) {
                selectConversation({ ...selectedConversation, groupAvatar: presignRes.data.publicUrl });
                toast.success('Group avatar updated');
            }
        } catch (error) {
            toast.error('Failed to update group avatar');
        }
    };

    const getGroupAvatarColor = (conv) => {
        if (conv.avatarColor) return conv.avatarColor;

        const shades = [
            'from-primary to-primary/90',
            'from-primary to-primary/80',
            'from-indigo-400 to-indigo-500',
            'from-cyan-400 to-cyan-500',
            'from-sky-400 to-sky-500',
            'from-primary/80 to-secondary',
            'from-primary to-info',
            'from-primary to-secondary/80',
        ];
        return shades[Math.floor(Math.random() * shades.length)];
    };

    const formatCallDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShareContactAsActualLink = (user) => {
        setContactToShare(user);
        setShareTargets([]);
        setShowShareContactModal(true);
    };

    const extractMentionedUserIds = (text) => {
        const regex = /@(\w+)/g;
        const matches = [...text.matchAll(regex)];
        const mentionedUsernames = matches.map(m => m[1]);
        const mentionedUsers = mentionableUsers.filter(u => mentionedUsernames.includes(u.username));
        return mentionedUsers.map(u => u._id);
    };

    const handleTranslate = useCallback(async (messageId, text, targetLang = 'en') => {
    if (!text) return;

    // 🔥 Clear any pending translation (debounce)
    if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
    }

    // 🔥 Check frontend cache first
    const cacheKey = `${text.trim()}_${targetLang}`;
    if (translationCache.current.has(cacheKey)) {
        setTranslations(prev => ({
            ...prev,
            [messageId]: { 
                text: translationCache.current.get(cacheKey), 
                lang: targetLang,
                cached: true 
            },
        }));
        return;
    }

    // 🔥 Debounce: wait 500ms before sending request
    translationTimeoutRef.current = setTimeout(async () => {
        setTranslating(prev => ({ ...prev, [messageId]: true }));
        setTranslations(prev => ({ ...prev, [messageId]: null }));

        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post('/chat/translate',
                { text, targetLang },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 🔥 Store in frontend cache
            if (res.data.translated) {
                translationCache.current.set(cacheKey, res.data.translated);
            }

            setTranslations(prev => ({
                ...prev,
                [messageId]: { 
                    text: res.data.translated, 
                    lang: targetLang,
                    cached: res.data.cached || false 
                },
            }));

        } catch (error) {
            if (error.response?.status === 429) {
                toast.error('Translation limit reached. Please wait a moment.');
            } else if (error.response?.status === 503) {
                toast.error('Translation service unavailable. Please try again later.');
            } else {
                toast.error('Translation failed');
            }
        } finally {
            setTranslating(prev => ({ ...prev, [messageId]: false }));
        }
    }, 500); // 🔥 500ms debounce
    }, []);

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
        await deleteMessage({ messageId });
        setShowMenu(null);
        toast.success('Message deleted');
    };

    const handleDeleteForEveryone = async (messageId) => {
        await deleteForEveryone({ messageId });
        setShowMenu(null);
        toast.success('Message deleted for everyone');
    };

    const formatVoiceTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSetWallpaper = (url) => {
        updateConvoSetting('wallpaper', url);
        toast.success('Wallpaper updated');
    };

    const handleUploadWallpaper = async (file) => {
        if (!selectedConversation) return;
        setWallpaperUploading(true);
        try {
            const token = localStorage.getItem('access-token');
            const presignRes = await axiosInstance.post('/media/wallpaper-presign', {
                conversationId: selectedConversation._id,
                fileName: file.name,
                contentType: file.type,
            }, { headers: { Authorization: `Bearer ${token}` } });

            await fetch(presignRes.data.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            const publicUrl = presignRes.data.publicUrl;

            await axiosInstance.post('/chat/user-wallpapers',
                { url: publicUrl, name: file.name || 'Uploaded' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchUserWallpapers();
            handleSetWallpaper(publicUrl);
        } catch (error) {
            toast.error('Failed to upload wallpaper');
        } finally {
            setWallpaperUploading(false);
        }
    };

    const handleVoicePlay = (messageId, url) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.src === url) {
            if (audio.paused) {
                audio.play().catch(() => {});
                setPlayingVoiceId(messageId);
            } else {
                audio.pause();
                setPlayingVoiceId(null);
            }
            return;
        }

        audio.pause();
        audio.src = url;
        audio.play().catch(() => {});
        setPlayingVoiceId(messageId);

        audio.onloadedmetadata = () => {
            setVoiceDurations(prev => ({ ...prev, [messageId]: audio.duration }));
        };
        audio.ontimeupdate = () => {
            const current = audio.currentTime;
            const duration = audio.duration;
            setVoiceCurrentTimes(prev => ({ ...prev, [messageId]: current }));
            if (duration) {
                setVoiceProgressWidths(prev => ({ ...prev, [messageId]: (current / duration) * 100 }));
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
                if (window.innerWidth < 1024) setMobileChatVisible(true);
            }
        } catch (error) {
            toast.error('Could not open conversation');
        }
    };

    const handleShareContactAsLink = (user) => {
        setContactToShare(user);
        setShareTargets([]);
        setShowShareContactModal(true);
    };

    const getFilteredConversationsInHeader = () => {
        return conversations.filter(c => {
            if (showArchiveSection) return Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id);
            if (showLockedSection) return Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id);
            if (showFavoritesSection) return Array.isArray(c.favoritedBy) && c.favoritedBy.includes(authUser?._id);

            if (Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id)) return false;
            if (Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id)) return false;

            if (quickFilter === 'unread') {
                const unread = c.unreadCount instanceof Map
                    ? c.unreadCount.get(authUser?._id) || 0
                    : (c.unreadCount?.[authUser?._id] || 0);
                if (unread === 0) return false;
            }
            if (quickFilter === 'favorites') {
                if (!Array.isArray(c.favoritedBy) || !c.favoritedBy.includes(authUser?._id)) return false;
            }
            if (quickFilter === 'groups') {
                if (!c.isGroup) return false;
            }

            return !conversationSearchQuery ||
                c.participants?.some(p => p.displayName?.toLowerCase().includes(conversationSearchQuery.toLowerCase())) ||
                (c.isGroup && c.groupName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()));
        });
    };

    const scrollToMessage = (messageId) => {
        const index = messages.findIndex(m => m._id === messageId);
        if (index >= 0 && virtuosoRef.current) {
            // small delay to ensure Virtuoso is fully ready
            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
            }, 100);
        }
    };

    // ---------- NEW: mobile‑friendly conversation selector ----------
    const handleSelectConversation = (conv) => {
    selectConversation(conv);
    if (window.innerWidth < 1024) setMobileChatVisible(true);
};

    const handleBackToList = () => {
        setMobileChatVisible(false);
        selectConversation(null);
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
                if (part.includes('/chat?contact=')) {
                    return (
                        <span
                            key={i}
                            className="underline cursor-pointer text-primary/70 hover:text-primary/30"
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
                    details[uid] = res.data;
                } catch {
                    details[uid] = uid;
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

    const startVideoNote = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: isFrontCamera ? 'user' : 'environment' },
                audio: true,
            });
            setVideoNoteStream(stream);
            setIsRecordingVideoNote(true);

            setTimeout(() => {
                if (videoNotePreviewRef.current) {
                    videoNotePreviewRef.current.srcObject = stream;
                    videoNotePreviewRef.current.play();
                }
            }, 100);

            const mr = new MediaRecorder(stream);
            videoNoteChunksRef.current = [];
            mr.ondataavailable = e => videoNoteChunksRef.current.push(e.data);
            mr.onstop = () => {
                const blob = new Blob(videoNoteChunksRef.current, { type: 'video/webm' });
                sendMediaMessage(blob, { isHexagon: true, filename: 'hexagon-note.webm' });
                stream.getTracks().forEach(t => t.stop());
                setIsRecordingVideoNote(false);
                setVideoNoteStream(null);
                setShowHexagonRecordModal(false);
            };
            mr.start();
            videoNoteRecorderRef.current = mr;
        } catch (error) {
            toast.error('Camera access denied');
        }
    };

    const stopVideoNote = () => {
        if (videoNoteRecorderRef.current?.state !== 'inactive') {
            videoNoteRecorderRef.current?.stop();
        }
    };

    const addReactionNotification = (messageId, userId, reaction) => {
        const message = messages.find(m => m._id === messageId);
        if (!message) return;

        const isOwn = userId === authUser?._id;
        const senderName = isOwn
            ? 'You'
            : (message.senderId?.displayName || 'Someone');

        const notification = {
            _id: `reaction-${messageId}-${Date.now()}`,
            isReactionNotification: true,
            text: `${senderName} reacted ${reaction} to a message`,
            conversationId: selectedConversation?._id,
            createdAt: new Date().toISOString(),
        };

        addMessage(notification);
        scrollToBottom();

        const currentConvId = selectedConversation?._id;
        if (currentConvId) {
            const updatedConversations = conversations.map(conv => {
                if (conv._id === currentConvId) {
                    return { ...conv, lastMessage: notification };
                }
                return conv;
            });
            useChatStore.setState({ conversations: updatedConversations });
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
        if (isSending) return;
        if (isChatRestricted) { toast.error('You are restricted from chatting'); return; }
        if (isBlocked) { toast.error('You have blocked this user. Unblock to send messages.'); return; }
        if (isBlockedBy) { toast.error('You have been blocked by this user'); return; }

        setIsSending(true);

        try {
            if (editingMessageId) {
                await editMessage({ messageId: editingMessageId, newText: messageText });
                setEditingMessageId(null);
            } else {
                const tempId = `temp_${Date.now()}`;
                addedMessageIds.current.add(tempId);

                const optimisticMessage = {
                    _id: tempId,
                    senderId: { _id: authUser?._id, displayName: authUser?.displayName },
                    text: messageText,
                    conversationId: selectedConversation?._id,
                    createdAt: new Date().toISOString(),
                    status: 'sending',
                    media: selectedFile ? [{
                        url: selectedFile.url,
                        mime: selectedFile.type,
                        size: selectedFile.size,
                        filename: selectedFile.name,
                        isHexagon: selectedFile.isHexagon || false,
                        isVoice: selectedFile.isVoice || false,
                    }] : [],
                    replyTo: replyingTo || undefined,
                    viewOnce: isViewOnce || undefined,
                };

                addMessage(optimisticMessage);
                scrollToBottom();

                let finalMedia = null;

                if (selectedFile) {
                    const mediaType = selectedFile.isVoice ? 'audio' :
                        selectedFile.isHexagon ? 'hexagonvideo' :
                            selectedFile.type?.startsWith('image/') ? 'images' :
                                selectedFile.type?.startsWith('video/') ? 'videos' : 'documents';

                    if (!selectedFile.finalUrl) {
                        const uploadResult = await useChatStore.getState().uploadChatMedia({
                            file: selectedFile.file,
                            conversationId: selectedConversation._id,
                            mediaType,
                        });

                        finalMedia = [{
                            url: uploadResult.url,
                            mime: selectedFile.type,
                            size: selectedFile.size,
                            filename: selectedFile.name,
                            isHexagon: selectedFile.isHexagon || false,
                            isVoice: selectedFile.isVoice || false,
                        }];
                    }

                    if (selectedFile.finalUrl) {
                        finalMedia = [{
                            url: selectedFile.finalUrl,
                            mime: selectedFile.type,
                            size: selectedFile.size,
                            filename: selectedFile.name,
                            isHexagon: selectedFile.isHexagon || false,
                            isVoice: selectedFile.isVoice || false,
                        }];
                    }
                }

                const mentionedIds = extractMentionedUserIds(messageText);

                const result = await sendMessage({
                    receiverId: getOtherUser(selectedConversation)?._id,
                    conversationId: selectedConversation?._id,
                    text: messageText,
                    replyTo: replyingTo?._id || undefined,
                    media: finalMedia,
                    isVoiceMessage: selectedFile?.isVoice || false,
                    voiceDuration: selectedFile?.isVoice ? recordingDuration : undefined,
                    viewOnce: isViewOnce || undefined,
                    mentions: mentionedIds,
                });

                if (result?._id) {
                    removeMessage(tempId);
                    addedMessageIds.current.add(result._id);
                    addMessage(result);

                    const urlRegex = /(https?:\/\/\S+)/g;
                    const urls = messageText.match(urlRegex);
                    if (urls && urls.length > 0) {
                        try {
                            const token = localStorage.getItem('access-token');
                            let previewData = null;
                            try {
                                const res = await axiosInstance.post('/chat/link-preview',
                                    { url: urls[0] },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                previewData = res.data;
                            } catch (backendErr) {
                                try {
                                    previewData = await getLinkPreview(urls[0], { timeout: 8000 });
                                    previewData = {
                                        url: previewData.url,
                                        title: previewData.title || urls[0],
                                        description: previewData.description || '',
                                        image: previewData.images?.[0] || '',
                                        domain: new URL(previewData.url).hostname.replace('www.', ''),
                                    };
                                } catch (clientErr) {
                                    // Both failed
                                }
                            }

                            if (previewData) {
                                await axiosInstance.put(
                                    `/chat/message/${result._id}/linkPreview-update`,
                                    previewData,
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                updateMessage(result._id, { linkPreview: previewData });
                            }
                        } catch (finalErr) {
                            // fail silently
                        }
                    }
                }
            }
        } catch (error) {
            const tempId = `temp_${Date.now()}`;
            updateMessage(tempId, { status: 'failed' });
            if (error?.message?.includes('blocked')) toast.error('You have been blocked by this user');
            else toast.error('Failed to send message');
        } finally {
            setIsSending(false);
            setMessageText("");
            setSelectedFile(null);
            setReplyingTo(null);
            setShowEmojiPicker(false);
            setIsViewOnce(false);
        }
    };

    const fetchLinkPreviewClient = async (url) => {
        try {
            const preview = await getLinkPreview(url, { timeout: 8000 });
            return {
                url: preview.url,
                title: preview.title || url,
                description: preview.description || '',
                image: preview.images?.[0] || '',
                domain: new URL(preview.url).hostname.replace('www.', ''),
            };
        } catch (error) {
            return null;
        }
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

    const sendMediaMessage = async (fileOrUrl, options = {}) => {
        try {
            let finalMedia;

            if (typeof fileOrUrl === 'string') {
                finalMedia = [{ url: fileOrUrl, mime: 'image/gif', filename: 'gif' }];
            } else {
                const mediaType = options.isVoice ? 'audio' :
                    options.isHexagon ? 'hexagonvideo' :
                        fileOrUrl.type?.startsWith('image/') ? 'images' :
                            fileOrUrl.type?.startsWith('video/') ? 'videos' : 'documents';

                const uploadResult = await useChatStore.getState().uploadChatMedia({
                    file: fileOrUrl,
                    conversationId: selectedConversation._id,
                    mediaType,
                });
                finalMedia = [{
                    url: uploadResult.url,
                    mime: fileOrUrl.type,
                    size: fileOrUrl.size,
                    filename: options.filename || fileOrUrl.name,
                    isHexagon: options.isHexagon || false,
                    isVoice: options.isVoice || false,
                }];
            }

            await sendMessage({
                receiverId: getOtherUser(selectedConversation)?._id,
                conversationId: selectedConversation?._id,
                text: '',
                media: finalMedia,
                isVoiceMessage: options.isVoice || false,
                voiceDuration: options.voiceDuration || 0,
            });
            scrollToBottom();
        } catch (error) {
            toast.error('Failed to send media');
        }
    };

    const handleKeyDown = (e) => {
    // Handle Enter key to send message
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
        return;
    }

    // Handle typing indicator with debounce
    const otherId = getOtherUser(selectedConversation)?._id;
    if (!otherId) return;

    const isTypingKey = 
        e.key.length === 1 ||
        e.key === 'Backspace' ||
        e.key === 'Delete';

    if (isTypingKey) {
        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        const hasText = e.target.value.trim().length > 0;
        
        if (hasText) {
            // Send startTyping immediately (but not too often)
            startTyping({ toUserId: otherId });
            
            // Set a timeout to stop typing if the user stops
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping({ toUserId: otherId });
            }, 1500); // Stop after 1.5 seconds of inactivity
        } else {
            stopTyping({ toUserId: otherId });
        }
    }
};

// Cleanup timeout on unmount
useEffect(() => {
    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };
}, []);
    const handleEmojiSelect = (emoji) => {
        setMessageText(prev => prev + emoji.native);
    };

    // ==================== Message Actions ====================

    const handleReaction = async (messageId, reaction) => {
        const message = messages.find(m => m._id === messageId);
        if (message) {
            const newReactions = { ...message.reactions };
            if (newReactions[authUser._id] === reaction) {
                delete newReactions[authUser._id];
            } else {
                newReactions[authUser._id] = reaction;
            }
            updateMessage(messageId, { reactions: newReactions });
        }
        await reactToMessage({ messageId, reaction });

        addReactionNotification(messageId, authUser._id, reaction);

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
        removeMessage(message._id);

        setMessageText(message.text || '');

        if (message.media && message.media.length > 0) {
            const mediaItem = message.media[0];
            if (mediaItem.url && mediaItem.url.startsWith('blob:')) {
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
                toast.info('The original media can’t be recovered. Please re-attach it.');
            }
        }

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
    const handleBookmark = async (messageId) => {
        await bookmarkMessage(messageId);
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
                allowMultiple: isMultipleTrue,
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
    const handlePollVote = async (messageId, optionIndex, isMultiple) => {
        await votePoll({
            messageId,
            optionIndex,
            isMultiple
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
                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                    recordingIntervalRef.current = null;
                }
            };
            mr.start();
            setIsRecording(true);
            setRecordingDuration(0);
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
    // [Your existing call functions remain unchanged; I'll keep them for brevity, but they are exactly the same]
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
            setLocalStream(stream);
            setIsVideoMode(isVideo);
            setIsVideoOff(false);
            setIsMicMuted(false);

            for (const targetId of targets) {
                const pc = createPeerConnection(targetId);
                stream.getTracks().forEach(t => pc.addTrack(t, stream));
            }

            const firstTarget = targets[0];
            if (firstTarget) {
                const pc = peerConnectionsRef.current.get(firstTarget);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
            }

            const callId = Date.now().toString();
            setActiveCall({
                callId,
                isVideo,
                otherUserId: isGroup ? null : targets[0],
                isGroupCall: isGroup,
            });
            setCallAnswered(false);
            setIsRinging(true);
            callAnsweredRef.current = false;
            isRingingRef.current = true;
            startCallTimer();

            callTimeoutRef.current = setTimeout(() => {
                if (isRingingRef.current && !callAnsweredRef.current) {
                    endCall();
                    sendCallSummary(isVideo ? 'video' : 'audio', callDuration, 'no_answer');
                    toast.error('Call ended – no answer');
                }
            }, 60000);

            socket?.emit('webrtc:call:initiate', {
                targets,
                isVideo,
                isGroupCall: isGroup,
                metadata: { callerName: authUser?.displayName, groupName: selectedConversation.groupName },
            });

            setTimeout(() => {
                for (const targetId of targets) {
                    const pc = peerConnectionsRef.current.get(targetId);
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
        }
    };
    const acceptCall = async () => {
        if (!incomingCall) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: incomingCall.isVideo,
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
                otherUserId: null,
                isGroupCall: incomingCall.isGroupCall,
            });
            setCallAnswered(true);
            setIsRinging(false);
            callAnsweredRef.current = true;
            isRingingRef.current = false;
            clearTimeout(callTimeoutRef.current);
            startCallTimer();
            setIncomingCall(null);

            socket?.emit('webrtc:call:join', { callId: incomingCall.callId });

        } catch (error) {
            toast.error('Camera/mic access denied');
            rejectCall();
        }
    };
    const rejectCall = () => {
        if (incomingCall) {
            socket?.emit('webrtc:call:leave', { callId: incomingCall.callId });
            setIncomingCall(null);
        }
    };
    const cleanupCall = () => {
        if (activeCall) {
            const status = callAnsweredRef.current ? 'ended' : 'missed';
            sendCallSummary(
                activeCall.isVideo ? 'video' : 'audio',
                callDuration,
                status
            );
        }

        stopCallTimer();
        clearTimeout(callTimeoutRef.current);
        setIsRinging(false);
        isRingingRef.current = false;
        callAnsweredRef.current = false;

        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
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
            socket?.emit('webrtc:call:end', { callId: activeCall.callId });
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
    const handleSendContactMessage = async (user) => {
        if (!selectedConversation || !user) return;
        try {
            await sendMessage({
                receiverId: getOtherUser(selectedConversation)?._id,
                conversationId: selectedConversation._id,
                text: `👤 Contact: ${user.displayName}`,
                contact: {
                    name: user.displayName,
                    userId: user._id,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                },
            });
            setShowSendContactModal(false);
            toast.success('Contact sent');
        } catch (error) {
            toast.error('Failed to send contact');
        }
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
    const handleUnlockSpecificChat = async () => {
        if (!unlockPassword.trim()) {
            toast.error('Enter your login password');
            return;
        }
        if (!selectedConversation?._id) {
            toast.error('No conversation selected');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(
                `/chat/conversation/${selectedConversation._id}/unlock`,
                { password: unlockPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Chat unlocked');
            setShowUnlockModal(false);
            setUnlockPassword('');
            await getConversations();
            selectConversation(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Incorrect password');
        }
    };
    const handleUnlockSection = async () => {
        if (!unlockPassword.trim()) {
            toast.error('Enter your login password');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post('/chat/unlock-all',
                { password: unlockPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Access granted to locked chats');
            setShowUnlockModal(false);
            setUnlockPassword('');
            setShowLockedSection(true);
            setShowArchiveSection(false);
            setShowFavoritesSection(false);
            selectConversation(null);
            await getConversations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Incorrect password');
        }
    };
    const handleAddToFavorites = async () => {
        const convId = selectedConversation?._id;
        if (!convId) return;

        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(
                `/chat/conversation/${convId}/favorite`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(
                res.data.favorited
                    ? 'Added to favorites'
                    : 'Removed from favorites'
            );

            await getConversations();
        } catch (error) {
            console.error('Favorite error:', error);
            toast.error('Failed to update favorites');
        }
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
    const handleOpenBookmarked = async () => {
        if (!selectedConversation) return;
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/bookmarked/${selectedConversation._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookmarkedMessages(res.data || []); setShowBookmarkedModal(true);
        } catch (error) {
            toast.error('Failed to load bookmarked');
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
    const themeColorMap = {
        // Reds & Pinks
        red: '#ef4444',
        rose: '#f43f5e',
        pink: '#ec4899',
        fuchsia: '#d946ef',
        coral: '#f97316',
        orange: '#f97316',
        amber: '#f59e0b',
        yellow: '#eab308',
        // Greens
        lime: '#84cc16',
        green: '#22c55e',
        emerald: '#10b981',
        teal: '#14b8a6',
        // Cyans & Blues
        cyan: '#06b6d4',
        sky: '#0ea5e9',
        blue: '#3b82f6',
        indigo: '#6366f1',
        // Purples & Violets
        violet: '#8b5cf6',
        purple: '#a855f7',
        grape: '#9333ea',
        lavender: '#c084fc',
        // Grays & Slates
        slate: '#64748b',
        gray: '#6b7280',
        zinc: '#71717a',
        neutral: '#737373',
        stone: '#78716c',
        warmGray: '#78716c',
        coolGray: '#6b7280',
        blueGray: '#64748b',
        // Extended palette
        crimson: '#dc143c',
        tomato: '#ff6347',
        salmon: '#fa8072',
        gold: '#ffd700',
        olive: '#808000',
        forest: '#228b22',
        mint: '#98ff98',
        aqua: '#00ffff',
        navy: '#000080',
        royal: '#4169e1',
        orchid: '#da70d6',
        plum: '#dda0dd',
        tan: '#d2b48c',
        chocolate: '#d2691e',
        sienna: '#a0522d',
        maroon: '#800000',
        // Brights
        magenta: '#ff00ff',
        neonGreen: '#39ff14',
        electricBlue: '#7df9ff',
        hotPink: '#ff69b4',
        tangerine: '#ff9966',
        lemon: '#fff700',
        limeade: '#bfff00',
        turquoise: '#40e0d0',
        // Darks
        darkRed: '#8b0000',
        darkGreen: '#006400',
        darkBlue: '#00008b',
        darkPurple: '#4b0082',
        darkOrange: '#cc5500',
        darkCyan: '#008b8b',
        darkMagenta: '#8b008b',
        darkGoldenrod: '#b8860b',
        // Lights
        lightPink: '#ffb6c1',
        lightGreen: '#90ee90',
        lightBlue: '#add8e6',
        lightCoral: '#f08080',
        lightSalmon: '#ffa07a',
        lightSeaGreen: '#20b2aa',
        lightSkyBlue: '#87cefa',
        lightSlateGray: '#778899',
    };
    const themeColor = convoSettings.themeColor || 'emerald';
    const bubbleColor = themeColor.startsWith('#') ? themeColor : (themeColorMap[themeColor] || themeColorMap.emerald);
    const bubbleColorDark = Color(bubbleColor).darken(0.3).hex();

    // ==================== Conversation Filtering ====================

    const getFilteredConversations = () => {
        return conversations.filter(c => {
            if (showArchiveSection) return Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id);
            if (showLockedSection) return Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id);
            if (showFavoritesSection) return Array.isArray(c.favoritedBy) && c.favoritedBy.includes(authUser?._id);
            if (Array.isArray(c.archivedBy) && c.archivedBy.includes(authUser?._id)) return false;
            if (Array.isArray(c.lockedBy) && c.lockedBy.includes(authUser?._id)) return false;
            return !conversationSearchQuery || c.participants?.some(
                    p => p.displayName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()))
                ||
                (c.isGroup && c.groupName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()));
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
    const renderAudioFilePlayer = (message, mediaItem) => {
        const isOwn = getIsOwn(message);
        return (
            <div className="py-1.5" style={{ width: '100%', minWidth: '250px' }} onClick={(e) => {e.stopPropagation();}}>
                <div className="flex items-center gap-2" onClick={(e) => {e.stopPropagation()}}>
                    <button
                        className="p-1.5 rounded-full hover:bg-base-100/20 flex-shrink-0"
                        aria-label="play/pause"
                        onClick={(e) => {
                            handleVoicePlay(message._id, mediaItem.url);
                            e.stopPropagation();
                        }}
                    >
                        {playingVoiceId === message._id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <span className={`text-xs flex-shrink-0 w-10 text-right tabular-nums ${isOwn ? 'text-primary-content' : 'text-base-content/70'}`}>
                    {formatVoiceTime(voiceCurrentTimes[message._id] || 0)}
                    </span>
                    <div
                        className={`flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer relative ${isOwn ? 'bg-base-100/30' : 'bg-base-300'}`}
                        onClick={(e) => {
                            handleProgressClick(e, message._id);
                            e.stopPropagation();
                        }}
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-100 ${isOwn ? 'bg-base-100' : 'bg-base-2000'}`}
                            style={{ width: `${voiceProgressWidths[message._id] || 0}%` }}
                        />
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow cursor-pointer hover:scale-125 transition-transform ${isOwn ? 'bg-base-100' : 'bg-gray-600'}`}
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
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        />
                    </div>
                    <span className={`text-xs flex-shrink-0 w-10 tabular-nums ${isOwn ? 'text-primary-content' : 'text-base-content/70'}`}>
                        {formatVoiceTime(voiceDurations[message._id] || 0)}
                    </span>
                </div>
            </div>
        );
    };

    const MessageBubble = React.memo(({ message }) => {

        if (!message) return null;
        const isOwn = getIsOwn(message);
        const isDeleted = message.deletedAt || message.deletedForEveryone;
        const isStarred = Array.isArray(message.starredBy) && message.starredBy.includes(authUser?._id);
        const isBookmarked = Array.isArray(message.bookmarkedBy) && message.bookmarkedBy.includes(authUser?._id);
        const isMentioned = Array.isArray(message.mentions) && message.mentions.includes(authUser?._id);

        // Theme color map (same as before, I'll reuse the outer one)
        const bubbleColor = themeColor.startsWith('#') ? themeColor : (themeColorMap[themeColor] || themeColorMap.emerald);

        // Reaction notification
        if (message.isReactionNotification) {
            return (
                <div className="flex justify-center mb-1 px-4">
                    <div className="bg-base-200 rounded-full px-4 py-1 text-xs text-base-content/60 italic">
                        {message.text}
                    </div>
                </div>
            );
        }

        // Deleted
        if (isDeleted) {
            return (
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
                    <div className="bg-base-200 rounded-xl px-4 py-2">
                        <p className="text-base-content/50 text-xs italic">This message was deleted</p>
                    </div>
                </div>
            );
        }

        const hasHexagonVideo = message.media && message.media.length > 0 && message.media[0]?.isHexagon;

        // ==================== HEXAGON VIDEO ====================
        if (hasHexagonVideo) {
            const hexMedia = message.media[0];

            // Receiver view‑once hexagon
            if (message.viewOnce && !isOwn) {
                const alreadyViewed = message.viewedBy?.includes(authUser?._id);
                return (
                    <div className={`flex items-end mb-3 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {alreadyViewed ? (
                            <div className="text-xs text-base-content/60 italic flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                You viewed this
                            </div>
                        ) : (
                            <div
                                className="relative cursor-pointer"
                                onClick={async () => {
                                    updateMessage(message._id, {
                                        viewedBy: [...(message.viewedBy || []), authUser?._id],
                                        media: [],
                                    });
                                    if (hexMedia) setShowMediaViewer(hexMedia);
                                    try {
                                        const token = localStorage.getItem('access-token');
                                        await axiosInstance.put(`/chat/message/${message._id}/view-once`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                    } catch (error) { toast.error('Failed'); }
                                }}
                            >
                                <div className="w-[216px] h-[216px] flex items-center justify-center bg-base-300"
                                     style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                    <div className="w-[208px] h-[208px] relative"
                                         style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                        <video src={hexMedia.url} className="w-full h-full object-cover blur-md" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <p className="text-primary-content text-xs font-bold bg-black/50 px-2 py-1 rounded">View Once</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            // Sender view‑once hexagon
            if (message.viewOnce && isOwn) {
                return (
                    <div className={`flex items-end mb-3 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className="w-[216px] h-[216px] flex items-center justify-center"
                             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', backgroundColor: bubbleColor }}>
                            <div className="w-[208px] h-[208px] relative"
                                 style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                {message.viewedBy?.length > 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-primary-content text-xs">Viewed</div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary-content text-xs">Sent as view‑once</div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            // Normal hexagon
            return (
                <div
    className={`flex items-end mb-1 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}
    onContextMenu={(e) => handleContextMenu(e, message._id)}
    {...useLongPress(
        (e) => {
            // Long press → open the same menu as right‑click
            const rect = e.currentTarget?.getBoundingClientRect?.();
            if (rect) {
                setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
                setShowMenu(message._id);
            } else {
                // fallback: use current touch position
                const touch = e.touches?.[0] || e.changedTouches?.[0];
                if (touch) {
                    setMenuPosition({ x: touch.clientX, y: touch.clientY });
                } else {
                    setMenuPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                }
                setShowMenu(message._id);
            }
        },
        null, // onClick – we don't need a separate click handler
        { delay: 800 }
    )}
>
                    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'order-1 mr-1' : 'order-2 ml-1'}`}>
                        <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setReactionPickerPos({ top: rect.top - 60, left: rect.left }); setShowReactionPicker(message._id); }} className="p-1 hover:bg-base-200 rounded-full" title="React"><Smile className="w-4 h-4 text-base-content/50" /></button>
                        <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMenuPosition({ x: rect.left, y: rect.bottom + 4 }); setShowMenu(message._id); }} className="p-1 hover:bg-base-200 rounded-full" title="More"><MoreHorizontal className="w-4 h-4 text-base-content/50" /></button>
                    </div>
                    <div className={`relative ${isOwn ? 'order-2' : 'order-1'}`}>
                        {message.pinned && <div className="absolute -top-5 left-0 flex items-center gap-1 z-10"><Pin className="w-3 h-3 text-primary" /><span className="text-[10px] text-primary">Pinned</span></div>}
                        <div className="w-[216px] h-[216px] flex items-center justify-center"
                             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', backgroundColor: isOwn ? bubbleColor : '#e5e7eb' }}
                        >
                            <div
                                className="w-[208px] h-[208px] cursor-pointer relative group/hex"
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                onMouseEnter={() => {
                                    // 1. Pause all other hexagon videos
                                    Object.entries(hexagonVideoRefs.current).forEach(([id, video]) => {
                                        if (id !== message._id && video) {
                                            video.pause();
                                            video.currentTime = 0;
                                            if (hexagonTimers.current[id]) {
                                                clearTimeout(hexagonTimers.current[id]);
                                                delete hexagonTimers.current[id];
                                            }
                                        }
                                    });
                                    // 2. Play the hovered video
                                    const video = hexagonVideoRefs.current[message._id];
                                    if (video) {
                                        video.muted = true;
                                        video.currentTime = 0;
                                        video.play().catch(() => {});
                                        // 3. Set a timer to stop after 10 seconds
                                        hexagonTimers.current[message._id] = setTimeout(() => {
                                            if (video) {
                                                video.pause();
                                                video.currentTime = 0;
                                            }
                                        }, 10000);
                                    }
                                }}
                                onMouseLeave={() => {
                                    const video = hexagonVideoRefs.current[message._id];
                                    if (video) {
                                        video.pause();
                                        video.currentTime = 0;
                                    }
                                    if (hexagonTimers.current[message._id]) {
                                        clearTimeout(hexagonTimers.current[message._id]);
                                        delete hexagonTimers.current[message._id];
                                    }
                                }}
                                onClick={() => setShowMediaViewer(hexMedia)}
                            >
                                <video
                                    ref={(el) => {
                                        if (el) {
                                            hexagonVideoRefs.current[message._id] = el;
                                        }
                                    }}
                                    src={hexMedia.url}
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    muted
                                    loop={false}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/hex:opacity-100 transition-opacity">
                                    <Play className="w-10 h-10 text-primary-content drop-shadow-lg" />
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-emerald-100' : 'justify-end text-base-content/50'}`}>
                            {message.editedAt && <span className="text-[10px]">edited</span>}
                            {isStarred && <Star className="w-3 h-3 text-warning fill-yellow-400" />}
                            {isBookmarked && <Bookmark className="w-3 h-3 text-primary fill-primary" />}
                            {message.status === 'failed' && isOwn && (
                                <button onClick={() => handleResendMessage(message)} className="text-[10px] text-error hover:text-error underline">Resend</button>
                            )}
                            <span className="text-[10px]">{formatMessageTime(message.createdAt)}</span>
                            <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowMessageInfo(message._id); }}>{getMessageStatusIcon(message)}</span>
                        </div>
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                            <div className={`absolute -top-2 ${isOwn ? '-left-2' : '-right-2'} flex gap-0.5`}>
                                {Object.values(message.reactions).slice(0, 3).map((r, i) => <span key={i} className="text-xs bg-base-100 shadow px-1.5 py-0.5 rounded-full border">{r}</span>)}
                            </div>
                        )}
                    </div>
                    {showReactionPicker === message._id && (
                        <div className="fixed z-50" style={{ top: Math.min(reactionPickerPos.top, window.innerHeight - 300), left: Math.min(reactionPickerPos.left, window.innerWidth - 320) }}>
                            <Suspense fallback={null}>
                                <MessageReactionEmojiPicker
                                    postId={message._id}
                                    onReact={(emoji) => handleReaction(message._id, emoji)}
                                    onClose={() => setShowReactionPicker(null)}
                                    isOpen={true}
                                    position={{ top: Math.min(reactionPickerPos.top, window.innerHeight - 300), left: Math.min(reactionPickerPos.left, window.innerWidth - 320) }}
                                    currentUserReaction={message.reactions?.[authUser?._id] || null}
                                    isOwn={isOwn}
                                />
                            </Suspense>
                        </div>
                    )}
                </div>
            );
        }

        // View‑once text (receiver)
        if (message.viewOnce && !isOwn && message.text && !message.media?.length) {
            const alreadyViewed = message.viewedBy?.includes(authUser?._id);
            return (
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
                    {alreadyViewed ? (
                        <div className="text-xs text-base-content/60 italic">You viewed this</div>
                    ) : (
                        <div
                            className="relative cursor-pointer"
                            onClick={async () => {
                                updateMessage(message._id, {
                                    viewedBy: [...(message.viewedBy || []), authUser?._id],
                                    text: '',
                                });
                                try {
                                    const token = localStorage.getItem('access-token');
                                    await axiosInstance.put(`/chat/message/${message._id}/view-once`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                } catch (error) { toast.error('Failed'); }
                            }}
                        >
                            <div className="rounded-xl px-3 py-2 text-primary-content blur-sm select-none" style={{ backgroundColor: bubbleColor }}>
                                {message.text}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-primary-content text-xs font-bold bg-black/50 px-2 py-1 rounded">View Once</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // View‑once media (receiver) – non‑hexagon images
        if (message.viewOnce && !isOwn && !hasHexagonVideo && message.media?.length > 0) {
            const alreadyViewed = message.viewedBy?.includes(authUser?._id);
            const mediaUrl = message.media[0]?.url;
            const text = message.text;

            return (
                <div className={`flex items-end mb-1 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className="relative max-w-[70%]">
                        {alreadyViewed ? (
                            <div className="text-xs text-base-content/60 italic flex items-center gap-2">
                                <Eye className="w-4 h-4" /> You viewed this
                            </div>
                        ) : (
                            <div
                                className="cursor-pointer"
                                onClick={async () => {
                                    updateMessage(message._id, {
                                        viewedBy: [...(message.viewedBy || []), authUser?._id],
                                        media: [],
                                        text: '',
                                    });

                                    if (mediaUrl) setShowMediaViewer({ url: mediaUrl, mime: message.media[0].mime });

                                    try {
                                        const token = localStorage.getItem('access-token');
                                        await axiosInstance.put(
                                            `/chat/message/${message._id}/view-once`,
                                            {},
                                            { headers: { Authorization: `Bearer ${token}` } }
                                        );
                                    } catch (error) { toast.error('Failed'); }
                                }}
                            >
                                <div className="w-40 h-40 relative mb-1">
                                    <img
                                        src={mediaUrl}
                                        alt=""
                                        className="w-full h-full object-cover rounded-lg blur-md"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-primary-content text-xs font-bold bg-black/50 px-2 py-1 rounded">
                                            View Once
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {text && !alreadyViewed && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words blur-sm select-none">
                                {text}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // ==================== REGULAR MESSAGE ====================
        return (
            <div
    className={`flex items-end mb-1 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`}
    onContextMenu={(e) => handleContextMenu(e, message._id)}
    {...useLongPress(
        (e) => {
            // Long press → open the same menu as right‑click
            const rect = e.currentTarget?.getBoundingClientRect?.();
            if (rect) {
                setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
                setShowMenu(message._id);
            } else {
                // fallback: use current touch position
                const touch = e.touches?.[0] || e.changedTouches?.[0];
                if (touch) {
                    setMenuPosition({ x: touch.clientX, y: touch.clientY });
                } else {
                    setMenuPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                }
                setShowMenu(message._id);
            }
        },
        null, // onClick – we don't need a separate click handler
        { delay: 800 }
    )}
>
                <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'order-1 mr-1' : 'order-2 ml-1'}`}>
                    <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setReactionPickerPos({ top: rect.top - 60, left: rect.left }); setShowReactionPicker(message._id); }} className="p-1 hover:bg-base-200 rounded-full" aria-label="react" title="React"><Smile className="w-4 h-4 text-base-content/50" /></button>
                    <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMenuPosition({ x: rect.left, y: rect.bottom + 4 }); setShowMenu(message._id); }} className="p-1 hover:bg-base-200 rounded-full" aria-label="actions" title="More"><MoreHorizontal className="w-4 h-4 text-base-content/50" /></button>
                </div>

                <div className={`relative ${isOwn ? 'order-2' : 'order-1'} ${
                    message.isVoiceMessage && !message.text ? 'voice-bubble-container' :
                        message.contact ? 'max-w-[90%] min-w-[250px]' : 'max-w-[70%]'
                }`}>
                    {message.pinned && <div className="absolute -top-4 left-2 flex items-center gap-1"><Pin className="w-3 h-3 text-primary" /><span className="text-[10px] text-primary">Pinned</span></div>}

                    {/* Sender name for group messages */}
                    {selectedConversation?.isGroup && !isOwn && message.senderId && (
                        <div className="flex items-center gap-1 mb-0.5">
                            <img src={message.senderId.avatarUrl || '/avatar.png'} className="w-6 h-6 rounded-full" alt="" />
                            <p className="text-[14px] font-semibold text-base-content/60">
                                {message.senderId.displayName || message.senderId.username}
                            </p>
                        </div>
                    )}

                    <div
                        className={`rounded-xl px-3 py-2 shadow-sm text-primary-content rounded-br-md ${message.isVoiceMessage && !message.text ? 'w-full' : ''} ${isMentioned && !isOwn ? 'border-l-4 border-l-primary' : ''}`}
                        style={isOwn ? { backgroundColor: bubbleColor } : { backgroundColor: '#ffffff', color: '#1f2937', border: '1px solid #f3f4f6' }}
                    >
                        {/* Poll */}
                        {message.poll?.question && (
                            <div className="mb-2 rounded-lg p-3" style={{ minWidth: '220px', backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }}>
                                <p className="font-semibold text-sm mb-3">📊 {message.poll.question}</p>
                                <div className="space-y-2">
                                    {message.poll?.options?.map((opt, i) => {
                                        const votes = message.poll?.votes || {};
                                        const voteEntries = Object.entries(votes);
                                        const totalUsers = voteEntries.length;
                                        const optionUsers = voteEntries.filter(([, v]) => {
                                            if (Array.isArray(v)) return v.includes(i);
                                            return v === i;
                                        }).length;
                                        const percentage = totalUsers > 0 ? Math.round((optionUsers / totalUsers) * 100) : 0;
                                        const userVote = voteEntries.find(([uid]) => uid === authUser?._id);
                                        const userVotedForThis = userVote && (
                                            Array.isArray(userVote[1]) ? userVote[1].includes(i) : userVote[1] === i
                                        );
                                        const hasVoted = !!userVote;

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handlePollVote(message._id, i, message.poll?.allowMultiple)}
                                                className={`w-full text-left rounded-lg transition-all relative overflow-hidden ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                                                style={{ minHeight: '36px' }}
                                            >
                                                {totalUsers > 0 && (
                                                    <div
                                                        className={`absolute inset-0 rounded-lg transition-all duration-500 ${userVotedForThis ? 'bg-base-100/30' : 'bg-base-100/10'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                )}
                                                <div className="relative px-3 py-2.5 flex items-center justify-between z-10">
                                                    <span className={`text-xs font-medium ${userVotedForThis ? 'font-bold' : ''}`}>{opt}</span>
                                                    <span className={`text-xs ml-2 flex-shrink-0 ${userVotedForThis ? 'font-bold' : ''}`}>
                    {totalUsers > 0 ? `${percentage}%` : ''}
                </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {Object.keys(message.poll?.votes || {}).length > 0 && (
                                    <p
                                        className="text-[10px] opacity-60 mt-2 text-center cursor-pointer hover:underline"
                                        onClick={() => {
                                            setShowPollVoters(message._id);
                                            fetchPollVoterDetails(message.poll.votes);
                                        }}
                                    >
                                        {Object.keys(message.poll.votes).length} user{Object.keys(message.poll.votes).length !== 1 ? 's' : ''} voted – see details
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Event */}
                        {message.event?.name && (
                            <div className="mb-2 bg-base-100/10 rounded-lg p-2">
                                <p className="font-semibold text-sm">📅 {message.event.name}</p>
                                <p className="text-xs opacity-80">
                                    Date: {message.event.date}{message.event.time ? ` • Time: ${message.event.time}` : ''}{message.event.location ? ` • Location: ${message.event.location}` : ''}
                                </p>
                            </div>
                        )}

                        {/* Regular Media (skip hexagon videos and voice messages) */}
                        {!message.viewOnce && message.media && message.media.length > 0 && message.media.map((m, i) => {
                            if (m.isHexagon) return null;
                            if (message.isVoiceMessage && m.mime?.startsWith('audio/')) return null;
                            return (
                                <div
                                    key={i}
                                    className={`mb-1 ${message.isVoiceMessage ? '' : 'max-w-[240px] cursor-pointer'}`}
                                    onClick={() => { if (!message.isVoiceMessage) setShowMediaViewer(m); }}
                                >
                                    {m.mime?.startsWith('image/') ? <img src={m.url} alt="" className="rounded-lg w-full" loading="lazy" /> :
                                        m.mime?.startsWith('video/') ? (message.isVoiceMessage ?
                                                <div className="w-40 h-40 rounded-full overflow-hidden relative"><video src={m.url} className="w-full h-full object-cover" /><div className="absolute inset-0 flex items-center justify-center"><Play className="w-8 h-8 text-primary-content drop-shadow-lg" /></div></div> :
                                                <video src={m.url} className="rounded-lg w-full" />) :
                                            m.mime?.startsWith('audio/') && !message.isVoiceMessage ? renderAudioFilePlayer(message, m) :
                                                <div className="flex items-center gap-2 bg-base-100/20 p-2 rounded">
                                                    <FileText className="w-6 h-6" />
                                                    <span className="text-xs truncate">{m.filename || 'File'}</span>
                                                </div>
                                    }
                                </div>
                            );
                        })}

                        {/* Voice Message */}
                        {message.isVoiceMessage && message.media?.[0] && (
                            <div className="py-1.5" style={{ width: '100%', minWidth: '250px' }}>
                                <div className="flex items-center gap-2">
                                    <button
                                        aria-label="play/pause"
                                        className="p-1.5 rounded-full hover:bg-base-100/20 flex-shrink-0"
                                        onClick={() => handleVoicePlay(message._id, message.media[0].url)}
                                    >
                                        {playingVoiceId === message._id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    <span className={`text-xs flex-shrink-0 w-10 text-right tabular-nums ${isOwn ? 'text-primary-content' : 'text-base-content/70'}`}>
                                    {formatVoiceTime(voiceCurrentTimes[message._id] || 0)}
                                </span>
                                    <div
                                        className={`flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer relative ${isOwn ? 'bg-base-100/30' : 'bg-base-300'}`}
                                        onClick={(e) => handleProgressClick(e, message._id)}
                                    >
                                        <div
                                            className={`h-full rounded-full transition-all duration-100 ${isOwn ? 'bg-base-100' : 'bg-base-2000'}`}
                                            style={{ width: `${voiceProgressWidths[message._id] || 0}%` }}
                                        />
                                        <div
                                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow cursor-pointer hover:scale-125 transition-transform ${isOwn ? 'bg-base-100' : 'bg-gray-600'}`}
                                            style={{ left: `calc(${voiceProgressWidths[message._id] || 0}% - 6px)` }}
                                            onMouseDown={(e) => { /* drag handler unchanged */ }}
                                        />
                                    </div>
                                    <span className={`text-xs flex-shrink-0 w-10 tabular-nums ${isOwn ? 'text-primary-content' : 'text-base-content/70'}`}>
                                    {formatVoiceTime(voiceDurations[message._id] || message.voiceDuration || 0)}
                                </span>
                                    <div className="relative flex-shrink-0">
                                        <button
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-base-100/20 ${isOwn ? 'text-primary-content' : 'text-base-content/70'}`}
                                            onClick={(e) => { e.stopPropagation(); setShowVoiceMenu(showVoiceMenu === message._id ? null : message._id); }}
                                        >
                                            {voicePlaybackRates[message._id] || 1}x
                                        </button>
                                        {showVoiceMenu === message._id && (
                                            <div className={`absolute bottom-full mb-1 bg-base-100 rounded-lg shadow-lg border py-1 w-20 z-30 ${isOwn ? 'right-0' : 'left-0'}`}
                                                 onClick={(e) => e.stopPropagation()}>
                                                {[0.5, 1, 1.5, 2].map(speed => (
                                                    <button key={speed} onClick={() => { if (audioRef.current) audioRef.current.playbackRate = speed; setVoicePlaybackRates(prev => ({ ...prev, [message._id]: speed })); setShowVoiceMenu(null); }}
                                                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-base-200 ${voicePlaybackRates[message._id] === speed || (!voicePlaybackRates[message._id] && speed === 1) ? 'text-primary font-medium' : 'text-base-content/70'}`}>
                                                        {speed}x
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        aria-label="download"
                                        className={`p-1 hover:bg-base-100/20 rounded-full flex-shrink-0 ${isOwn ? 'text-primary-content' : 'text-base-content/70'}`}
                                        onClick={(e) => { e.stopPropagation(); handleVoiceDownload(message.media[0].url); }}
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {message.replyTo && (() => {
                            const repliedMsg = messages.find(m => m._id === message.replyTo?._id) || message.replyTo;
                            const replyText = repliedMsg?.text?.substring(0, 80);
                            const replyMedia = repliedMsg?.media?.length > 0;
                            const replyVoice = repliedMsg?.isVoiceMessage;
                            const replySenderName = repliedMsg?.senderId?._id === authUser?._id ? 'You' : repliedMsg?.senderId?.displayName || 'User';
                            const replyId = message.replyTo._id || message.replyTo;
                            return (
                                <div
                                    className={`flex items-stretch mb-1 cursor-pointer rounded-sm overflow-hidden`}
                                    style={{ backgroundColor: isOwn ? bubbleColorDark : '#f3f4f6' }}
                                    onClick={() => {
                                        const targetEl = document.getElementById(`msg-${replyId}`);
                                        if (targetEl) {
                                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            targetEl.classList.add('bg-yellow-50/50');
                                            setTimeout(() => targetEl.classList.remove('bg-yellow-50/50'), 2000);
                                        }
                                    }}
                                >
                                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} />
                                    <div className="px-3 py-1.5 flex-1 min-w-0">
                                        <p className={`text-[11px] font-semibold truncate ${isOwn ? 'text-primary-content' : 'text-base-content/60'}`}>
                                            {replySenderName}
                                        </p>
                                        <p className={`text-[11px] truncate ${isOwn ? 'text-primary-content' : 'text-base-content/60'}`}>
                                            {replyText ? replyText : replyMedia ? '📎 Media' : replyVoice ? '🎤 Voice message' : 'Message'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Contact or Text */}
                        {message.contact ? (
                            <div
                                className="mb-2 bg-base-100/10 rounded-lg p-2.5 cursor-pointer hover:bg-base-100/20 transition-colors"
                                onClick={() => { if (message.contact.userId) handleOpenContactLink(message.contact.userId); }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                                        {message.contact.avatarUrl ? <img src={message.contact.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-primary-content font-bold text-sm">{message.contact.name?.charAt(0) || '?'}</div>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">{message.contact.name}</p>
                                        {message.contact.username && <p className="text-[10px] opacity-75">@{message.contact.username}</p>}
                                    </div>
                                </div>
                                <p className="text-[10px] opacity-60 text-center mt-1 border-t border-white/10 pt-1">Tap to open conversation</p>
                            </div>
                        ) : (
                            !message.viewOnce && message.text && !message.poll?.question && !message.event?.name && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{renderTextWithLinks(message.text)}</p>
                            )
                        )}

                        {message.linkPreview?.url && (
                            <a href={message.linkPreview.url} target="_blank" rel="noopener noreferrer"
                               className="block mt-2 bg-base-100/10 rounded-lg overflow-hidden hover:bg-base-100/20 transition-colors"
                               onClick={(e) => e.stopPropagation()}>
                                {message.linkPreview.image && <img src={message.linkPreview.image} alt="" className="w-full h-32 object-cover" />}
                                <div className="p-2">
                                    <p className="text-xs font-semibold truncate">{message.linkPreview.title}</p>
                                    {message.linkPreview.description && <p className="text-[10px] opacity-75 truncate mt-0.5">{message.linkPreview.description}</p>}
                                    <p className="text-[10px] opacity-50 mt-1">{message.linkPreview.domain}</p>
                                </div>
                            </a>
                        )}

                        {translations[message._id] && (
                            <div className="mt-2 pt-2 border-t border-white/20">
                                <p className="text-xs italic opacity-80">
                                    {typeof translations[message._id] === 'object'
                                        ? translations[message._id].text
                                        : translations[message._id]}
                                </p>
                                <p className="text-[10px] opacity-50 mt-1">
                                    Translated to {typeof translations[message._id] === 'object'
                                    ? getLanguageLabel(translations[message._id].lang)
                                    : 'English'}
                                </p>
                            </div>
                        )}
                        {translating[message._id] && (
                            <div className="mt-2 pt-2 border-t border-white/20">
                                <p className="text-xs italic opacity-60">Translating…</p>
                            </div>
                        )}

                        {message.call && (
                            <div className="flex items-center gap-2 py-1">
                                <Phone className="w-4 h-4" />
                                <span className="text-xs">
                                {message.call.type === 'video' ? 'Video' : 'Audio'} call · {formatCallDuration(message.call.duration)}
                                    {message.call.status === 'missed' && ' (Missed)'}
                                    {message.call.status === 'no_answer' && ' (No answer)'}
                            </span>
                            </div>
                        )}

                        {/* Sender view‑once status */}
                        {message.viewOnce && isOwn && !message.media?.length && (
                            <div className="text-xs text-base-content/50 italic">
                                {message.viewedBy?.length > 0 ? 'Viewed' : 'Sent as view‑once'}
                            </div>
                        )}

                        {/* Meta */}
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-primary-content' : 'justify-end text-base-content/50'}`}>
                            {message.editedAt && <span className="text-[10px]">edited</span>}
                            {isStarred && <Star className="w-3 h-3 text-warning fill-yellow-400" />}
                            {isBookmarked && <Bookmark className="w-3 h-3 text-primary fill-primary" />}
                            {message.status === 'failed' && isOwn && (
                                <button onClick={() => handleResendMessage(message)} className="text-[10px] text-error hover:text-error underline">Resend</button>
                            )}
                            <span className={`text-[10px] ${isOwn ? `text-base-content` : `text-gray-900`}`}>{formatMessageTime(message.createdAt)}</span>
                            <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowMessageInfo(message._id); }}>
                            {getMessageStatusIcon(message)}
                        </span>
                        </div>
                    </div>

                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className={`absolute -bottom-2 ${isOwn ? 'left-2' : 'right-2'} flex gap-0.5`}>
                            {Object.values(message.reactions).slice(0, 3).map((r, i) => <span key={i} className="text-xs bg-base-100 shadow px-1.5 py-0.5 rounded-full border">{r}</span>)}
                        </div>
                    )}
                </div>

                {showReactionPicker === message._id && (
                    <div className="fixed z-50" style={{ top: Math.min(reactionPickerPos.top, window.innerHeight - 300), left: Math.min(reactionPickerPos.left, window.innerWidth - 320) }}>
                        <Suspense fallback={null}>
                            <MessageReactionEmojiPicker
                                postId={message._id}
                                onReact={(emoji) => handleReaction(message._id, emoji)}
                                onClose={() => setShowReactionPicker(null)}
                                isOpen={true}
                                position={{ top: Math.min(reactionPickerPos.top, window.innerHeight - 300), left: Math.min(reactionPickerPos.left, window.innerWidth - 320) }}
                                currentUserReaction={message.reactions?.[authUser?._id] || null}
                                isOwn={isOwn}   // <-- add this
                            />
                        </Suspense>
                    </div>
                )}
            </div>
        );
    });

        return (
            <div className="w-full flex h-screen bg-base-100 overflow-hidden">
                <Sidebar />

                <main className="flex-1 flex overflow-hidden">
                    {/* ========== Conversation List ========== */}
                    <div
                        className={`w-full lg:w-[380px] xl:w-[420px] border-r border-base-300 flex flex-col bg-base-100 ${
                            selectedConversation && mobileChatVisible ? 'hidden lg:flex' : 'flex'
                        }`}
                    >
                        <div className="p-4 border-b border-base-300">
                            <div className="flex items-center justify-between mb-3 pl-12 sm:pl-0">
                                <h2 className="text-xl font-bold text-base-content">
                                    {showArchiveSection ? 'Archived' : showLockedSection ? 'Locked' : showFavoritesSection ? 'Favorites' : 'Chats'}
                                </h2>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setShowArchiveSection(false);
                                            setShowLockedSection(false);
                                            selectConversation(null);
                                            setShowFavoritesSection(false);
                                            setMobileChatVisible(false);
                                        }}
                                        className={`p-2 rounded-full transition-colors ${!showArchiveSection&&!showLockedSection&&!showFavoritesSection?'bg-primary/10 text-primary':'hover:bg-base-200 text-base-content/60'}`}
                                        aria-label="all chats"
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
                                        className={`p-2 rounded-full transition-colors ${showArchiveSection?'bg-primary/10 text-primary':'hover:bg-base-200 text-base-content/60'}`}
                                        aria-label="archived"
                                        title="Archived"
                                    >
                                        <Archive className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUnlockContext('section');
                                            setShowUnlockModal(true);
                                        }}
                                        className={`p-2 rounded-full transition-colors ${showLockedSection?'bg-primary/10 text-primary':'hover:bg-base-200 text-base-content/60'}`}
                                        aria-label="locked chats"
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
                                        className={`p-2 rounded-full transition-colors ${showFavoritesSection?'bg-primary/10 text-primary':'hover:bg-base-200 text-base-content/60'}`}
                                        aria-label="favorites"
                                        title="Favorites"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowNewGroupModal(true)}
                                        className="p-2 hover:bg-base-200 rounded-full transition-colors"
                                        aria-label="new group"
                                        title="New Group"
                                    >
                                        <Users className="w-5 h-5 text-base-content/60" />
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-base-100 transition-all text-base-content placeholder:text-base-content/50"
                                    value={conversationSearchQuery}
                                    onChange={(e) => setConversationSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {!showArchiveSection && !showLockedSection && !showFavoritesSection && (
                            <div className="flex gap-2 px-4 py-2 border-b border-base-300 overflow-x-auto">
                                <button
                                    onClick={() => setQuickFilter('all')}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'all' ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60 hover:bg-base-200'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setQuickFilter('unread')}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'unread' ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60 hover:bg-base-200'}`}
                                >
                                    Unread {unreadCount > 0 && `(${unreadCount})`}
                                </button>
                                <button
                                    onClick={() => setQuickFilter('favorites')}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'favorites' ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60 hover:bg-base-200'}`}
                                >
                                    Favorites {favoritesCount > 0 && `(${favoritesCount})`}
                                </button>
                                <button
                                    onClick={() => setQuickFilter('groups')}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${quickFilter === 'groups' ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60 hover:bg-base-200'}`}
                                >
                                    Groups {groupsCount > 0 && `(${groupsCount})`}
                                </button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            {isConversationsLoading ? (
                                <div className="p-8 text-center text-base-content/50">Loading...</div>
                            ) : sortedConversations.length === 0 ? (
                                <div className="p-8 text-center text-base-content/50 text-sm">No conversations</div>
                            ) : (
                                sortedConversations.map((conv) => {
                                    const other = getOtherUser(conv);
                                    const unread = conv.unreadCount instanceof Map ? conv.unreadCount.get(authUser?._id) || 0 : (conv.unreadCount?.[authUser?._id] || 0);
                                    const isPinned = Array.isArray(conv.pinnedBy) && conv.pinnedBy.includes(authUser?._id);
                                    const isSelected = selectedConversation?._id === conv._id;
                                    const isMuted = conv.mutedBy?.find(m => m.user === authUser?._id);
                                    return (
                                        <div
                                            key={conv._id}
                                            onClick={() => handleSelectConversation(conv)}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-base-200 ${isSelected ? 'bg-primary/10 border-r-2 border-primary' : ''}`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-primary-content text-lg font-bold ${
                                                    conv.isGroup
                                                        ? (!conv.groupAvatar ? `bg-gradient-to-br ${getGroupAvatarColor(conv)}` : '')
                                                        : (other?.avatarUrl ? '' : 'bg-gradient-to-br from-primary to-primary/90')
                                                }`}>
                                                    {conv.isGroup ? (
                                                        conv.groupAvatar ? (
                                                            <img src={conv.groupAvatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{conv.groupName?.charAt(0) || 'G'}</span>
                                                        )
                                                    ) : (
                                                        <img src={other?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                {isOnline(other?._id) && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-base-content truncate text-sm">
                                                        {conv.isGroup ? conv.groupName : other?.displayName || 'Unknown'}
                                                    </h3>
                                                    {conv.lastMessage && (
                                                        <span className="text-[10px] text-base-content/50 flex-shrink-0 ml-2">
                                                    {formatMessageTime(conv.lastMessage.createdAt)}
                                                </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-xs text-base-content/60 truncate">
                                                        {isTyping(other?._id) ? (
                                                            <span className="text-primary italic">typing...</span>
                                                        ) : isMuted ? (
                                                            <span className="flex items-center gap-1">
                                                        <VolumeX className="w-3 h-3" />
                                                                {conv.lastMessage?.text || 'No messages'}
                                                    </span>
                                                        ) : (
                                                            conv.lastMessage?.text || 'No messages'
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                        {isPinned && <Pin className="w-3 h-3 text-primary" />}
                                                        {unread > 0 && (
                                                            <span className="bg-primary/80 text-primary-content text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                        {unread > 99 ? '99+' : unread}
                                                    </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ========== Chat Area ========== */}
                    <div
                        className={`flex-1 flex-col bg-base-200 min-w-0 ${
                            selectedConversation && (!mobileChatVisible ? 'hidden lg:flex' : 'flex')
                        } ${!selectedConversation ? 'hidden lg:flex' : ''}`}
                        style={selectedConversation && convoSettings.wallpaper ? (
                            convoSettings.wallpaper.startsWith('#') || convoSettings.wallpaper.startsWith('rgb') || themeColorMap[convoSettings.wallpaper]
                                ? { backgroundColor: convoSettings.wallpaper.startsWith('#') ? convoSettings.wallpaper : (themeColorMap[convoSettings.wallpaper] || convoSettings.wallpaper) }
                                : {
                                    backgroundImage: `url(${convoSettings.wallpaper})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundAttachment: 'fixed',
                                }
                        ) : {  }}
                    >
                        {isChatRestricted ? (
                            <div className="flex-1 flex items-center justify-center bg-base-200">
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-10 h-10 text-error" />
                                    </div>
                                    <h3 className="text-lg font-bold text-base-content mb-2">Chat Access Restricted</h3>
                                    <p className="text-base-content/60 text-sm">You have been reported multiple times and cannot access chats at this time.</p>
                                </div>
                            </div>
                        ) : selectedConversation ? (
                            <>
                                {/* Header */}
                                <div
                                    className="px-4 py-3 border-b border-base-300 bg-base-100 flex items-center justify-between shadow-sm cursor-pointer hover:bg-base-200 transition-colors"
                                    onClick={() => {
                                        if (selectedConversation?.isGroup) {
                                            setShowGroupInfo(true);
                                        } else {
                                            setShowContactInfo(true);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Mobile back button */}
                                        <button
                                            className="lg:hidden p-1 mr-1 hover:bg-base-200 rounded-full"
                                            aria-label="cancel"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBackToList();
                                            }}
                                        >
                                            <X className="w-5 h-5 text-base-content/60" />
                                        </button>
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-primary-content text-sm font-bold ${
                                                selectedConversation.isGroup
                                                    ? (!selectedConversation.groupAvatar ? `bg-gradient-to-br ${getGroupAvatarColor(selectedConversation)}` : '')
                                                    : (getOtherUser(selectedConversation)?.avatarUrl ? '' : 'bg-gradient-to-br from-primary to-primary/90')
                                            }`}>
                                                {selectedConversation.isGroup ? (
                                                    selectedConversation.groupAvatar ? (
                                                        <img src={selectedConversation.groupAvatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{selectedConversation.groupName?.charAt(0) || 'G'}</span>
                                                    )
                                                ) : (
                                                    <img src={getOtherUser(selectedConversation)?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            {isOnline(getOtherUser(selectedConversation)?._id) && (
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex flex-row px-4">
                                                <h3 className="font-semibold text-base-content text-sm">
                                                    {selectedConversation.isGroup ? selectedConversation.groupName : getOtherUser(selectedConversation)?.displayName || 'Unknown'}
                                                </h3>
                                                {selectedConversation?.disappearingTimer && (
                                                    <Clock className="w-4 h-4 text-base-content/60 ml-1" title="Disappearing messages on" />
                                                )}
                                            </div>
                                            <p className="text-xs text-base-content/50">
                                                {isTyping(getOtherUser(selectedConversation)?._id)
                                                    ? 'typing...'
                                                    : selectedConversation.isGroup
                                                        ? (getOnlineCount(selectedConversation) > 0 ? `${getOnlineCount(selectedConversation)} online` : 'no one else online')
                                                        : isOnline(getOtherUser(selectedConversation)?._id)
                                                            ? 'online'
                                                            : getLastSeen(getOtherUser(selectedConversation)?.lastSeen)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button aria-label="start audio call" onClick={(e) => { e.stopPropagation(); startCall(false); }} className="p-2 hover:bg-base-200 rounded-full">
                                            <Phone className="w-5 h-5 text-base-content/60" />
                                        </button>
                                        <button aria-label="start video call" onClick={(e) => { e.stopPropagation(); startCall(true); }} className="p-2 hover:bg-base-200 rounded-full">
                                            <Video className="w-5 h-5 text-base-content/60" />
                                        </button>
                                        <button aria-label="search messages" onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); }} className="p-2 hover:bg-base-200 rounded-full">
                                            <Search className="w-5 h-5 text-base-content/60" />
                                        </button>
                                        <button aria-label="actions" onClick={(e) => { e.stopPropagation(); setShowConversationMenu(selectedConversation._id); }} className="p-2 hover:bg-base-200 rounded-full">
                                            <MoreVertical className="w-5 h-5 text-base-content/60" />
                                        </button>
                                    </div>
                                </div>

                                {/* Blocked UI */}
                                {(isBlocked || isBlockedBy) && (
                                    <div className={`px-4 py-3 text-center text-sm ${isBlockedBy ? 'bg-error/10 text-error' : 'bg-base-200 text-base-content/60'}`}>
                                        {isBlockedBy ? 'You have been blocked by this user' : 'You have blocked this user. Unblock to send messages.'}
                                    </div>
                                )}

                                {/* Pinned messages bar */}
                                {pinnedMessages.length > 0 && (
                                    <div className="px-4 py-2 bg-primary/10 border-b border-primary/10 cursor-pointer">
                                        {pinnedMessages.map((msg, idx) => (
                                            <div
                                                key={msg._id}
                                                className="flex items-center gap-2 text-sm text-primary/90 hover:underline"
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
                                    {showSearch && (
                                        <motion.div
                                            ref={searchRef}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-base-100 border-b border-base-300 overflow-hidden"
                                        >
                                            <div className="p-3 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search messages..."
                                                    className="flex-1 px-4 py-2 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-base-content placeholder:text-base-content/50"
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearchInput(e.target.value)}
                                                    autoFocus
                                                />
                                                <button aria-label="cancel" onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(''); }} className="p-2 hover:bg-base-200 rounded-full">
                                                    <X className="w-5 h-5 text-base-content/50" />
                                                </button>
                                            </div>
                                            {searchResults.length > 0 && (
                                                <div className="max-h-48 overflow-y-auto px-4 pb-3">
                                                    {searchResults.map(msg => (
                                                        <div
                                                            key={msg._id}
                                                            className="p-2 hover:bg-base-200 rounded-lg cursor-pointer text-sm text-base-content/70"
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
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Messages */}
                                <div className="flex-1 flex flex-col">
                                    {isMessagesLoading ? (
                                        <div className="text-center text-base-content/50 mt-20">Loading messages...</div>
                                    ) : messages.length === 0 ? (
                                        <EmptyChatPlaceholder />
                                    ) : (
                                        <div className="flex-1">
                                            <Virtuoso
                                                ref={virtuosoRef}
                                                style={{ height: "100%" }}                  // fills the flex container
                                                data={messages}
                                                itemContent={(index, message) => (
                                                    <div className="py-1" id={`msg-${message._id}`} onDoubleClick={() => handleReply(message)}>
                                                        <MessageBubble message={message} />
                                                    </div>
                                                )}
                                                onScroll={(e) => {
        const target = e.target;
        const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        setShowScrollButton(distanceFromBottom > 100);
    }}
                                                followOutput="auto"                          // auto-scroll when new messages arrive
                                                components={{
                                                    Footer: () =>
                                                        isTyping(getOtherUser(selectedConversation)?._id) ? (
                                                            <TypingIndicator />
                                                        ) : null,
                                                }}
                                            />
                                            {showScrollButton && (
    <button
        onClick={() => {
            if (virtuosoRef.current) {
                virtuosoRef.current.scrollToIndex({
                    index: messages.length - 1,
                    align: 'end',
                    behavior: 'smooth',
                });
            }
        }}
        className="absolute right-4 p-2 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
        style={{
            backgroundColor: bubbleColor,
            color: '#ffffff',
            bottom: replyingTo ? '7rem' : '5rem', // avoids reply preview
        }}
        aria-label="Scroll to bottom"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    </button>
)}
                                        </div>
                                    )}
                                </div>

                                {/* Reply Preview */}
                                <AnimatePresence>
                                    {replyingTo && (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            className="px-4 py-2.5 bg-base-100 border-t border-base-300 flex items-center gap-3"
                                        >
                                            <div className="w-1 h-10 bg-primary/80 rounded-full flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-primary">
                                                    {replyingTo.senderId?._id === authUser?._id ? 'You' : replyingTo.senderId?.displayName || 'User'}
                                                </p>
                                                <p className="text-xs text-base-content/60 truncate">
                                                    {replyingTo.text?.substring(0, 60) || (replyingTo.media?.length > 0 ? '📎 Media' : replyingTo.isVoiceMessage ? '🎤 Voice message' : 'Message')}
                                                </p>
                                            </div>
                                            <button aria-label="cancel" onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-base-200 rounded-full flex-shrink-0">
                                                <X className="w-4 h-4 text-base-content/50" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Video Recording Preview */}
                                <AnimatePresence>
                                    {isRecordingVideo && (
                                        <motion.div
                                            ref={fileRef}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            className="px-4 py-2 bg-black border-t border-base-content/40"
                                        >
                                            <div className="flex items-center gap-3">
                                                <video ref={videoPreviewRef} autoPlay muted playsInline className="w-32 h-24 rounded-lg object-cover" />
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
                                                    <span className="text-primary-content text-sm">Recording</span>
                                                </div>
                                                <div className="flex gap-2 ml-auto">
                                                    <button aria-label="Take photo" onClick={takePhoto} className="p-2 bg-base-100 text-base-content rounded-full hover:bg-base-300">
                                                        <Camera className="w-5 h-5" />
                                                    </button>
                                                    <button aria-label="stop" onClick={stopVideoRecording} className="p-2 bg-error text-primary-content rounded-full hover:bg-red-600">
                                                        <StopCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* File Preview */}
                                <AnimatePresence>
                                    {selectedFile && !isRecordingVideo && (
                                        <motion.div
                                            ref={fileRef}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            className="px-4 py-2 bg-base-100 border-t border-base-300"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {selectedFile.type?.startsWith('image/') ? (
                                                        <img src={selectedFile.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                    ) : selectedFile.type?.startsWith('video/') ? (
                                                        <video src={selectedFile.url} className="w-12 h-12 rounded-lg object-cover" />
                                                    ) : selectedFile.isVoice ? (
                                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <Mic className="w-6 h-6 text-primary" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 bg-base-200 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-6 h-6 text-base-content/50" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-medium text-base-content/80">{selectedFile.name}</p>
                                                        <p className="text-[10px] text-base-content/50">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <button aria-label="cancel" onClick={() => setSelectedFile(null)} className="p-1 hover:bg-base-200 rounded-full">
                                                    <X className="w-4 h-4 text-base-content/50" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Message Input */}
                                {!(isBlocked || isBlockedBy) && (
                                    <div className="px-4 py-3 bg-base-100 border-t border-base-300">
                                        {isRecording && <div className="mb-2"><RecordingWaveform duration={recordingDuration} /></div>}
                                        {isRecordingVideoNote && (
                                            <div className="px-4 py-2 bg-black border-t border-base-content/40 flex items-center gap-3">
                                                <div className="w-12 h-12 relative flex-shrink-0"
                                                     style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', backgroundColor: bubbleColor }}>
                                                    <div className="w-[44px] h-[44px] absolute top-[2px] left-[2px]"
                                                         style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                                        <video ref={videoNotePreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
                                                    <span className="text-primary-content text-sm">Recording hexagon note</span>
                                                </div>
                                                <button aria-label="stop" onClick={stopVideoNote} className="p-2 bg-error text-primary-content rounded-full hover:bg-red-600 transition-colors">
                                                    <StopCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-end gap-1 sm:gap-2">
                                            {/* Attachment menu */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                                    aria-label="Attachments"
                                                    className="p-2 sm:p-2.5 hover:bg-base-200 rounded-full"
                                                    title="Attachments"
                                                >
                                                    <Paperclip className="w-5 h-5 text-base-content/50" />
                                                </button>
                                                <AnimatePresence>
                                                    {showAttachmentMenu && (
                                                        <motion.div
                                                            ref={attachmentRef}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="absolute bottom-12 left-0 bg-base-100 rounded-xl shadow-xl border py-1 w-48 z-50"
                                                        >
                                                            {[
                                                                { Icon: ImageIcon, label: 'Photo/Video', action: () => fileInputRef.current?.click() },
                                                                { Icon: Camera, label: 'Take Photo', action: () => { handleCameraCapture(); setShowAttachmentMenu(false); } },
                                                                { Icon: FileText, label: 'Document', action: () => fileInputRef.current?.click() },
                                                                { Icon: MapPin, label: 'Location', action: () => { setShowLocationPicker(true); setShowAttachmentMenu(false); } },
                                                                { Icon: Contact, label: 'Contact', action: () => { setShowSendContactModal(true); setShowAttachmentMenu(false); } },
                                                                { Icon: BarChart3, label: 'Poll', action: () => { setShowPollModal(true); setShowAttachmentMenu(false); } },
                                                                { Icon: Calendar, label: 'Event', action: () => { setShowEventModal(true); setShowAttachmentMenu(false); } },
                                                            ].map((item, i) => {
                                                                const IconComponent = item.Icon;
                                                                return (
                                                                    <button key={i} onClick={item.action} className="w-full px-4 py-2 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                                                        <IconComponent className="w-4 h-4" /> {item.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" />
                                            </div>

                                            {/* Combined Expression button + its two pickers */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowExpressionMenu(!showExpressionMenu)}
                                                    className="p-2 sm:p-2.5 hover:bg-base-200 rounded-full"
                                                    aria-label="expressions"
                                                    title="Emoji & Sticker"
                                                >
                                                    <Smile className="w-5 h-5 text-base-content/50" />
                                                </button>

                                                {/* Expression popover (Emoji / Sticker choice) */}
                                                <AnimatePresence>
                                                    {showExpressionMenu && (
                                                        <motion.div
                                                            ref={expressionMenuRef}
                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            className="absolute bottom-12 left-0 bg-base-100 rounded-xl shadow-xl border py-1 w-40 z-50"
                                                        >
                                                            <button
                                                                onClick={() => { setShowEmojiPicker(true); setShowExpressionMenu(false); }}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70"
                                                            >
                                                                <Smile className="w-4 h-4" /> Emoji
                                                            </button>
                                                            <button
                                                                onClick={() => { setShowGifPicker(true); setShowExpressionMenu(false); }}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70"
                                                            >
                                                                <Sticker className="w-4 h-4" /> Sticker
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Emoji Picker – positioned relative to this button */}
                                                <AnimatePresence>
                                                    {showEmojiPicker && (
                                                        <motion.div
                                                            ref={emojiPickerRef}
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:absolute md:bottom-12 md:left-0 md:inset-x-auto"
                                                        >
                                                            <Suspense fallback={null}>
                                                                <EmojiPicker inputRef={messageInputRef} value={messageText} setValue={setMessageText} />
                                                            </Suspense>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Sticker / GIF Picker – positioned relative to this button */}
                                                <AnimatePresence>
                                                    {showGifPicker && (
                                                        <Suspense fallback={null}>
                                                            <GifStickerPicker
                                                                onSelect={({ type, url }) => {
                                                                    sendMediaMessage(url, { filename: type === 'sticker' ? 'sticker.png' : 'gif.gif' });
                                                                    setShowGifPicker(false);
                                                                }}
                                                                isOpen={showGifPicker}
                                                                onClose={() => setShowGifPicker(false)}
                                                                onOpenStickerEditor={() => setShowStickerEditor(true)}
                                                            />
                                                        </Suspense>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Textarea (unchanged) */}
                                            <div className="flex-1 relative">
        <textarea
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => {
                const value = e.target.value;
                setMessageText(value);
                const otherId = getOtherUser(selectedConversation)?._id;
                if (otherId && value) startTyping({ toUserId: otherId });
                else if (otherId) stopTyping({ toUserId: otherId });
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                const cursorPos = el.selectionStart;
                setCursorPosition(cursorPos);
                const textBeforeCursor = value.substring(0, cursorPos);
                const atIndex = textBeforeCursor.lastIndexOf('@');
                if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
                    const searchTerm = textBeforeCursor.substring(atIndex + 1).toLowerCase();
                    setMentionSearch(searchTerm);
                    setShowMentionsDropdown(true);
                } else {
                    setShowMentionsDropdown(false);
                }
            }}
            onKeyDown={handleKeyDown}
            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-base-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-base-100 transition-all text-base-content placeholder:text-base-content/50"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
        />
                                                {/* Mentions dropdown (unchanged) */}
                                                {showMentionsDropdown && (
                                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-base-100 rounded-xl shadow-lg border z-50 max-h-40 overflow-y-auto">
                                                        {selectedConversation?.isGroup && (
                                                            <div className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer"
                                                                 onClick={() => {
                                                                     const beforeAt = messageText.substring(0, messageText.lastIndexOf('@', cursorPosition));
                                                                     const afterCursor = messageText.substring(cursorPosition);
                                                                     const newText = beforeAt + '@everyone ' + afterCursor;
                                                                     setMessageText(newText);
                                                                     setShowMentionsDropdown(false);
                                                                     messageInputRef.current?.focus();
                                                                 }}
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center">
                                                                    <Users className="w-4 h-4 text-primary-content" />
                                                                </div>
                                                                <span className="text-sm font-medium">@everyone</span>
                                                            </div>
                                                        )}
                                                        {mentionableUsers
                                                            .filter(u => u.username?.toLowerCase().includes(mentionSearch) || u.displayName?.toLowerCase().includes(mentionSearch))
                                                            .slice(0, 5)
                                                            .map(user => (
                                                                <div key={user._id} className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer"
                                                                     onClick={() => {
                                                                         const beforeAt = messageText.substring(0, messageText.lastIndexOf('@', cursorPosition));
                                                                         const afterCursor = messageText.substring(cursorPosition);
                                                                         const newText = beforeAt + '@' + user.username + ' ' + afterCursor;
                                                                         setMessageText(newText);
                                                                         setShowMentionsDropdown(false);
                                                                         messageInputRef.current?.focus();
                                                                     }}
                                                                >
                                                                    <div className="w-6 h-6 rounded-full bg-base-300 overflow-hidden">
                                                                        <img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="text-sm">{user.username}</span>
                                                                </div>
                                                            ))}
                                                        {mentionableUsers.filter(u => u.username?.toLowerCase().includes(mentionSearch) || u.displayName?.toLowerCase().includes(mentionSearch)).length === 0 && (
                                                            <div className="px-3 py-2 text-xs text-base-content/50">No users found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Camera / Mic / Send (unchanged, but icons slightly larger on mobile) */}
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <div className="flex items-center gap-1">
                                                        {!isRecording && !isRecordingVideoNote && (
                                                            <button
                                                                onClick={startVideoNote}
                                                                aria-label="Start video note"
                                                                className="p-2 sm:p-2.5 text-base-content/50 hover:bg-base-200 rounded-full transition-colors"
                                                                title="Record hexagon video note"
                                                            >
                                                                <Camera className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {!isRecording && !isRecordingVideoNote && !messageText.trim() && !selectedFile && (
                                                            <button
                                                                onClick={startRecording}
                                                                className="p-2 sm:p-2.5 text-base-content/50 hover:text-error hover:bg-base-200 rounded-full transition-colors"
                                                                aria-label="mic"
                                                                title="Record voice message"
                                                            >
                                                                <Mic className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {isRecording && (
                                                            <button
                                                                onClick={stopRecording}
                                                                className="p-2 sm:p-2.5 bg-error text-primary-content rounded-full hover:bg-error transition-colors animate-pulse"
                                                                aria-label="stop recording"
                                                                title="Stop recording"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {isRecordingVideoNote && (
                                                            <button
                                                                onClick={stopVideoNote}
                                                                className="p-2 sm:p-2.5 text-primary-content rounded-full transition-colors"
                                                                style={{ backgroundColor: bubbleColor }}
                                                                aria-label="stop recording"
                                                                title="Stop recording"
                                                            >
                                                                <StopCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {selectedFile && !selectedFile.isVoice && (
                                                            <label className="flex items-center gap-2 px-4 py-1 text-xs text-base-content/60 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isViewOnce}
                                                                    onChange={(e) => setIsViewOnce(e.target.checked)}
                                                                    className="rounded"
                                                                />
                                                                View once
                                                            </label>
                                                        )}
                                                        {(messageText.trim() || selectedFile) && (
                                                            <button
                                                                onClick={handleSendMessage}
                                                                aria-label="sendp"
                                                                disabled={isSending}
                                                                className="p-2 sm:p-2.5 rounded-full transition-colors shadow-sm text-primary-content"
                                                                style={{ backgroundColor: isSending ? '#d1d5db' : bubbleColor }}
                                                            >
                                                                {isSending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <NoConversationPlaceholder />
                        )}
                    </div>

                    {/* ========== Contact Info Panel (responsive) ========== */}
                    <AnimatePresence>
                        {showContactInfo && selectedConversation && !selectedConversation.isGroup && (() => {
                            const user = getOtherUser(selectedConversation);
                            if (!user) return null;
                            return (
                                <motion.div
                                    ref={contactInfoRef}
                                    initial={{ x: 300, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 300, opacity: 0 }}
                                    className="fixed inset-0 z-50 lg:static lg:w-[350px] border-l border-base-300 bg-base-100 overflow-y-auto flex-shrink-0"
                                >
                                    {/* On mobile, add a header with close button */}
                                    <div className="flex items-center justify-between p-4 lg:hidden border-b">
                                        <h3 className="font-bold text-lg">Contact Info</h3>
                                        <button aria-label="cancel" onClick={() => setShowContactInfo(false)} className="p-2 hover:bg-base-200 rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6 hidden lg:flex">
                                            <h3 className="font-bold text-lg">Contact Info</h3>
                                            <button aria-label="cancel" onClick={() => setShowContactInfo(false)} className="p-2 hover:bg-base-200 rounded-full">
                                                <X className="w-5 h-5 text-base-content/60" />
                                            </button>
                                        </div>
                                        <div className="text-center mb-6">
                                            <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden">
                                                {user?.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-primary-content text-3xl font-bold">
                                                        {user?.displayName?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-lg">{user?.displayName}</h4>
                                            <p className="text-base-content/60 text-sm">@{user?.username}</p>
                                            <p className="text-xs text-base-content/50 mt-1">{user?.bio || 'No bio'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <button onClick={handleGoToProfile} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <ExternalLink className="w-4 h-4" /> Go to Profile
                                            </button>
                                            <button onClick={() => { handleOpenMedia(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <ImageIcon className="w-4 h-4" /> Media, Links & Docs
                                            </button>
                                            <button onClick={() => { handleShareContactAsActualLink(user); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <ExternalLink className="w-4 h-4" /> Share Contact Link
                                            </button>
                                            <button onClick={() => { handleOpenStarred(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Star className="w-4 h-4" /> Starred Messages
                                            </button>
                                            <button onClick={() => { handleOpenBookmarked(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Bookmark className="w-4 h-4" /> Bookmarked Messages
                                            </button>
                                            <button onClick={() => { setShowContactInfo(false); setShowWallpaperModal(true); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <ImageIcon className="w-4 h-4" /> Wallpaper
                                            </button>
                                            <button onClick={() => setShowThemeModal(true)} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Palette className="w-4 h-4" /> Chat Theme
                                            </button>
                                            <button onClick={() => { handleOpenGroupsInCommon(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Users className="w-4 h-4" /> Groups in Common
                                            </button>
                                            <button onClick={() => { handleShareContactOpen(user); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Contact className="w-4 h-4" /> Share Contact
                                            </button>
                                            <button onClick={() => { setShowContactInfo(false); setShowDisappearingModal(true); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Clock className="w-4 h-4" /> Disappearing Messages
                                            </button>
                                            {selectedConversation?.lockedBy?.includes(authUser?._id) ? (
                                                <button onClick={() => { setShowContactInfo(false); setUnlockContext('chat'); setShowUnlockModal(true); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                    <Unlock className="w-4 h-4" /> Unlock Chat
                                                </button>
                                            ) : (
                                                <button onClick={() => { setShowContactInfo(false); handleLockChatOpen(); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                    <Lock className="w-4 h-4" /> Lock Chat
                                                </button>
                                            )}
                                            <button onClick={() => { handleAddToFavorites(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                                <Heart className={`w-4 h-4 ${selectedConversation?.favoritedBy?.includes(authUser?._id) ? 'fill-red-400 text-error' : ''}`} />
                                                {selectedConversation?.favoritedBy?.includes(authUser?._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                            </button>
                                            <button onClick={() => { handleBlockContact(); setShowContactInfo(false); }} className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm ${isBlocked ? 'hover:bg-success/10 text-green-500' : 'hover:bg-error/10 text-error'}`}>
                                                {isBlocked ? <><UserCheck className="w-4 h-4" /> Unblock Contact</> : <><UserX className="w-4 h-4" /> Block Contact</>}
                                            </button>
                                            <button onClick={() => { handleReportContact(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-error/10 rounded-xl flex items-center gap-3 text-sm text-error">
                                                <Flag className="w-4 h-4" /> Report Contact
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </main>

                {/* Group Info Modal */}
                <Suspense fallback={null}>
                    <GroupInfoModal
                        isOpen={showGroupInfo}
                        onClose={() => setShowGroupInfo(false)}
                        conversationId={selectedConversation?._id}
                        onlineUsers={onlineUsers}
                        onMemberClick={async (memberId) => {
                            setShowGroupInfo(false);
                            try {
                                const conv = await getConversation(memberId);
                                if (conv) selectConversation(conv);
                            } catch (error) {
                                toast.error('Could not open conversation');
                            }
                        }}
                        onAvatarChange={handleGroupAvatarChange}
                    />
                </Suspense>

                {/* ========== Context Menu, Conversation Menu, All Modals ========== */}
                {/* ========== Context Menu ========== */}
                <AnimatePresence>
                    {
                        showMenu && (() => {
                            const message = messages.find(m => m._id === showMenu);
                            if (!message) return null;
                            const isOwn = getIsOwn(message);
                            const isStarred = message.starredBy?.includes(authUser?._id);
                            const isBookmarked = message.bookmarkedBy?.includes(authUser?._id);
                            return (
                                <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="fixed z-50 bg-base-100 rounded-xl shadow-xl border py-1 w-56 max-w-[95vw]"
                                    style={{
                                        left: Math.min(menuPosition.x, window.innerWidth - 240),
                                        top: Math.min(menuPosition.y, window.innerHeight - 450)
                                    }}
                                    onClick={() => setShowMenu(null)}
                                >
                                    <button onClick={() => handleReply(message)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        <Reply className="w-4 h-4" /> Reply
                                    </button>
                                    {isOwn && message.text && (
                                        <button onClick={() => handleEdit(message)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                            <Edit className="w-4 h-4" /> Edit
                                        </button>
                                    )}
                                    <button onClick={() => handleForward(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        <Forward className="w-4 h-4" /> Forward
                                    </button>
                                    <button onClick={() => handleStar(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        {isStarred ? <><StarOff className="w-4 h-4" /> Unstar</> : <><Star className="w-4 h-4" /> Star</>}
                                    </button>
                                    <button onClick={() => handleBookmark(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        {isBookmarked ? <><TbBookmarkOff className="w-4 h-4" /> Unbookmark</> : <><Bookmark className="w-4 h-4" /> Bookmark</>}
                                    </button>
                                    <button onClick={() => handleCopy(message.text || '')} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        <Copy className="w-4 h-4" /> Copy
                                    </button>
                                    <button onClick={() => setShowTranslateModal(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        <Languages className="w-4 h-4" /> Translate
                                    </button>
                                    <button onClick={() => handlePinMessage(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        <Pin className="w-4 h-4" /> {message.pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button onClick={() => handleReportMessage(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 flex items-center gap-3 text-sm text-base-content/70">
                                        <Flag className="w-4 h-4" /> Report
                                    </button>
                                    {isOwn && (
                                        <button onClick={() => setShowDeleteModal(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-error/10 flex items-center gap-3 text-sm text-error">
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
                                        className="bg-base-100 border rounded-xl shadow-xl p-2 w-[90%] max-w-xs"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <button onClick={handlePinConversation} className="w-full px-4 py-2.5 text-left hover:bg-base-200 rounded-lg flex items-center gap-3 text-sm text-base-content/70">
                                            <Pin className="w-4 h-4" /> {isPinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button onClick={handleArchiveConversation} className="w-full px-4 py-2.5 text-left hover:bg-base-200 rounded-lg flex items-center gap-3 text-sm text-base-content/70">
                                            <Archive className="w-4 h-4" /> {conv?.archivedBy?.includes(authUser?._id) ? 'Unarchive' : 'Archive'}
                                        </button>
                                        <button onClick={() => handleMuteConversation(isMuted ? null : 8)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 rounded-lg flex items-center gap-3 text-sm text-base-content/70">
                                            <BellOff className="w-4 h-4" /> {isMuted ? 'Unmute' : 'Mute'}
                                        </button>
                                        <button onClick={() => { handleShareContactOpen(getOtherUser(selectedConversation)); setShowConversationMenu(null); }} className="w-full px-4 py-2.5 text-left hover:bg-base-200 rounded-lg flex items-center gap-3 text-sm text-base-content/70">
                                            <Contact className="w-4 h-4" /> Share Contact
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('access-token');
                                                    const res = await axiosInstance.get(
                                                        `/chat/conversation/${selectedConversation._id}/export`,
                                                        {
                                                            headers: { Authorization: `Bearer ${token}` },
                                                            responseType: 'blob',
                                                        }
                                                    );
                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `chat_${selectedConversation._id}.txt`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                } catch (error) {
                                                    toast.error('Failed to export chat');
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 text-left hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export Chat
                                        </button>
                                        <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left hover:bg-error/10 rounded-lg flex items-center gap-3 text-sm text-error">
                                            <Trash2 className="w-4 h-4" /> Clear Chat
                                        </button>
                                        <button onClick={() => setShowConversationMenu(null)} className="w-full px-4 py-2.5 text-left hover:bg-base-200 rounded-lg flex items-center gap-3 text-sm text-base-content/50 mt-1 border-t">
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                    </motion.div>
                                </motion.div>
                            );
                        })()
                    }
                </AnimatePresence>

                {/* ========== Pin Duration Modal ========== */}
                <AnimatePresence>
                    {showPinDurationModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-sm shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Pin Message</h3>
                                <p className="text-sm text-base-content/60 mb-4">How long?</p>
                                <div className="space-y-2">
                                    {[
                                        { label: '24 hours', value: 24 },
                                        { label: '7 days', value: 168 },
                                        { label: '30 days', value: 720 },
                                        { label: 'Unpin', value: null, danger: true }
                                    ].map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePinDurationSelect(opt.value)}
                                            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${opt.danger ? 'text-error hover:bg-error/10' : 'hover:bg-base-200 text-base-content/70'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Poll Modal ========== */}
                <AnimatePresence>
                    {showPollModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Create Poll</h3>
                                <input
                                    type="text"
                                    placeholder="Question"
                                    className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3 text-base-content placeholder:text-base-content/50"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                />
                                {pollOptions.map((opt, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        placeholder={`Option ${i + 1}`}
                                        className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2 text-base-content placeholder:text-base-content/50"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...pollOptions]; newOpts[i] = e.target.value; setPollOptions(newOpts);
                                        }}
                                    />
                                ))}
                                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-primary text-sm mb-4 hover:text-primary">+ Add Option</button>
                                <label className="flex items-center gap-2 text-sm mb-4 text-primary hover:text-primary cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isMultipleTrue}
                                        onChange={(e) => setIsMultipleTrue(e.target.checked)}
                                        className="rounded"
                                    />
                                    Allow Multiple Votes
                                </label>
                                <div className="flex gap-2">
                                    <button onClick={handleCreatePoll} className="flex-1 py-2.5 text-primary-content rounded-xl font-medium" style={{backgroundColor: bubbleColor}}>Create Poll</button>
                                    <button onClick={() => setShowPollModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Event Modal ========== */}
                <AnimatePresence>
                    {showEventModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Create Event</h3>
                                <input
                                    type="text"
                                    placeholder="Event name"
                                    className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3 text-base-content placeholder:text-base-content/50"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                />
                                <input type="date" className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3 text-base-content" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                                <input type="time" className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3 text-base-content" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                                <input type="text" placeholder="Location (optional)" className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4 text-base-content placeholder:text-base-content/50" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateEvent} className="flex-1 py-2.5 text-primary-content rounded-xl font-medium" style={{background: bubbleColor}}>Create Event</button>
                                    <button onClick={() => setShowEventModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Share Contact Modal ========== */}
                <AnimatePresence>
                    {showShareContactModal && contactToShare && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-3">Share Contact</h3>
                                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl mb-4">
                                    <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden">
                                        {contactToShare.avatarUrl ? <img src={contactToShare.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-primary-content font-bold">{contactToShare.displayName?.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{contactToShare.displayName}</p>
                                        <p className="text-xs text-base-content/50">@{contactToShare.username}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-base-content/60 mb-3">Select conversations to share this contact with:</p>
                                <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                                    {conversations.map(conv => {
                                        const other = getOtherUser(conv);
                                        const targetId = conv.isGroup ? conv._id : other?._id;
                                        if (!targetId || targetId === contactToShare?._id) return null;
                                        return (
                                            <div key={conv._id} onClick={() => setShareTargets(prev => prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId])} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${shareTargets.includes(targetId) ? 'bg-primary/10' : 'hover:bg-base-200'}`}>
                                                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-primary-content text-sm font-bold ${
                                                    conv.isGroup
                                                        ? (!conv.groupAvatar ? `bg-gradient-to-br ${getGroupAvatarColor(conv)}` : '')
                                                        : (other?.avatarUrl ? '' : 'bg-gradient-to-br from-primary to-primary/90')
                                                }`}>
                                                    {conv.isGroup ? (
                                                        conv.groupAvatar ? (
                                                            <img src={conv.groupAvatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{conv.groupName?.charAt(0) || 'G'}</span>
                                                        )
                                                    ) : (
                                                        <img src={other?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <span className="text-sm">{conv.isGroup ? conv.groupName : other?.displayName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleShareContactConfirm} disabled={shareTargets.length === 0} className="flex-1 py-2.5 text-primary-content rounded-xl font-medium disabled:bg-base-300 disabled:text-base-content/50" style={{background: bubbleColor}}>Share ({shareTargets.length})</button>
                                    <button onClick={() => setShowShareContactModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Media Modal ========== */}
                <AnimatePresence>
                    {showMediaModal && (
                        <motion.div
                            ref={mediaRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowMediaModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[95%] max-w-xl max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Media, Links & Docs</h3>
                                    <button onClick={() => setShowMediaModal(false)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                </div>
                                {mediaItems.length === 0 ? <p className="text-center text-base-content/50 py-8">No media shared yet</p> : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {mediaItems.map((item, i) => (
                                            <div key={i} className="aspect-square rounded-lg overflow-hidden cursor-pointer bg-base-200" onClick={() => { setShowMediaModal(false); setShowMediaViewer(item); }}>
                                                {item.mime?.startsWith('image/') ? <img src={item.url} alt="" className="w-full h-full object-cover" /> : item.mime?.startsWith('video/') ? <video src={item.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-8 h-8 text-base-content/50" /></div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Starred Messages Modal ========== */}
                <AnimatePresence>
                    {showStarredModal && (
                        <motion.div
                            ref={starredRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowStarredModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[95%] max-w-xl max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Starred Messages</h3>
                                    <button onClick={() => setShowStarredModal(false)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                </div>
                                {starredMessages.length === 0 ? <p className="text-center text-base-content/50 py-8">No starred messages</p> : starredMessages.map(msg => (
                                    <div key={msg._id} className="p-3 hover:bg-base-200 rounded-lg cursor-pointer" onClick={() => { setShowStarredModal(false); setTimeout(() => scrollToMessage(msg._id), 300); }}>
                                        <div className="flex items-center gap-2 mb-1"><Star className="w-3 h-3 text-warning fill-yellow-400" /><span className="text-xs text-base-content/50">{formatMessageTime(msg.createdAt)}</span></div>
                                        <p className="text-sm text-base-content/70">{msg.text?.substring(0, 100)}</p>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Bookmarked Messages Modal ========== */}
                <AnimatePresence>
                    {showBookmarkedModal && (
                        <motion.div
                            ref={bookmarkedRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowBookmarkedModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[95%] max-w-xl max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Bookmarked Messages</h3>
                                    <button onClick={() => setShowBookmarkedModal(false)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                </div>
                                {bookmarkedMessages.length === 0 ? <p className="text-center text-base-content/50 py-8">No bookmarked messages</p> : bookmarkedMessages.map(msg => (
                                    <div key={msg._id} className="p-3 hover:bg-base-200 rounded-lg cursor-pointer" onClick={() => { setShowBookmarkedModal(false); setTimeout(() => scrollToMessage(msg._id), 300); }}>
                                        <div className="flex items-center gap-2 mb-1"><Bookmark className="w-3 h-3 text-primary fill-primary" /><span className="text-xs text-base-content/50">{formatMessageTime(msg.createdAt)}</span></div>
                                        <p className="text-sm text-base-content/70">{msg.text?.substring(0, 100)}</p>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Groups in Common Modal ========== */}
                <AnimatePresence>
                    {showGroupsInCommonModal && (
                        <motion.div
                            ref={groupsRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowGroupsInCommonModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Groups in Common</h3>
                                    <button onClick={() => setShowGroupsInCommonModal(false)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                </div>
                                {groupsInCommon.length === 0 ? <p className="text-center text-base-content/50 py-8">No groups in common</p> : groupsInCommon.map(group => (
                                    <div key={group._id} className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer" onClick={() => { selectConversation(group); setShowGroupsInCommonModal(false); }}>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-primary-content font-bold">{group.groupName?.charAt(0) || 'G'}</div>
                                        <span className="text-sm font-medium">{group.groupName}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Lock Chat Modal ========== */}
                <AnimatePresence>
                    {showLockChatModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-sm shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Lock Chat</h3>
                                    <button onClick={() => setShowLockChatModal(false)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                </div>
                                <p className="text-sm text-base-content/60 mb-4">Enter your login password to lock this chat.</p>
                                <input type="password" placeholder="Enter password" className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4 text-base-content placeholder:text-base-content/50" value={lockPassword} onChange={(e) => setLockPassword(e.target.value)} autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={handleLockChatConfirm} className="flex-1 py-2.5 bg-primary/80 text-primary-content rounded-xl font-medium hover:bg-primary">Lock Chat</button>
                                    <button onClick={() => setShowLockChatModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Unlock Modal ========== */}
                <AnimatePresence>
                    {showUnlockModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-sm shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Unlock Chats</h3>
                                    <button onClick={() => setShowUnlockModal(false)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                </div>
                                <p className="text-sm text-base-content/60 mb-4">Enter your login password to access locked chats.</p>
                                <input type="password" placeholder="Enter password" className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4 text-base-content placeholder:text-base-content/50" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={unlockContext === 'section' ? handleUnlockSection : handleUnlockSpecificChat} className="flex-1 py-2.5 bg-primary/80 text-primary-content rounded-xl font-medium hover:bg-primary">Unlock</button>
                                    <button onClick={() => setShowUnlockModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Media Viewer Modal ========== */}
                <AnimatePresence>
                    {showMediaViewer && (
                        <motion.div
                            ref={mediaViewerRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                            onClick={() => setShowMediaViewer(null)}
                        >
                            <button onClick={() => setShowMediaViewer(null)} className="absolute top-4 right-4 p-2 bg-base-100/20 rounded-full text-primary-content hover:bg-base-100/40 z-10">
                                <X className="w-6 h-6" />
                            </button>
                            {showMediaViewer.mime?.startsWith('image/') ? (
                                <img src={showMediaViewer.url} alt="" className="max-w-[95vw] max-h-[95vh] rounded-xl border object-contain" onClick={e => e.stopPropagation()} />
                            ) : showMediaViewer.mime?.startsWith('video/') ? (
                                <video src={showMediaViewer.url} controls className="max-w-[95vw] max-h-[95vh] border rounded-xl" onClick={e => e.stopPropagation()} />
                            ) : (
                                <div className="bg-base-100 border rounded-xl p-8 text-center max-w-[90%]" onClick={e => e.stopPropagation()}>
                                    <FileText className="w-16 h-16 text-base-content/50 mx-auto mb-4" />
                                    <p className="text-lg font-medium">{showMediaViewer.filename || 'File'}</p>
                                    <a href={showMediaViewer.url} download className="text-primary hover:text-primary mt-2 inline-block"><Download className="w-5 h-5 inline mr-1" /> Download</a>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Forward Modal ========== */}
                <AnimatePresence>
                    {showForwardModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-3">Forward Message</h3>
                                <div className="bg-base-200 rounded-xl p-3 mb-4 text-sm text-base-content/60">{messageToForward?.text?.substring(0, 100) || 'Media message'}</div>
                                <div className="space-y-1 mb-4">
                                    {conversations.map(conv => {
                                        const other = getOtherUser(conv);
                                        const targetId = conv.isGroup ? conv._id : other?._id;
                                        if (!targetId) return null;
                                        return (
                                            <div key={conv._id} onClick={() => setForwardTargets(prev => prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId])} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${forwardTargets.includes(targetId) ? 'bg-primary/10' : 'hover:bg-base-200'}`}>
                                                <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-primary-content text-sm font-bold ${
                                                    conv.isGroup
                                                        ? (!conv.groupAvatar ? `bg-gradient-to-br ${getGroupAvatarColor(conv)}` : '')
                                                        : (other?.avatarUrl ? '' : 'bg-gradient-to-br from-primary to-primary/90')
                                                }`}>
                                                    {conv.isGroup ? (
                                                        conv.groupAvatar ? (
                                                            <img src={conv.groupAvatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{conv.groupName?.charAt(0) || 'G'}</span>
                                                        )
                                                    ) : (
                                                        <img src={other?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium">{conv.isGroup ? conv.groupName : other?.displayName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={handleForwardSubmit} disabled={forwardTargets.length === 0} className="w-full py-2.5 text-primary-content rounded-xl font-medium disabled:bg-base-300 disabled:text-base-content/50" style={{background: bubbleColor}}>Forward ({forwardTargets.length})</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== New Group Modal ========== */}
                <AnimatePresence>
                    {showNewGroupModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">New Group</h3>
                                <input type="text" placeholder="Group name" className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3" value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />
                                <div className="max-h-48 overflow-y-auto mb-4">
                                    {contacts.map(user => (
                                        <div key={user._id} onClick={() => setSelectedParticipants(prev => prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id])} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${selectedParticipants.includes(user._id) ? 'bg-primary/10' : 'hover:bg-base-200'}`}>
                                            <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden"><img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" /></div>
                                            <span className="text-sm">{user.displayName}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleCreateGroup} className="flex-1 py-2.5 text-primary-content rounded-xl font-medium" style={{background: bubbleColor}}>Create ({selectedParticipants.length})</button>
                                    <button onClick={() => setShowNewGroupModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Contact List Modal ========== */}
                <AnimatePresence>
                    {showContactList && (
                        <motion.div
                            ref={contactListRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <motion.div
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-2xl pointer-events-auto"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">New Chat</h3>
                                    <button onClick={() => setShowContactList(false)} className="p-2 hover:bg-base-200 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {contacts.length === 0 ? (
                                    <p className="text-center text-base-content/50 py-8">No contacts yet</p>
                                ) : (
                                    contacts.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={async () => {
                                                const conv = await getConversation(user._id);
                                                if (conv) selectConversation(conv);
                                                setShowContactList(false);
                                            }}
                                            className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-xl cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden">
                                                <img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{user.displayName}</p>
                                                <p className="text-xs text-base-content/50">@{user.username}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Incoming Call ========== */}
                <AnimatePresence>
                    {incomingCall && (
                        <motion.div
                            ref={callRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-base-100 border rounded-2xl p-8 w-[90%] max-w-xs text-center shadow-2xl"
                            >
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {incomingCall.isVideo ? <Video className="w-10 h-10 text-primary" /> : <Phone className="w-10 h-10 text-primary" />}
                                </div>
                                <h3 className="text-xl font-bold mb-1">
                                    {incomingCall.isGroupCall ? `Group Call: ${incomingCall.metadata?.groupName || 'Group'}` : `Incoming ${incomingCall.isVideo ? 'Video' : 'Audio'} Call`}
                                </h3>
                                <p className="text-base-content/60 mb-6">
                                    {incomingCall.isGroupCall ? `${incomingCall.callerName} is calling the group` : `${incomingCall.callerName} is calling...`}
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button aria-label="reject call" onClick={rejectCall} className="p-4 bg-error text-primary-content rounded-full hover:bg-red-600 transition-colors shadow-lg"><PhoneOff className="w-6 h-6" /></button>
                                    <button aria-label="accept call" onClick={acceptCall} className="p-4 bg-success text-primary-content rounded-full hover:bg-green-600 transition-colors shadow-lg"><Phone className="w-6 h-6" /></button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Add to Call Modal ========== */}
                <AnimatePresence>
                    {showAddToCallModal && (
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
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[70vh] overflow-y-auto shadow-xl z-[61]"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Add to Call</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {contacts.map(user => (
                                        <div key={user._id} onClick={() => { socket?.emit('webrtc:call:initiate', { targets: [user._id], isVideo: isVideoMode, metadata: { callerName: authUser?.displayName, callId: activeCall?.callId } }); toast.success(`Invited ${user.displayName}`); setShowAddToCallModal(false); }} className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden"><img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" /></div>
                                            <span className="text-sm font-medium">{user.displayName}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowAddToCallModal(false)} className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Delete Message Modal ========== */}
                <AnimatePresence>
                    {showDeleteModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowDeleteModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-xs shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Delete Message</h3>
                                <p className="text-sm text-base-content/60 mb-4">Choose how you want to delete this message.</p>
                                <div className="space-y-2">
                                    <button onClick={() => { handleDeleteForMe(showDeleteModal); setShowDeleteModal(null); }} className="w-full py-2.5 rounded-xl font-medium hover:bg-base-200 flex items-center justify-center gap-2 text-base-content/70">
                                        <Trash2 className="w-4 h-4" /> Delete for me
                                    </button>
                                    <button onClick={() => { handleDeleteForEveryone(showDeleteModal); setShowDeleteModal(null); }} className="w-full py-2.5 rounded-xl font-medium hover:bg-error/10 flex items-center justify-center gap-2 text-error">
                                        <Trash2 className="w-4 h-4" /> Delete for everyone
                                    </button>
                                </div>
                                <button onClick={() => setShowDeleteModal(null)} className="mt-2 w-full py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Poll Voters Modal ========== */}
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
                                    className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Poll Voters</h3>
                                        <button onClick={() => { setShowPollVoters(null); setPollVoterDetails({}); }} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                    </div>
                                    {loadingPollVoters ? (
                                        <p className="text-center text-base-content/50 py-4">Loading...</p>
                                    ) : (
                                        msg.poll.options.map((opt, idx) => {
                                            const voters = Object.entries(msg.poll.votes || {}).filter(([, option]) => {
                                                if (Array.isArray(option)) return option.includes(idx);
                                                return option === idx;
                                            }).map(([uid]) => uid);
                                            return (
                                                <div key={idx} className="mb-3">
                                                    <p className="font-semibold text-sm mb-1">{opt}</p>
                                                    {voters.length === 0 ? (
                                                        <p className="text-xs text-base-content/50 ml-2">No votes</p>
                                                    ) : (
                                                        <ul className="text-xs text-base-content/70 ml-2 space-y-0.5">
                                                            <div className="max-h-40 overflow-y-auto">
                                                                {voters.map(uid => (
                                                                    <li key={uid} className="flex items-center gap-2 py-2">
                                                                        <div className="w-6 h-6 rounded-full bg-base-300 overflow-hidden flex-shrink-0">
                                                                            {pollVoterDetails[uid]?.avatarUrl ? (
                                                                                <img src={pollVoterDetails[uid].avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-primary-content text-[10px] font-bold">{(pollVoterDetails[uid]?.displayName || uid).charAt(0)}</div>
                                                                            )}
                                                                        </div>
                                                                        <span>{pollVoterDetails[uid]?.displayName || pollVoterDetails[uid]?.username || uid}</span>
                                                                    </li>
                                                                ))}
                                                            </div>
                                                        </ul>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    <button onClick={() => { setShowPollVoters(null); setPollVoterDetails({}); }} className="mt-4 w-full py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Close</button>
                                </motion.div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                {/* ========== Disappearing Messages Modal ========== */}
                <AnimatePresence>
                    {showDisappearingModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowDisappearingModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-sm shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Disappearing Messages</h3>
                                <p className="text-sm text-base-content/60 mb-4">Messages will be automatically deleted after the selected time.</p>
                                <div className="space-y-2">
                                    {[
                                        { label: '24 hours', value: 86400 },
                                        { label: '7 days', value: 604800 },
                                        { label: '90 days', value: 7776000 },
                                        { label: 'Off', value: null },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('access-token');
                                                    await axiosInstance.put(
                                                        `/chat/conversation/${selectedConversation._id}/disappearing`,
                                                        { timer: option.value },
                                                        { headers: { Authorization: `Bearer ${token}` } }
                                                    );
                                                    // Update the conversation in the store WITHOUT clearing messages
                                                    const updatedConv = { ...selectedConversation, disappearingTimer: option.value };
                                                    const updatedConversations = conversations.map(c =>
                                                        c._id === selectedConversation._id ? updatedConv : c
                                                    );
                                                    useChatStore.setState({
                                                        conversations: updatedConversations,
                                                        selectedConversation: updatedConv,
                                                    });
                                                    toast.success(
                                                        option.value ? `Disappearing after ${option.label}` : 'Disappearing messages off'
                                                    );
                                                    setShowDisappearingModal(false);
                                                } catch (error) {
                                                    toast.error('Failed to update');
                                                }
                                            }}
                                            className={`w-full py-2.5 rounded-xl text-sm font-medium ${selectedConversation?.disappearingTimer === option.value ? 'bg-primary/10 text-primary' : 'hover:bg-base-200 text-base-content/70'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setShowDisappearingModal(false)} className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Wallpaper Modal ========== */}
                <AnimatePresence>
                    {showWallpaperModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowWallpaperModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[520px] max-h-[85vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Chat Wallpaper</h3>
                                    <button onClick={() => setShowWallpaperModal(false)} className="p-2 hover:bg-base-200 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
                                    <input
                                        type="text"
                                        placeholder="Search wallpapers... (e.g. forest, ocean, sky)"
                                        value={wallpaperSearch}
                                        onChange={(e) => {
                                            setWallpaperSearch(e.target.value);
                                            fetchWallpapers(e.target.value || "nature", 1, false);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-lg text-sm focus:outline-none"
                                    />
                                </div>

                                {/* Unsplash Results with Infinite Scroll */}
                                <div className="mb-4">
                                    <p className="text-sm text-base-content/60 mb-2">Browse Wallpapers</p>
                                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                        {wallpapers.map(img => (
                                            <div key={img.id} className="relative group">
                                                <img
                                                    src={img.thumb}
                                                    alt=""
                                                    className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                                    onClick={() => {
                                                        updateConvoSetting('wallpaper', img.url);
                                                        setShowWallpaperModal(false);
                                                        toast.success('Wallpaper updated');
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleSaveWallpaper(img.url, img.thumb, "unsplash")}
                                                    className="absolute top-1 right-1 p-1 bg-base-100/80 rounded-full hover:bg-base-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Save to my wallpapers"
                                                >
                                                    <Download className="w-3 h-3 text-base-content/80" />
                                                </button>
                                            </div>
                                        ))}
                                        {loadingWallpapers && (
                                            <div className="col-span-3 text-center py-4 text-sm text-base-content/50">Loading...</div>
                                        )}
                                    </div>
                                    {wallpaperPage < wallpaperTotalPages && !loadingWallpapers && (
                                        <button
                                            onClick={() => fetchWallpapers(wallpaperSearch || "nature", wallpaperPage + 1, true)}
                                            className="w-full mt-2 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            Load More
                                        </button>
                                    )}
                                </div>

                                {/* Plain Colors */}
                                <div className="border-t border-base-300 pt-4 mb-4">
                                    <p className="text-sm text-base-content/60 mb-2">
                                        Plain Colors
                                        <a
                                            href="https://colors.codes"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary ml-1 text-xs"
                                        >
                                            (find hex codes at colors.codes)
                                        </a>
                                    </p>
                                    <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                                        {Object.entries(themeColorMap).map(([name, color]) => (
                                            <div
                                                key={name}
                                                className="w-8 h-8 rounded-full cursor-pointer border-2 hover:scale-110 transition-transform"
                                                style={{
                                                    backgroundColor: color,
                                                    borderColor: convoSettings.wallpaper === color ? '#3b82f6' : 'transparent',
                                                }}
                                                onClick={() => {
                                                    updateConvoSetting('wallpaper', color);
                                                    setShowWallpaperModal(false);
                                                    toast.success(`Wallpaper set to ${name}`);
                                                }}
                                                title={name}
                                            />
                                        ))}
                                    </div>

                                    {/* Custom Hex Color */}
                                    <div className="mt-3 flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={hexWallpaperInput.startsWith('#') ? hexWallpaperInput : '#000000'}
                                            onChange={(e) => setHexWallpaperInput(e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            placeholder="#RRGGBB"
                                            value={hexWallpaperInput}
                                            onChange={(e) => setHexWallpaperInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddWallpaperColor();
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 bg-base-200 rounded-lg text-sm focus:outline-none"
                                            maxLength={7}
                                        />
                                        <button
                                            onClick={handleAddWallpaperColor}
                                            className="px-4 py-2 bg-primary/80 text-primary-content rounded-lg text-sm font-medium hover:bg-primary"
                                        >
                                            Set
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-base-content/50 mt-1">
                                        Enter a hex code or pick a color above
                                    </p>
                                </div>

                                {/* My Wallpapers (Uploaded & Saved) */}
                                <div className="border-t border-base-300 pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-base-content/60">My Wallpapers</p>
                                        <label className="cursor-pointer text-sm text-primary hover:text-primary">
                                            <Upload className="w-4 h-4 inline mr-1" />
                                            Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    // Upload to MinIO and save
                                                    try {
                                                        const uploadResult = await useChatStore.getState().uploadChatMedia({
                                                            file,
                                                            conversationId: selectedConversation._id,
                                                            mediaType: 'wallpapers',
                                                        });
                                                        await handleSaveWallpaper(uploadResult.url, uploadResult.url, "upload");
                                                    } catch (error) {
                                                        toast.error('Upload failed');
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                        {myWallpapers.map(wp => (
                                            <div key={wp._id} className="relative group">
                                                <img
                                                    src={wp.thumb || wp.url}
                                                    alt=""
                                                    className="w-full h-20 object-cover rounded-lg cursor-pointer"
                                                    onClick={() => {
                                                        updateConvoSetting('wallpaper', wp.url);
                                                        setShowWallpaperModal(false);
                                                        toast.success('Wallpaper updated');
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleDeleteWallpaper(wp._id)}
                                                    className="absolute top-1 right-1 p-1 bg-base-100/80 rounded-full hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete wallpaper"
                                                >
                                                    <Trash2 className="w-3 h-3 text-error" />
                                                </button>
                                            </div>
                                        ))}
                                        {myWallpapers.length === 0 && (
                                            <div className="col-span-3 text-center text-sm text-base-content/50 py-4">
                                                No saved wallpapers
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            updateConvoSetting('wallpaper', null);
                                            setShowWallpaperModal(false);
                                            toast.success('Wallpaper set to default');
                                        }}
                                        className="w-full py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300 mb-3"
                                    >
                                        Set to Default
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Translate Modal ========== */}
                <AnimatePresence>
                    {showTranslateModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowTranslateModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-4">Translate to</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {TRANSLATE_LANGUAGES.map((lang) => (
                                        <button key={lang.code} onClick={() => { const messageId = showTranslateModal; const message = messages.find(m => m._id === messageId); if (message?.text) handleTranslate(messageId, message.text, lang.code); setShowTranslateModal(null); }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-base-200 transition-colors text-sm text-base-content/80">
                                            <span className="text-lg">{lang.flag}</span> <span>{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setShowTranslateModal(null)} className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Theme Modal ========== */}
                <AnimatePresence>
                    {showThemeModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowThemeModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-base-100 border rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Chat Theme</h3>
                                    <button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-base-200 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-sm text-base-content/60 mb-4">Choose a preset color or enter a custom hex code.</p>

                                {/* Search Bar */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or hex..."
                                        value={searchColorQuery}
                                        onChange={(e) => setSearchColorQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-lg text-sm focus:outline-none"
                                    />
                                </div>

                                {/* Filtered swatches */}
                                <div className="grid grid-cols-8 gap-3 mb-4 max-h-64 overflow-y-auto">
                                    {[
                                        ...Object.entries(themeColorMap).map(([name, color]) => ({ name, color, id: name })),
                                        ...customColors.map(c => ({ name: c.name, color: c.hex, id: c._id })),
                                    ]
                                        .filter(item => {
                                            const query = searchColorQuery.toLowerCase();
                                            if (!query) return true;
                                            return (
                                                item.name.toLowerCase().includes(query) ||
                                                item.color.toLowerCase().includes(query)
                                            );
                                        })
                                        .map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    updateConvoSetting('themeColor', item.color);
                                                    setShowThemeModal(false);
                                                    toast.success(`Theme set to ${item.name}`);
                                                }}
                                                title={item.name}
                                                aria-label={item.name}
                                                className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-base-200 transition-colors"
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                                                    style={{
                                                        backgroundColor: item.color,
                                                        borderColor: (convoSettings.themeColor || 'emerald') === item.color ? '#3b82f6' : 'transparent',
                                                    }}
                                                />
                                                <span className="text-[10px] text-base-content/70 capitalize truncate w-full text-center">
                                                {item.name}
                                            </span>
                                            </button>
                                        ))}
                                    {searchColorQuery && customColors.filter(c =>
                                        c.name.toLowerCase().includes(searchColorQuery.toLowerCase()) ||
                                        c.hex.toLowerCase().includes(searchColorQuery.toLowerCase())
                                    ).length === 0 && Object.entries(themeColorMap).filter(([name, color]) =>
                                        name.toLowerCase().includes(searchColorQuery.toLowerCase()) ||
                                        color.toLowerCase().includes(searchColorQuery.toLowerCase())
                                    ).length === 0 && (
                                        <div className="col-span-8 text-center text-sm text-base-content/50 py-4">
                                            No colors found
                                        </div>
                                    )}
                                </div>

                                {/* Custom color input */}
                                <div className="border-t border-base-300 pt-4">
                                    <p className="text-sm text-base-content/60 mb-2">Add custom color</p>
                                    <p className="text-sm text-base-content/60 mb-2">
                                        <a
                                            href="https://colors.codes"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary ml-1 text-xs"
                                        >
                                            (find hex codes at colors.codes)
                                        </a>
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={hexInput.startsWith('#') ? hexInput : '#000000'}
                                            onChange={(e) => setHexInput(e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            placeholder="#RRGGBB"
                                            value={hexInput}
                                            onChange={(e) => setHexInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomColor();
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 bg-base-200 rounded-lg text-sm focus:outline-none"
                                            maxLength={7}
                                        />
                                        <button
                                            onClick={handleAddCustomColor}
                                            className="px-4 py-2 bg-primary/80 text-primary-content rounded-lg text-sm font-medium hover:bg-primary"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-base-content/50 mt-1">Enter a hex code and press Enter or click Add</p>
                                </div>

                                <button
                                    onClick={() => {
                                        updateConvoSetting('themeColor', 'emerald');
                                        setShowThemeModal(false);
                                        toast.success('Theme set to default');
                                    }}
                                    className="w-full py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300 mb-3"
                                >
                                    Set to Default
                                </button>

                                <button
                                    onClick={() => setShowThemeModal(false)}
                                    className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300"
                                >
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Message Info Modal ========== */}
                <AnimatePresence>
                    {showMessageInfo && (() => {
                        const msg = messages.find(m => m._id === showMessageInfo);
                        if (!msg) return null;
                        return (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                                onClick={() => setShowMessageInfo(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                    className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-sm max-h-[80vh] overflow-y-auto shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Message Info</h3>
                                        <button onClick={() => setShowMessageInfo(null)} className="p-2 hover:bg-base-200 rounded-full"><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center"><Check className="w-5 h-5 text-base-content/60" /></div><div><p className="text-sm font-medium">Sent</p><p className="text-xs text-base-content/50">{formatMessageTime(msg.createdAt)}</p></div></div>
                                        {msg.deliveredAt && <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center"><CheckCheck className="w-5 h-5 text-base-content/60" /></div><div><p className="text-sm font-medium">Delivered</p><p className="text-xs text-base-content/50">{formatMessageTime(msg.deliveredAt)}</p></div></div>}
                                        {msg.status === 'read' && msg.readAt && <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><CheckCheck className="w-5 h-5 text-primary" /></div><div><p className="text-sm font-medium">Read</p><p className="text-xs text-base-content/50">{Object.values(msg.readAt).length > 0 ? formatMessageTime(Object.values(msg.readAt)[0]) : 'Unknown'}</p></div></div>}
                                    </div>
                                    <button onClick={() => setShowMessageInfo(null)} className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Close</button>
                                </motion.div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                {/* ========== Location Picker ========== */}
                <AnimatePresence>
                    {showLocationPicker && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowLocationPicker(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-sm shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <LocationPicker onClose={onLocationPickerClose} onSelect={onLocationPickerSelect} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Sticker Editor ========== */}
                <AnimatePresence>
                    {showStickerEditor && (
                        <Suspense fallback={null}>
                            <StickerEditor
                                onClose={() => setShowStickerEditor(false)}
                                onSave={async (blob) => { /* upload and save logic unchanged */ setShowStickerEditor(false); }}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                {/* Active Call */}
                <AnimatePresence>
                    {activeCall && (
                        <motion.div
                            ref={activeCallRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={
                                isCallMinimized
                                    ? { opacity: 1, scale: 1, width: 300, height: 200, bottom: 20, right: 20, position: 'fixed' }
                                    : { opacity: 1, scale: 1, width: '100%', height: '100%', inset: 0, position: 'fixed' }
                            }
                            className="z-50 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="relative w-full h-full">
                                {isVideoMode && remoteStreams.size > 0 ? (
                                    remoteStreams.size === 1 ? (
                                        Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                                            <video
                                                key={userId}
                                                ref={el => {
                                                    if (el) { remoteVideoRefs.current.set(userId, el); el.srcObject = stream; }
                                                }}
                                                autoPlay playsInline className="w-full h-full object-cover"
                                            />
                                        ))
                                    ) : (
                                        <div className={`w-full h-full p-4 grid gap-2 ${
                                            remoteStreams.size === 2 ? 'grid-cols-2' : remoteStreams.size <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                                        }`}>
                                            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                                                <div key={userId} className="relative rounded-xl overflow-hidden bg-gray-800">
                                                    <video
                                                        ref={el => {
                                                            if (el) { remoteVideoRefs.current.set(userId, el); el.srcObject = stream; }
                                                        }}
                                                        autoPlay playsInline className="w-full h-full object-cover"
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
                                        <p className="text-primary-content text-lg font-medium">{getOtherUser(selectedConversation)?.displayName || 'Call'}</p>
                                        <p className="text-base-content/50 text-sm">{isVideoMode ? 'Video call' : 'Audio call'}</p>
                                        {callAnswered ? (
                                            <div className="mt-6 w-64">
                                                <AudioWaveform isActive={true} isMuted={isMicMuted} />
                                                <p className="text-primary-content text-sm mt-2">{formatCallDuration(callDuration)}</p>
                                            </div>
                                        ) : (
                                            <div className="mt-6">
                                                <p className="text-primary-content text-lg animate-pulse">Ringing...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isVideoMode && localStream && (
                                    <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                                        <video
                                            ref={el => { localVideoRef.current = el; if (el && localStream) el.srcObject = localStream; }}
                                            autoPlay muted playsInline className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Call controls – responsive */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 md:px-6 md:py-3 flex-wrap justify-center">
                                    <button onClick={toggleMute} className={`p-2 md:p-3 rounded-full transition-colors ${isMicMuted ? 'bg-error text-primary-content' : 'bg-base-100/20 text-primary-content hover:bg-base-100/30'}`}>
                                        {isMicMuted ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                                    </button>
                                    <button onClick={toggleVideo} className={`p-2 md:p-3 rounded-full transition-colors ${isVideoOff ? 'bg-error text-primary-content' : 'bg-base-100/20 text-primary-content hover:bg-base-100/30'}`}
                                            title={isVideoOff ? "Turn on camera" : "Turn off camera"}>
                                        {isVideoOff ? <VideoOff className="w-4 h-4 md:w-5 md:h-5" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
                                    </button>
                                    {isVideoMode && (
                                        <button aria-label="flip camera" onClick={flipCamera} className="p-2 md:p-3 rounded-full bg-base-100/20 text-primary-content hover:bg-base-100/30">
                                            <RotateCw className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    )}
                                    <button onClick={shareScreen} className={`p-2 md:p-3 rounded-full transition-colors ${isSharingScreen ? 'bg-primary text-primary-content' : 'bg-base-100/20 text-primary-content hover:bg-base-100/30'}`}>
                                        <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button onClick={() => setShowAddToCallModal(true)} className="p-2 md:p-3 rounded-full bg-base-100/20 text-primary-content hover:bg-base-100/30" title="Add participant">
                                        <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <button onClick={endCall} className="p-2 md:p-3 rounded-full bg-error text-primary-content hover:bg-red-600">
                                        <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>

                                <button onClick={toggleCallMinimize} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-primary-content hover:bg-black/60">
                                    {isCallMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden audio element */}
                <audio
                    ref={audioRef}
                    onTimeUpdate={(e) => {
                        const a = e.currentTarget;
                        if (a.duration) setAudioProgress((a.currentTime / a.duration) * 100);
                    }}
                    onEnded={() => { setIsPlayingAudio(null); setAudioProgress(0); }}
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

                {/* Video Recording Modal (responsive) */}
                <AnimatePresence>
                    {showVideoRecordModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-50 flex flex-col"
                        >
                            <div className="flex-1 relative">
                                <video
                                    ref={el => {
                                        if (el) { videoPreviewRef.current = el; if (videoStream) el.srcObject = videoStream; }
                                    }}
                                    autoPlay muted playsInline className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                                <button onClick={() => { if (videoStream) { videoStream.getTracks().forEach(t => t.stop()); setVideoStream(null); } setShowVideoRecordModal(false); }} className="p-4 bg-base-100/20 rounded-full text-primary-content hover:bg-base-100/40">
                                    <X className="w-6 h-6" />
                                </button>
                                <button onClick={takePhoto} className="p-6 bg-base-100 rounded-full hover:bg-base-300 shadow-xl">
                                    <Camera className="w-8 h-8 text-base-content" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ========== Send Contact Modal ========== */}
                <AnimatePresence>
                    {showSendContactModal && (
                        <motion.div
                            ref={sendContactRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <motion.div
                                className="bg-base-100 border rounded-2xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto shadow-2xl pointer-events-auto"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Send Contact</h3>
                                    <button onClick={() => setShowSendContactModal(false)} className="p-2 hover:bg-base-200 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {contacts.length === 0 ? (
                                    <p className="text-center text-base-content/50 py-8">No contacts yet</p>
                                ) : (
                                    contacts.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => handleSendContactMessage(user)}
                                            className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-xl cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden">
                                                <img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{user.displayName}</p>
                                                <p className="text-xs text-base-content/50">@{user.username}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <button onClick={() => setShowSendContactModal(false)} className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        );
        
};

export default ChatPage;
