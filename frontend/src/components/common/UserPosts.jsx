import {useUserStore} from "../../store/useUserStore";
import {useEffect, useState} from "react";
import PostSkeleton from "../../components/skeletons/PostSkeleton";
import {Link, useNavigate} from "react-router-dom";
import {FaRegComment, FaRegHeart, FaTrash} from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {BiRepost} from "react-icons/bi";
import {formatPostDate} from "../../utils/date";
import {useAuthStore} from "../../store/useAuthStore";
import {MdAddReaction, MdReportProblem} from "react-icons/md";
import {IoClose} from "react-icons/io5";
import {Hash, MoreHorizontal} from "lucide-react";
import EditPostModal from "../../components/common/EditPostModal";
import ReactionEmojiPicker from "./ReactionEmojiPicker.tsx";
import ReactionsDisplay from "./ReactionsDisplay";

const UserPosts = () => {

    const {isReacting, isLiking, isReposting, isGettingUserPosts, userPosts, isCommenting,getUserPosts,
        likePost, deletePost, isEditing,
        reactToPost, reportPost, isReporting,
        commentPost,repost, getLikedPosts,
        editingPostId, deletingPostId, reportingPostId
    } = useUserStore();
    const {authUserId, user, authUser} = useAuthStore();
    const navigate = useNavigate();

    const [commentData, setCommentData] = useState({ text: "", postId: "" });
    const [reportSelectVisible, setReportSelectVisible] = useState(false);
    const [actionPostId, setActionPostId] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);

    const isMyProfile = authUser?._id === user?._id;

    const handleHashtagClick = (hashtag) => {
        navigate('/search', { state: { searchWord: hashtag, searchType: 'hashtag' } });
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        commentPost(commentData);
    };

    const reportFunction = (e, post) => {
        reportPost({id: post?._id, reason: {reason: e.target.value}});
        setReportSelectVisible(false);
    }

    const setReportSelectFalse = () => {
        setReportSelectVisible(false);
    }

    useEffect(() => {
        if (user?._id){
            getUserPosts(user?._id);
        }
    }, [user?._id]);

    useEffect(() => {
        if (user?._id){
            getLikedPosts(user?._id);
        }
    }, [user?._id]);

    return (
        <>
            {(isGettingUserPosts) && (
                <div className='flex flex-col justify-center'>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}
            {!isGettingUserPosts && userPosts?.length === 0 && (
                <p className='text-center my-4'>
                    {isMyProfile === true ? "You haven't created any posts yet. Share your first post!" : isMyProfile === false ? "This user hasn't created any posts yet." : "No posts to display"}
                </p>
            )}
            {!isGettingUserPosts && userPosts && (
                <div className="overflow-auto w-full h-screen">
                    {userPosts?.map((post) => {
                         return (
                             <div className='flex gap-2 items-start p-4 border-b border-gray-700' key={post?._id}>
                                <div className='flex flex-col flex-1'>
                                <div className='flex gap-2 items-center'>
                                    <div className='avatar'>
                                        <Link to={`/profile/${post?.author?.username}`}
                                              className='w-8 h-8 rounded-full overflow-hidden'>
                                            <img src={post?.author?.avatarUrl || "/avatar-placeholder.png"}
                                                 alt={post?.author?.displayName}/>
                                        </Link>
                                    </div>
                                    <Link to={`/profile/${post?.author?.username}`} className='font-bold'>
                                        {post?.author?.displayName}
                                    </Link>
                                    <span className='text-gray-700 flex gap-1 text-sm'>
							            <Link to={`/profile/${post?.author?.username}`}>@{post?.author?.username}</Link>
							            <span>·</span>
							            <span>{formatPostDate(post?.createdAt)}</span>
						            </span>
                                    <span className='flex justify-end flex-1 space-x-2'>
                                            <div className="dropdown dropdown-end">
                                                <button
                                                    tabIndex={0}
                                                    className="btn btn-ghost btn-sm"
                                                    aria-label="Post functions"
                                                >
                                                    {(editingPostId === post?._id) && <LoadingSpinner size='sm'/>}
                                                    {(deletingPostId === post?._id) && <LoadingSpinner size='sm'/>}
                                                    {(reportingPostId === post?._id) && <LoadingSpinner size='sm'/>}
                                                    {!(editingPostId === post?._id) && !(deletingPostId === post?._id) && !(reportingPostId === post?._id) &&
                                                        <MoreHorizontal className="h-5 w-5"/>}
                                                </button>

                                                <ul
                                                    tabIndex={0}
                                                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                                >
                                                    <li>
                                                        {post?.author?._id === authUserId && (
                                                            <button
                                                                className="text-gray-500"
                                                            >
                                                                <div
                                                                    className="flex flex-row group w-40 justify-between"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        deletePost(post?._id);
                                                                    }}>
                                                                    <p className="group-hover:text-red-500">Delete
                                                                        post</p>
                                                                    {!(deletingPostId === post?._id) && (
                                                                        <FaTrash
                                                                            className='cursor-pointer group-hover:text-red-500'/>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        )}
                                                        {post?.author?._id === authUserId && !isEditing && (
                                                            <EditPostModal post={post}/>
                                                        )}
                                                        <button
                                                            className="text-gray-500"
                                                        >
                                                            <div
                                                                className={`flex flex-row group ${reportSelectVisible ? "w-32" : "w-40"} ${!reportSelectVisible ? "w-40" : "w-32"} justify-between`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setReportSelectVisible(true);
                                                                }}>
                                                                    <p className={`group-hover:text-gray-700 ${reportSelectVisible ? "hidden" : "flex"}`}>Report post</p>
                                                                    <select
                                                                        onChange={(e) => reportFunction(e, post)}
                                                                        className={`${reportSelectVisible ? "flex" : "hidden"}
                                                                         ${!reportSelectVisible ? "hidden" : "flex"}flex-auto`}
                                                                    >
                                                                        <option>Select Reason</option>
                                                                        <option onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setReportSelectVisible(false);
                                                                        }}>pornographic</option>
                                                                        <option onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setReportSelectVisible(false);
                                                                        }}>piracy</option>
                                                                        <option onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setReportSelectVisible(false);
                                                                        }}>violence</option>
                                                                        <option onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setReportSelectVisible(false);
                                                                        }}>cyberbully</option>
                                                                        <option onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setReportSelectVisible(false);
                                                                        }}>impersonation</option>
                                                                        <option onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setReportSelectVisible(false);
                                                                        }}>abuse</option>
                                                                    </select>
                                                                {!isReporting && (
                                                                    <MdReportProblem
                                                                        className={`cursor-pointer group-hover:text-gray-700 ${reportSelectVisible ? "hidden" : "flex"}`}/>
                                                                )}
                                                                </div>
                                                                <IoClose
                                                                    className={`${reportSelectVisible ? "flex" : "hidden"} h-6 w-6`}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setReportSelectFalse();
                                                                    }}
                                                                />
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </span>
                                </div>
                                <Link
                                    to={`/post/${post?._id}`}
                                    key={post?._id}
                                    className="w-full"
                                >
                                    <div className='flex flex-col gap-3 overflow-hidden'>
                                        <span className="w-full line-clamp-3 leading-relaxed">{post?.text}</span>
                                        {post?.hashtags && post.hashtags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {post.hashtags.map((hashtag, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleHashtagClick(hashtag);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-sm text-blue-700 hover:text-blue-800 transition-all duration-200"
                                                    >
                                                        <Hash className="w-3 h-3" />
                                                        <span>{hashtag}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div
                                            className="w-full h-[400px] aspect-[4/5] sm:aspect-video rounded-2xl overflow-hidden items-center">
                                            {post?.mediaType === "Image" && (
                                                <img
                                                    src={post?.url}
                                                    className='w-full h-full object-cover object-center block rounded-lg'
                                                    alt=''
                                                    loading="lazy"
                                                />
                                            )}
                                            {post?.mediaType === "Video" && (
                                                <video
                                                    src={post?.url}
                                                    className='w-full h-full object-cover object-center block rounded-lg'
                                                    controls={true}
                                                />
                                            )}
                                            {post?.mediaType === "Audio" && (
                                                <div
                                                    className='w-full h-full object-cover object-center block rounded-lg'
                                                >
                                                    <img src="/Snitch_Audio_Waveform(1920 x 1080).png" alt=""
                                                         className="w-full h-[350px] object-cover object-center block rounded-lg"/>
                                                    <audio
                                                        src={post?.url}
                                                        controls={true}
                                                        className='w-full'
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div className='flex justify-between mt-3'>
                                    <div className='flex gap-4 items-center w-2/3 justify-between'>
                                        <div
                                            className='flex gap-1 items-center cursor-pointer group'
                                            onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
                                        >
                                            <FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400'/>
                                            <span className='text-sm text-slate-500 group-hover:text-sky-400'>
									            {post?.comments.length}
								            </span>
                                        </div>
                                        {/* We're using Modal Component from DaisyUI */}
                                        <dialog id={`comments_modal${post?._id}`}
                                                className='modal border-none outline-none'>
                                            <div
                                                className={`modal-box rounded border border-gray-600 space-y-2 ${post?.comments.length === 0 ? 'w-full max-w-2xl' : ''}`}>

                                                <div className="flex mx-auto items-center justify-between">
                                                    <h3 className='font-bold text-lg mb-4'>Comments</h3>
                                                    <div>
                                                        <form method='dialog' className='modal-backdrop'>
                                                            <button className='outline-none'><IoClose
                                                                className="text-black"/></button>
                                                        </form>
                                                    </div>
                                                </div>

                                                <form
                                                    className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
                                                    onSubmit={handlePostComment}
                                                >
										                    <textarea
                                                                className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
                                                                placeholder='Write a comment...'
                                                                value={commentData.text}
                                                                onKeyDown={(e) => e.key === "Enter" && handlePostComment(e)}
                                                                onChange={(e) => setCommentData({
                                                                    ...commentData,
                                                                    text: e.target.value,
                                                                    postId: post?._id
                                                                })}
                                                            />
                                                    <button
                                                        className='btn btn-primary rounded-full btn-sm text-white px-4'>
                                                        {isCommenting ? <LoadingSpinner size='md'/> : "Post"}
                                                    </button>
                                                </form>
                                                <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                                                    {post?.comments.length === 0 && (
                                                        <p className='text-sm text-slate-500'>
                                                            No comments yet. Be the first to share your thoughts!
                                                        </p>
                                                    )}
                                                    {post?.comments.map((comment) => (
                                                        <div key={comment._id} className='flex gap-2 items-start'>
                                                            <div className='avatar'>
                                                                <div className='w-8 rounded-full'>
                                                                    <img
                                                                        src={comment?.userAvatar || "/avatar-placeholder.png"}
                                                                        alt={comment?.userUsername}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className='flex flex-col'>
                                                                <div className='flex items-center gap-1'>
                                                                    <span
                                                                        className='font-bold'>{comment?.userDisplayName}</span>
                                                                    <span className='text-gray-700 text-sm'>
															                    @{comment?.userUsername}
														                    </span>
                                                                </div>
                                                                <div className='text-sm'>{comment?.text}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </dialog>
                                        <div className='flex gap-1 items-center group cursor-pointer' onClick={(e) => {
                                            e.preventDefault();
                                            setActionPostId(post._id);
                                            repost(post?._id);
                                        }}>
                                            {isReposting && actionPostId === post._id && <LoadingSpinner size='sm'/>}
                                            {!isReposting && (
                                                <BiRepost
                                                    className='w-6 h-6 text-slate-500 group-hover:text-green-500'/>
                                            )}
                                            <span
                                                className={`text-sm  group-hover:text-green-500 ${
                                                    "text-slate-500"
                                                }`}
                                            >
                                                {post?.repostCount}
                                            </span>


                                        </div>
                                        <div className='flex gap-1 items-center group cursor-pointer' onClick={(e) => {
                                            e.preventDefault();
                                            setActionPostId(post._id);
                                            likePost(post?._id);
                                        }}>
                                            {isLiking && actionPostId === post._id && <LoadingSpinner size='sm'/>}
                                            {!isLiking && (
                                                <FaRegHeart
                                                    className={`w-4 h-4 cursor-pointer ${!!post?.likes?.some((id) => id === authUserId) ? 'text-pink-500' : 'text-slate-500'} group-hover:text-pink-500`}/>
                                            )}

                                            <span
                                                className={`text-sm group-hover:text-pink-500 ${
                                                    !!post?.likes?.some((id) => id === authUserId) ? "text-pink-500" : "text-slate-500"
                                                }`}
                                            >
									                    {post?.likes?.length}
								                    </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-0 items-center">
                                        <ReactionsDisplay reactions={post?.reaction}/>
                                        <div className="flex gap-0 items-center cursor-pointer relative ml-2">
                                            <div
                                                className="flex gap-1 items-center group cursor-pointer"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setEmojiPickerOpen(
                                                        emojiPickerOpen === post._id ? null : post._id
                                                    );
                                                }}
                                            >
                                                {isReacting && actionPostId === post._id && (
                                                    <LoadingSpinner size="sm"/>
                                                )}

                                                {!isReacting && (
                                                    <MdAddReaction
                                                        className="w-6 h-6 cursor-pointer text-slate-500 group-hover:text-yellow-500"/>
                                                )}

                                                <span className="text-sm text-slate-500 group-hover:text-yellow-500">
                                                    {post?.reaction?.length}
                                                </span>
                                            </div>
                                            <ReactionEmojiPicker
                                                postId={post._id}
                                                isOpen={emojiPickerOpen === post._id}
                                                onClose={() => setEmojiPickerOpen(null)}
                                                onReact={(emoji) => {
                                                    setActionPostId(post._id);
                                                    reactToPost({
                                                        id: post?._id,
                                                        reaction: emoji,
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                         )
                    })}
                </div>
            )}
        </>
    )
};
export default UserPosts;
