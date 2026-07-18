import {useAuthStore} from "../../store/useAuthStore.js";
import {useChatStore} from "../../store/useChatStore.js";
import {useState} from "react";
import {SendIcon} from "lucide-react";

const MessageInput = () => {
    const {authUser, selectedUser, sendMessage} = useAuthStore();
    const [newMessage, setNewMessage] = useState("");

    const handleSend = () => {
        if (!selectedUser || !authUser) return;
        sendMessage(selectedUser?._id, authUser?._id, newMessage.trim());
        setNewMessage("")
    }

    return (
        <div className="p-2 mt-auto border-t border-base-300">
            <div className="flex items-center gap-2 w-full">
                <input
                aria-label="Type a message"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-base-200 border-none w-full flex-1 py-2 px-3 rounded-md outline-primary/20"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />

                <button
                  aria-label="Send message"
                  className="size-icon h-8 w-8 flex items-center justify-center rounded-md bg-primary text-primary-content disabled:opacity-50"
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                >
                    <SendIcon className="size-4" />
                </button>
            </div>
        </div>
    )
};

export default MessageInput;
