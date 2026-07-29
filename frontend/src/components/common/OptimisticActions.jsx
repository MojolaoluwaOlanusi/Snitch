import { useState } from 'react';
import { FaRegHeart } from 'react-icons/fa';
import { BiRepost } from 'react-icons/bi';
import { Bookmark } from 'lucide-react';
import { MdAddReaction } from 'react-icons/md';
import { toast } from 'sonner';

// Optimistic Like Button with heart burst animation
export const OptimisticLikeButton = ({ post, authUserId, onLike }) => {
    const [isLiked, setIsLiked] = useState(!!post?.likes?.some((id) => id === authUserId));
    const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async () => {
        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
        setIsAnimating(true);

        try {
            await onLike(post._id);
        } catch (error) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
            toast.error("Failed to like post");
        } finally {
            setTimeout(() => setIsAnimating(false), 600);
        }
    };

    return (
        <div className="flex gap-1 items-center cursor-pointer group" onClick={handleClick}>
            <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
                <FaRegHeart
                    className={`w-4 h-4 transition-transform duration-200 ${
                        isLiked ? "text-secondary scale-110" : "text-base-content/60"
                    } group-hover:text-secondary group-hover:scale-110`}
                />
                {isAnimating && isLiked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-secondary/20 rounded-full animate-ping" />
                    </div>
                )}
            </div>
            <span className={`text-sm transition-colors ${
                isLiked ? "text-secondary" : "text-base-content/60 group-hover:text-secondary"
            }`}>
                {likeCount}
            </span>
        </div>
    );
};

// Optimistic Repost Button with rotation animation
export const OptimisticRepostButton = ({ post, onRepost }) => {
    const [repostCount, setRepostCount] = useState(post?.repostCount || 0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async () => {
        setRepostCount(prev => prev + 1);
        setIsAnimating(true);

        try {
            await onRepost(post._id);
        } catch (error) {
            setRepostCount(prev => prev - 1);
            toast.error("Failed to repost");
        } finally {
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    return (
        <div className="flex gap-1 items-center cursor-pointer group" onClick={handleClick}>
            <BiRepost
                className={`w-6 h-6 transition-all duration-300 ${
                    isAnimating ? 'text-success rotate-180 scale-110' : 'text-base-content/60'
                } group-hover:text-success group-hover:scale-110`}
            />
            <span className="text-sm group-hover:text-success text-base-content/60 transition-colors">
                {repostCount}
            </span>
        </div>
    );
};

// Optimistic Bookmark Button with wiggle animation
export const OptimisticBookmarkButton = ({ post, authUserId, onBookmark }) => {
    const [isBookmarked, setIsBookmarked] = useState(post?.bookmarkedBy?.includes(authUserId));
    const [bookmarkCount, setBookmarkCount] = useState(post?.bookmarksCount || 0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async () => {
        const newIsBookmarked = !isBookmarked;
        setIsBookmarked(newIsBookmarked);
        setBookmarkCount(prev => newIsBookmarked ? prev + 1 : prev - 1);
        setIsAnimating(true);

        try {
            await onBookmark(post._id);
        } catch (error) {
            setIsBookmarked(!newIsBookmarked);
            setBookmarkCount(prev => newIsBookmarked ? prev - 1 : prev + 1);
            toast.error("Failed to bookmark post");
        } finally {
            setTimeout(() => setIsAnimating(false), 400);
        }
    };

    return (
        <button
            className={`flex items-center justify-center gap-2 transition-colors group py-2 hover:bg-base-200 rounded-lg ${
                isBookmarked ? "text-primary" : "text-base-content/60 hover:text-primary"
            }`}
            onClick={handleClick}
        >
            <Bookmark
                className={`w-5 h-5 transition-all duration-200 ${
                    isBookmarked ? "fill-current" : ""
                } ${isAnimating ? 'animate-[wiggle_0.3s_ease-in-out]' : ''}`}
            />
            <span className="text-sm">{bookmarkCount}</span>
        </button>
    );
};

// Optimistic Reaction Button with bounce animation
export const OptimisticReactionButton = ({ post, onReact, onTogglePicker }) => {
    const [reactionCount, setReactionCount] = useState(post?.reaction?.length || 0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleReact = async (emoji) => {
        setReactionCount(prev => prev + 1);
        setIsAnimating(true);

        try {
            await onReact({ id: post._id, reaction: emoji });
        } catch (error) {
            setReactionCount(prev => prev - 1);
            toast.error("Failed to react to post");
        } finally {
            setTimeout(() => setIsAnimating(false), 400);
        }
    };

    return (
        <div className="flex gap-1 items-center cursor-pointer group" onClick={onTogglePicker}>
            <MdAddReaction
                className={`w-6 h-6 transition-all duration-200 ${
                    isAnimating ? 'text-yellow-500 scale-125' : 'text-base-content/60'
                } group-hover:text-yellow-500 group-hover:scale-110`}
            />
            <span className="text-sm text-base-content/60 group-hover:text-yellow-500 transition-colors">
                {reactionCount}
            </span>
        </div>
    );
};

// Optimistic Delete Button with fade animation
export const OptimisticDeleteButton = ({ post, onDelete, children }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClick = async () => {
        setIsDeleting(true);

        try {
            await onDelete(post._id);
        } catch (error) {
            setIsDeleting(false);
            toast.error("Failed to delete post");
        }
    };

    return (
        <button
            className={`transition-all duration-300 ${isDeleting ? 'opacity-0 scale-95' : ''}`}
            onClick={handleClick}
            disabled={isDeleting}
        >
            {children}
        </button>
    );
};

// Optimistic Follow Button
export const OptimisticFollowButton = ({ userId, isFollowing, onFollow }) => {
    const [following, setFollowing] = useState(isFollowing);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async () => {
        const newFollowing = !following;
        setFollowing(newFollowing);
        setIsAnimating(true);

        try {
            await onFollow({ id: userId });
        } catch (error) {
            setFollowing(!newFollowing);
            toast.error("Failed to follow user");
        } finally {
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    return (
        <button
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                following
                    ? 'bg-base-200 text-base-content hover:bg-base-300'
                    : 'bg-primary text-primary-content hover:bg-primary/90'
            } ${isAnimating ? 'scale-105' : ''}`}
            onClick={handleClick}
        >
            {following ? 'Following' : 'Follow'}
        </button>
    );
};
