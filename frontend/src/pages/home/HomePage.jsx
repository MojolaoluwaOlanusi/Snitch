import Sidebar from "../../components/common/Sidebar.jsx";
import RightPanel from "../../components/common/RightPanel.jsx";
import { useUserStore } from "../../store/useUserStore.js";
import { useRef } from 'react';
import Posts from "../../components/common/Posts.jsx";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useState } from "react";
import FollowingPosts from "../../components/common/FollowingPosts.jsx";
import { usePullToRefresh } from '../../hooks/usePullToRefresh.jsx';
import PullToRefreshIndicator from '../../components/common/PullToRefreshIndicator.jsx';

function HomePage() {
    const [feedType, setFeedType] = useState("forYou");
    const { authUser } = useAuthStore();
    const { getConversations } = useChatStore();
    const { getPosts, getFollowingPosts, refreshData } = useUserStore();
    const feedContainerRef = useRef(null);

    // Pull-to-refresh handler
    const handleRefresh = async () => {
        try {
            // Refresh posts and data
            await Promise.all([
                getPosts(),
                getFollowingPosts(),
                refreshData ? refreshData() : Promise.resolve(),
            ]);
            // Optionally refresh conversations
            if (getConversations) {
                await getConversations();
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    };

    const { pullDistance, isRefreshing } = usePullToRefresh(feedContainerRef, handleRefresh);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />

            {/* Main feed with pull-to-refresh container */}
            <main className="flex-1 bg-base-100 rounded-lg w-full h-screen overflow-y-auto relative" ref={feedContainerRef}>
                {/* Pull-to-refresh indicator */}
                <PullToRefreshIndicator
                    pullDistance={pullDistance}
                    isRefreshing={isRefreshing}
                />

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