// @ts-nocheck
import { useUserStore } from "@/store/useUserStore.js";
import { useEffect, useState, Suspense } from "react";
import PostSkeleton from "../../components/skeletons/PostSkeleton";
import { Link, useNavigate } from "react-router-dom";
import { Share2, Copy, Check, Bookmark, Sticker } from "lucide-react";
import { FaFacebook, FaXTwitter, FaWhatsapp, FaTelegram, FaEnvelope } from "react-icons/fa6";
import { FaRegComment, FaRegHeart, FaTrash } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { BiRepost } from "react-icons/bi";
import { formatPostDate } from "../../utils/date";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore.js";
import { MdAddReaction, MdReportProblem } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { Hash, MoreHorizontal } from "lucide-react";
import EditPostModal from "../../components/common/EditPostModal";
import ReactionEmojiPicker from "./ReactionEmojiPicker.tsx";
import ReactionsDisplay from "./ReactionsDisplay";
import ReportModal from "./ReportModal.jsx"
import GifStickerPicker from "../../components/common/GifStickerPicker";
import { AnimatePresence } from "framer-motion";
import axiosInstance from "@/lib/axios.js";

// ── Single following post item ─────────────────────────
const FollowingPostItem = ({ post, authUserId }) => {
    const {
        isReposting, isLiking, isReacting, isCommenting,
        repost, likePost, reactToPost, bookmarkPost,
        deletePost, reportPost,
        editingPostId, deletingPostId, reportingPostId,
    } = useUserStore();

    const {authUser} = useAuthStore();

    const [isBookmarked, setIsBookmarked] = useState(post?.bookmarkedBy?.includes(authUserId));
    const [bookmarkCount, setBookmarkCount] = useState(post?.bookmarksCount || 0);
    const [actionPostId, setActionPostId] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [commentData, setCommentData] = useState({ text: "", postId: "", media: null });
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyMedia, setReplyMedia] = useState(null);
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

    const handleHashtagClick = (hashtag) => {
        navigate("/search", { state: { searchWord: hashtag, searchType: "hashtag" } });
    };

    return (
        <div className="flex gap-2 items-start p-4 border-b border-base-content/30" key={post?._id}>
            <div className="flex flex-col flex-1">
                {/* Author header */}
                <div className="flex gap-2 items-center">
                    <div className="avatar">
                        <Link to={`/profile/${post?.author?.username}`} className="w-8 h-8 rounded-full overflow-hidden">
                            <img src={post?.author?.avatarUrl || "/avatar-placeholder.png"} alt={post?.author?.displayName} />
                        </Link>
                    </div>
                    <Link to={`/profile/${post?.author?.username}`} className="font-bold">
                        {post?.author?.displayName}
                    </Link>
                    <span className="text-gray-700 flex gap-1 text-sm">
            <Link to={`/profile/${post?.author?.username}`}>@{post?.author?.username}</Link>
            <span>·</span>
            <span>{formatPostDate(post?.createdAt)}</span>
          </span>
                    <span className="flex justify-end flex-1 space-x-2">
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-sm" aria-label="Post functions">
                {(editingPostId === post?._id) && <LoadingSpinner size="sm" />}
                  {(deletingPostId === post?._id) && <LoadingSpinner size="sm" />}
                  {(reportingPostId === post?._id) && <LoadingSpinner size="sm" />}
                  {!(editingPostId === post?._id) && !(deletingPostId === post?._id) && !(reportingPostId === post?._id) && <MoreHorizontal className="h-5 w-5" />}
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  {post?.author?._id === authUserId && (
                      <button className="text-gray-500" onClick={(e) => { e.preventDefault(); deletePost(post?._id); }}>
                          <div className="flex flex-row group w-40 justify-between">
                              <p className="group-hover:text-red-500">Delete post</p>
                              {!(deletingPostId === post?._id) && <FaTrash className="cursor-pointer group-hover:text-red-500" />}
                          </div>
                      </button>
                  )}
                    {post?.author?._id === authUserId && !useUserStore.getState().isEditing && <EditPostModal post={post} />}
                    <button className="text-gray-500" onClick={() => { setShowReportModal(post._id) }}>
                    Report Post
                  </button>
                </li>
              </ul>
            </div>
          </span>
                </div>

                {/* Post content */}
                <Link to={`/post/${post?._id}`} className="w-full">
                    <div className="flex flex-col gap-3 overflow-hidden">
            <span className={`w-full leading-relaxed whitespace-pre-wrap ${post?.url && post?.mediaType ? "line-clamp-3" : "line-clamp-[11]"}`}>
              {post?.text}
            </span>
                        {post?.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {post.hashtags.map((hashtag, index) => (
                                    <button key={index} onClick={(e) => { e.preventDefault(); handleHashtagClick(hashtag); }}
                                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-sm text-blue-700 hover:text-blue-800 transition-all duration-200">
                                        <Hash className="w-3 h-3" /><span>{hashtag}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {post?.url && post?.mediaType && (
                            <div className="w-full h-[400px] aspect-[4/5] sm:aspect-video rounded-2xl overflow-hidden items-center">
                                {post?.mediaType === "Image" && <img src={post?.url} className="w-full h-full object-cover object-center block rounded-lg" alt="" loading="lazy" />}
                                {post?.mediaType === "Video" && <video src={post?.url} className="w-full h-full object-cover object-center block rounded-lg" controls />}
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

                {/* Action bar */}
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
                        <dialog id={`fw_comments_modal${post._id}`} className="modal border-none outline-none">
                            <div className={`modal-box rounded border border-base-content/30 space-y-2 ${post?.comments.length === 0 ? "w-full max-w-2xl" : ""}`}>
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
                        className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-base-content/30 bg-base-100"
                        placeholder="Write a comment..."
                        value={commentData.text}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(e); } }}
                        onChange={(e) => setCommentData({ ...commentData, text: e.target.value, postId: post?._id })}
                    />
                                        <button type="button" onClick={() => setShowCommentStickerPicker(!showCommentStickerPicker)} className="p-2 hover:bg-base-200 rounded-full" title="Add sticker or GIF">
                                            <Sticker className="w-5 h-5 text-base-content/60" />
                                        </button>
                                        <button type="submit" className="btn btn-primary rounded-full btn-sm text-primary-content px-4">
                                            {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
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
                                                {comment.media?.url && (
                                                    <div className="mt-1">
                                                        {comment.media.type === 'sticker' ? (
                                                            <img src={comment.media.url} alt="sticker" className="max-w-[120px] max-h-[120px]" />
                                                        ) : (
                                                            <img src={comment.media.url} alt="gif" className="max-w-[150px] max-h-[150px] rounded" />
                                                        )}
                                                    </div>
                                                )}
                                                <button className="text-xs text-primary hover:underline mt-1" onClick={() => setReplyToCommentId(replyToCommentId === comment._id ? null : comment._id)}>Reply</button>
                                                {replyToCommentId === comment._id && (
                                                    <div className="mt-2 space-y-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Write a reply..."
                                                                className="flex-1 border border-base-content/30 rounded px-2 py-1 text-sm bg-base-100"
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
                                                {comment.replies?.length > 0 && (
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
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={(e) => {
                                e.preventDefault();
                                setActionPostId(post._id);
                                repost(post?._id);
                            }}
                        >
                            {isReposting && actionPostId === post._id && <LoadingSpinner size="sm" />}
                            {!isReposting && (
                                <BiRepost className="w-6 h-6 text-base-content/60 group-hover:text-success" />
                            )}
                            <span className="text-sm group-hover:text-success text-base-content/60">
        {post?.repostCount}
      </span>
                        </div>

                        {/* Like */}
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={(e) => {
                                e.preventDefault();
                                setActionPostId(post._id);
                                likePost(post?._id);
                            }}
                        >
                            {isLiking && actionPostId === post._id && <LoadingSpinner size="sm" />}
                            {!isLiking && (
                                <FaRegHeart
                                    className={`w-4 h-4 cursor-pointer ${
                                        isLikedByMe ? "text-secondary" : "text-base-content/60"
                                    } group-hover:text-secondary`}
                                />
                            )}
                            <span
                                className={`text-sm group-hover:text-secondary ${
                                    isLikedByMe ? "text-secondary" : "text-base-content/60"
                                }`}
                            >
        {post?.likes?.length}
      </span>
                        </div>

                        {/* Share */}
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={(e) => {
                                e.preventDefault();
                                const postUrl = `${window.location.origin}/post/${post?._id}`;
                                window.dispatchEvent(
                                    new CustomEvent("fwopenShareModal", {
                                        detail: { postId: post?._id, url: postUrl },
                                    })
                                );
                            }}
                        >
                            <Share2 className="w-4 h-4 text-base-content/60 group-hover:text-primary" />
                        </div>

                        {/* Bookmark */}
                        <button
                            className={`flex items-center justify-center gap-2 transition-colors group py-2 hover:bg-base-200 rounded-lg ${
                                isBookmarked ? "text-primary" : "text-base-content/60 hover:text-primary"
                            }`}
                            onClick={async () => {
                                const data = await bookmarkPost(post._id);
                                if (data) {
                                    setIsBookmarked(data.bookmarked);
                                    setBookmarkCount(data.bookmarksCount);
                                }
                            }}
                        >
                            <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                            <span className="text-sm">{bookmarkCount}</span>
                        </button>

                        {/* React / Emoji picker */}
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={(e) => {
                                e.preventDefault();
                                setEmojiPickerOpen(emojiPickerOpen === post._id ? null : post._id);
                            }}
                        >
                            {isReacting && actionPostId === post._id && <LoadingSpinner size="sm" />}
                            {!isReacting && (
                                <MdAddReaction className="w-6 h-6 text-base-content/60 group-hover:text-yellow-500" />
                            )}
                            <span className="text-sm text-base-content/60 group-hover:text-yellow-500">
        {post?.reaction?.length}
      </span>
                        </div>

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

// ── Main FollowingPosts component ──────────────────────
const FollowingPosts = () => {
    const { isGettingFollowingPosts, followingPosts, getFollowingPosts, getPosts } = useUserStore();
    const { authUserId } = useAuthStore();
    const [shareModal, setShareModal] = useState({ open: false, postId: null, url: "" });

    useEffect(() => {
        const handler = (e) => setShareModal({ open: true, postId: e.detail.postId, url: e.detail.url });
        window.addEventListener("fwOpenShareModal", handler);
        return () => window.removeEventListener("fwOpenShareModal", handler);
    }, []);

    useEffect(() => { getFollowingPosts(); getPosts(); }, [getFollowingPosts, getPosts]);

    return (
        <>
            {isGettingFollowingPosts && <div className="flex flex-col justify-center"><PostSkeleton /><PostSkeleton /><PostSkeleton /></div>}
            {!isGettingFollowingPosts && followingPosts?.length === 0 && <p className="text-center my-4">No posts to display. Check back later!</p>}
            {!isGettingFollowingPosts && followingPosts && (
                <div className="overflow-auto w-full h-[calc(100vh-50px)]">
                    {followingPosts.map((post) => <FollowingPostItem key={post._id} post={post} authUserId={authUserId} />)}
                </div>
            )}
            {shareModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShareModal({ open: false, postId: null, url: "" })}>
                    <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Share Post</h3><button onClick={() => setShareModal({ open: false, postId: null, url: "" })} className="p-2 hover:bg-gray-100 rounded-full"><IoClose className="w-5 h-5 text-gray-500" /></button></div>
                        <button onClick={() => { navigator.clipboard.writeText(shareModal.url); toast.success("Link copied to clipboard"); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl mb-2 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><Copy className="w-5 h-5 text-gray-600" /></div>
                            <div className="text-left flex-1"><p className="text-sm font-medium text-gray-800">Copy Link</p><p className="text-xs text-gray-400">{shareModal.url}</p></div>
                            <Check className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModal.url)}`, "_blank")} className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><FaFacebook className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium text-blue-700">Facebook</span></button>
                            <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareModal.url)}`, "_blank")} className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"><FaXTwitter className="w-5 h-5 text-gray-800" /><span className="text-sm font-medium text-gray-700">X</span></button>
                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareModal.url)}`, "_blank")} className="flex items-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"><FaWhatsapp className="w-5 h-5 text-green-600" /><span className="text-sm font-medium text-green-700">WhatsApp</span></button>
                            <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareModal.url)}`, "_blank")} className="flex items-center gap-2 px-4 py-3 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"><FaTelegram className="w-5 h-5 text-sky-600" /><span className="text-sm font-medium text-sky-700">Telegram</span></button>
                            <button onClick={() => window.open(`mailto:?subject=Check out this post on Snitch&body=${encodeURIComponent(shareModal.url)}`, "_blank")} className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors col-span-2"><FaEnvelope className="w-5 h-5 text-red-600" /><span className="text-sm font-medium text-red-700">Email</span></button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FollowingPosts;