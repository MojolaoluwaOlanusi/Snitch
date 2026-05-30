import { Link } from "react-router-dom";

import LoadingSpinner from "../../components/common/LoadingSpinner";

import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import {useUserStore} from "../../store/useUserStore";
import {useEffect} from "react";
import {BiRepost} from "react-icons/bi";
import {MdOutlineAddReaction} from "react-icons/md";
import Sidebar from "../../components/common/Sidebar";
import RightPanel from "../../components/common/RightPanel";

const NotificationPage = () => {

    const { getNotifications, deleteNotifications, isGettingNotifications, notifications } = useUserStore();

    useEffect(() => {
        getNotifications();
    }, [getNotifications]);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className='flex-[4_4_0] border-l border-r bg-white rounded-lg w-full min-h-screen overflow-scroll'>
                <div className='flex justify-between space-x-64 items-center p-4 border-b border-gray-700'>
                    <p className='font-bold'>Notifications</p>
                    <div className="dropdown dropdown-end">
                        <button
                            tabIndex={0}
                            className="btn btn-ghost btn-sm"
                            aria-label="Notification settings"
                        >
                            <IoSettingsOutline className="w-4 h-4" />
                        </button>

                        <ul
                            tabIndex={0}
                            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                            <li>
                                <button
                                    onClick={deleteNotifications}
                                    disabled={isGettingNotifications || !notifications || notifications.length === 0}
                                    className="text-red-500"
                                >
                                    Delete all notifications
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                {isGettingNotifications && (
                    <div className='flex justify-center h-full items-center'>
                        <LoadingSpinner size='lg' />
                    </div>
                )}
                {notifications?.length === 0 && <div className='text-center p-4 font-bold'>No notifications 🤔</div>}
                {notifications?.map((notification) => (
                    <div className='border-b border-gray-700' key={notification._id}>
                        <div className='flex gap-2 p-4'>
                            {notification.type === "follow" && <FaUser className='w-7 h-7 text-primary' />}
                            {notification.type === "like" && <FaHeart className='w-7 h-7 text-red-500' />}
                            {notification.type === "react" && <MdOutlineAddReaction className='w-7 h-7 text-yellow-500' />}
                            {notification.type === "repost" && <BiRepost className='w-7 h-7 text-green-500' />}
                            <Link to={`/profile/${notification.from.username}`}>
                                <div className='avatar'>
                                    <div className='w-8 rounded-full'>
                                        <img src={notification?.fromAvatarUrl || "/avatar-placeholder.png"} alt={notification.from.username} />
                                    </div>
                                </div>
                                <div className='flex gap-1'>
                                    <span className='font-bold'>@{notification.from.username}</span>{" "}
                                    {notification.type === "follow" && "followed you"}
                                    {notification.type === "like" && "liked your post"}
                                    {notification.type === "react" && "reacted to your post"}
                                    {notification.type === "repost" && "reposted your post"}
                                </div>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            <RightPanel/>
        </div>
    );
};
export default NotificationPage;
