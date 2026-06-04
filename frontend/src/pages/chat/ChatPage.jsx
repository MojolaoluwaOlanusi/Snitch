import {useChatStore} from "../../store/useChatStore";
import Sidebar from "../../components/common/Sidebar";
import {SnitchLogo} from "../../components/svgs/snitch";

const NoConversationPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
        <SnitchLogo className="size-16 animate-bounce"/>
        <div className="text-center">
            <h3 className="text-gray-300 text-lg font-medium mb-1">No Conversation Selected</h3>
            <p className="text-gray-500 text-sm">Choose a friend to start chatting</p>
        </div>
    </div>
);

const ChatPage =  () => {

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className="flex-col items-center bg-white rounded-lg w-full h-screen">
                <NoConversationPlaceholder />
            </div>
        </div>
    );
}
export default ChatPage;
