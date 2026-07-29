// @ts-nocheck
import { useUserStore } from "@/store/useUserStore.js";
import { useEffect, useState, Suspense, useMemo } from "react";
import PostSkeleton from "../../components/skeletons/PostSkeleton.jsx";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebook, FaXTwitter, FaWhatsapp, FaTelegram, FaEnvelope } from "react-icons/fa6";
import { FaRegComment, FaRegHeart, FaTrash } from "react-icons/fa";
import { toast } from "sonner";
import { BiRepost } from "react-icons/bi";
import { OptimisticLikeButton, OptimisticRepostButton, OptimisticBookmarkButton, OptimisticReactionButton, OptimisticDeleteButton } from "./OptimisticActions.jsx";
import { formatPostDate } from "../../utils/date/index.js";
import { useAuthStore } from "@/store/useAuthStore.js";
import { MdAddReaction, MdReportProblem } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import EditPostModal from "../../components/common/EditPostModal.jsx";
import {MoreHorizontal, Hash, Share2, Copy, Check, Bookmark, Sticker,  ChevronDown, ChevronUp} from "lucide-react";
import ReactionEmojiPicker from "./ReactionEmojiPicker.tsx";
import ReactionsDisplay from "./ReactionsDisplay.jsx";
import GifStickerPicker from "../../components/common/GifStickerPicker.jsx";
import { AnimatePresence } from "framer-motion";
import ReportModal from "./ReportModal.jsx";
import axiosInstance from "../../lib/axios.js";
import WhoToFollowCarousel from "../../components/common/WhoToFollowCarousel.jsx";

// ── Helper: compute insertion points ──
const getInsertionPoints = (totalPosts) => {
    const intervals = [5, 7, 10, 15, 20];
    const points = [];
    let current = 0;
    let i = 0;
    while (current < totalPosts) {
        const interval = intervals[i % intervals.length];
        current += interval;
        if (current < totalPosts) points.push(current);
        i++;
    }
    return points;
};

// ── Single post item (extracted to avoid hook-in-loop) ──
const PostItem = ({ post, authUserId }) => {
    const {
        repost, likePost, reactToPost, bookmarkPost,
        reportPost, deletePost,
    } = useUserStore();

    const {authUser} = useAuthStore();
    const isOwnPost = post?.author?.username === authUser?.username;

    const [isBookmarked, setIsBookmarked] = useState(
        post?.bookmarkedBy?.includes(authUserId)
    );
    const [bookmarkCount, setBookmarkCount] = useState(post?.bookmarksCount || 0);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [commentData, setCommentData] = useState({ text: "", postId: "", media: null });
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyMedia, setReplyMedia] = useState(null);
    const [showReplies, setShowReplies] = useState(false);
    const [showCommentStickerPicker, setShowCommentStickerPicker] = useState(false);
    const [showReplyStickerPicker, setShowReplyStickerPicker] = useState(false);
    const [showReportModal, setShowReportModal] = useState(null);

    const navigate = useNavigate();
    const isLikedByMe = !!post?.likes?.some((id) => id === authUserId);

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!commentData.text.trim() && !commentData.media) return;

        // Optimistic UI – immediately add a temporary comment
        const tempComment = {
            _id: `temp-${Date.now()}`,
            user: authUserId,
            text: commentData.text,
            media: commentData.media || null,
            userAvatar: authUser?.avatarUrl || "/avatar-placeholder.png",
            userDisplayName: authUser?.displayName,
            userUsername: authUser?.username,
            createdAt: new Date().toISOString(),
        };
        // Update local post state (if you have a setPosts or similar)
        // Example for a local state: setPost(prev => ({...prev, comments: [...prev.comments, tempComment]}));
        // Or if you're using the global store, you can push to it:
        const updatedComments = [...(post?.comments || []), tempComment];
        // We need to update the post in the store. This depends on your store structure.
        // For simplicity, we'll refetch the post after a successful request.

        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.post(
                "/posts/comment",
                {
                    postId: post._id,
                    text: commentData.text,
                    media: commentData.media || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove the temp comment and replace with the real one from the server
            const updatedPost = res.data;   // assuming API returns the full updated post
            // Now update the post in your state/store.
            // If you have a function like updatePost in your store:
            useUserStore.getState().updatePost(post._id, updatedPost);
            // Or if you maintain a local posts array:
            // setPosts(prev => prev.map(p => p._id === post._id ? updatedPost : p));

            // Clear comment input
            setCommentData({ text: "", postId: "", media: null });
        } catch (error) {
            // Remove the temp comment if the request fails
            // Revert the optimistic update
            useUserStore.getState().updatePost(post._id, { ...post, comments: post.comments });
            console.error("Failed to comment:", error);
            toast.error("Failed to comment");
        }
    };

    const handleReplyComment = async (commentId, replyText, replyMedia = null) => {
        if (!replyText.trim() && !replyMedia) return;

        // Optimistic UI – add a temp reply
        const tempReply = {
            _id: `temp-${Date.now()}`,
            user: authUserId,
            text: replyText,
            media: replyMedia,
            userAvatar: authUser?.avatarUrl || "/avatar-placeholder.png",
            userDisplayName: authUser?.displayName,
            userUsername: authUser?.username,
            createdAt: new Date().toISOString(),
        };

        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.post(
                `/posts/comment/${commentId}/reply`,
                { text: replyText, media: replyMedia },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // API returns the full updated post
            const updatedPost = res.data;
            useUserStore.getState().updatePost(post._id, updatedPost);
            // Clear reply state
            setReplyToCommentId(null);
            setReplyText("");
        } catch (error) {
            // Revert optimistic reply
            useUserStore.getState().updatePost(post._id, post);
            console.error("Failed to reply:", error);
            toast.error("Failed to reply");
        }
    };

    const handleShare = async (postId, url, title = 'Check out this post on Snitch', text = 'I found this interesting post on Snitch!') => {
        // If Web Share API is supported, use it
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url,
                });
                // Exit early - don't open the modal
                return;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                }
                // If user cancelled (AbortError), don't show modal
                if (error.name === 'AbortError') {
                    return;
                }
                // Fallback to modal if share fails for other reasons
            }
        }

        // Fallback: open the share modal (only if navigator.share not supported or failed)
        window.dispatchEvent(
            new CustomEvent("OpenShareModal", {
                detail: { postId, url, title, text },
            })
        );
    };

    const handleHashtagClick = (hashtag, navigate) => {
        navigate('/search', { state: { searchWord: hashtag, searchType: 'hashtag' } });
    };

    return (
        <div className="flex gap-2 items-start p-4 border-b border-base-content/40" key={post?._id}>
            <div className="flex flex-col flex-1">
                <div className="flex gap-2 items-center">
                    <div className="avatar">
                        <Link to={`/profile/${post?.author?.username}`} className="w-8 h-8 rounded-full overflow-hidden">
                            <img src={post?.author?.avatarUrl || "/avatar-placeholder.png"} alt={post?.author?.displayName} />
                        </Link>
                    </div>
                    <Link to={`/profile/${post?.author?.username}`} className="font-bold">
                        {post?.author?.displayName}
                    </Link>
                    <span className="text-base-content/80 flex gap-1 text-sm">
            <Link to={`/profile/${post?.author?.username}`}>@{post?.author?.username}</Link>
            <span>·</span>
            <span>{formatPostDate(post?.createdAt)}</span>
          </span>
                    <span className="flex justify-end flex-1 space-x-2">
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-sm" aria-label="Post functions">
                  <MoreHorizontal className="h-5 w-5" />
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
  <li>
    {isOwnPost && (
        <OptimisticDeleteButton post={post} onDelete={deletePost}>
            <div className="flex flex-row group w-40 justify-between">
                <p className="group-hover:text-error">Delete post</p>
                <FaTrash className="cursor-pointer group-hover:text-error" />
            </div>
        </OptimisticDeleteButton>
    )}
      {isOwnPost && (
          <EditPostModal post={post} />
      )}
      <button className="text-base-content/60" onClick={() => setShowReportModal(post._id)}>
      Report Post
    </button>
  </li>
</ul>
            </div>
          </span>
                </div>
                <Link to={`/post/${post?._id}`} className="w-full">
                    <div className="flex flex-col gap-3 overflow-hidden">
                        <span className={`w-full leading-relaxed whitespace-pre-wrap ${post?.url && post?.mediaType ? 'line-clamp-3' : 'line-clamp-[11]'}`}>
                        {post?.text}
                        </span>
                        {post?.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {post.hashtags.map((hashtag, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleHashtagClick(hashtag, navigate);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full text-sm text-primary hover:text-primary transition-all duration-200"
                                    >
                                        <Hash className="w-3 h-3" />
                                        <span>{hashtag}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {post?.url && post?.mediaType && (
                            <div className="w-full h-[400px] aspect-[4/5] sm:aspect-video rounded-2xl overflow-hidden items-center">
                                {post?.mediaType === "Image" && (
                                    <img src={post?.url} className="w-full h-full object-cover object-center block rounded-lg" alt="" loading="lazy" />
                                )}
                                {post?.mediaType === "Video" && (
                                    <video src={post?.url} className="w-full h-full object-cover object-center block rounded-lg" controls />
                                )}
                                {post?.mediaType === "Audio" && (
                                    <div className="w-full h-full object-cover object-center block rounded-lg">
                                        <img src="/Snitch_Audio_Waveform(1920 x 1080).png" alt="" className="w-full h-[350px] object-cover object-center block rounded-lg" />
                                        <audio src={post?.url} controls className="w-full" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Link>
                {/* Action bar – replace entirely with this */}
                <div className="flex justify-between mt-3">
                    <div className="flex flex-1 items-center justify-around">
                        {/* Comment */}
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={() =>
                                document.getElementById(`comments_modal${post._id}`).showModal()
                            }
                        >
                            <FaRegComment className="w-4 h-4 text-base-content/60 group-hover:text-info" />
                            <span className="text-sm text-base-content/60 group-hover:text-info">
                                {post?.comments.length}
                            </span>
                        </div>

                        {/* Comment modal */}
                        <dialog id={`comments_modal${post._id}`} className="modal border-none outline-none">
                            <div className={`modal-box rounded border border-base-content/30 space-y-2 bg-base-200 ${post?.comments.length === 0 ? "w-full max-w-2xl" : ""}`}>
                                <div className="flex mx-auto items-center justify-between">
                                    <h3 className="font-bold text-lg mb-4">Comments</h3>
                                    <div>
                                        <form method="dialog" className="modal-backdrop">
                                            <button className="outline-none"><IoClose className="text-base-content" /></button>
                                        </form>
                                    </div>
                                </div>

                                {/* New comment form */}
                                <form onSubmit={handlePostComment}>
                                    <div className="flex gap-2 items-center mt-4 border-t border-base-content/30 pt-2">
                                        <textarea
                                            className="w-full p-1 rounded text-md resize-none border focus:outline-none border-base-content/30 bg-base-300 text-base-content placeholder:text-base-content/50 focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="Write a comment..."
                                            value={commentData.text}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(e); } }}
                                            onChange={(e) => setCommentData({ ...commentData, text: e.target.value, postId: post?._id })}
                                        />
                                        <button type="button" onClick={() => setShowCommentStickerPicker(!showCommentStickerPicker)} className="p-2 hover:bg-base-200 rounded-full" title="Add sticker or GIF">
                                            <Sticker className="w-5 h-5 text-base-content/60" />
                                        </button>
                                        <button type="submit" className="btn btn-primary rounded-full btn-sm text-primary-content px-4">
                                            Post
                                        </button>
                                    </div>
                                </form>

                                {/* Sticker / GIF picker for new comment */}
                                <AnimatePresence>
                                    {showCommentStickerPicker && (
                                        <div className="max-h-48 overflow-y-auto border border-base-content/30 rounded-lg p-1">
                                            <Suspense fallback={null}>
                                                <GifStickerPicker
                                                    onSelect={({ type, url }) => {
                                                        setCommentData(prev => ({
                                                            ...prev,
                                                            media: { url, type },   // directly store the media object
                                                        }));
                                                        setShowCommentStickerPicker(false);
                                                    }}
                                                    isOpen={showCommentStickerPicker}
                                                    onClose={() => setShowCommentStickerPicker(false)}
                                                />
                                            </Suspense>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {/* Comments list */}
                                <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                                    {post?.comments.length === 0 && (
                                        <p className="text-sm text-base-content/60">No comments yet. Be the first to share your thoughts!</p>
                                    )}
                                    {post?.comments.map((comment) => (
                                        <div key={comment._id} className="flex gap-2 items-start">
                                            <div className="avatar">
                                                <div className="w-8 rounded-full">
                                                    <img src={comment?.userAvatar || "/avatar-placeholder.png"} alt={comment?.userUsername} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold">{comment?.userDisplayName}</span>
                                                    <span className="text-base-content/70 text-sm">@{comment?.userUsername}</span>
                                                </div>
                                                <div className="text-sm">{comment?.text}</div>
                                                {comment.media && comment.media.url && (
                                                    <div className="mt-1">
                                                        {comment.media.type === 'sticker' ? (
                                                            <img src={comment.media.url} alt="sticker" className="max-w-[120px] max-h-[120px]" />
                                                        ) : (
                                                            <img src={comment.media.url} alt="gif" className="max-w-[150px] max-h-[150px] rounded" />
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex w-full justify-between">
                                                    {/* Show replies */}
                                                    {comment.replies?.length > 0 && (
                                                        <button onClick={() => setShowReplies(!showReplies)} className="p-1">
                                                            {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}

                                                    {/* Reply button */}
                                                    <button className="text-xs text-primary hover:underline mt-1" onClick={() => setReplyToCommentId(replyToCommentId === comment._id ? null : comment._id)}>
                                                        Reply
                                                    </button>
                                                </div>

                                                {/* Inline reply input */}
                                                {replyToCommentId === comment._id && (
                                                    <div className="mt-2 space-y-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Write a reply..."
                                                                className="flex-1 border border-base-content/30 rounded px-2 py-1 text-sm bg-base-300"
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleReplyComment(comment._id, replyText, replyMedia);
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                className="text-xs btn btn-primary btn-sm"
                                                                onClick={() => handleReplyComment(comment._id, replyText, replyMedia)}
                                                            >
                                                                Send
                                                            </button>
                                                            <button type="button" onClick={() => setShowReplyStickerPicker(!showReplyStickerPicker)} className="p-1 hover:bg-base-200 rounded" title="Add sticker or GIF">
                                                                <Sticker className="w-4 h-4 text-base-content/60" />
                                                            </button>
                                                        </div>
                                                        <AnimatePresence>
                                                            {showReplyStickerPicker && (
                                                                <div className="max-h-32 overflow-y-auto border border-base-content/30 rounded-lg p-1">
                                                                    <Suspense fallback={null}>
                                                                        <GifStickerPicker
                                                                            onSelect={({ type, url }) => {
                                                                                setReplyMedia({type, url});
                                                                                setShowReplyStickerPicker(false);
                                                                            }}
                                                                            isOpen={showReplyStickerPicker}
                                                                            onClose={() => setShowReplyStickerPicker(false)}
                                                                        />
                                                                    </Suspense>
                                                                </div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                {showReplies && (
                                                    <div className="ml-4 mt-2 space-y-2">
                                                        {comment.replies.map(reply => (
                                                            <div key={reply._id} className="flex gap-2 items-start">
                                                                <div className="avatar">
                                                                    <div className="w-6 rounded-full">
                                                                        <img src={reply?.userAvatar || "/avatar-placeholder.png"} alt={reply?.userUsername} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="font-bold text-xs">{reply?.userDisplayName}</span>
                                                                        <span className="text-base-content/70 text-xs">@{reply?.userUsername}</span>
                                                                    </div>
                                                                    <div className="text-xs">{reply?.text}</div>
                                                                    {reply.media?.url && (
                                                                        <div className="mt-1">
                                                                            {reply.media.type === 'sticker' ? (
                                                                                <img src={reply.media.url} alt="sticker" className="max-w-[80px] max-h-[80px]" />
                                                                            ) : (
                                                                                <img src={reply.media.url} alt="gif" className="max-w-[100px] max-h-[100px] rounded" />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </dialog>

                        {/* Repost */}
                        <OptimisticRepostButton post={post} onRepost={repost} />

                        {/* Like */}
                        <OptimisticLikeButton post={post} authUserId={authUserId} onLike={likePost} />

                        {/* Share */}
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={(e) => {
                                e.preventDefault();
                                const postUrl = `${window.location.origin}/post/${post?._id}`;
                                handleShare(post?._id, postUrl);
                            }}
                        >
                            <Share2 className="w-4 h-4 text-base-content/60 group-hover:text-primary" />
                        </div>

                        {/* Bookmark */}
                        <OptimisticBookmarkButton post={post} authUserId={authUserId} onBookmark={bookmarkPost} />

                        {/* React / Emoji picker */}
                        <OptimisticReactionButton 
                            post={post} 
                            onReact={reactToPost} 
                            onTogglePicker={() => setEmojiPickerOpen(emojiPickerOpen === post._id ? null : post._id)}
                        />

                        {/* Top‑3 reactions display (inline) */}
                        <ReactionsDisplay reactions={post?.reaction} />

                    </div>

                    {/* Emoji picker (absolutely positioned) */}
                    <div className="relative">
                        {emojiPickerOpen === post._id && (
                            <ReactionEmojiPicker
                                postId={post._id}
                                isOpen={true}
                                onClose={() => setEmojiPickerOpen(null)}
                                onReact={(emoji) => {
                                    setActionPostId(post._id);
                                    reactToPost({ id: post?._id, reaction: emoji });
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Report Modal */}
                <ReportModal
                    isOpen={showReportModal === post._id}
                    onClose={() => setShowReportModal(null)}
                    onReport={(reason) =>
                        reportPost({ id: post._id, reason: { reason } })
                    }
                />
            </div>
        </div>
    );
};

// ── Main Posts component ────────────────────────────────
const Posts = () => {
    const {
        isGettingPosts, Posts, getPosts, getFollowingPosts,
        suggestedUsers, getSuggestedUsers
    } = useUserStore();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    const { authUser, authUserId } = useAuthStore();

    // Detect mobile viewport
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch suggestions once (if not loaded)
    useEffect(() => {
        if (!suggestedUsers || suggestedUsers.length === 0) {
            getSuggestedUsers();
        }
    }, [getSuggestedUsers, suggestedUsers?.length]);

    // Merge feed with carousels after every 20 posts (mobile only)
    const feedItems = useMemo(() => {
        if (!isMobile) return Posts.map(p => ({ type: 'post', data: p }));
        if (!Posts.length) return [];

        const merged = [];
        let suggestionIndex = 0;
        const CAROUSEL_SIZE = 10;
        const POST_INTERVAL = 20;

        Posts.forEach((post, idx) => {
            merged.push({ type: 'post', data: post });

            const pos = idx + 1;
            if (pos % POST_INTERVAL === 0 && suggestionIndex < suggestedUsers.length) {
                const carouselUsers = suggestedUsers.slice(
                    suggestionIndex,
                    suggestionIndex + CAROUSEL_SIZE
                );
                if (carouselUsers.length > 0) {
                    merged.push({
                        type: 'carousel',
                        data: carouselUsers,
                    });
                    suggestionIndex += CAROUSEL_SIZE;
                }
            }
        });

        // Do NOT append leftover suggestions – only posts.

        return merged;
    }, [Posts, suggestedUsers, isMobile]);
    useEffect(() => {
        getPosts();
        getFollowingPosts();
    }, [getPosts, getFollowingPosts]);

    // Share modal state (unchanged)
    const [shareModal, setShareModal] = useState({ open: false, postId: null, url: "", title: "Share Post", text: "" });
    useEffect(() => {
        const handler = (e) => setShareModal({ 
            open: true, 
            postId: e.detail.postId, 
            url: e.detail.url,
            title: e.detail.title || "Share Post",
            text: e.detail.text || ""
        });
        window.addEventListener("OpenShareModal", handler);
        return () => window.removeEventListener("OpenShareModal", handler);
    }, []);

    if (isGettingPosts) {
        return (
            <div className="flex flex-col justify-center">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </div>
        );
    }

    if (!Posts?.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body items-center text-center">
                        <div className="text-6xl mb-4">😅</div>
                        <h2 className="card-title text-2xl">Your feed is empty</h2>
                        <p className="text-base-content/60">Invite friends to make it lit</p>
                        <div className="card-actions justify-center mt-4">
                            <button 
                                onClick={() => {
                                    const { authUser } = useAuthStore.getState();
                                    const inviteUrl = `${window.location.origin}/profile/${authUser?.username}`;
                                    const inviteText = `Hey! I'm on Snitch – a cool new social app. Follow me @${authUser?.username} and let's connect! 🚀`;
                                    handleShare(null, inviteUrl, "Invite a friend to Snitch", inviteText);
                                }}
                                className="btn btn-primary"
                            >
                                Invite Friends
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-auto w-full h-[calc(100vh-50px)]">
            {feedItems.map((item, idx) => {
                if (item.type === 'post') {
                    return <PostItem key={item.data._id} post={item.data} authUserId={authUserId} />;
                } else if (item.type === 'carousel') {
                    return (
                        <WhoToFollowCarousel
                            key={`carousel-${idx}`}
                            users={item.data}
                        />
                    );
                }
                return null;
            })}

            {/* Share modal (still in Posts) */}
            {shareModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShareModal({ open: false, postId: null, url: "", title: "Share Post", text: "" })}>
                    <div className="bg-base-100 rounded-2xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">{shareModal.title}</h3>
                            <button onClick={() => setShareModal({ open: false, postId: null, url: "", title: "Share Post", text: "" })} className="p-2 hover:bg-base-200 rounded-full">
                                <IoClose className="w-5 h-5 text-base-content/60" />
                            </button>
                        </div>
                        {shareModal.text && (
                            <div className="mb-4 p-3 bg-base-200 rounded-lg text-sm text-base-content/70">
                                {shareModal.text}
                            </div>
                        )}
                        <button onClick={() => {
                            const shareText = shareModal.text ? `${shareModal.text} ${shareModal.url}` : shareModal.url;
                            navigator.clipboard.writeText(shareText);
                            toast.success("Link copied to clipboard");
                        }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 rounded-xl mb-2 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center">
                                <Copy className="w-5 h-5 text-base-content/70" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-sm font-medium text-base-content">Copy Link</p>
                                <p className="text-xs text-base-content/50">{shareModal.url}</p>
                            </div>
                            <Check className="w-4 h-4 text-base-content/50" />
                        </button>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModal.url)}&quote=${encodeURIComponent(shareModal.text || '')}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/10 rounded-xl transition-colors">
                                <FaFacebook className="w-5 h-5 text-primary/90" />
                                <span className="text-sm font-medium text-primary">Facebook</span>
                            </button>
                            <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareModal.url)}&text=${encodeURIComponent(shareModal.text || '')}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-base-200 hover:bg-base-200 rounded-xl transition-colors">
                                <FaXTwitter className="w-5 h-5 text-base-content" />
                                <span className="text-sm font-medium text-base-content/80">X</span>
                            </button>
                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareModal.text ? `${shareModal.text} ${shareModal.url}` : shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-success/10 hover:bg-success/10 rounded-xl transition-colors">
                                <FaWhatsapp className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">WhatsApp</span>
                            </button>
                            <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareModal.url)}&text=${encodeURIComponent(shareModal.text || '')}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-info/10 hover:bg-info/20 rounded-xl transition-colors">
                                <FaTelegram className="w-5 h-5 text-info" />
                                <span className="text-sm font-medium text-info">Telegram</span>
                            </button>
                            <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(shareModal.title)}&body=${encodeURIComponent(shareModal.text ? `${shareModal.text} ${shareModal.url}` : shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-error/10 hover:bg-error/10 rounded-xl transition-colors col-span-2">
                                <FaEnvelope className="w-5 h-5 text-error/90" />
                                <span className="text-sm font-medium text-error">Email</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Posts;