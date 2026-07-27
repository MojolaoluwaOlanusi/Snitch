import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useChatStore } from '../../store/useChatStore.js';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const SharePage = () => {
    const { authUser } = useAuthStore();
    const { sendMessage, getConversation, selectConversation } = useChatStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [shareData, setShareData] = useState({ title: '', text: '', url: '' });

    useEffect(() => {
        // Parse shared data from URL params or POST data
        const params = new URLSearchParams(location.search);
        const title = params.get('title') || '';
        const text = params.get('text') || '';
        const url = params.get('url') || '';

        // For POST requests (file uploads), we need to handle FormData
        // This is simplified; for production, you'd handle file uploads here

        setShareData({ title, text, url });
        setLoading(false);
    }, [location]);

    const handleSelectConversation = async (conversationId) => {
        try {
            const conv = await getConversation(conversationId);
            if (conv) {
                selectConversation(conv);
                navigate('/chat');
                toast.success('Shared to conversation!');
            }
        } catch (error) {
            toast.error('Failed to share');
        }
    };

    const handleSend = async (receiverId) => {
        if (!shareData.text && !shareData.url) {
            toast.error('Nothing to share');
            return;
        }

        const messageText = shareData.text + (shareData.url ? `\n${shareData.url}` : '');

        try {
            await sendMessage({
                receiverId,
                conversationId: null,
                text: messageText,
            });
            toast.success('Shared!');
            navigate('/chat');
        } catch (error) {
            toast.error('Failed to send');
        }
    };

    if (!authUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-200">
                <div className="text-center p-8">
                    <p className="text-base-content/60">Please log in to share content to Snitch.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary mt-4"
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
            <div className="bg-base-100 rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold text-base-content mb-4">Share to Snitch</h2>

                {/* Preview of shared content */}
                {shareData.title && (
                    <div className="bg-base-200 rounded-lg p-3 mb-3">
                        <p className="font-semibold text-base-content">{shareData.title}</p>
                    </div>
                )}
                {shareData.text && (
                    <div className="bg-base-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-base-content/80">{shareData.text}</p>
                    </div>
                )}
                {shareData.url && (
                    <div className="bg-base-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-primary truncate">{shareData.url}</p>
                    </div>
                )}

                <div className="divider text-sm text-base-content/50">Send to</div>

                {/* Quick send to recent contacts */}
                <div className="space-y-2">
                    <button
                        onClick={() => handleSend('recent-conversation-id')}
                        className="w-full btn btn-primary"
                    >
                        Send to Recent Chat
                    </button>
                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full btn btn-ghost"
                    >
                        Choose Conversation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePage;