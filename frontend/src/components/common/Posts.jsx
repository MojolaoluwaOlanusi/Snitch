import {useUserStore} from "../../store/useUserStore";
import {useEffect, useState} from "react";
import PostSkeleton from "../../components/skeletons/PostSkeleton";
import {Link} from "react-router-dom";
import { FaRegComment, FaRegHeart, FaTrash} from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {BiRepost} from "react-icons/bi";
import {formatPostDate} from "../../utils/date";
import {useAuthStore} from "../../store/useAuthStore";
import {MdAddReaction, MdReportProblem} from "react-icons/md";
import {IoClose} from "react-icons/io5";
import EditPostModal from "../../components/common/EditPostModal";
import {MoreHorizontal} from "lucide-react";
// import EmojiPicker from "./EmojiPicker";

const Posts = () => {

    const {isDeleting, isReacting, getPosts, isLiking, isReposting, isCommenting, isGettingPosts, Posts,likePost, likedPost, deletePost,
        reactToPost, reactedToPost, isEditing,
        commentPost,repost, getFollowingPosts, reposted, reportPost, isReporting
    } = useUserStore();
    const {authUserId} = useAuthStore();

    const [commentData, setCommentData] = useState({ text: "", postId: "" });
    const [reportSelectVisible, setReportSelectVisible] = useState(false);

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
        getPosts();
    }, [getPosts]);

    useEffect(() => {
        getFollowingPosts();
    }, [getFollowingPosts]);

    return (
		<>
			{(isGettingPosts) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isGettingPosts && Posts?.length === 0 && (
				<p className='text-center my-4'>No posts in this tab. Switch 👻</p>
			)}
			{!isGettingPosts && Posts && (
				<div className="overflow-auto w-full h-[calc(100vh-50px)]">
					{Posts?.map((post) => (
                        <div className='flex gap-2 items-start p-4 border-b border-gray-700' key={post?._id}>
                            <div className='flex flex-col flex-1'>
                                <div className='flex gap-2 items-center'>
                                    <div className='avatar'>
                                        <Link to={`/profile/${post?.author?.username}`} className='w-8 h-8 rounded-full overflow-hidden'>
                                            <img src={post?.author?.avatarUrl || "/avatar-placeholder.png"} alt={post?.author?.displayName} />
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
                                                    {isEditing && <LoadingSpinner size='sm'/>}
                                                    {isDeleting && <LoadingSpinner size='sm' />}
                                                    {isReporting && <LoadingSpinner size='sm' />}
                                                    {!isEditing && !isDeleting && !isReporting && <MoreHorizontal className="h-5 w-5" />}
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
                                                                <div className="flex flex-row group w-40 justify-between" onClick={(e) => {
                                                                    e.preventDefault();
                                                                    deletePost(post?._id);
                                                                }}>
                                                                    <p className="group-hover:text-red-500">Delete post</p>
                                                                    {!isDeleting && (
                                                                        <FaTrash className='cursor-pointer group-hover:text-red-500'/>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        )}
                                                        {post?.author?._id === authUserId && !isEditing && (
                                                            <EditPostModal post={post} />
                                                        )}
                                                        <button
                                                            className="text-gray-500"
                                                        >
                                                            <div className={`flex flex-row group ${reportSelectVisible ? "w-32" : "w-40"} ${!reportSelectVisible ? "w-40" : "w-32"} justify-between`} onClick={(e) => {
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
                                                                    <MdReportProblem className={`cursor-pointer group-hover:text-gray-700 ${reportSelectVisible ? "hidden" : "flex"}`}/>
                                                                )}
                                                                </div>
                                                                <IoClose className={`${reportSelectVisible ? "flex" :"hidden"} h-6 w-6`}
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
                                            <span className="w-[600px] truncate">{post?.text}</span>
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
                                                        <img src="/Snitch_Audio_Waveform(1920 x 1080).png" alt="" className="w-full h-[350px] object-cover object-center block rounded-lg"/>
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
                                            <FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
                                            <span className='text-sm text-slate-500 group-hover:text-sky-400'>
									            {post?.comments.length}
								            </span>
                                        </div>
                                        <dialog id={`comments_modal${post?._id}`} className='modal border-none outline-none'>
                                            <div className='modal-box rounded border border-gray-600 space-y-2'>

                                                <div className="flex mx-auto items-center justify-between">
                                                    <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                                                    <div>
                                                        <form method='dialog' className='modal-backdrop'>
                                                            <button className='outline-none'><IoClose className="text-black"/></button>
                                                        </form>
                                                    </div>
                                                </div>

                                                <form
                                                    className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
                                                    onSubmit={handlePostComment}
                                                >
										                    <textarea
                                                                className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
                                                                placeholder='Add a comment...'
                                                                value={commentData.text}
                                                                onKeyDown={(e) => e.key === "Enter" && handlePostComment(e)}
                                                                onChange={(e) => setCommentData({ ...commentData, text: e.target.value, postId: post?._id})}
                                                            />
                                                    <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
                                                        {isCommenting ? <LoadingSpinner size='md' /> : "Post"}
                                                    </button>
                                                </form>
                                                <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                                                    {post?.comments.length === 0 && (
                                                        <p className='text-sm text-slate-500'>
                                                            No comments yet 🤔 Be the first one 😉
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
                                                                    <span className='font-bold'>{comment?.userDisplayName}</span>
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
                                            repost(post?._id);
                                        }}>
                                            {isReposting && <LoadingSpinner size='sm' />}
                                            {!reposted && !isReposting && (
                                                <BiRepost className='w-6 h-6  text-slate-500 group-hover:text-green-500' />
                                            )}
                                            {reposted && !isReposting && (
                                                <BiRepost className='w-6 h-6 cursor-pointer text-green-500 ' />
                                            )}

                                            <span
                                                className={`text-sm  group-hover:text-green-500 ${
                                                    reposted ? "text-green-500" : "text-slate-500"
                                                }`}
                                            >
                                                {post?.repostCount}
                                            </span>


                                        </div>
                                        <div className='flex gap-1 items-center group cursor-pointer' onClick={(e) => {
                                            e.preventDefault();
                                            likePost(post?._id);
                                        }}>
                                            {isLiking && <LoadingSpinner size='sm' />}
                                            {!likedPost && !isLiking && (
                                                <FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
                                            )}
                                            {likedPost && !isLiking && (
                                                <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />
                                            )}

                                            <span
                                                className={`text-sm  group-hover:text-pink-500 ${
                                                    likedPost ? "text-pink-500" : "text-slate-500"
                                                }`}
                                            >
									                    {post?.likes?.length}
								                    </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-0 items-center cursor-pointer">
                                        <div className="flex gap-1 items-center group cursor-pointer" onClick={(e) => {
                                            e.preventDefault();
                                        }}>
                                            {isReacting && <LoadingSpinner size='sm' />}
                                            {!reactedToPost && !isReacting && (
                                                <MdAddReaction className='w-6 h-6 cursor-pointer text-slate-500 group-hover:text-yellow-500' />
                                            )}

                                            {reactedToPost && !isReacting && (
                                                <MdAddReaction className='w-6 h-6 cursor-pointer text-yellow-500 ' />
                                            )}
                                            <span
                                                className={`text-sm  group-hover:text-yellow-500 ${
                                                    reactedToPost ? "text-yellow-500" : "text-slate-500"
                                                }`}
                                            >
									                    {post?.reaction?.length}
								                    </span>
                                        </div>
                                        <select
                                            onChange={(e) => {
                                                reactToPost({id: post?._id , reaction: e.target.value})
                                            }}>
                                            <option></option>
                                            <option>👍</option>
                                            <option>💖</option>
                                            <option>😢</option>
                                            <option>😄</option>
                                            <option>🐦</option>
                                            <option>✅</option>
                                            <option>🐍</option>
                                            <option>😃</option>
                                            <option>😆</option>
                                            <option>😅</option>
                                            <option>🤣</option>
                                            <option>😜</option>
                                            <option>😚</option>
                                        </select>
                                        {/*<EmojiPicker inputRef={inputRef} />*/}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
				</div>
			)}
		</>
	);
};
export default Posts;
