// @ts-nocheck
import {useEffect, useRef, useState, useCallback} from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import Sidebar from "../../components/common/Sidebar";
import { SnitchLogo } from "../../components/svgs/snitch";
import {
    Search, MoreHorizontal, MoreVertical, Phone, Paperclip, Smile, Send,
    Video, Mic, Image as ImageIcon, FileText, MapPin, UserPlus, Star,
    Archive, Pin, BellOff, Trash2, Check, CheckCheck, Clock, Reply,
    Forward, Copy, X, Search as SearchIcon, Play, Pause, VideoOff,
    MicOff, PhoneOff, MessageCircle, RotateCw, MonitorUp, Users,
    Minimize2, Maximize2, Camera, MessageSquare, User, Contact,
    BarChart3, Calendar, Lock, Shield, Flag, Download, ExternalLink,
    Heart, UserCheck, UserX, VolumeX, Eye, EyeOff
} from "lucide-react";
import EmojiPicker from "../../components/common/EmojiPicker";
import ReactionEmojiPicker from "../../components/common/ChatReactionEmojiPicker";
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
        <p className="text-gray-500 text-sm text-center max-w-xs">
            Select a conversation or start a new one to begin messaging
        </p>
    </div>
);

const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-4 py-1">
        <div className="flex gap-1">
            {[0, 150, 300].map((delay, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
            ))}
        </div>
        <span className="text-xs text-gray-400 ml-1">typing</span>
    </div>
);

const AudioWaveform = ({ isActive, isMuted }) => (
    <div className="flex items-center justify-center gap-[2px] h-12 px-2">
        {[...Array(12)].map((_, i) => (
            <div key={i} className={`w-[3px] rounded-full transition-all duration-200 ${isActive && !isMuted ? 'bg-blue-400' : 'bg-gray-300'}`}
                 style={{ height: isActive && !isMuted ? `${12 + Math.sin(i * 0.8) * 10 + Math.random() * 8}px` : '6px', animation: isActive && !isMuted ? `wave 0.${4 + (i % 3)}s ease-in-out infinite alternate` : 'none' }} />
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
    <div className="flex items-center gap-2 bg-red-50 rounded-full px-4 py-1.5 animate-pulse">
        <div className="flex items-center gap-[1px]">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="w-[2px] bg-red-400 rounded-full" style={{ height: `${10 + Math.random() * 16}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
        </div>
        <span className="text-xs text-red-500 font-medium">{duration}s</span>
        <div className="w-2 h-2 bg-red-500 rounded-full" />
    </div>
);

// ==================== Main Component ====================

const ChatPage = () => {
    const {
        conversations, selectedConversation, messages,
        isMessagesLoading, isConversationsLoading,
        onlineUsers, typingUsers,
        getConversations, getConversation, selectConversation,
        getMessages, sendMessage, startTyping, stopTyping,
        reactToMessage, editMessage, deleteMessage, forwardMessage,
        starMessage, pinConversation, archiveConversation,
        muteConversation, markConversationAsRead, clearChat,
        createGroup, addMessage, updateMessage, removeMessage,
        setOnlineUsers, addTypingUser, removeTypingUser,
        searchMessages, pinMessage, unpinMessage,
    } = useChatStore();

    const { authUser, socket } = useAuthStore();
    const navigate = useNavigate();

    // --- State ---
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
    const [forwardTargets, setForwardTargets] = useState([]);
    const [showArchiveSection, setShowArchiveSection] = useState(false);
    const [showLockedSection, setShowLockedSection] = useState(false);
    const [showFavoritesSection, setShowFavoritesSection] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showPinDurationModal, setShowPinDurationModal] = useState(null);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [showPinnedMsgs, setShowPinnedMsgs] = useState(false);
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
    const addedMessageIds = useRef(new Set());

    // ==================== Socket Setup ====================

    const setupSocketListeners = useCallback(() => {
        if (!socket || socketListenersAttached.current) return;
        socketListenersAttached.current = true;

        socket.on('receive_message', (message) => {
            if (addedMessageIds.current.has(message._id)) return;
            addedMessageIds.current.add(message._id);
            const state = useChatStore.getState();
            addMessage(message);
            if (message.conversationId === state.selectedConversation?._id) scrollToBottom();
            getConversations();
        });

        socket.on('message_sent', (message) => {
            if (addedMessageIds.current.has(message._id)) return;
            addedMessageIds.current.add(message._id);
            const state = useChatStore.getState();
            if (!state.messages.find(m => m._id === message._id)) { addMessage(message); scrollToBottom(); }
        });

        socket.on('message:edited', (message) => updateMessage(message._id, message));
        socket.on('message:deleted', ({ messageId }) => removeMessage(messageId));
        socket.on('message:deleted:everyone', ({ messageId }) => removeMessage(messageId));
        socket.on('reaction:update', ({ messageId, reactions }) => updateMessage(messageId, { reactions }));
        socket.on('message:read', ({ messageId }) => updateMessage(messageId, { status: 'read' }));

        socket.on('message:pinned', ({ message }) => {
            setPinnedMessages(prev => [...prev.filter(m => m._id !== message._id), message]);
            updateMessage(message._id, { pinned: true });
        });
        socket.on('message:unpinned', ({ messageId }) => {
            setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
            updateMessage(messageId, { pinned: false });
        });

        socket.on('typing:start', ({ from }) => {
            addTypingUser(from);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => removeTypingUser(from), 5000);
        });
        socket.on('typing:stop', ({ from }) => { removeTypingUser(from); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); });

        socket.on('users_online', (users) => setOnlineUsers(Array.isArray(users) ? users : []));
        socket.on('user_online', (userId) => setOnlineUsers(prev => [...new Set([...prev, userId])]));
        socket.on('user_offline', (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId)));

        socket.on('message:starred', ({ messageId, starred, userId }) => {
            const { authUser } = useAuthStore.getState();
            updateMessage(messageId, { starred: starred, starredBy: starred ? [userId || authUser?._id] : [] });
        });

        socket.on('webrtc:call:incoming', ({ callId, from, isVideo, metadata }) => {
            const conv = conversations.find(c => c.participants?.some(p => p._id === from));
            const caller = conv?.participants?.find(p => p._id === from);
            setIncomingCall({ callId, callerId: from, callerName: caller?.displayName || metadata?.callerName || 'Unknown', isVideo });
        });

        socket.on('webrtc:signal', async ({ from, type, data }) => {
            const pc = peerConnectionsRef.current.get(from); if (!pc) return;
            try {
                if (type === 'offer') { await pc.setRemoteDescription(new RTCSessionDescription(data)); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); socket.emit('webrtc:signal', { toUserId: from, type: 'answer', data: answer }); }
                else if (type === 'answer') { await pc.setRemoteDescription(new RTCSessionDescription(data)); }
                else if (type === 'ice' && data) { await pc.addIceCandidate(new RTCIceCandidate(data)); }
            } catch (e) { console.error('Signal error:', e); }
        });

        socket.on('webrtc:call:ended', () => cleanupCall());
        socket.on('webrtc:call:participant_left', ({ userId }) => {
            setRemoteStreams(prev => { const n = new Map(prev); n.delete(userId); return n; });
            const pc = peerConnectionsRef.current.get(userId); if (pc) { pc.close(); peerConnectionsRef.current.delete(userId); }
        });
        socket.on('webrtc:call:participant_joined', ({ userId }) => { toast(`${userId} joined`, { icon: '👋' }); });
    }, [socket, conversations.length]);

    const cleanupSocketListeners = useCallback(() => {
        if (!socket) return;
        socketListenersAttached.current = false;
        ['receive_message','message_sent','message:edited','message:deleted','message:deleted:everyone','reaction:update','message:read','message:pinned','message:unpinned','typing:start','typing:stop','users_online','user_online','user_offline','message:starred','webrtc:call:incoming','webrtc:signal','webrtc:call:ended','webrtc:call:participant_left','webrtc:call:participant_joined'].forEach(e => socket.off(e));
    }, [socket]);

    useEffect(() => {
        getConversations(); fetchFollowingUsers();
        if (socket?.connected) { setupSocketListeners(); socket.emit('get_online_users'); }
        const onConnect = () => { setupSocketListeners(); socket?.emit('get_online_users'); getConversations(); };
        socket?.on('connect', onConnect);
        return () => { cleanupSocketListeners(); socket?.off('connect', onConnect); if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); };
    }, [socket?.id]);

    useEffect(() => { if (selectedConversation?._id) { getMessages(selectedConversation._id); markConversationAsRead(selectedConversation._id); } }, [selectedConversation?._id]);
    useEffect(() => { scrollToBottom(); }, [messages]);
    useEffect(() => { if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream; }, [localStream]);
    useEffect(() => { remoteStreams.forEach((stream, userId) => { const el = remoteVideoRefs.current.get(userId); if (el) el.srcObject = stream; }); }, [remoteStreams]);

    // Outside click handlers
    useEffect(() => { const h = (e) => { if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false); }; if (showEmojiPicker) { document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); } }, [showEmojiPicker]);
    useEffect(() => { const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(null); }; if (showMenu) { document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); } }, [showMenu]);
    useEffect(() => { const h = (e) => { if (attachmentRef.current && !attachmentRef.current.contains(e.target)) setShowAttachmentMenu(false); }; if (showAttachmentMenu) { document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); } }, [showAttachmentMenu]);
    useEffect(() => { const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); }; if (showSearch) { document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); } }, [showSearch]);
    useEffect(() => { const h = (e) => { if (contactInfoRef.current && !contactInfoRef.current.contains(e.target)) setShowContactInfo(false); }; if (showContactInfo) { document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); } }, [showContactInfo]);

    // ==================== Helpers ====================

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    const getOtherUser = (conversation) => { if (!conversation?.participants || !authUser) return null; return conversation.participants.find(p => p._id !== authUser._id); };
    const isOnline = (userId) => Array.isArray(onlineUsers) && onlineUsers.includes(userId);
    const isTyping = (userId) => Array.isArray(typingUsers) && typingUsers.includes(userId);
    const getIsOwn = (message) => { if (!message || !authUser) return false; const senderId = message.senderId?._id || message.senderId; return String(senderId) === String(authUser._id); };
    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatMessageTime = (date) => { const now = new Date(); const d = new Date(date); const diff = now - d; if (diff < 86400000) return formatTime(date); if (diff < 172800000) return 'Yesterday'; if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`; return d.toLocaleDateString(); };
    const getMessageStatusIcon = (message) => { if (!getIsOwn(message)) return null; if (message.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />; if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-800" />; if (message.status === 'sent' || message.status === 'sending') return <Check className="w-3.5 h-3.5 text-gray-800" />; if (message.status === 'failed') return <Clock className="w-3.5 h-3.5 text-red-400" />; return <Clock className="w-3.5 h-3.5 text-gray-400" />; };

    const fetchFollowingUsers = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/auth/get-following', { headers: { Authorization: `Bearer ${token}` } });
            const ids = Array.isArray(res.data) ? res.data : (res.data?.following || []);
            const users = (await Promise.all(ids.map(async (id) => { try { const r = await axiosInstance.get(`/auth/get-user-by-id/${id}`, { headers: { Authorization: `Bearer ${token}` } }); return r.data; } catch { return null; } }))).filter(Boolean);
            setFollowingUsers(users);
        } catch (error) { console.error('Error fetching users:', error); setFollowingUsers([]); }
    };

    // ==================== Send Message ====================

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedFile) return;
        if (editingMessageId) { await editMessage({ messageId: editingMessageId, newText: messageText }); setEditingMessageId(null); }
        else {
            const tempId = `temp_${Date.now()}`; addedMessageIds.current.add(tempId);
            const optimisticMessage = { _id: tempId, senderId: { _id: authUser?._id, displayName: authUser?.displayName }, text: messageText, conversationId: selectedConversation?._id, createdAt: new Date().toISOString(), status: 'sending', media: selectedFile ? [{ url: selectedFile.url, mime: selectedFile.type, size: selectedFile.size, filename: selectedFile.name }] : [], replyTo: replyingTo || undefined };
            addMessage(optimisticMessage); scrollToBottom();
            try {
                const result = await sendMessage({ receiverId: getOtherUser(selectedConversation)?._id, conversationId: selectedConversation?._id, text: messageText, replyTo: replyingTo?._id || undefined, media: selectedFile ? [{ url: selectedFile.url, mime: selectedFile.type, size: selectedFile.size, filename: selectedFile.name }] : undefined });
                if (result?._id) { removeMessage(tempId); addedMessageIds.current.add(result._id); addMessage(result); }
            } catch (error) { updateMessage(tempId, { status: 'failed' }); toast.error('Failed to send message'); }
        }
        setMessageText(""); setSelectedFile(null); setReplyingTo(null); setShowEmojiPicker(false);
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } const otherId = getOtherUser(selectedConversation)?._id; if (otherId && e.target.value) startTyping({ toUserId: otherId }); else if (otherId) stopTyping({ toUserId: otherId }); };
    const handleFileSelect = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => setSelectedFile({ file, url: reader.result, type: file.type, size: file.size, name: file.name }); reader.readAsDataURL(file); };
    const handleEmojiSelect = (emoji) => { setMessageText(prev => prev + emoji.native); };

    // ==================== Message Actions ====================

    const handleReaction = async (messageId, reaction) => { await reactToMessage({ messageId, reaction }); setShowReactionPicker(null); };
    const handleReply = (message) => { setReplyingTo(message); setShowMenu(null); messageInputRef.current?.focus(); };
    const handleEdit = (message) => { if (!getIsOwn(message)) return; setEditingMessageId(message._id); setMessageText(message.text || ''); setShowMenu(null); messageInputRef.current?.focus(); };
    const handleDelete = async (messageId) => { await deleteMessage({ messageId }); setShowMenu(null); };
    const handleForward = (messageId) => { const msg = messages.find(m => m._id === messageId); if (!msg) return; setMessageToForward(msg); setForwardTargets([]); setShowForwardModal(true); setShowMenu(null); };
    const handleStar = async (messageId) => { await starMessage(messageId); setShowMenu(null); };
    const handleCopy = (text) => { if (navigator.clipboard && text) { navigator.clipboard.writeText(text).then(() => toast.success('Copied')); } setShowMenu(null); };
    const handleReportMessage = async (messageId) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post(`/chat/message/${messageId}/report`,
                { reason: 'Inappropriate message' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Message reported');
        } catch (error) {
            console.error('Failed to report message:', error);
            toast.error('Failed to report message');
        }
        setShowMenu(null);
    };    const handlePinMessage = (messageId) => { setShowPinDurationModal(messageId); setShowMenu(null); };
    const handlePinDurationSelect = async (duration) => { const messageId = showPinDurationModal; if (!messageId) return; if (duration === null) { await unpinMessage(messageId); toast.success('Message unpinned'); } else { await pinMessage({ messageId, duration }); toast.success(`Message pinned for ${duration} hours`); } setShowPinDurationModal(null); };
    const handleForwardSubmit = async () => { if (!messageToForward || forwardTargets.length === 0) return; await forwardMessage({ messageId: messageToForward._id, targets: forwardTargets }); setShowForwardModal(false); setMessageToForward(null); setForwardTargets([]); toast.success('Forwarded'); };
    const handleContextMenu = (e, messageId) => { e.preventDefault(); setMenuPosition({ x: e.clientX, y: e.clientY }); setShowMenu(messageId); };

    // ==================== Poll & Event ====================

    const handleCreatePoll = async () => { if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) { toast.error('Add a question and at least 2 options'); return; } await sendMessage({ receiverId: getOtherUser(selectedConversation)?._id, conversationId: selectedConversation?._id, text: `📊 Poll: ${pollQuestion}`, poll: { question: pollQuestion, options: pollOptions.filter(o => o.trim()) } }); setShowPollModal(false); setPollQuestion(''); setPollOptions(['', '']); };
    const handleCreateEvent = async () => { if (!eventName.trim() || !eventDate) { toast.error('Event name and date required'); return; } await sendMessage({ receiverId: getOtherUser(selectedConversation)?._id, conversationId: selectedConversation?._id, text: `📅 Event: ${eventName}\nDate: ${eventDate}${eventTime ? `\nTime: ${eventTime}` : ''}${eventLocation ? `\nLocation: ${eventLocation}` : ''}`, event: { name: eventName, date: eventDate, time: eventTime, location: eventLocation } }); setShowEventModal(false); setEventName(''); setEventDate(''); setEventTime(''); setEventLocation(''); };
    const handleShareContact = (user) => { setContactToShare(user); setShowShareContactModal(true); };
    const handleShareContactConfirm = async () => { if (!contactToShare || !selectedConversation) return; await sendMessage({ receiverId: getOtherUser(selectedConversation)?._id, conversationId: selectedConversation?._id, text: `👤 Contact: ${contactToShare.displayName}`, contact: { name: contactToShare.displayName, userId: contactToShare._id, username: contactToShare.username } }); setShowShareContactModal(false); setContactToShare(null); toast.success('Contact shared'); };

    // ==================== Recording ====================

    const startRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const mr = new MediaRecorder(stream); const chunks = []; mr.ondataavailable = e => chunks.push(e.data); mr.onstop = () => { const blob = new Blob(chunks, { type: 'audio/webm' }); setSelectedFile({ file: blob, url: URL.createObjectURL(blob), type: 'audio/webm', size: blob.size, name: 'voice-message.webm', isVoice: true }); stream.getTracks().forEach(t => t.stop()); }; mr.start(); setIsRecording(true); setRecordingDuration(0); recordingIntervalRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000); window._mediaRecorder = mr; } catch (error) { toast.error('Microphone access denied'); } };
    const stopRecording = () => { if (window._mediaRecorder?.state !== 'inactive') window._mediaRecorder?.stop(); setIsRecording(false); if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); setRecordingDuration(0); };

    // ==================== Call Functions ====================

    const createPeerConnection = (targetUserId) => { const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); pc.onicecandidate = e => { if (e.candidate) socket?.emit('webrtc:signal', { toUserId: targetUserId, type: 'ice', data: e.candidate }); }; pc.ontrack = e => { setRemoteStreams(prev => { const n = new Map(prev); n.set(targetUserId, e.streams[0]); return n; }); }; pc.onconnectionstatechange = () => { if (['disconnected','failed'].includes(pc.connectionState)) { setRemoteStreams(prev => { const n = new Map(prev); n.delete(targetUserId); return n; }); } }; peerConnectionsRef.current.set(targetUserId, pc); return pc; };

    const startCall = async (isVideo) => { const otherId = getOtherUser(selectedConversation)?._id; if (!otherId) return; try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo }); setLocalStream(stream); setIsVideoMode(isVideo); setIsVideoOff(false); setIsMicMuted(false); const pc = createPeerConnection(otherId); stream.getTracks().forEach(t => pc.addTrack(t, stream)); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); const callId = Date.now().toString(); setActiveCall({ callId, isVideo, otherUserId: otherId }); socket?.emit('webrtc:call:initiate', { targets: [otherId], isVideo, metadata: { callerName: authUser?.displayName } }); setTimeout(() => { socket?.emit('webrtc:signal', { toUserId: otherId, type: 'offer', data: offer }); }, 500); } catch (error) { toast.error('Camera/mic access denied'); } };

    const acceptCall = async () => { if (!incomingCall) return; try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.isVideo }); setLocalStream(stream); setIsVideoMode(incomingCall.isVideo); setIsVideoOff(false); setIsMicMuted(false); const pc = createPeerConnection(incomingCall.callerId); stream.getTracks().forEach(t => pc.addTrack(t, stream)); setActiveCall({ callId: incomingCall.callId, isVideo: incomingCall.isVideo, otherUserId: incomingCall.callerId }); setIncomingCall(null); socket?.emit('webrtc:call:join', { callId: incomingCall.callId }); } catch (error) { toast.error('Camera/mic access denied'); rejectCall(); } };

    const rejectCall = () => { if (incomingCall) { socket?.emit('webrtc:call:leave', { callId: incomingCall.callId }); setIncomingCall(null); } };

    const cleanupCall = () => { if (localStream) localStream.getTracks().forEach(t => t.stop()); if (screenStream) screenStream.getTracks().forEach(t => t.stop()); peerConnectionsRef.current.forEach(pc => pc.close()); peerConnectionsRef.current.clear(); setLocalStream(null); setRemoteStreams(new Map()); setScreenStream(null); setActiveCall(null); setIncomingCall(null); setIsSharingScreen(false); setIsCallMinimized(false); };

    const endCall = () => { if (activeCall) { socket?.emit('webrtc:call:end', { callId: activeCall.callId }); } cleanupCall(); };

    const toggleVideoMode = async () => { if (!localStream || !activeCall) return; try { if (isVideoMode) { localStream.getVideoTracks().forEach(t => t.stop()); const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); const pc = peerConnectionsRef.current.get(activeCall.otherUserId); const sender = pc?.getSenders().find(s => s.track?.kind === 'audio'); if (sender) await sender.replaceTrack(audioStream.getAudioTracks()[0]); setLocalStream(audioStream); setIsVideoMode(false); setIsVideoOff(true); } else { const videoStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: isFrontCamera ? 'user' : 'environment' } }); const pc = peerConnectionsRef.current.get(activeCall.otherUserId); const videoTrack = videoStream.getVideoTracks()[0]; const sender = pc?.getSenders().find(s => s.track?.kind === 'video'); if (sender) await sender.replaceTrack(videoTrack); else pc?.addTrack(videoTrack, videoStream); const audioSender = pc?.getSenders().find(s => s.track?.kind === 'audio'); if (audioSender) await audioSender.replaceTrack(videoStream.getAudioTracks()[0]); setLocalStream(videoStream); setIsVideoMode(true); setIsVideoOff(false); } } catch (error) { toast.error('Could not switch'); } };

    const toggleMute = () => { if (localStream) { localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setIsMicMuted(!isMicMuted); } };
    const toggleVideo = () => { if (localStream) { localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setIsVideoOff(!isVideoOff); } };

    const flipCamera = async () => { if (!localStream || !isVideoMode) return; try { localStream.getVideoTracks().forEach(t => t.stop()); const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isFrontCamera ? 'environment' : 'user' }, audio: true }); const pc = peerConnectionsRef.current.get(activeCall?.otherUserId); const sender = pc?.getSenders().find(s => s.track?.kind === 'video'); if (sender) await sender.replaceTrack(newStream.getVideoTracks()[0]); setLocalStream(newStream); setIsFrontCamera(!isFrontCamera); } catch (error) { toast.error('Could not flip camera'); } };

    const shareScreen = async () => { if (!activeCall) return; try { if (isSharingScreen) { if (screenStream) screenStream.getTracks().forEach(t => t.stop()); setIsSharingScreen(false); const pc = peerConnectionsRef.current.get(activeCall.otherUserId); const sender = pc?.getSenders().find(s => s.track?.kind === 'video'); if (sender && localStream) { const videoTrack = localStream.getVideoTracks()[0]; if (videoTrack) await sender.replaceTrack(videoTrack); } } else { const stream = await navigator.mediaDevices.getDisplayMedia({ video: true }); setScreenStream(stream); setIsSharingScreen(true); stream.getVideoTracks()[0].onended = () => { setIsSharingScreen(false); const pc = peerConnectionsRef.current.get(activeCall.otherUserId); const sender = pc?.getSenders().find(s => s.track?.kind === 'video'); if (sender && localStream) { const videoTrack = localStream.getVideoTracks()[0]; if (videoTrack) sender.replaceTrack(videoTrack); } }; const pc = peerConnectionsRef.current.get(activeCall.otherUserId); const sender = pc?.getSenders().find(s => s.track?.kind === 'video'); if (sender) await sender.replaceTrack(stream.getVideoTracks()[0]); else pc?.addTrack(stream.getVideoTracks()[0], stream); } } catch (error) { toast.error('Could not share screen'); } };

    const toggleCallMinimize = () => { setIsCallMinimized(!isCallMinimized); };

    // ==================== Conversation Actions ====================

    const handlePinConversation = async () => { await pinConversation(showConversationMenu); setShowConversationMenu(null); };
    const handleArchiveConversation = async () => { await archiveConversation(showConversationMenu); setShowConversationMenu(null); };
    const handleMuteConversation = async (duration) => { await muteConversation(showConversationMenu, duration); setShowConversationMenu(null); };
    const handleClearChat = async () => { if (window.confirm('Clear this chat?')) { await clearChat(selectedConversation?._id); setShowConversationMenu(null); } };
    const handleSearchMessages = async () => { if (!searchQuery.trim() || !selectedConversation) return; const results = await searchMessages(selectedConversation._id, searchQuery); setSearchResults(results || []); };
    const handleCreateGroup = async () => { if (!groupName.trim()) return; await createGroup({ name: groupName, participantIds: selectedParticipants }); setShowNewGroupModal(false); setGroupName(""); setSelectedParticipants([]); };
    const handleBlockContact = async () => { const user = getOtherUser(selectedConversation); if (!user) return; try { const token = localStorage.getItem('access-token'); await axiosInstance.post(`/auth/block/${user._id}`, {}, { headers: { Authorization: `Bearer ${token}` } }); toast.success('Contact blocked'); } catch (error) { toast.error('Failed to block contact'); } setShowConversationMenu(null); };
    const handleReportContact = async () => {
        const user = getOtherUser(selectedConversation);
        if (!user) return;
        try {
            const token = localStorage.getItem('access-token');
            // Use the new report-user route instead of report
            await axiosInstance.post(`/auth/report-user/${user._id}`,
                { reason: 'Reported from chat' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Contact reported');
        } catch (error) {
            console.error('Failed to report contact:', error);
            toast.error('Failed to report contact');
        }
        setShowConversationMenu(null);
    };    const handleGoToProfile = () => { const user = getOtherUser(selectedConversation); if (user?.username) navigate(`/profile/${user.username}`); };
    const handleLockChat = () => { toast('Lock chat - password required'); setShowConversationMenu(null); };
    const handleAddToFavorites = async () => { try { const token = localStorage.getItem('access-token'); await axiosInstance.put(`/chat/conversation/${selectedConversation?._id}/favorite`, {}, { headers: { Authorization: `Bearer ${token}` } }); toast.success('Added to favorites'); await getConversations(); } catch (error) { toast.error('Failed to add to favorites'); } setShowConversationMenu(null); };

    // ==================== Conversation Filtering ====================

    const getFilteredConversations = () => {
        return conversations.filter(c => {
            if (showArchiveSection) return c.archivedBy?.includes(authUser?._id);
            if (showLockedSection) return c.lockedBy?.includes(authUser?._id);
            if (showFavoritesSection) return c.favoritedBy?.includes(authUser?._id);
            if (c.archivedBy?.includes(authUser?._id)) return false;
            if (c.lockedBy?.includes(authUser?._id)) return false;
            const matchesSearch = !conversationSearchQuery || c.participants?.some(p => p.displayName?.toLowerCase().includes(conversationSearchQuery.toLowerCase())) || (c.isGroup && c.groupName?.toLowerCase().includes(conversationSearchQuery.toLowerCase()));
            return matchesSearch;
        });
    };

    const sortedConversations = [...getFilteredConversations()].sort((a, b) => {
        const aPinned = a.pinnedBy?.includes(authUser?._id) ? 1 : 0;
        const bPinned = b.pinnedBy?.includes(authUser?._id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime() - new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
    });

    const unreadCount = conversations.filter(c => { const unread = c.unreadCount instanceof Map ? c.unreadCount.get(authUser?._id) || 0 : (c.unreadCount?.[authUser?._id] || 0); return unread > 0 && !c.archivedBy?.includes(authUser?._id); }).length;
    const favoritesCount = conversations.filter(c => c.favoritedBy?.includes(authUser?._id)).length;
    const groupsCount = conversations.filter(c => c.isGroup && !c.archivedBy?.includes(authUser?._id)).length;

    // ==================== Render Message ====================

    const renderMessage = (message) => {
        if (!message) return null;
        const isOwn = getIsOwn(message);
        const isDeleted = message.deletedAt || message.deletedForEveryone;
        if (isDeleted) return (<div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-4`}><div className="bg-gray-100 rounded-xl px-4 py-2"><p className="text-gray-400 text-xs italic">This message was deleted</p></div></div>);

        return (
            <div className={`flex items-end mb-1 px-4 group ${isOwn ? 'justify-end' : 'justify-start'}`} onContextMenu={(e) => handleContextMenu(e, message._id)}>
                {/* Action buttons - horizontal, correct side */}
                <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'order-1 mr-1' : 'order-2 ml-1'}`}>
                    <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setReactionPickerPos({ top: rect.top - 60, left: rect.left }); setShowReactionPicker(message._id); }} className="p-1 hover:bg-gray-100 rounded-full" title="React"><Smile className="w-4 h-4 text-gray-400" /></button>
                    <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMenuPosition({ x: rect.left, y: rect.bottom + 4 }); setShowMenu(message._id); }} className="p-1 hover:bg-gray-100 rounded-full" title="More"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                </div>
                {/* Message bubble */}
                <div className={`relative max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {message.pinned && <div className="absolute -top-4 left-2 flex items-center gap-1"><Pin className="w-3 h-3 text-blue-400" /><span className="text-[10px] text-blue-400">Pinned</span></div>}
                    {message.starredBy?.includes(authUser?._id) && <div className="absolute -top-4 right-2"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /></div>}
                    {message.replyTo && (
                        <div className={`text-xs px-3 py-1 rounded-t-xl border-l-2 mb-0.5 ${isOwn ? 'bg-gray-500 text-white border-gray-300' : 'bg-gray-200 text-gray-600 border-gray-400'}`}>
                            <p className="font-semibold truncate">{message.replyTo.senderId?._id === authUser?._id ? 'You' : message.replyTo.senderId?.displayName || 'User'}</p>
                            <p className="truncate opacity-75">{message.replyTo.text?.substring(0, 60) || 'Media'}</p>
                        </div>
                    )}
                    <div className={`rounded-xl px-3 py-2 shadow-sm ${isOwn ? 'bg-gray-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'}`}>
                        {message.poll && (<div className="mb-2 bg-white/10 rounded-lg p-2"><p className="font-semibold text-sm mb-2">📊 {message.poll.question}</p>{message.poll.options.map((opt, i) => <button key={i} className="w-full text-left px-2 py-1.5 bg-white/20 rounded mb-1 text-xs hover:bg-white/30">{opt}</button>)}</div>)}
                        {message.event && (<div className="mb-2 bg-white/10 rounded-lg p-2"><p className="font-semibold text-sm">📅 {message.event.name}</p><p className="text-xs opacity-80">Date: {message.event.date}{message.event.time ? ` • Time: ${message.event.time}` : ''}{message.event.location ? ` • Location: ${message.event.location}` : ''}</p></div>)}
                        {message.contact && (<div className="mb-2 bg-white/10 rounded-lg p-2 flex items-center gap-2 cursor-pointer" onClick={() => message.contact.username && navigate(`/profile/${message.contact.username}`)}><div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"><Contact className="w-4 h-4" /></div><div><p className="text-xs font-semibold">{message.contact.name}</p><p className="text-[10px] opacity-75">@{message.contact.username}</p></div></div>)}
                        {message.media && message.media.length > 0 && message.media.map((m, i) => (
                            <div key={i} className={`mb-1 ${message.isVoiceMessage ? '' : 'max-w-[240px]'}`}>
                                {m.mime?.startsWith('image/') ? <img src={m.url} alt="" className="rounded-lg w-full" loading="lazy" /> : m.mime?.startsWith('video/') ? (message.isVoiceMessage ? <div className="w-40 h-40 rounded-full overflow-hidden relative"><video src={m.url} className="w-full h-full object-cover" /><div className="absolute inset-0 flex items-center justify-center"><Play className="w-8 h-8 text-white drop-shadow-lg" /></div></div> : <video src={m.url} controls className="rounded-lg w-full" />) : m.mime?.startsWith('audio/') ? <audio src={m.url} controls className="w-full" /> : <div className="flex items-center gap-2 bg-white/20 p-2 rounded"><FileText className="w-6 h-6" /><span className="text-xs truncate">{m.filename || 'File'}</span></div>}
                            </div>
                        ))}
                        {message.isVoiceMessage && message.media?.[0] && (
                            <div className="flex items-center gap-2 min-w-[180px] py-1">
                                <button className="p-1.5 rounded-full hover:bg-white/20 flex-shrink-0" onClick={() => { if (isPlayingAudio === message._id) { audioRef.current?.pause(); setIsPlayingAudio(null); } else { setIsPlayingAudio(message._id); setTimeout(() => { if (audioRef.current) { audioRef.current.src = message.media[0].url; audioRef.current.play().catch(() => {}); } }, 50); } }}>{isPlayingAudio === message._id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${isPlayingAudio === message._id ? audioProgress : 0}%` }} /></div>
                                <span className="text-xs flex-shrink-0">{message.voiceDuration || 0}s</span>
                            </div>
                        )}
                        {message.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>}
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-gray-200' : 'justify-end text-gray-400'}`}>
                            {message.editedAt && <span className="text-[10px]">edited</span>}
                            <span className="text-[10px]">{formatMessageTime(message.createdAt)}</span>
                            {getMessageStatusIcon(message)}
                        </div>
                    </div>
                    {message.reactions && Object.keys(message.reactions).length > 0 && (<div className={`absolute -bottom-2 ${isOwn ? 'left-2' : 'right-2'} flex gap-0.5`}>{Object.values(message.reactions).slice(0, 3).map((r, i) => <span key={i} className="text-xs bg-white shadow px-1.5 py-0.5 rounded-full border">{r}</span>)}</div>)}
                </div>
                {showReactionPicker === message._id && (<div className="fixed z-50" style={{ top: reactionPickerPos.top, left: Math.min(reactionPickerPos.left, window.innerWidth - 320) }}><ReactionEmojiPicker postId={message._id} onReact={(emoji) => handleReaction(message._id, emoji)} onClose={() => setShowReactionPicker(null)} isOpen={true} /></div>)}
            </div>
        );
    };

    // ==================== RENDER ====================

    return (
        <div className="w-full flex h-screen bg-white overflow-hidden">
            <Sidebar />
            {/* ========== Conversation List ========== */}
            <div className="w-full md:w-[380px] lg:w-[420px] border-r border-gray-100 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-gray-800">{showArchiveSection ? 'Archived' : showLockedSection ? 'Locked' : showFavoritesSection ? 'Favorites' : 'Chats'}</h2>
                        <div className="flex gap-1">
                            <button onClick={() => { setShowArchiveSection(false); setShowLockedSection(false); setShowFavoritesSection(false); }} className={`p-2 rounded-full transition-colors ${!showArchiveSection&&!showLockedSection&&!showFavoritesSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`} title="All Chats"><MessageCircle className="w-5 h-5" /></button>
                            <button onClick={() => { setShowArchiveSection(true); setShowLockedSection(false); setShowFavoritesSection(false); }} className={`p-2 rounded-full transition-colors ${showArchiveSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`} title="Archived"><Archive className="w-5 h-5" /></button>
                            <button onClick={() => { setShowLockedSection(true); setShowArchiveSection(false); setShowFavoritesSection(false); }} className={`p-2 rounded-full transition-colors ${showLockedSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`} title="Locked"><Lock className="w-5 h-5" /></button>
                            <button onClick={() => { setShowFavoritesSection(true); setShowArchiveSection(false); setShowLockedSection(false); }} className={`p-2 rounded-full transition-colors ${showFavoritesSection?'bg-blue-50 text-blue-400':'hover:bg-gray-100 text-gray-500'}`} title="Favorites"><Heart className="w-5 h-5" /></button>
                            <button onClick={() => setShowNewGroupModal(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="New Group"><Users className="w-5 h-5 text-gray-500" /></button>
                        </div>
                    </div>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:bg-white transition-all" value={conversationSearchQuery} onChange={(e) => setConversationSearchQuery(e.target.value)} /></div>
                </div>
                {!showArchiveSection && !showLockedSection && !showFavoritesSection && (
                    <div className="flex gap-2 px-4 py-2 border-b border-gray-50 overflow-x-auto">
                        <button className="px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-xs font-medium whitespace-nowrap">All</button>
                        {unreadCount > 0 && <button className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs whitespace-nowrap hover:bg-gray-100">Unread ({unreadCount})</button>}
                        {favoritesCount > 0 && <button className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs whitespace-nowrap hover:bg-gray-100">Favorites ({favoritesCount})</button>}
                        {groupsCount > 0 && <button className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs whitespace-nowrap hover:bg-gray-100">Groups ({groupsCount})</button>}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    {isConversationsLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : sortedConversations.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">No conversations</div> : sortedConversations.map((conv) => {
                        const other = getOtherUser(conv);
                        const unread = conv.unreadCount instanceof Map ? conv.unreadCount.get(authUser?._id) || 0 : (conv.unreadCount?.[authUser?._id] || 0);
                        const isPinned = conv.pinnedBy?.includes(authUser?._id); const isSelected = selectedConversation?._id === conv._id;
                        const isMuted = conv.mutedBy?.find(m => m.user === authUser?._id);
                        return (
                            <div key={conv._id} onClick={() => selectConversation(conv)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-r-2 border-blue-400' : ''}`}>
                                <div className="relative flex-shrink-0"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 overflow-hidden">{conv.isGroup ? <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">{conv.groupName?.charAt(0) || 'G'}</div> : <img src={other?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />}</div>{isOnline(other?._id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-800 truncate text-sm">{conv.isGroup ? conv.groupName : other?.displayName || 'Unknown'}</h3>{conv.lastMessage && <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatMessageTime(conv.lastMessage.createdAt)}</span>}</div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <p className="text-xs text-gray-500 truncate">{isTyping(other?._id) ? <span className="text-blue-400 italic">typing...</span> : isMuted ? <span className="flex items-center gap-1"><VolumeX className="w-3 h-3" />{conv.lastMessage?.text || 'No messages'}</span> : conv.lastMessage?.text || 'No messages'}</p>
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">{isPinned && <Pin className="w-3 h-3 text-blue-400" />}{unread > 0 && <span className="bg-blue-400 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread > 99 ? '99+' : unread}</span>}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ========== Chat Area ========== */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                {selectedConversation ? (<>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowContactInfo(true)}>
                        <div className="flex items-center gap-3">
                            <div className="relative"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 overflow-hidden">{selectedConversation.isGroup ? <div className="w-full h-full flex items-center justify-center text-white font-bold">{selectedConversation.groupName?.charAt(0) || 'G'}</div> : <img src={getOtherUser(selectedConversation)?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />}</div>{isOnline(getOtherUser(selectedConversation)?._id) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}</div>
                            <div><h3 className="font-semibold text-gray-800 text-sm">{selectedConversation.isGroup ? selectedConversation.groupName : getOtherUser(selectedConversation)?.displayName || 'Unknown'}</h3><p className="text-xs text-gray-400">{isTyping(getOtherUser(selectedConversation)?._id) ? 'typing...' : isOnline(getOtherUser(selectedConversation)?._id) ? 'online' : 'last seen recently'}</p></div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); startCall(false); }} className="p-2 hover:bg-gray-100 rounded-full"><Phone className="w-5 h-5 text-gray-500" /></button>
                            <button onClick={(e) => { e.stopPropagation(); startCall(true); }} className="p-2 hover:bg-gray-100 rounded-full"><Video className="w-5 h-5 text-gray-500" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); }} className="p-2 hover:bg-gray-100 rounded-full"><Search className="w-5 h-5 text-gray-500" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setShowConversationMenu(selectedConversation._id); }} className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical className="w-5 h-5 text-gray-500" /></button>
                        </div>
                    </div>
                    {/* Pinned messages bar */}
                    {pinnedMessages.length > 0 && (<div className="px-4 py-2 bg-blue-50 border-b border-blue-100 cursor-pointer flex items-center gap-2" onClick={() => setShowPinnedMsgs(!showPinnedMsgs)}><Pin className="w-4 h-4 text-blue-400" /><span className="text-sm text-blue-500 font-medium">{pinnedMessages.length} pinned</span></div>)}
                    {/* Search */}
                    <AnimatePresence>{showSearch && (<motion.div ref={searchRef} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white border-b border-gray-100 overflow-hidden"><div className="p-3 flex gap-2"><input type="text" placeholder="Search messages..." className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchMessages()} autoFocus /><button onClick={handleSearchMessages} className="px-4 py-2 bg-blue-400 text-white rounded-xl text-sm font-medium hover:bg-blue-500">Search</button><button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(''); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button></div>{searchResults.length > 0 && <div className="max-h-48 overflow-y-auto px-4 pb-3">{searchResults.map(msg => <div key={msg._id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-600">{msg.text?.substring(0, 100)}</div>)}</div>}</motion.div>)}</AnimatePresence>
                    {/* Messages */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 space-y-0.5">{isMessagesLoading ? <div className="text-center text-gray-400 mt-20">Loading messages...</div> : messages.length === 0 ? <EmptyChatPlaceholder /> : <>{messages.map((message) => <div key={message._id}>{renderMessage(message)}</div>)}{isTyping(getOtherUser(selectedConversation)?._id) && <TypingIndicator />}<div ref={messagesEndRef} /></>}</div>
                    {/* Reply Preview */}
                    <AnimatePresence>{replyingTo && (<motion.div ref={replyRef} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-3"><div className="w-1 h-10 bg-blue-400 rounded-full" /><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-blue-400">{replyingTo.senderId?._id === authUser?._id ? 'You' : replyingTo.senderId?.displayName || 'User'}</p><p className="text-xs text-gray-500 truncate">{replyingTo.text || 'Media message'}</p></div><button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button></motion.div>)}</AnimatePresence>
                    {/* File Preview */}
                    <AnimatePresence>{selectedFile && (<motion.div ref={fileRef} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="px-4 py-2 bg-white border-t border-gray-100"><div className="flex items-center justify-between"><div className="flex items-center gap-2">{selectedFile.type?.startsWith('image/') ? <img src={selectedFile.url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : selectedFile.type?.startsWith('video/') ? <video src={selectedFile.url} className="w-12 h-12 rounded-lg object-cover" /> : selectedFile.isVoice ? <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Mic className="w-6 h-6 text-blue-400" /></div> : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-gray-400" /></div>}<div><p className="text-xs font-medium text-gray-700">{selectedFile.name}</p><p className="text-[10px] text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p></div></div><button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button></div></motion.div>)}</AnimatePresence>
                    {/* Message Input */}
                    <div className="px-4 py-3 bg-white border-t border-gray-100">
                        {isRecording && <div className="mb-2"><RecordingWaveform duration={recordingDuration} /></div>}
                        <div className="flex items-end gap-2">
                            <div className="relative">
                                <button onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className="p-2 hover:bg-gray-100 rounded-full"><Paperclip className="w-5 h-5 text-gray-400" /></button>
                                <AnimatePresence>{showAttachmentMenu && (<motion.div ref={attachmentRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-12 left-0 bg-white rounded-xl shadow-xl border py-1 w-48 z-50">
                                    {[{ Icon: ImageIcon, label: 'Photo/Video', action: () => fileInputRef.current?.click() },{ Icon: Camera, label: 'Camera', action: () => fileInputRef.current?.click() },{ Icon: FileText, label: 'Document', action: () => fileInputRef.current?.click() },{ Icon: MapPin, label: 'Location', action: () => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition((pos) => setMessageText(prev => prev + `📍 ${pos.coords.latitude}, ${pos.coords.longitude}`), () => toast.error('Location unavailable')); } },{ Icon: Contact, label: 'Contact', action: () => { setShowContactList(true); } },{ Icon: BarChart3, label: 'Poll', action: () => { setShowPollModal(true); } },{ Icon: Calendar, label: 'Event', action: () => { setShowEventModal(true); } }].map((item, i) => { const IconComponent = item.Icon; return (<button key={i} onClick={() => { item.action(); setShowAttachmentMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><IconComponent className="w-4 h-4" /> {item.label}</button>); })}
                                </motion.div>)}</AnimatePresence>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" />
                            </div>
                            <div className="flex-1 relative">
                                <textarea ref={messageInputRef} value={messageText} onChange={(e) => { setMessageText(e.target.value); const otherId = getOtherUser(selectedConversation)?._id; if (otherId && e.target.value) startTyping({ toUserId: otherId }); else if (otherId) stopTyping({ toUserId: otherId }); const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }} onKeyDown={handleKeyDown} placeholder={editingMessageId ? "Edit message..." : "Type a message..."} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:bg-white transition-all" rows={1} style={{ minHeight: '40px', maxHeight: '120px' }} />
                            </div>
                            <div className="relative">
                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-gray-100 rounded-full"><Smile className="w-5 h-5 text-gray-400" /></button>
                                <AnimatePresence>{showEmojiPicker && (<motion.div ref={emojiPickerRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-12 right-0 z-50"><EmojiPicker inputRef={messageInputRef} value={messageText} setValue={setMessageText} /></motion.div>)}</AnimatePresence>
                            </div>
                            {messageText.trim() || selectedFile ? <button onClick={handleSendMessage} className="p-2.5 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors shadow-sm"><Send className="w-5 h-5" /></button> : isRecording ? <button onClick={stopRecording} className="p-2.5 bg-red-400 text-white rounded-full hover:bg-red-500 transition-colors animate-pulse"><X className="w-5 h-5" /></button> : <button onClick={startRecording} className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-gray-100 rounded-full transition-colors"><Mic className="w-5 h-5" /></button>}
                        </div>
                    </div>
                </>) : <NoConversationPlaceholder />}
            </div>

            {/* ========== Contact Info Panel ========== */}
            <AnimatePresence>{showContactInfo && selectedConversation && !selectedConversation.isGroup && (() => { const user = getOtherUser(selectedConversation); return (
                <motion.div ref={contactInfoRef} initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="w-[350px] border-l border-gray-100 bg-white overflow-y-auto flex-shrink-0">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6"><h3 className="font-bold text-lg">Contact Info</h3><button onClick={() => setShowContactInfo(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button></div>
                        <div className="text-center mb-6"><div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 mx-auto mb-3 overflow-hidden"><img src={user?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" /></div><h4 className="font-bold text-lg">{user?.displayName}</h4><p className="text-gray-500 text-sm">@{user?.username}</p><p className="text-xs text-gray-400 mt-1">{user?.bio || 'No bio'}</p></div>
                        <div className="space-y-1">
                            <button onClick={handleGoToProfile} className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><ExternalLink className="w-4 h-4" /> Go to Profile</button>
                            <button className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><ImageIcon className="w-4 h-4" /> Media, Links & Docs</button>
                            <button className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><Star className="w-4 h-4" /> Starred Messages</button>
                            <button className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><Users className="w-4 h-4" /> Groups in Common</button>
                            <button onClick={() => { handleShareContact(user); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><Contact className="w-4 h-4" /> Share Contact</button>
                            <button onClick={() => { handleLockChat(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><Lock className="w-4 h-4" /> Lock Chat</button>
                            <button onClick={() => { handleAddToFavorites(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"><Heart className="w-4 h-4" /> Add to Favorites</button>
                            <button onClick={() => { handleBlockContact(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-red-50 rounded-xl flex items-center gap-3 text-sm text-red-500"><UserX className="w-4 h-4" /> Block Contact</button>
                            <button onClick={() => { handleReportContact(); setShowContactInfo(false); }} className="w-full px-4 py-3 hover:bg-red-50 rounded-xl flex items-center gap-3 text-sm text-red-500"><Flag className="w-4 h-4" /> Report Contact</button>
                        </div>
                    </div>
                </motion.div>
            );})()}</AnimatePresence>

            {/* ========== Context Menu ========== */}
            <AnimatePresence>{showMenu && (() => { const message = messages.find(m => m._id === showMenu); if (!message) return null; const isOwn = getIsOwn(message); return (
                <motion.div ref={menuRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed z-50 bg-white rounded-xl shadow-xl border py-1 w-52" style={{ left: Math.min(menuPosition.x, window.innerWidth - 220), top: Math.min(menuPosition.y, window.innerHeight - 400) }} onClick={() => setShowMenu(null)}>
                    <button onClick={() => handleReply(message)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Reply className="w-4 h-4" /> Reply</button>
                    {isOwn && <button onClick={() => handleEdit(message)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Copy className="w-4 h-4" /> Edit</button>}
                    <button onClick={() => handleForward(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Forward className="w-4 h-4" /> Forward</button>
                    <button onClick={() => handleStar(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Star className={`w-4 h-4 ${message.starredBy?.includes(authUser?._id) ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {message.starredBy?.includes(authUser?._id) ? 'Unstar' : 'Star'}</button>
                    <button onClick={() => handleCopy(message.text || '')} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Copy className="w-4 h-4" /> Copy</button>
                    <button onClick={() => handlePinMessage(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Pin className="w-4 h-4" /> {message.pinned ? 'Unpin' : 'Pin'}</button>
                    <button onClick={() => handleReportMessage(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600"><Flag className="w-4 h-4" /> Report</button>
                    {isOwn && <button onClick={() => handleDelete(message._id)} className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-500"><Trash2 className="w-4 h-4" /> Delete</button>}
                </motion.div>
            );})()}</AnimatePresence>

            {/* ========== Conversation Menu ========== */}
            <AnimatePresence>{showConversationMenu && (() => { const conv = conversations.find(c => c._id === showConversationMenu); const isPinned = conv?.pinnedBy?.includes(authUser?._id); const isMuted = conv?.mutedBy?.find(m => m.user === authUser?._id); return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowConversationMenu(null)}>
                    <motion.div ref={conversationRef} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl p-2 w-64" onClick={e => e.stopPropagation()}>
                        <button onClick={handlePinConversation} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"><Pin className="w-4 h-4" /> {isPinned ? 'Unpin' : 'Pin'}</button>
                        <button onClick={handleArchiveConversation} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"><Archive className="w-4 h-4" /> {conv?.archivedBy?.includes(authUser?._id) ? 'Unarchive' : 'Archive'}</button>
                        <button onClick={() => handleMuteConversation(isMuted ? null : 8)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"><BellOff className="w-4 h-4" /> {isMuted ? 'Unmute' : 'Mute'}</button>
                        <button onClick={() => { handleShareContact(getOtherUser(selectedConversation)); setShowConversationMenu(null); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600"><Contact className="w-4 h-4" /> Share Contact</button>
                        <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left hover:bg-red-50 rounded-lg flex items-center gap-3 text-sm text-red-500"><Trash2 className="w-4 h-4" /> Clear Chat</button>
                        <button onClick={() => setShowConversationMenu(null)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-400 mt-1 border-t"><X className="w-4 h-4" /> Cancel</button>
                    </motion.div>
                </motion.div>
            );})()}</AnimatePresence>

            {/* ========== Pin Duration Modal ========== */}
            <AnimatePresence>{showPinDurationModal && (<motion.div ref={pinDurationRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPinDurationModal(null)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Pin Message</h3><p className="text-sm text-gray-500 mb-4">How long?</p><div className="space-y-2">{[{ label: '24 hours', value: 24 },{ label: '7 days', value: 168 },{ label: '30 days', value: 720 },{ label: 'Unpin', value: null, danger: true }].map((opt, i) => (<button key={i} onClick={() => handlePinDurationSelect(opt.value)} className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${opt.danger ? 'text-red-500 hover:bg-red-50' : 'hover:bg-gray-50 text-gray-600'}`}>{opt.label}</button>))}</div></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== Poll Modal ========== */}
            <AnimatePresence>{showPollModal && (<motion.div ref={pollRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPollModal(false)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Create Poll</h3><input type="text" placeholder="Question" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />{pollOptions.map((opt, i) => (<input key={i} type="text" placeholder={`Option ${i + 1}`} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-2" value={opt} onChange={(e) => { const newOpts = [...pollOptions]; newOpts[i] = e.target.value; setPollOptions(newOpts); }} />))}<button onClick={() => setPollOptions([...pollOptions, ''])} className="text-blue-400 text-sm mb-4 hover:text-blue-500">+ Add Option</button><div className="flex gap-2"><button onClick={handleCreatePoll} className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500">Create Poll</button><button onClick={() => setShowPollModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button></div></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== Event Modal ========== */}
            <AnimatePresence>{showEventModal && (<motion.div ref={eventRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Create Event</h3><input type="text" placeholder="Event name" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3" value={eventName} onChange={(e) => setEventName(e.target.value)} /><input type="date" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /><input type="time" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3" value={eventTime} onChange={(e) => setEventTime(e.target.value)} /><input type="text" placeholder="Location (optional)" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-4" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} /><div className="flex gap-2"><button onClick={handleCreateEvent} className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500">Create Event</button><button onClick={() => setShowEventModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button></div></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== Share Contact Modal ========== */}
            <AnimatePresence>{showShareContactModal && contactToShare && (<motion.div ref={shareContactRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowShareContactModal(false)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-80 text-center shadow-xl" onClick={e => e.stopPropagation()}><div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mx-auto mb-3"><img src={contactToShare.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" /></div><h3 className="font-bold">{contactToShare.displayName}</h3><p className="text-gray-500 text-sm mb-4">@{contactToShare.username}</p><p className="text-sm text-gray-600 mb-4">Share this contact?</p><div className="flex gap-2"><button onClick={handleShareContactConfirm} className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500">Share</button><button onClick={() => setShowShareContactModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button></div></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== Incoming Call ========== */}
            <AnimatePresence>{incomingCall && (<motion.div ref={callRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl p-8 w-80 text-center shadow-2xl"><div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">{incomingCall.isVideo ? <Video className="w-10 h-10 text-blue-400" /> : <Phone className="w-10 h-10 text-blue-400" />}</div><h3 className="text-xl font-bold mb-1">Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call</h3><p className="text-gray-500 mb-6">{incomingCall.callerName} is calling...</p><div className="flex gap-4 justify-center"><button onClick={rejectCall} className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"><PhoneOff className="w-6 h-6" /></button><button onClick={acceptCall} className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg"><Phone className="w-6 h-6" /></button></div></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== Active Call ========== */}
            <AnimatePresence>{activeCall && (<motion.div ref={activeCallRef} initial={{ opacity: 0, scale: 0.9 }} animate={isCallMinimized ? { opacity: 1, scale: 1, width: 300, height: 200, bottom: 20, right: 20, position: 'fixed' } : { opacity: 1, scale: 1, width: '100%', height: '100%', inset: 0, position: 'fixed' }} className="z-50 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"><div className="relative w-full h-full">{isVideoMode && remoteStreams.size > 0 ? Array.from(remoteStreams.entries()).map(([userId, stream]) => (<video key={userId} ref={(el) => { if (el) { remoteVideoRefs.current.set(userId, el); el.srcObject = stream; } }} autoPlay playsInline className="w-full h-full object-cover" />)) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"><div className="w-24 h-24 bg-blue-400 rounded-full flex items-center justify-center mb-4"><Phone className="w-12 h-12 text-white" /></div><p className="text-white text-lg font-medium">{getOtherUser(selectedConversation)?.displayName || 'Call'}</p><p className="text-gray-400 text-sm">{isVideoMode ? 'Video call' : 'Audio call'}</p><div className="mt-6 w-64"><AudioWaveform isActive={true} isMuted={isMicMuted} /></div></div>)}{isVideoMode && localStream && (<div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg"><video ref={(el) => { localVideoRef.current = el; if (el && localStream) el.srcObject = localStream; }} autoPlay muted playsInline className="w-full h-full object-cover" /></div>)}<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-6 py-3"><button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isMicMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>{isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button><button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>{isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button><button onClick={toggleVideoMode} className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30">{isVideoMode ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button>{isVideoMode && <button onClick={flipCamera} className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"><RotateCw className="w-5 h-5" /></button>}<button onClick={shareScreen} className={`p-3 rounded-full transition-colors ${isSharingScreen ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}><MonitorUp className="w-5 h-5" /></button><button onClick={endCall} className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"><PhoneOff className="w-5 h-5" /></button></div><button onClick={toggleCallMinimize} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/60">{isCallMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}</button></div></motion.div>)}</AnimatePresence>

            {/* ========== Forward Modal ========== */}
            <AnimatePresence>{showForwardModal && (<motion.div ref={forwardMessageRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForwardModal(false)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-3">Forward Message</h3><div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-500">{messageToForward?.text?.substring(0, 100) || 'Media message'}</div><div className="space-y-1 mb-4">{conversations.map(conv => { const other = getOtherUser(conv); const targetId = conv.isGroup ? conv._id : other?._id; if (!targetId) return null; return (<div key={conv._id} onClick={() => setForwardTargets(prev => prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId])} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${forwardTargets.includes(targetId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 overflow-hidden flex items-center justify-center text-white font-bold">{conv.isGroup ? (conv.groupName?.[0] || 'G') : <img src={other?.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />}</div><span className="text-sm font-medium">{conv.isGroup ? conv.groupName : other?.displayName}</span></div>); })}</div><button onClick={handleForwardSubmit} disabled={forwardTargets.length === 0} className="w-full py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400">Forward ({forwardTargets.length})</button></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== New Group Modal ========== */}
            <AnimatePresence>{showNewGroupModal && (<motion.div ref={newGroupRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowNewGroupModal(false)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">New Group</h3><input type="text" placeholder="Group name" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 mb-3" value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus /><div className="max-h-48 overflow-y-auto mb-4">{followingUsers.map(user => (<div key={user._id} onClick={() => setSelectedParticipants(prev => prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id])} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${selectedParticipants.includes(user._id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}><div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden"><img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" /></div><span className="text-sm">{user.displayName}</span></div>))}</div><div className="flex gap-2"><button onClick={handleCreateGroup} className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500">Create ({selectedParticipants.length})</button><button onClick={() => setShowNewGroupModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button></div></motion.div></motion.div>)}</AnimatePresence>

            {/* ========== Contact List Modal ========== */}
            <AnimatePresence>{showContactList && (<motion.div ref={contactListRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowContactList(false)}><motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">New Chat</h3>{followingUsers.length === 0 ? <p className="text-center text-gray-400 py-8">No contacts yet</p> : followingUsers.map(user => (<div key={user._id} onClick={async () => { const conv = await getConversation(user._id); if (conv) selectConversation(conv); setShowContactList(false); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden"><img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" /></div><div><p className="font-medium text-sm">{user.displayName}</p><p className="text-xs text-gray-400">@{user.username}</p></div></div>))}</motion.div></motion.div>)}</AnimatePresence>

            <audio ref={audioRef} onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setAudioProgress((a.currentTime / a.duration) * 100); }} onEnded={() => { setIsPlayingAudio(null); setAudioProgress(0); }} className="hidden" />
            <style>{`@keyframes wave { 0% { height: 8px; } 100% { height: 36px; } }`}</style>
        </div>
    );
};

export default ChatPage;
