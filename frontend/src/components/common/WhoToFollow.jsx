import { Link } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore.js";
import { useEffect } from "react";
import PageLoader from "./PageLoader.jsx";

const WhoToFollow = () => {
    const { suggestedUsers, getSuggestedUsers, isGettingSuggestedUsers, followUser, isFollowingUser } = useUserStore();

    useEffect(() => {
        getSuggestedUsers();
    }, [getSuggestedUsers]);

    // Hide on desktop (screen width >= 1024px)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        return null;
    }

    if (suggestedUsers?.length === 0) return null;

    return (
        <div className="lg:hidden my-4 mx-2">
            <div className="bg-base-100 p-4 rounded-md">
                <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-base-content">Who to follow</p>
                    <Link to="/explore" className="text-sm text-primary/90 hover:text-primary">
                        See all
                    </Link>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                    {isGettingSuggestedUsers ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex-shrink-0 w-32 h-20 bg-base-200 rounded-lg animate-pulse" />
                            ))}
                        </>
                    ) : (
                        suggestedUsers?.map((user) => (
                            <div
                                key={user?._id}
                                className="flex-shrink-0 w-32 bg-base-200 rounded-lg p-3 flex flex-col items-center"
                            >
                                <Link to={`/profile/${user?.username}`} className="mb-2">
                                    <div className="avatar">
                                        <div className="w-12 rounded-full">
                                            <img src={user?.avatarUrl || "/avatar-placeholder.png"} alt={user?.username} />
                                        </div>
                                    </div>
                                </Link>
                                <div className="text-center w-full">
                                    <p className="font-semibold text-xs truncate w-full">{user?.displayName}</p>
                                    <p className="text-xs text-base-content/60 truncate w-full">@{user?.username}</p>
                                </div>
                                <button
                                    className="mt-2 btn bg-primary/60 text-base-content hover:bg-base-300 hover:opacity-90 rounded-full btn-xs w-full"
                                    onClick={() => followUser({ id: user?._id })}
                                    disabled={isFollowingUser}
                                >
                                    {isFollowingUser ? <PageLoader /> : "Follow"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhoToFollow;
