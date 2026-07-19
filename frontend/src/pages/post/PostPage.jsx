import { useParams, useNavigate, Link } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore.js";
import { FaArrowLeft, FaRegComment, FaRegHeart, FaTrash } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { MdAddReaction, MdReportProblem } from "react-icons/md";
import {MoreHorizontal, Hash, Sticker, ChevronUp, ChevronDown, Share2, Bookmark, Copy, Check} from "lucide-react";
import {Suspense, useEffect, useState} from "react";
import PostPageSkeleton from "../../components/skeletons/PostPageSkeleton.jsx";
import Sidebar from "../../components/common/Sidebar.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { formatPostDate } from "../../utils/date/index.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import EditPostModal from "../../components/common/EditPostModal.jsx";
import ReactionEmojiPicker from "../../components/common/ReactionEmojiPicker.tsx";
import ReactionsDisplay from "../../components/common/ReactionsDisplay.jsx";
import axiosInstance from "../../lib/axios.js";
import {AnimatePresence} from "framer-motion";
import GifStickerPicker from "../../components/common/GifStickerPicker.jsx";
import {toast} from "sonner";
import {IoClose} from "react-icons/io5";
import {FaEnvelope, FaFacebook, FaTelegram, FaWhatsapp, FaXTwitter} from "react-icons/fa6";

const PostPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { authUserId, authUser } = useAuthStore();
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyMedia, setReplyMedia] = useState(null);
    const [showReplies, setShowReplies] = useState(false);
    const [showCommentStickerPicker, setShowCommentStickerPicker] = useState(false);
    const [showReplyStickerPicker, setShowReplyStickerPicker] = useState(false);


    const {
        getPostById,
        singlePost,
        isGettingSinglePost,
        likePost,
        isLiking,
        bookmarkPost,
        isCommenting,
        repost,
        isReposting,
        reactToPost,
        isReacting,
        isDeleting,
        reportPost,
        deletePost,
        editingPostId,
        deletingPostId,
        reportingPostId,
        getAllUsers,
        users,
    } = useUserStore();

    const [commentData, setCommentData] = useState({ text: "", postId: "" });
    const [reportSelectVisible, setReportSelectVisible] = useState(false);
    const [actionPostId, setActionPostId] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
    const [authorData, setAuthorData] = useState(null);
    const [shareModal, setShareModal] = useState({ open: false, postId: null, url: "" });
    const [isBookmarked, setIsBookmarked] = useState(
        singlePost?.bookmarkedBy?.includes(authUserId)
    );
    const [bookmarkCount, setBookmarkCount] = useState(singlePost?.bookmarksCount || 0);

    useEffect(() => {
        getPostById(postId);
        getAllUsers();
    }, [getPostById, postId, getAllUsers]);

    useEffect(() => {
        if (singlePost?.author) {
            if (typeof singlePost.author === "string") {
                const commentUser = singlePost?.comments?.find(
                    (comment) => comment.user === singlePost.author
                );
                if (commentUser) {
                    setAuthorData({
                        _id: commentUser.user,
                        username: commentUser.userUsername,
                        displayName: commentUser.userDisplayName,
                        avatarUrl: commentUser.userAvatar,
                    });
                } else {
                    const authorUser = users?.find(
                        (user) => user._id === singlePost.author
                    );
                    if (authorUser) {
                        if (authorUser.displayName && authorUser.avatarUrl) {
                            setAuthorData(authorUser);
                        } else {
                            fetchUserData(singlePost.author);
                        }
                    } else if (singlePost.author === authUserId) {
                        setAuthorData(authUser);
                    } else {
                        fetchUserData(singlePost.author);
                    }
                }
            } else {
                setAuthorData(singlePost.author);
            }
        }
    }, [singlePost, users, authUserId, authUser]);

    useEffect(() => {
        const handler = (e) => setShareModal({ open: true, postId: e.detail.postId, url: e.detail.url });
        window.addEventListener("OpenPostShareModal", handler);
        return () => window.removeEventListener("OpenShareModal", handler);
    }, []);

    const fetchUserData = async (userId) => {
        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.get(`/auth/get-user-by-id/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAuthorData(res.data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

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
        const updatedComments = [...(singlePost?.comments || []), tempComment];
        // We need to update the post in the store. This depends on your store structure.
        // For simplicity, we'll refetch the post after a successful request.

        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.post(
                "/posts/comment",
                {
                    postId: singlePost._id,
                    text: commentData.text,
                    media: commentData.media || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove the temp comment and replace with the real one from the server
            const updatedPost = res.data;   // assuming API returns the full updated post
            // Now update the post in your state/store.
            // If you have a function like updatePost in your store:
            useUserStore.getState().updatePost(singlePost._id, updatedPost);
            // Or if you maintain a local posts array:
            // setPosts(prev => prev.map(p => p._id === post._id ? updatedPost : p));

            // Clear comment input
            setCommentData({ text: "", postId: "", media: null });
        } catch (error) {
            // Remove the temp comment if the request fails
            // Revert the optimistic update
            useUserStore.getState().updatePost(singlePost._id, { ...singlePost, comments: singlePost.comments });
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
            useUserStore.getState().updatePost(singlePost._id, updatedPost);
            // Clear reply state
            setReplyToCommentId(null);
            setReplyText("");
        } catch (error) {
            // Revert optimistic reply
            useUserStore.getState().updatePost(singlePost._id, singlePost);
            console.error("Failed to reply:", error);
            toast.error("Failed to reply");
        }
    };


    const reportFunction = (e) => {
        reportPost({
            id: singlePost?._id,
            reason: { reason: e.target.value },
        });
        setReportSelectVisible(false);
    };

    const setReportSelectFalse = () => {
        setReportSelectVisible(false);
    };

    const handleHashtagClick = (hashtag) => {
        navigate("/search", { state: { searchWord: hashtag, searchType: "hashtag" } });
    };

    const handleMentionClick = (username) => {
        navigate(`/profile/${username}`);
    };

    const isLikedByMe = !!singlePost?.likes?.some((id) => id === authUserId);
    const isPostOwner =
        typeof singlePost?.author === "string"
            ? singlePost.author === authUserId
            : singlePost?.author?._id === authUserId;
    const reactionCount = singlePost?.reaction?.length || 0;

    if (isGettingSinglePost) {
        return (
            <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center bg-base-100">
                    <PostPageSkeleton />
                </div>
            </div>
        );
    }

    if (!singlePost) {
        return (
            <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center bg-base-100">
                    <p className="text-base-content/60">Post not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />
            <main className="flex-1 flex flex-col bg-base-100 overflow-auto">
                {/* Hamburger spacer */}
                <div className="h-14 lg:hidden" />

                {/* Header */}
                <div className="sticky top-0 z-10 bg-base-100 border-b border-base-200 px-4 py-3 flex items-center justify-between">
                    <div className="w-5 h-5"/>
                    <h1 className="text-xl font-bold text-base-content/80">Post</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-base-200 rounded-full transition-colors"
                        aria-label="Go back"
                    >
                        <FaArrowLeft className="w-5 h-5 text-base-content/80" />
                    </button>
                </div>

                {/* Post Content */}
                <div className="w-full p-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <Link
                            to={`/profile/${authorData?.username || "#"}`}
                            className="flex-shrink-0"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                <img
                                    src={
                                        authorData?.avatarUrl || "/avatar-placeholder.png"
                                    }
                                    alt={authorData?.displayName || "User"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </Link>
                        <div className="flex-1">
                            <Link
                                to={`/profile/${authorData?.username || "#"}`}
                                className="font-bold text-base-content/80 hover:underline"
                            >
                                {authorData?.displayName || "Unknown User"}
                            </Link>
                            <p className="text-base-content/60 text-sm">
                                @{authorData?.username || "unknown"} ·{" "}
                                {formatPostDate(singlePost?.createdAt)}
                            </p>
                        </div>
                        <div className="relative">
                            <button
                                className="p-2 hover:bg-base-200 rounded-full transition-colors"
                                onClick={() =>
                                    setReportSelectVisible(!reportSelectVisible)
                                }
                            >
                                {editingPostId === singlePost?._id && (
                                    <LoadingSpinner size="sm" />
                                )}
                                {deletingPostId === singlePost?._id && (
                                    <LoadingSpinner size="sm" />
                                )}
                                {reportingPostId === singlePost?._id && (
                                    <LoadingSpinner size="sm" />
                                )}
                                {!(
                                    editingPostId === singlePost?._id
                                ) && !(deletingPostId === singlePost?._id) && !(reportingPostId === singlePost?._id) && (
                                    <MoreHorizontal className="h-5 w-5 text-base-content/80" />
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {reportSelectVisible && (
                                <div className="absolute right-0 mt-2 w-52 bg-base-100 rounded-xl shadow-lg border border-base-200 z-50">
                                    <div className="p-2">
                                        {isPostOwner && (
                                            <button
                                                onClick={() => {
                                                    setActionPostId(singlePost._id);
                                                    deletePost(singlePost._id);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-base-200 rounded-lg transition-colors text-error"
                                            >
                                                <div className="flex flex-row group w-40 justify-between items-center">
                                                    <p className="group-hover:text-primary font-medium">
                                                        Delete post
                                                    </p>
                                                    <FaTrash className="h-4 w-4 group-hover:text-error" />
                                                </div>
                                            </button>
                                        )}
                                        {isPostOwner && !isDeleting && (
                                            <div className="px-3 py-2">
                                                <EditPostModal post={singlePost} />
                                            </div>
                                        )}
                                        {!isPostOwner && (
                                            <button
                                                onClick={() =>
                                                    setReportSelectVisible(true)
                                                }
                                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-base-200 rounded-lg transition-colors text-base-content/80"
                                            >
                                                <MdReportProblem className="w-4 h-4" />
                                                <span>Report post</span>
                                            </button>
                                        )}
                                        {reportSelectVisible && !isPostOwner && (
                                            <div className="px-3 py-2">
                                                <select
                                                    onChange={(e) =>
                                                        reportFunction(e)
                                                    }
                                                    className="w-full p-2 border border-base-300 rounded-lg text-sm"
                                                >
                                                    <option value="">
                                                        Select Reason
                                                    </option>
                                                    <option value="pornographic">
                                                        Pornographic
                                                    </option>
                                                    <option value="piracy">
                                                        Piracy
                                                    </option>
                                                    <option value="violence">
                                                        Violence
                                                    </option>
                                                    <option value="cyberbully">
                                                        Cyberbully
                                                    </option>
                                                    <option value="impersonation">
                                                        Impersonation
                                                    </option>
                                                    <option value="abuse">
                                                        Abuse
                                                    </option>
                                                </select>
                                            </div>
                                        )}
                                        <button
                                            onClick={setReportSelectFalse}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-left hover:bg-base-200 rounded-lg transition-colors text-base-content/80"
                                        >
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Post Text */}
                    <div className="mb-4">
                        <p className="text-base-content/80 text-lg leading-relaxed whitespace-pre-wrap">
                            {singlePost?.text}
                        </p>

                        {/* Hashtags */}
                        {singlePost?.hashtags &&
                            singlePost.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {singlePost.hashtags.map(
                                        (hashtag, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    handleHashtagClick(
                                                        hashtag
                                                    )
                                                }
                                                className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full text-sm text-primary hover:text-primary transition-all duration-200"
                                            >
                                                <Hash className="w-3 h-3" />
                                                <span>{hashtag}</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}

                        {/* Mentions */}
                        {singlePost?.mentions &&
                            singlePost.mentions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {singlePost.mentions.map(
                                        (mention, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    handleMentionClick(
                                                        mention
                                                    )
                                                }
                                                className="text-primary hover:underline cursor-pointer"
                                            >
                                                @{mention}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Media */}
                    {singlePost?.mediaType === "Image" && (
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-base-200">
                            <img
                                src={singlePost?.url}
                                className="w-full h-auto object-contain max-h-[500px]"
                                alt="Post Media"
                            />
                        </div>
                    )}
                    {singlePost?.mediaType === "Video" && (
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-base-200">
                            <video
                                src={singlePost?.url}
                                className="w-full max-h-[500px]"
                                controls
                            />
                        </div>
                    )}
                    {singlePost?.mediaType === "Audio" && (
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-base-200 bg-base-200 p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🎵</span>
                                </div>
                                <audio
                                    src={singlePost?.url}
                                    controls
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reactions Display */}
                    {singlePost?.reaction &&
                        singlePost.reaction.length > 0 && (
                            <div className="mb-4">
                                <ReactionsDisplay
                                    reactions={singlePost.reaction}
                                />
                            </div>
                        )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between py-3 border-y border-base-200 mb-4">
                        <div className="flex items-center justify-between w-full gap-2">
                            {/* Comment */}
                            <button className="flex items-center justify-center gap-2 text-base-content/60 hover:text-sky-500 transition-colors group flex-1 py-2 hover:bg-base-200 rounded-lg">
                                <FaRegComment className="w-5 h-5 group-hover:text-sky-500" />
                                <span className="text-sm">
                                    {singlePost?.comments?.length || 0}
                                </span>
                            </button>

                            {/* Repost */}
                            <button
                                className="flex items-center justify-center gap-2 text-base-content/60 hover:text-success transition-colors group flex-1 py-2 hover:bg-base-200 rounded-lg"
                                onClick={() => {
                                    setActionPostId(singlePost._id);
                                    repost(singlePost._id);
                                }}
                            >
                                {isReposting &&
                                    actionPostId === singlePost._id && (
                                        <LoadingSpinner size="sm" />
                                    )}
                                {!isReposting && (
                                    <BiRepost className="w-5 h-5 group-hover:text-success" />
                                )}
                                <span className="text-sm">
                                    {singlePost?.repostCount || 0}
                                </span>
                            </button>

                            {/* Like */}
                            <button
                                className={`flex items-center justify-center gap-2 transition-colors group flex-1 py-2 hover:bg-base-200 rounded-lg ${
                                    isLikedByMe
                                        ? "text-secondary"
                                        : "text-base-content/60 hover:text-secondary"
                                }`}
                                onClick={() => {
                                    setActionPostId(singlePost._id);
                                    likePost(singlePost._id);
                                }}
                            >
                                {isLiking &&
                                    actionPostId === singlePost._id && (
                                        <LoadingSpinner size="sm" />
                                    )}
                                {!isLiking && (
                                    <FaRegHeart
                                        className={`w-5 h-5 ${
                                            isLikedByMe
                                                ? "text-secondary"
                                                : "group-hover:text-secondary"
                                        }`}
                                    />
                                )}
                                <span className="text-sm">
                                    {singlePost?.likes?.length || 0}
                                </span>
                            </button>

                            {/* Share */}
                            <button
                                className="flex items-center justify-center gap-2 text-base-content/60 hover:text-sky-500 transition-colors group flex-1 py-2 hover:bg-base-200 rounded-lg"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const postUrl = `${window.location.origin}/post/${singlePost?._id}`;
                                    window.dispatchEvent(
                                        new CustomEvent("OpenPostShareModal", {
                                            detail: { postId: singlePost?._id, url: postUrl },
                                        })
                                    );
                                }}
                            >
                                <Share2 className="w-4 h-4 text-base-content/60 group-hover:text-primary" />
                            </button>

                            {/* Bookmark */}
                            <button
                                className={`flex items-center justify-center gap-2 transition-colors group flex-1 py-2 hover:bg-base-200 rounded-lg ${
                                    isBookmarked
                                        ? "text-secondary"
                                        : "text-base-content/60 hover:text-secondary"
                                }`}
                                onClick={async () => {
                                    const data = await bookmarkPost(singlePost._id);
                                    if (data) {
                                        setIsBookmarked(data.bookmarked);
                                        setBookmarkCount(data.bookmarksCount);
                                    }
                                }}
                            >
                                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                                <span className="text-sm">{bookmarkCount}</span>
                            </button>

                            {/* React */}
                            <div className="relative flex-1">
                                <button
                                    className="flex items-center justify-center gap-2 text-base-content/60 hover:text-warning transition-colors group w-full py-2 hover:bg-base-200 rounded-lg"
                                    onClick={() =>
                                        setEmojiPickerOpen(
                                            emojiPickerOpen ===
                                            singlePost._id
                                                ? null
                                                : singlePost._id
                                        )
                                    }
                                >
                                    {isReacting &&
                                        actionPostId === singlePost._id && (
                                            <LoadingSpinner size="sm" />
                                        )}
                                    {!isReacting && (
                                        <MdAddReaction className="w-5 h-5 group-hover:text-warning" />
                                    )}
                                    <span className="text-sm">
                                        {reactionCount}
                                    </span>
                                </button>
                                <ReactionEmojiPicker
                                    postId={singlePost._id}
                                    isOpen={
                                        emojiPickerOpen === singlePost._id
                                    }
                                    onClose={() =>
                                        setEmojiPickerOpen(null)
                                    }
                                    onReact={(emoji) => {
                                        setActionPostId(singlePost._id);
                                        reactToPost({
                                            id: singlePost._id,
                                            reaction: emoji,
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t border-base-200 pt-4">
                        <h2 className="font-bold text-lg mb-4">Comments</h2>

                        {/* Add Comment */}
                        <form
                            className="flex gap-3 mb-6"
                            onSubmit={handlePostComment}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                                <img
                                    src={
                                        authUser?.avatarUrl ||
                                        "/avatar-placeholder.png"
                                    }
                                    alt="Your avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <textarea
                                    className="w-full p-3 border-2 border-base-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all bg-base-200 text-base-content placeholder:text-base-content/50"
                                    placeholder="Write a comment..."
                                    rows="2"
                                    value={commentData.text}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(e); } }}
                                    onChange={(e) =>
                                        setCommentData({
                                            ...commentData,
                                            text: e.target.value,
                                            postId: singlePost._id,
                                        })
                                    }
                                />
                                <button
                                    type="submit"
                                    className="mt-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-content rounded-full font-medium transition-colors disabled:opacity-50"
                                    disabled={
                                        isCommenting ||
                                        !commentData.text.trim()
                                    }
                                >
                                    {isCommenting ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        "Post"
                                    )}
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

                        {shareModal.open && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShareModal({ open: false, postId: null, url: "" })}>
                                <div className="bg-base-100 rounded-2xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Share Post</h3>
                                        <button onClick={() => setShareModal({ open: false, postId: null, url: "" })} className="p-2 hover:bg-base-200 rounded-full">
                                            <IoClose className="w-5 h-5 text-base-content/60" />
                                        </button>
                                    </div>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(shareModal.url);
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
                                        <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/10 rounded-xl transition-colors">
                                            <FaFacebook className="w-5 h-5 text-primary/90" />
                                            <span className="text-sm font-medium text-primary">Facebook</span>
                                        </button>
                                        <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-base-200 hover:bg-base-200 rounded-xl transition-colors">
                                            <FaXTwitter className="w-5 h-5 text-base-content" />
                                            <span className="text-sm font-medium text-base-content/80">X</span>
                                        </button>
                                        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-success/10 hover:bg-success/10 rounded-xl transition-colors">
                                            <FaWhatsapp className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-medium text-green-700">WhatsApp</span>
                                        </button>
                                        <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-info/10 hover:bg-info/20 rounded-xl transition-colors">
                                            <FaTelegram className="w-5 h-5 text-info" />
                                            <span className="text-sm font-medium text-info">Telegram</span>
                                        </button>
                                        <button onClick={() => window.open(`mailto:?subject=Check out this post on Snitch&body=${encodeURIComponent(shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-error/10 hover:bg-error/10 rounded-xl transition-colors col-span-2">
                                            <FaEnvelope className="w-5 h-5 text-error/90" />
                                            <span className="text-sm font-medium text-error">Email</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4">
                            {singlePost?.comments?.length === 0 && (
                                <p className="text-center text-base-content/60 py-8">
                                    No comments yet. Be the first to share
                                    your thoughts!
                                </p>
                            )}
                            {singlePost?.comments?.map((comment) => (
                                <div key={comment._id} className="flex gap-3">
                                    <Link
                                        to={`/profile/${comment?.userUsername}`}
                                        className="flex-shrink-0"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                                            <img
                                                src={
                                                    comment?.userAvatar ||
                                                    "/avatar-placeholder.png"
                                                }
                                                alt={comment?.userDisplayName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="bg-base-200 rounded-2xl px-4 py-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link
                                                    to={`/profile/${comment?.userUsername}`}
                                                    className="font-bold text-sm hover:underline"
                                                >
                                                    {comment?.userDisplayName}
                                                </Link>
                                                <span className="text-base-content/60 text-xs">
                                                    @{comment?.userUsername}
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                {comment?.text}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-base-content/60">
                                            {comment.replies?.length > 0 && (
                                                <button onClick={() => setShowReplies(!showReplies)} className="p-1">
                                                    {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <span>
                                                {formatPostDate(
                                                    comment?.createdAt
                                                )}
                                            </span>
                                            <button className="hover:text-base-content/80" onClick={() => setReplyToCommentId(replyToCommentId === comment._id ? null : comment._id)}>
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
                </div>
            </main>
        </div>
    );
};

export default PostPage;