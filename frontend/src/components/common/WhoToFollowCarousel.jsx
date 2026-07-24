// frontend/src/components/common/WhoToFollowCarousel.jsx
import { Link } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore.js";
import { useState } from "react";
import PageLoader from "./PageLoader.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import { toast } from "sonner";

const WhoToFollowCarousel = ({ users, onFollow }) => {
    const { followUser, isFollowingUser } = useUserStore();
    const { authUser } = useAuthStore();
    const [followed, setFollowed] = useState(new Set());
    const [loadingUserId, setLoadingUserId] = useState(null); // track which user is being followed

    const handleFollow = async (userId) => {
        // ✅ Prevent self-follow
        if (userId === authUser?._id) {
            toast.error("You can't follow yourself");
            return;
        }

        // ✅ Already followed in UI
        if (followed.has(userId)) {
            toast.info("Already following this user");
            return;
        }

        // ✅ Start loading state for this user
        setLoadingUserId(userId);

        try {
            await followUser({ id: userId });
            // ✅ Only update local state on success
            setFollowed(prev => new Set(prev).add(userId));
            if (onFollow) onFollow(userId);
        } catch (error) {
            // ✅ Error is already handled in the store, but we can add a fallback
            console.error("Follow failed:", error);
        } finally {
            setLoadingUserId(null);
        }
    };

    if (!users || users.length === 0) return null;

    return (
        <div className="bg-base-100 rounded-xl border border-base-300 p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-base-content">Who to follow</h3>
                <Link to="/search" className="text-xs text-primary hover:underline">
                    See all
                </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {users.map((user) => {
                    const isFollowed = followed.has(user._id);
                    const isSelf = user._id === authUser?._id;
                    const isLoading = loadingUserId === user._id;

                    return (
                        <div
                            key={user._id}
                            className="flex-shrink-0 w-32 bg-primary/5 border border-primary/10 rounded-xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Display Name */}
                            <Link to={`/profile/${user.username}`} className="w-full">
                                <p className="text-sm font-semibold text-base-content truncate w-full">
                                    {user.displayName || user.username}
                                </p>
                            </Link>

                            {/* Username */}
                            <Link to={`/profile/${user.username}`} className="w-full">
                                <p className="text-xs text-base-content/50 truncate w-full">@{user.username}</p>
                            </Link>

                            {/* Avatar */}
                            <Link to={`/profile/${user.username}`} className="mt-1">
                                <div className="avatar">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border border-base-300">
                                        <img
                                            src={user.avatarUrl || "/avatar-placeholder.png"}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </Link>

                            {/* ✅ Follow Button with proper states */}
                            <button
                                className={`mt-2 btn btn-xs w-full ${
                                    isSelf
                                        ? 'btn-ghost text-base-content/30 cursor-not-allowed'
                                        : isFollowed
                                            ? 'btn-success'
                                            : 'btn-primary'
                                }`}
                                onClick={() => handleFollow(user._id)}
                                disabled={isFollowingUser || isFollowed || isSelf || isLoading}
                            >
                                {isSelf
                                    ? 'You'
                                    : isLoading
                                        ? <PageLoader />
                                        : isFollowed
                                            ? 'Followed'
                                            : 'Follow'
                                }
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WhoToFollowCarousel;