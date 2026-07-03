import {useUserStore} from "../../store/useUserStore";
import {useEffect} from "react";
import CreatePostRightPanelSkeleton from "../../components/skeletons/CreatePostRightPanelSkeleton";
import {useAuthStore} from "../../store/useAuthStore";
import {AudioLinesIcon, ImageIcon, VideoIcon} from "lucide-react";
import {Link} from "react-router-dom";

const CreatePostRightPanel = () => {
    const { truncatedPosts, isGettingUserPosts, getTruncatedPosts } = useUserStore();
    const { authUserId, authUser } = useAuthStore();

    useEffect(() => {
        getTruncatedPosts(authUserId);
    }, [getTruncatedPosts]);

    if (truncatedPosts?.length === 0) return <div className='md:w-64 w-0'>
    </div>;

    return (
        <div className='hidden lg:block my-4 mx-2'>
            <div className='bg-white p-4 rounded-md sticky top-2 space-y-4'>
                <p className='font-bold'>Your Posts</p>
                <div className='flex flex-col gap-4'>
                    {/* item */}
                    {isGettingUserPosts && (
                        <>
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                            <CreatePostRightPanelSkeleton />
                        </>
                    )}
                    {!isGettingUserPosts &&
                        truncatedPosts?.map((posts) => (
                            <div
                                className='flex items-center justify-between gap-4 h-20'
                                key={posts?._id}
                            >
                                <Link
                                    to={`/post/${posts?._id}`}
                                >
                                    <div className='flex gap-2 items-center'>
                                        <div className='avatar hidden md:inline-flex'>
                                            <div className='w-8 rounded-full'>
                                                <img src={authUser?.avatarUrl || "/avatar.png"} alt={authUser?.username}/>
                                            </div>
                                        </div>
                                        <div className='flex flex-col rounded-lg hover:bg-gray-200 bg-gray-100 hover:opacity-90 w-[250px]'>
										<span className='font-semibold tracking-tight truncate w-50'>
											{posts?.text}
										</span>
                                            <div className="flex gap-2 items-center">
                                                <span className='text-semibold text-slate-500 w-50 truncate'>{posts?.mediaType === "Audio" && (<AudioLinesIcon className="text-black"/>)}{posts?.mediaType === "Video" && (<VideoIcon className="text-black"/>)}{posts?.mediaType === "Image" && (<ImageIcon className="text-black"/>)}</span>
                                                <span className="font-semibold tracking-tight truncate w-48 underline text-blue-500">{posts?.url}</span>
                                            </div>
                                            {posts.visibility === "public" && (
                                                <span className="flex flex-col bg-green-400 rounded-lg text-bold w-14 items-center text-emerald-800">Public</span>
                                            )}
                                            {posts.visibility === "private" && (
                                                <span className="flex flex-col bg-gray-400 rounded-lg text-bold w-16 items-center text-gray-800">Private</span>
                                            )}
                                            {posts.visibility === "followers" && (
                                                <span className="flex flex-col bg-blue-400 rounded-lg text-bold w-[80px] items-center text-slate-800">Followers</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
}
export default CreatePostRightPanel
