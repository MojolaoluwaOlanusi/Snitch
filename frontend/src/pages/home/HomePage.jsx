import Sidebar from "../../components/common/Sidebar.jsx";
import RightPanel from "../../components/common/RightPanel.jsx";
import { useUserStore } from "../../store/useUserStore.js";
import Posts from "../../components/common/Posts.jsx";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useState } from "react";
import FollowingPosts from "../../components/common/FollowingPosts.jsx";
import { usePullToRefresh } from "../../hooks/usePullToRefresh.js";

function HomePage() {
    const [feedType, setFeedType] = useState("forYou");
    const { authUser } = useAuthStore();
    const { getConversations } = useChatStore();
    const { getNotifications } = useUserStore();

    // Pull-to-refresh handler
    const handleRefresh = async () => {
        try {
            // Refresh posts by re-fetching from the Posts/FollowingPosts components
            // This will trigger a re-render of the feed
            window.location.reload();
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    };

    const { pullIndicator, pullToRefreshProps } = usePullToRefresh(handleRefresh, {
        threshold: 80,
        maxPull: 120,
        enabledWidth: 768,
    });

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />

            {/* Pull-to-refresh indicator */}
            {pullIndicator}

            {/* Main feed */}
            <main {...pullToRefreshProps} className="flex-1 bg-base-100 rounded-lg w-full h-screen overflow-y-auto">

                <div className="items-center justify-items-center">
                    <header className="items-center justify-center w-full">
                        <div className="flex w-full border-b border-base-300">
                            <div
                                className="flex justify-center flex-1 p-3 hover:bg-base-300 rounded-lg transition duration-300 cursor-pointer relative"
                                onClick={() => setFeedType("forYou")}
                            >
                                <p className="text-base-content">For You</p>
                                {feedType === "forYou" && (
                                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                            <div
                                className="flex justify-center flex-1 p-3 hover:bg-base-300 rounded-lg transition duration-300 cursor-pointer relative"
                                onClick={() => setFeedType("following")}
                            >
                                <p className="text-base-content">Following</p>
                                {feedType === "following" && (
                                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                        </div>
                    </header>
                </div>
                {feedType === "forYou" && (
                    <>
                        <Posts />
                    </>
                )}
                {feedType === "following" && (
                    <>
                        <FollowingPosts />
                    </>
                )}
            </main>

            {/* Right panel – hidden on mobile/tablet, visible on desktop */}
            <div className="hidden lg:block">
                <RightPanel />
            </div>
        </div>
    );
}

export default HomePage;