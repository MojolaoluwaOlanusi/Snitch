import {useChatStore} from "@/store/useChatStore";
import Sidebar from "../../components/common/Sidebar";
import {useAuthStore} from "@/store/useAuthStore";
import {SnitchLogo} from "@/components/svgs/snitch";

const ChatPage =  () => {

    const { authUser} = useAuthStore();

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className="flex-col items-center bg-white rounded-lg w-full h-screen">
                <p>Hello  this is a chat upgrade!!!</p>
            </div>
        </div>
    );
}
export default ChatPage;

const NoConversationPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
        <SnitchLogo className="size-16 animate-bounce"/>
        <div className="text-center">
            <h3 className="text-gray-300 text-lg font-medium mb-1">No Conversation Selected</h3>
            <p className="text-gray-500 text-sm">Choose a friend to start chatting</p>
        </div>
    </div>
);