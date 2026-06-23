// @ts-nocheck
import {useState, useEffect, useRef} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Users, UserPlus, UserX, Shield, Settings, LogOut, Flag,
    MessageSquare, Image as ImageIcon, Bell, BellOff, Trash2,
    Edit3, Check, Crown, LinkIcon, FileText, Download
} from "lucide-react";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";

const GroupInfoModal = ({ isOpen, onClose, conversationId, onlineUsers, onMemberClick, onAvatarChange }) => {
    const [group, setGroup] = useState(null);
    const [mediaItems, setMediaItems] = useState([]);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMediaViewer, setShowMediaViewer] = useState(null);
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [editingName, setEditingName] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [editingDescription, setEditingDescription] = useState(false);
    const [groupDescription, setGroupDescription] = useState("");
    const [adminOnlyMessages, setAdminOnlyMessages] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const mediaRef = useRef(null);
    const mediaViewerRef = useRef(null);

    const { authUser } = useAuthStore();
    const {
        getConversations, updateGroupInfo, addGroupParticipant, getMessages,
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

    const isAdmin = group?.admin?._id === authUser?._id;
    const isParticipant = group?.participants?.some(p => p._id === authUser?._id);

    const handleSaveName = async () => {
        if (!groupName.trim()) return;
        await updateGroupInfo(conversationId, { name: groupName });
        setEditingName(false);
        toast.success('Group name updated');
        await fetchGroupInfo();
    };

    const handleSaveDescription = async () => {
        await updateGroupInfo(conversationId, { description: groupDescription });
        setEditingDescription(false);
        toast.success('Group description updated');
        await fetchGroupInfo();
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
                        className="bg-white rounded-2xl w-[420px] max-h-[85vh] overflow-y-auto shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Loading...</div>
                        ) : !group ? (
                            <div className="p-8 text-center text-gray-400">Group not found</div>
                        ) : (
                            <div>
                                {/* Header */}
                                <div className="p-6 text-center border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Group Info</h3>
                                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Group Avatar */}
                                    <div
                                        className={`w-20 h-20 rounded-full ${!group.groupAvatar && `bg-gradient-to-br ${group.avatarColor}`} } flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 overflow-hidden cursor-pointer`}
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
                                                className="text-center px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveName} className="p-1 text-green-500 hover:bg-green-50 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <h4 className="font-bold text-lg mb-1 flex items-center justify-center gap-2">
                                            {group.groupName}
                                            {isAdmin && (
                                                <button onClick={() => setEditingName(true)} className="p-1 hover:bg-gray-100 rounded-full">
                                                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                            )}
                                        </h4>
                                    )}

                                    <p className="text-sm text-gray-500">
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
                                                className="text-center px-3 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveDescription} className="p-1 text-green-500 hover:bg-green-50 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-2">
                                            {group.groupDescription || 'No description'}
                                            {isAdmin && (
                                                <button onClick={() => setEditingDescription(true)} className="ml-1 p-1 hover:bg-gray-100 rounded-full inline">
                                                    <Edit3 className="w-3 h-3 text-gray-400" />
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
                                            className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center justify-between text-sm text-gray-600"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-4 h-4" />
                                                <span>Only admins can send messages</span>
                                            </div>
                                            <div className={`w-10 h-6 rounded-full transition-colors ${adminOnlyMessages ? 'bg-blue-400' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${adminOnlyMessages ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                            </div>
                                        </button>
                                    )}

                                    <button onClick={() => { setShowAddMembers(true); fetchContacts(); }} className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600">
                                        <UserPlus className="w-4 h-4" /> Add Members
                                    </button>

                                    <button onClick={handleToggleMute} className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600">
                                        {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                        {muted ? 'Unmute Notifications' : 'Mute Notifications'}
                                    </button>

                                    <button
                                        className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                        onClick={() => {
                                            handleOpenMedia();
                                        }}
                                    >
                                        <ImageIcon className="w-4 h-4" /> Media, Links & Docs
                                    </button>

                                    <button
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('access-token');
                                                const res = await axiosInstance.post(`/chat/group/${conversationId}/invite`, {}, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                // Copy link to clipboard
                                                await navigator.clipboard.writeText(res.data.inviteLink);
                                                toast.success('Invite link copied to clipboard');
                                            } catch (error) {
                                                toast.error('Failed to generate invite link');
                                            }
                                        }}
                                        className="w-full px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-sm text-gray-600"
                                    >
                                        <LinkIcon className="w-4 h-4" /> Invite via Link
                                    </button>

                                    <button onClick={() => setShowReportModal(true)} className="w-full px-4 py-3 hover:bg-red-50 rounded-xl flex items-center gap-3 text-sm text-red-500">
                                        <Flag className="w-4 h-4" /> Report Group
                                    </button>

                                    <button onClick={handleLeaveGroup} className="w-full px-4 py-3 hover:bg-red-50 rounded-xl flex items-center gap-3 text-sm text-red-500">
                                        <LogOut className="w-4 h-4" /> Leave Group
                                    </button>
                                </div>

                                {/* Members List */}
                                <div className="border-t border-gray-100 p-4">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-3">
                                        Members ({group.participants?.length || 0})
                                    </h4>
                                    <div className="space-y-1">
                                        {group.participants?.map((member) => (
                                            <div
                                                key={member._id}
                                                 onClick={() => onMemberClick(member._id)}
                                                 className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                                                {member.displayName?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium flex items-center gap-1">
                                                            {member.displayName}
                                                            {member._id === group.admin?._id && (
                                                                <Crown className="w-3 h-3 text-yellow-400" title="Admin" />
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-400">@{member.username}</p>
                                                    </div>
                                                    {/* Online dot */}
                                                    {onlineUsers?.includes(member._id) && (
                                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                    )}
                                                </div>
                                                {/* ... remove button ... */}
                                                {isAdmin && member._id !== authUser?._id && (
                                                    <button
                                                        onClick={() => {
                                                            handleRemoveMember(member._id);
                                                            e.stopPropagation();
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 rounded-full text-red-400 hover:text-red-500"
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
                                    className="bg-white rounded-2xl p-6 w-96 max-h-[70vh] overflow-y-auto shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Add Members</h3>
                                        <button onClick={() => setShowAddMembers(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto mb-4">
                                        {contacts.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">No users to add</p>
                                        ) : (
                                            contacts.map(user => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => setSelectedUsers(prev =>
                                                        prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id]
                                                    )}
                                                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${
                                                        selectedUsers.includes(user._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                        <img src={user.avatarUrl || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{user.displayName}</p>
                                                        <p className="text-xs text-gray-400">@{user.username}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddMembers}
                                            disabled={selectedUsers.length === 0}
                                            className="flex-1 py-2.5 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400"
                                        >
                                            Add ({selectedUsers.length})
                                        </button>
                                        <button
                                            onClick={() => setShowAddMembers(false)}
                                            className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
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
                                    className="bg-white rounded-2xl p-6 w-80 text-center shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Flag className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h3 className="font-bold mb-2">Report Group</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Are you sure you want to report this group? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={handleReportGroup} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600">
                                            Report
                                        </button>
                                        <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">
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
        </AnimatePresence>


    );
};

export default GroupInfoModal;