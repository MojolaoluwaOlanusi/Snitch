import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useChatStore } from '../../store/useChatStore.js';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { Share2, MessageCircle, X, Send, User } from 'lucide-react';

const SharePage = () => {
    const { authUser } = useAuthStore();
    const { sendMessage, getConversation, selectConversation, getConversations } = useChatStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [shareData, setShareData] = useState({ title: '', text: '', url: '', files: [] });
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // Parse shared data from URL params
        const params = new URLSearchParams(location.search);
        const title = params.get('title') || '';
        const text = params.get('text') || '';
        const url = params.get('url') || '';

        setShareData({ title, text, url, files: [] });
        setLoading(false);

        // Load conversations if user is authenticated
        if (authUser) {
            loadConversations();
        }
    }, [location, authUser]);

    const loadConversations = async () => {
        try {
            const convs = await getConversations();
            setConversations(convs || []);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const handleSend = async () => {
        if (!selectedConversation) {
            toast.error('Please select a conversation');
            return;
        }

        setSending(true);
        try {
            const messageText = shareData.text + (shareData.url ? `\n${shareData.url}` : '');
            
            await sendMessage({
                receiverId: selectedConversation.participants?.find(p => p._id !== authUser._id)?._id,
                conversationId: selectedConversation._id,
                text: messageText,
            });
            
            toast.success('Shared successfully!');
            navigate('/chat');
        } catch (error) {
            toast.error('Failed to send');
            setSending(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    if (!authUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-200">
                <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Share2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-base-content mb-2">Share to Snitch</h2>
                    <p className="text-base-content/60 mb-4">Please log in to share content to Snitch.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary w-full"
                    >
                        Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-200">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
            <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-primary p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-6 h-6 text-primary-content" />
                        <h2 className="text-lg font-bold text-primary-content">Share to Snitch</h2>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-primary/80 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-primary-content" />
                    </button>
                </div>

                {/* Content Preview */}
                <div className="p-4 border-b border-base-300">
                    {shareData.title && (
                        <div className="mb-2">
                            <p className="font-semibold text-base-content">{shareData.title}</p>
                        </div>
                    )}
                    {shareData.text && (
                        <div className="bg-base-200 rounded-lg p-3 mb-2">
                            <p className="text-sm text-base-content/80">{shareData.text}</p>
                        </div>
                    )}
                    {shareData.url && (
                        <div className="bg-base-200 rounded-lg p-3">
                            <p className="text-sm text-primary truncate">{shareData.url}</p>
                        </div>
                    )}
                </div>

                {/* Conversation Selection */}
                <div className="p-4">
                    <h3 className="text-sm font-semibold text-base-content mb-3">Select conversation</h3>
                    
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-base-content/60">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-base-content/30" />
                            <p className="text-sm">No conversations yet</p>
                            <button
                                onClick={() => navigate('/chat')}
                                className="btn btn-primary btn-sm mt-4"
                            >
                                Start a chat
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {conversations.map((conv) => {
                                const otherUser = conv.participants?.find(p => p._id !== authUser._id);
                                const displayName = conv.isGroup 
                                    ? conv.name 
                                    : otherUser?.displayName || otherUser?.username || 'Unknown';
                                const avatarUrl = conv.isGroup
                                    ? null
                                    : otherUser?.avatarUrl || '/avatar.png';

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            selectedConversation?._id === conv._id
                                                ? 'bg-primary text-primary-content'
                                                : 'bg-base-200 hover:bg-base-300'
                                        }`}
                                    >
                                        <div className="avatar">
                                            <div className="w-10 h-10 rounded-full">
                                                {conv.isGroup ? (
                                                    <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold">
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <img src={avatarUrl} alt={displayName} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-sm">{displayName}</p>
                                            {conv.lastMessage && (
                                                <p className="text-xs opacity-70 truncate">
                                                    {conv.lastMessage.text || 'Media'}
                                                </p>
                                            )}
                                        </div>
                                        {selectedConversation?._id === conv._id && (
                                            <div className="w-4 h-4 rounded-full bg-primary-content text-primary flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-base-300 flex gap-2">
                    <button
                        onClick={handleCancel}
                        className="flex-1 btn btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!selectedConversation || sending}
                        className="flex-1 btn btn-primary"
                    >
                        {sending ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePage;