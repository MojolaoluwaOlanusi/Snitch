import { useUserStore } from "../../store/useUserStore.js";
import { useEffect, useState } from "react";
import CreatePostRightPanelSkeleton from "../../components/skeletons/CreatePostRightPanelSkeleton.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import {
    AudioLinesIcon,
    ImageIcon,
    VideoIcon,
    Calendar,
    Globe,
    Lock,
    Users,
    Clock,
    Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

// Helper to format post date
const formatPostDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: diffDays > 365 ? 'numeric' : undefined,
    });
};

// Visibility badge component
const VisibilityBadge = ({ visibility }) => {
    const config = {
        public: {
            label: 'Public',
            icon: Globe,
            className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        },
        private: {
            label: 'Private',
            icon: Lock,
            className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
        },
        followers: {
            label: 'Followers',
            icon: Users,
            className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        },
        friends: {
            label: 'Friends',
            icon: Users,
            className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        },
    };

    const { label, icon: Icon, className } = config[visibility] || config.public;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${className}`}>
            <Icon className="w-2.5 h-2.5" />
            {label}
        </span>
    );
};

// Media type icon component
const MediaTypeIcon = ({ mediaType }) => {
    if (mediaType === 'Audio') return <AudioLinesIcon className="w-3.5 h-3.5 text-primary/60" />;
    if (mediaType === 'Video') return <VideoIcon className="w-3.5 h-3.5 text-primary/60" />;
    if (mediaType === 'Image') return <ImageIcon className="w-3.5 h-3.5 text-primary/60" />;
    return null;
};

const CreatePostRightPanel = () => {
    const { truncatedPosts, isGettingUserPosts, getTruncatedPosts } = useUserStore();
    const { authUserId, authUser } = useAuthStore();

    useEffect(() => {
        getTruncatedPosts(authUserId);
    }, [getTruncatedPosts, authUserId]);

    if (truncatedPosts?.length === 0) {
        return (
            <div className='hidden lg:block w-64 my-4 mx-2'>
                <div className='bg-base-100 p-6 rounded-2xl border border-base-200 text-center'>
                    <div className='text-base-content/30 text-4xl mb-2'>📝</div>
                    <p className='text-sm text-base-content/50 font-medium'>No posts yet</p>
                    <p className='text-xs text-base-content/30 mt-1'>Your posts will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className='hidden lg:block w-64 my-4 mx-2'>
            <div className='bg-base-100 rounded-2xl border border-base-200 p-4 sticky top-2 shadow-sm'>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className='font-semibold text-sm text-base-content'>Your Posts</p>
                    <span className="text-[10px] text-base-content/40 bg-base-200 px-2 py-0.5 rounded-full">
                        {truncatedPosts?.length || 0}
                    </span>
                </div>

                {/* Posts list */}
                <div className='flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar'>
                    {isGettingUserPosts ? (
                        <>
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                        </>
                    ) : (
                        truncatedPosts?.map((post) => (
                            <Link
                                to={`/post/${post?._id}`}
                                key={post?._id}
                                className="group block"
                            >
                                <div className="bg-base-200/50 hover:bg-base-200 rounded-xl p-3 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-base-300">
                                    {/* Post content */}
                                    <div className="flex items-start gap-2.5">
                                        {/* Avatar */}
                                        <div className="avatar flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-base-300/50">
                                                <img
                                                    src={authUser?.avatarUrl || "/avatar.png"}
                                                    alt={authUser?.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        {/* Post details */}
                                        <div className="flex-1 min-w-0">
                                            {/* Post text */}
                                            <p className="text-sm text-base-content/80 font-medium truncate leading-relaxed">
                                                {post?.text || 'Untitled post'}
                                            </p>

                                            {/* Media type indicator */}
                                            {post?.mediaType && post.mediaType !== 'None' && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MediaTypeIcon mediaType={post.mediaType} />
                                                    <span className="text-[10px] text-base-content/40">
                                                        {post.mediaType}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Tags row – visibility + date */}
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <VisibilityBadge visibility={post?.visibility || 'public'} />

                                                <span className="inline-flex items-center gap-1 text-[10px] text-base-content/30">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatPostDate(post?.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePostRightPanel;