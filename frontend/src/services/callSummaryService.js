import { useChatStore } from '../store/useChatStore.js';
import { useAuthStore } from '../store/useAuthStore.js';

export const sendCallSummary = (type, duration, status) => {
    const { selectedConversation, sendMessage } = useChatStore.getState();
    const { authUser } = useAuthStore.getState();
    if (!selectedConversation) {
        console.warn('No conversation selected, cannot send call summary.');
        return;
    }
    const otherUser = selectedConversation.participants?.find(p => p._id !== authUser?._id);
    if (!otherUser) {
        console.warn('No other user found, cannot send call summary.');
        return;
    }
    sendMessage({
        receiverId: otherUser._id,
        conversationId: selectedConversation._id,
        text: '',
        call: { type, duration, status, callerId: authUser?._id },
    });
};