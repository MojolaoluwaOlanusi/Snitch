import { useChatStore } from '../store/useChatStore.js';
import { useCallStore } from '../store/useCallStore.js';
import {useAuthStore} from "@/store/useAuthStore.js";

export const sendCallSummary = (type, duration, status) => {
    const { selectedConversation, sendMessage } = useChatStore.getState();
    const { authUser } = useAuthStore.getState();
    if (!selectedConversation) return;
    const otherUser = selectedConversation.participants?.find(p => p._id !== authUser?._id);
    sendMessage({
        receiverId: otherUser?._id,
        conversationId: selectedConversation._id,
        text: '',
        call: { type, duration, status, callerId: authUser?._id },
    });
};