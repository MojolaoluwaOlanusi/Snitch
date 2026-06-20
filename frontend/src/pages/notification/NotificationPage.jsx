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
import { MessageCircle } from "lucide-react";

const NotificationPage = () => {

    const { getNotifications, deleteNotifications, isGettingNotifications, notifications } = useUserStore();

    useEffect(() => {
        getNotifications();
    }, [getNotifications]);

    const getNotificationIcon = (type) => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case "follow":
                return <FaUser className={`${iconClass} text-blue-400`} />;
            case "like":
                return <FaHeart className={`${iconClass} text-blue-400`} />;
            case "react":
                return <MdOutlineAddReaction className={`${iconClass} text-blue-400`} />;
            case "repost":
                return <BiRepost className={`${iconClass} text-blue-400`} />;
            default:
                return null;
        }
    };

    const getNotificationText = (type) => {
        switch (type) {
            case "follow":
                return "followed you";
            case "like":
                return "liked your post";
            case "react":
                return "reacted to your post";
            case "repost":
                return "reposted your post";
            default:
                return "";
        }
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-gray-50">
            <Sidebar/>
            <div className='flex-[4_4_0] border-l border-r border-gray-200 bg-white w-full min-h-screen overflow-scroll'>
                <div className='sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200'>
                    <div className='flex justify-between items-center px-6 py-4'>
                        <h1 className='text-2xl font-bold text-gray-800'>Notifications</h1>
                        <div className="dropdown dropdown-end">
                            <button
                                tabIndex={0}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                aria-label="Notification settings"
                            >
                                <IoSettingsOutline className="w-5 h-5 text-gray-500" />
                            </button>

                            <ul
                                tabIndex={0}
                                className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-xl w-56 border border-gray-200"
                            >
                                <li>
                                    <button
                                        onClick={deleteNotifications}
                                        disabled={isGettingNotifications || !notifications || notifications.length === 0}
                                        className="text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    >
                                        Delete all notifications
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {isGettingNotifications && (
                    <div className='flex justify-center items-center h-64'>
                        <LoadingSpinner size='lg' />
                    </div>
                )}

                {!isGettingNotifications && notifications?.length === 0 && (
                    <div className='flex flex-col items-center justify-center h-64 text-center px-4'>
                        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                            <IoSettingsOutline className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className='text-gray-500 font-medium'>No notifications yet</p>
                        <p className='text-gray-400 text-sm mt-1'>When you get notifications, they'll appear here</p>
                    </div>
                )}

                {!isGettingNotifications && notifications?.map((notification) => (
                    <div
                        className='border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200'
                        key={notification._id}
                    >
                        {notification.type === "mention" ? (
                            // Mention notification – link to the chat conversation
                            <Link
                                to={`/chat`}
                                state={{ conversationId: notification.conversationId, messageId: notification.message?._id }}
                                className='block'
                            >
                                <div className='flex items-center gap-4 p-5'>
                                    <div className='flex-shrink-0'>
                                        <MessageCircle className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className='avatar flex-shrink-0'>
                                        <div className='w-12 h-12 rounded-full ring-2 ring-gray-100 ring-offset-2'>
                                            <img
                                                src={notification.fromAvatarUrl || "/avatar-placeholder.png"}
                                                alt={notification.from.username}
                                                className='w-full h-full object-cover'
                                            />
                                        </div>
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-gray-800'>
                            <span className='font-semibold text-gray-900 hover:text-blue-400 transition-colors duration-200'>
                                @{notification.from?.username}
                            </span>
                                            <span className='text-gray-500 ml-1'>
                                mentioned you in a chat
                            </span>
                                        </p>
                                        {notification.text && (
                                            <p className='text-sm text-gray-500 truncate mt-1'>
                                                "{notification.text}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            // Original notification (follow, like, etc.)
                            <Link to={`/profile/${notification.from.username}`} className='block'>
                                <div className='flex items-center gap-4 p-5'>
                                    <div className='flex-shrink-0'>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className='avatar flex-shrink-0'>
                                        <div className='w-12 h-12 rounded-full ring-2 ring-gray-100 ring-offset-2'>
                                            <img
                                                src={notification?.fromAvatarUrl || "/avatar-placeholder.png"}
                                                alt={notification.from.username}
                                                className='w-full h-full object-cover'
                                            />
                                        </div>
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-gray-800'>
                            <span className='font-semibold text-gray-900 hover:text-blue-400 transition-colors duration-200'>
                                @{notification.from.username}
                            </span>
                                            <span className='text-gray-500 ml-1'>
                                {getNotificationText(notification.type)}
                            </span>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                ))}
            </div>
            <RightPanel/>
        </div>
    );
};
export default NotificationPage;
