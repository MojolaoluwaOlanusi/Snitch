import { useParams, useNavigate, Link } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";
import { FaArrowLeft, FaRegComment, FaRegHeart, FaTrash } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { MdAddReaction, MdReportProblem } from "react-icons/md";
import { MoreHorizontal, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import PostPageSkeleton from "../../components/skeletons/PostPageSkeleton";
import Sidebar from "../../components/common/Sidebar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatPostDate } from "../../utils/date";
import { useAuthStore } from "../../store/useAuthStore";
import EditPostModal from "../../components/common/EditPostModal";
import ReactionEmojiPicker from "../../components/common/ReactionEmojiPicker.tsx";
import ReactionsDisplay from "../../components/common/ReactionsDisplay";
import axiosInstance from "../../lib/axios";

const PostPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { authUserId, authUser } = useAuthStore();

    const {
        getPostById,
        singlePost,
        isGettingSinglePost,
        likePost,
        isLiking,
        commentPost,
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

    const handlePostComment = (e) => {
        e.preventDefault();
        commentPost({ ...commentData, postId: singlePost._id }).then(() => {
            getPostById(postId);
        });
        setCommentData({ text: "", postId: "" });
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
            <div className="w-full flex flex-col md:flex-row h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                    <PostPageSkeleton />
                </div>
            </div>
        );
    }

    if (!singlePost) {
        return (
            <div className="w-full flex flex-col md:flex-row h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
                    <p className="text-gray-500">Post not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-white overflow-auto">
                {/* Hamburger spacer */}
                <div className="h-14 lg:hidden" />

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Post</h1>
                </div>

                {/* Post Content */}
                <div className="w-full p-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <Link
                            to={`/profile/${authorData?.username || "#"}`}
                            className="flex-shrink-0"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200">
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
                                className="font-bold text-gray-900 hover:underline"
                            >
                                {authorData?.displayName || "Unknown User"}
                            </Link>
                            <p className="text-gray-500 text-sm">
                                @{authorData?.username || "unknown"} ·{" "}
                                {formatPostDate(singlePost?.createdAt)}
                            </p>
                        </div>
                        <div className="relative">
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                                    <MoreHorizontal className="h-5 w-5 text-gray-700" />
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {reportSelectVisible && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                                    <div className="p-2">
                                        {isPostOwner && (
                                            <button
                                                onClick={() => {
                                                    setActionPostId(singlePost._id);
                                                    deletePost(singlePost._id);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-red-500"
                                            >
                                                <div className="flex flex-row group w-40 justify-between items-center">
                                                    <p className="group-hover:text-blue-500 font-medium">
                                                        Delete post
                                                    </p>
                                                    <FaTrash className="h-4 w-4 group-hover:text-red-500" />
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
                                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
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
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
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
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
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
                        <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
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
                                                className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-sm text-blue-700 hover:text-blue-800 transition-all duration-200"
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
                                                className="text-blue-500 hover:underline cursor-pointer"
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
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-gray-200">
                            <img
                                src={singlePost?.url}
                                className="w-full h-auto object-contain max-h-[500px]"
                                alt="Post Media"
                            />
                        </div>
                    )}
                    {singlePost?.mediaType === "Video" && (
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-gray-200">
                            <video
                                src={singlePost?.url}
                                className="w-full max-h-[500px]"
                                controls
                            />
                        </div>
                    )}
                    {singlePost?.mediaType === "Audio" && (
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-100 p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
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
                    <div className="flex items-center justify-between py-3 border-y border-gray-200 mb-4">
                        <div className="flex items-center justify-between w-full gap-2">
                            {/* Comment */}
                            <button className="flex items-center justify-center gap-2 text-gray-500 hover:text-sky-500 transition-colors group flex-1 py-2 hover:bg-gray-100 rounded-lg">
                                <FaRegComment className="w-5 h-5 group-hover:text-sky-500" />
                                <span className="text-sm">
                                    {singlePost?.comments?.length || 0}
                                </span>
                            </button>

                            {/* Repost */}
                            <button
                                className="flex items-center justify-center gap-2 text-gray-500 hover:text-green-500 transition-colors group flex-1 py-2 hover:bg-gray-100 rounded-lg"
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
                                    <BiRepost className="w-5 h-5 group-hover:text-green-500" />
                                )}
                                <span className="text-sm">
                                    {singlePost?.repostCount || 0}
                                </span>
                            </button>

                            {/* Like */}
                            <button
                                className={`flex items-center justify-center gap-2 transition-colors group flex-1 py-2 hover:bg-gray-100 rounded-lg ${
                                    isLikedByMe
                                        ? "text-pink-500"
                                        : "text-gray-500 hover:text-pink-500"
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
                                                ? "text-pink-500"
                                                : "group-hover:text-pink-500"
                                        }`}
                                    />
                                )}
                                <span className="text-sm">
                                    {singlePost?.likes?.length || 0}
                                </span>
                            </button>

                            {/* React */}
                            <div className="relative flex-1">
                                <button
                                    className="flex items-center justify-center gap-2 text-gray-500 hover:text-yellow-500 transition-colors group w-full py-2 hover:bg-gray-100 rounded-lg"
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
                                        <MdAddReaction className="w-5 h-5 group-hover:text-yellow-500" />
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
                    <div className="border-t border-gray-200 pt-4">
                        <h2 className="font-bold text-lg mb-4">Comments</h2>

                        {/* Add Comment */}
                        <form
                            className="flex gap-3 mb-6"
                            onSubmit={handlePostComment}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0">
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
                                    className="w-full p-3 border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-200 transition-all"
                                    placeholder="Write a comment..."
                                    rows="2"
                                    value={commentData.text}
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
                                    className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors disabled:opacity-50"
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

                        {/* Comments List */}
                        <div className="space-y-4">
                            {singlePost?.comments?.length === 0 && (
                                <p className="text-center text-gray-500 py-8">
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
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200">
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
                                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link
                                                    to={`/profile/${comment?.userUsername}`}
                                                    className="font-bold text-sm hover:underline"
                                                >
                                                    {comment?.userDisplayName}
                                                </Link>
                                                <span className="text-gray-500 text-xs">
                                                    @{comment?.userUsername}
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                {comment?.text}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                            <span>
                                                {formatPostDate(
                                                    comment?.createdAt
                                                )}
                                            </span>
                                            <button className="hover:text-gray-700">
                                                Like
                                            </button>
                                            <button className="hover:text-gray-700">
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostPage;