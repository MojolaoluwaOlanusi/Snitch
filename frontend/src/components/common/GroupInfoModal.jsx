// @ts-nocheck
import {useState, useEffect, useRef} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, UserPlus, UserX, Shield, LogOut, Flag,
    Image as ImageIcon, Bell, BellOff, Trash,
    Edit3, Check, Crown, LinkIcon, FileText, Download, Star, Bookmark, Clock, Upload, Unlock, Lock,
    Heart, Palette
} from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { toast } from 'sonner'
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";

const GroupInfoModal = ({ isOpen, onClose, conversationId, onlineUsers, onMemberClick, onAvatarChange }) => {
    const [group, setGroup] = useState(null);
    const [mediaItems, setMediaItems] = useState([]);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showStarredModal, setShowStarredModal] = useState(false);
    const [showBookmarkedModal, setShowBookmarkedModal] = useState(false);
    const [showWallpaperModal, setShowWallpaperModal] = useState(false);
    const [showDisappearingModal, setShowDisappearingModal] = useState(false);
    const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
    const [starredMessages, setStarredMessages] = useState([]);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMediaViewer, setShowMediaViewer] = useState(null);
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [editingName, setEditingName] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [unlockPassword, setUnlockPassword] = useState('');
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [showLockedSection, setShowLockedSection] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [wallpaperUploading, setWallpaperUploading] = useState(false);
    const [customWallpapers, setCustomWallpapers] = useState([]);
    const [lockPassword, setLockPassword] = useState('');
    const [showLockChatModal, setShowLockChatModal] = useState(false);
    const [groupDescription, setGroupDescription] = useState("");
    const [adminOnlyMessages, setAdminOnlyMessages] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const mediaRef = useRef(null);
    const starredRef = useRef(null);
    const bookmarkedRef = useRef(null);
    const unlockRef = useRef(null);
    const lockRef = useRef(null);
    const mediaViewerRef = useRef(null);

    const { authUser } = useAuthStore();
    const {
        getConversations, updateGroupInfo, addGroupParticipant, getMessages, conversations,
        removeGroupParticipant, muteConversation, selectConversation, messages
    } = useChatStore();

    useEffect(() => {
        if (isOpen && conversationId) fetchGroupInfo();
    }, [isOpen, conversationId]);

    useEffect(() => {
        if (group?._id) {
            getMessages(group._id);
        }
    }, [group?._id]);

    const fetchGroupInfo = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/group/${conversationId}/info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroup(res.data);
            setGroupName(res.data.groupName || "");
            setGroupDescription(res.data.groupDescription || "");
            setAdminOnlyMessages(res.data.adminOnlyMessages || false);
        } catch (error) {
            toast.error('Failed to load group info');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlockChat = async () => {
        if (!unlockPassword.trim()) {
            toast.error('Enter password');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post('/chat/unlock-all',
                { password: unlockPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Chats unlocked');
            setShowUnlockModal(false);
            setUnlockPassword('');
            setShowLockedSection(true);
            await getConversations();
        } catch (error) {
            toast.error('Wrong password');
        }
    };
    const handleAddToFavorites = async () => {
        const convId = group?._id;
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
    const handleLockChatOpen = () => {
        setLockPassword('');
        setShowLockChatModal(true);
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

    const isAdmin = group?.admin?._id === authUser?._id;
    const isParticipant = group?.participants?.some(p => p._id === authUser?._id);

    const handleSaveName = async () => {
        if (!groupName.trim()) return;
        await updateGroupInfo(conversationId, { name: groupName });
        setEditingName(false);
        toast.success('Group name updated');
        await fetchGroupInfo();
    };

    const handleUploadWallpaper = async (file) => {
        if (!group) return;
        setWallpaperUploading(true);
        try {
            const token = localStorage.getItem('access-token');
            const presignRes = await axiosInstance.post('/media/wallpaper-presign', {
                conversationId: group._id,
                fileName: file.name,
                contentType: file.type,
            }, { headers: { Authorization: `Bearer ${token}` } });

            await fetch(presignRes.data.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            const publicUrl = presignRes.data.publicUrl;

            await handleSetWallpaper(publicUrl);

            setCustomWallpapers(prev => [publicUrl, ...prev]);
        } catch (error) {
            toast.error('Failed to upload wallpaper');
        } finally {
            setWallpaperUploading(false);
        }
    };

    const handleSetWallpaper = async (url) => {
        if (!group) return;
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put(
                `/chat/conversation/${group._id}/wallpaper`,
                { wallpaperUrl: url },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Wallpaper response:', res.data);

            const updatedConv = { ...group, wallpaper: url };
            const updatedConversations = conversations.map(c =>
                c._id === group._id ? updatedConv : c
            );
            useChatStore.setState({
                conversations: updatedConversations,
                selectedConversation: updatedConv,
            });

            toast.success('Wallpaper updated');
        } catch (error) {
            console.error('Failed to set wallpaper:', error);
            toast.error('Failed to set wallpaper');
        }
    };

    const handleSaveDescription = async () => {
        await updateGroupInfo(conversationId, { description: groupDescription });
        setEditingDescription(false);
        toast.success('Group description updated');
        await fetchGroupInfo();
    };

    const scrollToMessage = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-yellow-50');
            setTimeout(() => el.classList.remove('bg-yellow-50'), 2000);
        }
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

    const handleToggleAdminOnly = async () => {
        await updateGroupInfo(conversationId, { adminOnlyMessages: !adminOnlyMessages });
        setAdminOnlyMessages(!adminOnlyMessages);
        toast.success(adminOnlyMessages ? 'All members can now send messages' : 'Only admins can send messages');
        await fetchGroupInfo();
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;
        await addGroupParticipant(conversationId, selectedUsers);
        setShowAddMembers(false);
        setSelectedUsers([]);
        toast.success('Members added');
        await fetchGroupInfo();
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Remove this member?')) return;
        await removeGroupParticipant(conversationId, userId);
        toast.success('Member removed');
        await fetchGroupInfo();
    };

    const handleLockChatConfirm = async () => {
        if (!lockPassword.trim()) {
            toast.error('Enter password');
            return;
        }
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.put(`/chat/conversation/${group?._id}/lock`, {
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

    const handleLeaveGroup = async () => {
        if (!window.confirm('Leave this group?')) return;
        await removeGroupParticipant(conversationId, authUser?._id);
        selectConversation(null);
        onClose();
        toast.success('Left the group');
    };

    const handleToggleMute = async () => {
        await muteConversation(conversationId, muted ? null : 8);
        setMuted(!muted);
        toast.success(muted ? 'Group unmuted' : 'Group muted for 8 hours');
    };

    const handleReportGroup = async () => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post(`/chat/group/${conversationId}/report`,
                { reason: 'Reported group' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Group reported');
            setShowReportModal(false);
        } catch (error) {
            toast.error('Failed to report group');
        }
    };

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
        if (!group) return;
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/starred/${group._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStarredMessages(res.data || []); setShowStarredModal(true);
        } catch (error) {
            toast.error('Failed to load starred');
        }
    };
    const handleOpenBookmarked = async () => {
        if (!group) return;
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/chat/bookmarked/${group._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookmarkedMessages(res.data || []); setShowBookmarkedModal(true);
        } catch (error) {
            toast.error('Failed to load bookmarked');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="bg-base-100 rounded-2xl w-[90%] max-w-md md:w-[420px] max-h-[85vh] overflow-y-auto shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {loading ? (
                            <div className="p-8 text-center text-base-content/50">Loading...</div>
                        ) : !group ? (
                            <div className="p-8 text-center text-base-content/50">Group not found</div>
                        ) : (
                            <div>
                                {/* Header */}
                                <div className="p-6 text-center border-b border-base-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Group Info</h3>
                                        <button onClick={onClose} className="p-2 hover:bg-base-200 rounded-full">
                                            <X className="w-5 h-5 text-base-content/60" />
                                        </button>
                                    </div>

                                    {/* Group Avatar */}
                                    <div
                                        className={`w-20 h-20 rounded-full flex items-center justify-center text-primary-content text-2xl font-bold mx-auto mb-3 overflow-hidden cursor-pointer ${
                                            !group.groupAvatar ? `bg-gradient-to-br ${group.avatarColor}` : ''
                                        }`}
                                        onClick={() => {
                                            if (group.admin?._id === authUser?._id) {
                                                document.getElementById('group-avatar-input')?.click();
                                            }
                                        }}
                                    >
                                        {group.groupAvatar ? (
                                            <img src={group.groupAvatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{group.groupName?.charAt(0) || 'G'}</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="group-avatar-input"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onAvatarChange?.(file);
                                            setTimeout(() => {
                                                fetchGroupInfo();
                                            }, 2000);
                                        }}
                                    />

                                    {/* Group Name */}
                                    {editingName ? (
                                        <div className="flex items-center gap-2 justify-center mb-2">
                                            <input
                                                type="text"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                                className="text-center px-3 py-1 border border-base-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveName} className="p-1 text-green-500 hover:bg-success/10 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <h4 className="font-bold text-lg mb-1 flex items-center justify-center gap-2">
                                            {group.groupName}
                                            {isAdmin && (
                                                <button onClick={() => setEditingName(true)} className="p-1 hover:bg-base-200 rounded-full">
                                                    <Edit3 className="w-3.5 h-3.5 text-base-content/50" />
                                                </button>
                                            )}
                                        </h4>
                                    )}

                                    <p className="text-sm text-base-content/60">
                                        Group · {group.participants?.length || 0} members
                                    </p>

                                    {/* Description */}
                                    {editingDescription ? (
                                        <div className="flex items-center gap-2 justify-center mt-2">
                                            <input
                                                type="text"
                                                value={groupDescription}
                                                onChange={(e) => setGroupDescription(e.target.value)}
                                                placeholder="Add group description"
                                                className="text-center px-3 py-1 border border-base-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary w-64"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveDescription} className="p-1 text-green-500 hover:bg-success/10 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-base-content/50 mt-2">
                                            {group.groupDescription || 'No description'}
                                            {isAdmin && (
                                                <button onClick={() => setEditingDescription(true)} className="ml-1 p-1 hover:bg-base-200 rounded-full inline">
                                                    <Edit3 className="w-3 h-3 text-base-content/50" />
                                                </button>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-4 space-y-1">
                                    {/* Admin Only Messages Toggle */}
                                    {isAdmin && (
                                        <button
                                            onClick={handleToggleAdminOnly}
                                            className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center justify-between text-sm text-base-content/70"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-4 h-4" />
                                                <span>Only admins can send messages</span>
                                            </div>
                                            <div className={`w-10 h-6 rounded-full transition-colors ${adminOnlyMessages ? 'bg-primary/80' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-base-100 rounded-full shadow transition-transform ${adminOnlyMessages ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                            </div>
                                        </button>
                                    )}

                                    <button onClick={() => {
                                        setShowAddMembers(true);
                                        fetchContacts();
                                    }} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                        <UserPlus className="w-4 h-4" /> Add Members
                                    </button>

                                    <button onClick={handleToggleMute} className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70">
                                        {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                        {muted ? 'Unmute Notifications' : 'Mute Notifications'}
                                    </button>

                                    <button
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                        onClick={() => {
                                            handleOpenMedia();
                                        }}
                                    >
                                        <ImageIcon className="w-4 h-4" /> Media, Links & Docs
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleOpenStarred();
                                        }}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <Star className="w-4 h-4" />
                                        Starred Messages
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleOpenBookmarked();
                                        }}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <Bookmark className="w-4 h-4" />
                                        Bookmarked Messages
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowWallpaperModal(true);
                                        }}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        Wallpaper
                                    </button>
                                    <button
                                        onClick={() => setShowThemeModal(true)}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <Palette className="w-4 h-4" />
                                        Chat Theme
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowDisappearingModal(true);
                                        }}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Disappearing Messages
                                    </button>
                                    {/* Lock/Unlock */}
                                    {group?.lockedBy?.includes(authUser?._id) ? (
                                        <button
                                            onClick={() => {
                                                handleUnlockChat();
                                            }}
                                            className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                        >
                                            <Unlock className="w-4 h-4" />
                                            Unlock Chat
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                handleLockChatOpen();
                                            }}
                                            className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                        >
                                            <Lock className="w-4 h-4" />
                                            Lock Chat
                                        </button>
                                    )}
                                    {/* Favorites */}
                                    <button
                                        onClick={() => {
                                            handleAddToFavorites();
                                            toast.success(group?.favoritedBy?.includes(authUser?._id));
                                        }}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <Heart
                                            className={`w-4 h-4 ${group?.favoritedBy?.includes(authUser?._id) ? 'fill-red-400 text-error' : ''}`}
                                        />
                                        {group?.favoritedBy?.includes(authUser?._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                    </button>

                                    <button
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('access-token');
                                                const res = await axiosInstance.post(`/chat/group/${conversationId}/invite`, {}, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                await navigator.clipboard.writeText(res.data.inviteLink);
                                                toast.success('Invite link copied to clipboard');
                                            } catch (error) {
                                                toast.error('Failed to generate invite link');
                                            }
                                        }}
                                        className="w-full px-4 py-3 hover:bg-base-200 rounded-xl flex items-center gap-3 text-sm text-base-content/70"
                                    >
                                        <LinkIcon className="w-4 h-4" /> Invite via Link
                                    </button>

                                    <button onClick={() => setShowReportModal(true)} className="w-full px-4 py-3 hover:bg-error/10 rounded-xl flex items-center gap-3 text-sm text-error">
                                        <Flag className="w-4 h-4" /> Report Group
                                    </button>

                                    <button onClick={handleLeaveGroup} className="w-full px-4 py-3 hover:bg-error/10 rounded-xl flex items-center gap-3 text-sm text-error">
                                        <LogOut className="w-4 h-4" /> Leave Group
                                    </button>
                                </div>

                                {/* Members List */}
                                <div className="border-t border-base-300 p-4">
                                    <h4 className="text-sm font-semibold text-base-content/60 mb-3">
                                        Members ({group.participants?.length || 0})
                                    </h4>
                                    <div className="space-y-1">
                                        {group.participants?.map((member) => (
                                            <div
                                                key={member._id}
                                                onClick={() => onMemberClick(member._id)}
                                                className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-primary-content text-xs font-bold">
                                                                {member.displayName?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium flex items-center gap-1">
                                                            {member.displayName}
                                                            {member._id === group.admin?._id && (
                                                                <Crown className="w-3 h-3 text-warning" title="Admin" />
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-base-content/50">@{member.username}</p>
                                                    </div>
                                                    {onlineUsers?.includes(member._id) && (
                                                        <div className="w-2 h-2 bg-success rounded-full" />
                                                    )}
                                                </div>
                                                {isAdmin && member._id !== authUser?._id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveMember(member._id);
                                                        }}
                                                        className="p-1.5 hover:bg-error/10 rounded-full text-error hover:text-error"
                                                        title="Remove member"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Add Members Sub-Modal */}
                    <AnimatePresence>
                        {showAddMembers && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
                                onClick={() => setShowAddMembers(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-md md:w-96 max-h-[70vh] overflow-y-auto shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Add Members</h3>
                                        <button onClick={() => setShowAddMembers(false)} className="p-2 hover:bg-base-200 rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto mb-4">
                                        {contacts.length === 0 ? (
                                            <p className="text-center text-base-content/50 py-8">No users to add</p>
                                        ) : (
                                            contacts.map(user => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => setSelectedUsers(prev =>
                                                        prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id]
                                                    )}
                                                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${
                                                        selectedUsers.includes(user._id) ? 'bg-primary/10' : 'hover:bg-base-200'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden">
                                                        <img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{user.displayName}</p>
                                                        <p className="text-xs text-base-content/50">@{user.username}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddMembers}
                                            disabled={selectedUsers.length === 0}
                                            className="flex-1 py-2.5 bg-primary/80 text-primary-content rounded-xl font-medium hover:bg-primary disabled:bg-base-300 disabled:text-base-content/50"
                                        >
                                            Add ({selectedUsers.length})
                                        </button>
                                        <button
                                            onClick={() => setShowAddMembers(false)}
                                            className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Report Group Sub-Modal */}
                    <AnimatePresence>
                        {showReportModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
                                onClick={() => setShowReportModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xs text-center shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Flag className="w-6 h-6 text-error" />
                                    </div>
                                    <h3 className="font-bold mb-2">Report Group</h3>
                                    <p className="text-sm text-base-content/60 mb-4">
                                        Are you sure you want to report this group? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={handleReportGroup} className="flex-1 py-2.5 bg-error text-primary-content rounded-xl font-medium hover:bg-red-600">
                                            Report
                                        </button>
                                        <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

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
                                className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xl md:w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Media, Links & Docs
                                    </h3>
                                    <button
                                        onClick={() => setShowMediaModal(false)}
                                        className="p-2 hover:bg-base-200 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {mediaItems.length === 0 ?
                                    <p className="text-center text-base-content/50 py-8">
                                        No media shared yet
                                    </p> : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {mediaItems.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="aspect-square rounded-lg overflow-hidden cursor-pointer bg-base-200"
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
                                                                <FileText className="w-8 h-8 text-base-content/50" />
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
                                className="absolute top-4 right-4 p-2 bg-base-100/20 rounded-full text-primary-content hover:bg-base-100/40 z-10"
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
                                        className="bg-base-100 rounded-xl p-8 text-center"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <FileText className="w-16 h-16 text-base-content/50 mx-auto mb-4" />
                                        <p className="text-lg font-medium">
                                            {showMediaViewer.filename || 'File'}
                                        </p>
                                        <a
                                            href={showMediaViewer.url}
                                            download className="text-primary hover:text-primary mt-2 inline-block"
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
                                className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xl md:w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Starred Messages
                                    </h3>
                                    <button
                                        onClick={() => setShowStarredModal(false)}
                                        className="p-2 hover:bg-base-200 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {starredMessages.length === 0 ?
                                    <p className="text-center text-base-content/50 py-8">
                                        No starred messages
                                    </p> :
                                    starredMessages.map(msg => (
                                        <div
                                            key={msg._id}
                                            className="p-3 hover:bg-base-200 rounded-lg cursor-pointer"
                                            onClick={() => {
                                                setShowStarredModal(false);
                                                onClose();
                                                setTimeout(() => scrollToMessage(msg._id), 300);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-3 h-3 text-warning fill-yellow-400" />
                                                <span className="text-xs text-base-content/50">
                                                    {formatMessageTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-base-content/70">
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

            {/* Bookmarked Messages Modal */}
            <AnimatePresence>
                {
                    showBookmarkedModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                            onClick={() => setShowBookmarkedModal(false)}
                        >
                            <motion.div
                                ref={bookmarkedRef}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xl md:w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Bookmarked Messages
                                    </h3>
                                    <button
                                        onClick={() => setShowBookmarkedModal(false)}
                                        className="p-2 hover:bg-base-200 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {bookmarkedMessages.length === 0 ?
                                    <p className="text-center text-base-content/50 py-8">
                                        No bookmarked messages
                                    </p> :
                                    bookmarkedMessages.map(msg => (
                                        <div
                                            key={msg._id}
                                            className="p-3 hover:bg-base-200 rounded-lg cursor-pointer"
                                            onClick={() => {
                                                setShowBookmarkedModal(false);
                                                onClose();
                                                setTimeout(() => scrollToMessage(msg._id), 300);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Bookmark className="w-3 h-3 text-primary fill-primary" />
                                                <span className="text-xs text-base-content/50">
                                                    {formatMessageTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-base-content/70">
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

            <AnimatePresence>
                {showWallpaperModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowWallpaperModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-md md:w-[420px] max-h-[80vh] overflow-y-auto shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Chat Wallpaper</h3>
                                <button onClick={() => setShowWallpaperModal(false)} className="p-2 hover:bg-base-200 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-base-content/60 mb-4">Choose a preset or upload your own image.</p>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=200&h=200&fit=crop',
                                    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
                                    ...customWallpapers,
                                ].map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            handleSetWallpaper(url);
                                            setShowWallpaperModal(false);
                                        }}
                                        className="aspect-square rounded-lg cursor-pointer border-2 hover:border-primary transition-colors overflow-hidden"
                                    >
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-base-300 pt-4">
                                <label className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-3 rounded-xl">
                                    <div className="w-10 h-10 bg-base-200 rounded-lg flex items-center justify-center">
                                        {wallpaperUploading ? (
                                            <Clock className="w-5 h-5 text-base-content/60 animate-spin" />
                                        ) : (
                                            <Upload className="w-5 h-5 text-base-content/60" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-base-content/80">
                                            {wallpaperUploading ? 'Uploading...' : 'Upload from device'}
                                        </p>
                                        <p className="text-xs text-base-content/50">JPEG, PNG, or GIF</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            await handleUploadWallpaper(file);
                                        }}
                                        disabled={wallpaperUploading}
                                    />
                                </label>
                            </div>
                            <div className="border-t border-base-300 group pt-4">
                                <label className="flex items-center gap-3 cursor-pointer group-hover:bg-error/10 p-3 rounded-xl"
                                       onClick={() => {
                                           handleSetWallpaper("");
                                           setShowWallpaperModal(false);
                                       }}
                                >
                                    <div className="w-10 h-10 bg-base-200 rounded-lg flex items-center justify-center">
                                        <Trash className="w-5 h-5 group-hover:text-error text-base-content/50"/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-base-content/80 group-hover:text-error">
                                            Remove Wallpaper
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDisappearingModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowDisappearingModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xs shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">Disappearing Messages</h3>
                            <p className="text-sm text-base-content/60 mb-4">
                                Messages will be automatically deleted after the selected time.
                            </p>
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
                                                    `/chat/conversation/${group._id}/disappearing`,
                                                    { timer: option.value },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                const updatedConv = { ...group, disappearingTimer: option.value };
                                                selectConversation(updatedConv);
                                                toast.success(
                                                    option.value ? `Disappearing after ${option.label}` : 'Disappearing messages off'
                                                );
                                            } catch (error) {
                                                toast.error('Failed to update');
                                            }
                                            setShowDisappearingModal(false);
                                        }}
                                        className={`w-full py-2.5 rounded-xl text-sm font-medium ${
                                            group?.disappearingTimer === option.value
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-base-200 text-base-content/70'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowDisappearingModal(false)}
                                className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
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
                                className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xs shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Unlock Chats
                                    </h3>
                                    <button
                                        onClick={() => setShowUnlockModal(false)}
                                        className="p-2 hover:bg-base-200 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-base-content/60 mb-4">
                                    Enter your login password to access locked chats.
                                </p>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
                                    value={unlockPassword}
                                    onChange={(e) => setUnlockPassword(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUnlockChat}
                                        className="flex-1 py-2.5 bg-primary/80 text-primary-content rounded-xl font-medium hover:bg-primary"
                                    >
                                        Unlock
                                    </button>
                                    <button
                                        onClick={() => setShowUnlockModal(false)}
                                        className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
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
                                className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xs shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        Lock Chat
                                    </h3>
                                    <button
                                        onClick={() => setShowLockChatModal(false)}
                                        className="p-2 hover:bg-base-200 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-base-content/60 mb-4">
                                    Enter your login password to lock this chat.
                                </p>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2.5 bg-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
                                    value={lockPassword}
                                    onChange={(e) => setLockPassword(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLockChatConfirm}
                                        className="flex-1 py-2.5 bg-primary/80 text-primary-content rounded-xl font-medium hover:bg-primary"
                                    >
                                        Lock Chat
                                    </button>
                                    <button
                                        onClick={() => setShowLockChatModal(false)}
                                        className="flex-1 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            <AnimatePresence>
                {showThemeModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowThemeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-base-100 rounded-2xl p-6 w-[90%] max-w-xs shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4">Chat Theme</h3>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { name: 'Emerald', color: '#10b981', key: 'emerald' },
                                    { name: 'Blue', color: '#3b82f6', key: 'blue' },
                                    { name: 'Purple', color: '#8b5cf6', key: 'purple' },
                                    { name: 'Rose', color: '#f43f5e', key: 'rose' },
                                    { name: 'Orange', color: '#f97316', key: 'orange' },
                                    { name: 'Teal', color: '#14b8a6', key: 'teal' },
                                    { name: 'Slate', color: '#64748b', key: 'slate' },
                                    { name: 'Indigo', color: '#6366f1', key: 'indigo' },
                                ].map(theme => (
                                    <button
                                        key={theme.key}
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('access-token');
                                                await axiosInstance.put(
                                                    `/chat/conversation/${group._id}/theme`,
                                                    { themeColor: theme.key },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                const updatedConv = { ...group, themeColor: theme.key };
                                                const updatedConversations = conversations.map(c =>
                                                    c._id === group._id ? updatedConv : c
                                                );
                                                useChatStore.setState({
                                                    conversations: updatedConversations,
                                                    selectedConversation: updatedConv,
                                                });
                                                setShowThemeModal(false);
                                                toast.success('Theme updated');
                                            } catch (error) {
                                                toast.error('Failed');
                                            }
                                        }}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-base-200 transition-colors"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full border-2 ${
                                                (group?.themeColor || 'emerald') === theme.key
                                                    ? 'border-blue-400'
                                                    : 'border-transparent'
                                            }`}
                                            style={{ backgroundColor: theme.color }}
                                        />
                                        <span className="text-xs font-medium">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowThemeModal(false)} className="w-full mt-4 py-2.5 bg-base-200 rounded-xl font-medium hover:bg-base-300">Cancel</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </AnimatePresence>

    );
};

export default GroupInfoModal;