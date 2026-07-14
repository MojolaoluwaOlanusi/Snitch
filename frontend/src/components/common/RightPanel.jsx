import { Link } from "react-router-dom";
import {useUserStore} from "../../store/useUserStore";
import {useAuthStore} from "../../store/useAuthStore";
import {useEffect} from "react";
import RightPanelSkeleton from "../../components/skeletons/RightPanelSkeleton";
import PageLoader from "../../components/common/PageLoader";


const RightPanel = () => {
    const { suggestedUsers, getSuggestedUsers, isGettingSuggestedUsers,  followUser, isFollowingUser } = useUserStore();

    useEffect(() => {
        getSuggestedUsers();
    }, [getSuggestedUsers]);

    if (suggestedUsers?.length === 0) return <div className='md:w-64 w-0'></div>;

    return (
        <div className='hidden lg:block my-4 mx-2'>
            <div className='bg-base-100 p-4 rounded-md sticky top-2 '>
                <p className='font-bold'>Who to follow</p>
                <div className='flex flex-col gap-4'>
                    {/* item */}
                    {isGettingSuggestedUsers && (
                        <>
                            <RightPanelSkeleton />
                            <RightPanelSkeleton />
                            <RightPanelSkeleton />
                            <RightPanelSkeleton />
                        </>
                    )}
                    {!isGettingSuggestedUsers &&
                        suggestedUsers?.map((user) => (
                            <Link
                                to={`/profile/${user?.username}`}
                                className='flex items-center justify-between gap-4'
                                key={user?._id}
                            >
                                <div className='flex gap-2 items-center'>
                                    <div className='avatar'>
                                        <div className='w-8 rounded-full'>
                                            <img src={user?.avatarUrl || "/avatar-placeholder.png"} alt={user?.username} />
                                        </div>
                                    </div>
                                    <div className='flex flex-col'>
										<span className='font-semibold tracking-tight truncate w-28'>
											{user?.displayName}
										</span>
                                        <span className='text-sm text-base-content/60'>@{user?.username}</span>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        className='btn bg-primary/60 text-base-content hover:bg-base-300 hover:opacity-90 rounded-full btn-sm'
                                        onClick={(e) => {
                                            e.preventDefault();
                                            followUser({id: user?._id});
                                        }}
                                    >
                                        {isFollowingUser ? <PageLoader /> : "Follow"}
                                    </button>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
};
export default RightPanel;
