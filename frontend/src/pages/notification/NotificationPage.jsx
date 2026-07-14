import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { useUserStore } from "../../store/useUserStore";
import { useEffect } from "react";
import { BiRepost } from "react-icons/bi";
import { MdOutlineAddReaction } from "react-icons/md";
import Sidebar from "../../components/common/Sidebar";
import RightPanel from "../../components/common/RightPanel";
import {Bookmark, MessageCircle} from "lucide-react";

const NotificationPage = () => {
    const { getNotifications, deleteNotifications, isGettingNotifications, notifications } = useUserStore();

    useEffect(() => {
        getNotifications();
    }, [getNotifications]);

    const getNotificationIcon = (type) => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case "follow":
                return <FaUser className={`${iconClass} text-primary`} />;
            case "like":
                return <FaHeart className={`${iconClass} text-primary`} />;
            case "react":
                return <MdOutlineAddReaction className={`${iconClass} text-primary`} />;
            case "repost":
                return <BiRepost className={`${iconClass} text-primary`} />;
            case "bookmark":
                return <Bookmark className={`${iconClass} text-primary`} />;
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
            case "bookmark":
                return "bookmarked your post";
            default:
                return "";
        }
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />

            <main className="flex-1 border-l border-r border-base-200 bg-base-100 w-full min-h-screen overflow-y-auto">
                {/* Spacer for hamburger on mobile */}
                <div className="h-14 lg:hidden" />

                <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-sm border-b border-base-200">
                    <div className="flex justify-between items-center px-4 sm:px-6 py-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                            Notifications
                        </h1>
                        <div className="dropdown dropdown-end">
                            <button
                                tabIndex={0}
                                className="p-2 rounded-full hover:bg-base-200 transition-colors duration-200"
                                aria-label="Notification settings"
                            >
                                <IoSettingsOutline className="w-5 h-5 text-base-content/60" />
                            </button>

                            <ul
                                tabIndex={0}
                                className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-xl w-56 border border-base-200"
                            >
                                <li>
                                    <button
                                        onClick={deleteNotifications}
                                        disabled={
                                            isGettingNotifications ||
                                            !notifications ||
                                            notifications.length === 0
                                        }
                                        className="text-error hover:bg-error/10 rounded-lg transition-colors duration-200"
                                    >
                                        Delete all notifications
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {isGettingNotifications && (
                    <div className="flex justify-center items-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                )}

                {!isGettingNotifications && notifications?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
                            <IoSettingsOutline className="w-8 h-8 text-base-content/50" />
                        </div>
                        <p className="text-base-content/60 font-medium">No notifications yet</p>
                        <p className="text-base-content/50 text-sm mt-1">
                            When you get notifications, they'll appear here
                        </p>
                    </div>
                )}

                {!isGettingNotifications &&
                    notifications?.map((notification) => (
                        <div
                            className="border-b border-base-300 hover:bg-base-200 transition-colors duration-200"
                            key={notification._id}
                        >
                            {notification.type === "mention" ? (
                                // Mention notification – link to the chat conversation
                                <Link
                                    to={`/chat`}
                                    state={{
                                        conversationId: notification.conversationId,
                                        messageId: notification.message?._id,
                                    }}
                                    className="block"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                                        <div className="flex-shrink-0">
                                            <MessageCircle className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="avatar flex-shrink-0">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-1 ring-primary/20 ring-offset-2">
                                                <img
                                                    src={
                                                        notification.fromAvatarUrl ||
                                                        "/avatar-placeholder.png"
                                                    }
                                                    alt={notification.from.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base-content text-sm sm:text-base">
                                                <span className="font-semibold text-base-content/20 hover:text-primary transition-colors duration-200">
                                                    @{notification.from?.username}
                                                </span>
                                                <span className="text-base-content/60 ml-1">
                                                    mentioned you in a chat
                                                </span>
                                            </p>
                                            {notification.text && (
                                                <p className="text-xs sm:text-sm text-base-content/60 truncate mt-1">
                                                    "{notification.text}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                // Original notification (follow, like, etc.)
                                <Link
                                    to={`/profile/${notification.from.username}`}
                                    className="block"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                                        <div className="flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="avatar flex-shrink-0">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-1 ring-primary/20 ring-offset-2">
                                                <img
                                                    src={
                                                        notification?.fromAvatarUrl ||
                                                        "/avatar-placeholder.png"
                                                    }
                                                    alt={notification.from.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base-content text-sm sm:text-base">
                                                <span className="font-semibold text-base-content/20 hover:text-primary transition-colors duration-200">
                                                    @{notification.from.username}
                                                </span>
                                                <span className="text-base-content/60 ml-1">
                                                    {getNotificationText(notification.type)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </div>
                    ))}
            </main>

            {/* Right panel – hidden on mobile/tablet */}
            <div className="hidden lg:block">
                <RightPanel />
            </div>
        </div>
    );
};

export default NotificationPage;