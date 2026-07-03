import { BellIcon, HomeIcon, MessageCircleIcon, PlusIcon, SearchIcon, UserIcon, ZapIcon, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { GiFlowerTwirl } from "react-icons/gi";
import { SnitchLogoSmall } from "../svgs/snitch";
import { useAuthStore } from "../../store/useAuthStore";
import { useEffect, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../store/useChatStore";

const Sidebar = () => {
    const { logout, authUser, getProfile } = useAuthStore();
    const { selectedConversation } = useChatStore();
    const [isChatRestricted, setIsChatRestricted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        getProfile();
        checkChatRestriction();
    }, [getProfile]);

    const checkChatRestriction = async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/check-restriction', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsChatRestricted(res.data.restricted || false);
        } catch (error) {
            setIsChatRestricted(false);
        }
    };

    // Common link data
    const links = [
        { to: "/", icon: HomeIcon, label: "Home" },
        { to: "/chat", icon: MessageCircleIcon, label: "Chat", restricted: isChatRestricted },
        { to: `/profile/${authUser?.username}`, icon: UserIcon, label: "Profile" },
        { to: `/create-post/${authUser?.username}`, icon: PlusIcon, label: "Create Post" },
        { to: "/warp", icon: ZapIcon, label: "Warp" },
        { to: "/search", icon: SearchIcon, label: "Search" },
        { to: `/notifications/${authUser?.username}`, icon: BellIcon, label: "Notifications" },
        { to: "/ai", icon: GiFlowerTwirl, label: "AI" },
    ];

    const renderLinks = (mobile = false) => (
        <div className="space-y-1">
            {links.map((link) => {
                const isChat = link.label === "Chat" && link.restricted;
                const to = isChat ? "#" : link.to;
                const extraClass = isChat
                    ? 'bg-gray-300 cursor-not-allowed opacity-50 pointer-events-none'
                    : 'bg-blue-500 hover:bg-blue-600 btn-primary';
                return (
                    <Link
                        key={link.label}
                        to={to}
                        className={`btn w-full justify-start text-white ${extraClass}`}
                        onClick={(e) => {
                            if (isChat) {
                                e.preventDefault();
                                toast?.error?.('Chat access restricted due to reports');
                            }
                            if (mobile) setMobileMenuOpen(false);
                        }}
                        title={link.label}
                    >
                        <link.icon className="size-5 shrink-0" />
                        <span className="ml-2 md:hidden lg:inline">{link.label}</span>
                    </Link>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Hamburger button – visible only on mobile (smaller than md) */}
            {!selectedConversation && !mobileMenuOpen && (
                <button
                    className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
            )}

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        {/* Drawer panel */}
                        <motion.div
                            className="absolute top-0 left-0 h-full w-64 bg-white shadow-xl p-6 flex flex-col"
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <SnitchLogoSmall />
                                    <h3 className="font-bold text-2xl text-blue-600">Snitch</h3>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {renderLinks(true)}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    logout();
                                    setMobileMenuOpen(false);
                                }}
                                className="btn btn-ghost w-full justify-start text-red-500 mt-4"
                            >
                                <BiLogOut className="w-5 h-5 mr-2" />
                                <span>Logout</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar (visible on md and above) */}
            <div className="hidden md:flex h-screen w-full max-w-[80px] lg:max-w-[225px] flex-col gap-2 border-r border-gray-200 bg-white">
                <div className="rounded-lg bg-white p-4 sticky top-0 left-0 h-screen flex flex-col w-full">
                    <div className="flex items-center justify-center lg:justify-start space-x-2 py-4">
                        <SnitchLogoSmall />
                        <h3 className="hidden lg:block font-bold text-3xl text-blue-600">Snitch</h3>
                    </div>

                    <div className="space-y-2">
                        {links.map((link) => {
                            const isChat = link.label === "Chat" && link.restricted;
                            const to = isChat ? "#" : link.to;
                            const extraClass = isChat
                                ? 'bg-gray-300 cursor-not-allowed opacity-50 pointer-events-none'
                                : 'bg-blue-500 hover:bg-blue-600 btn-primary';
                            return (
                                <Link
                                    key={link.label}
                                    to={to}
                                    className={`btn w-full justify-center lg:justify-start text-white ${extraClass}`}
                                    onClick={(e) => {
                                        if (isChat) {
                                            e.preventDefault();
                                            toast?.error?.('Chat access restricted due to reports');
                                        }
                                    }}
                                    title={link.label}
                                >
                                    <link.icon className="size-5 shrink-0" />
                                    <span className="hidden lg:inline ml-2">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Profile & Logout */}
                    <Link
                        to={`/profile/${authUser?.username}`}
                        className="mt-auto mb-4 flex items-center justify-center lg:justify-start gap-2 transition-all duration-300 hover:bg-blue-300 py-2 px-2 lg:px-4 rounded-full"
                    >
                        <div className="avatar">
                            <div className="w-8 rounded-full">
                                <img src={authUser?.avatarUrl || "/avatar.png"} alt={authUser?.username} />
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-col flex-1 truncate">
                            <p className="text-slate-500 font-bold text-sm truncate">{authUser?.displayName}</p>
                            <p className="text-slate-500 text-xs truncate">@{authUser?.username}</p>
                        </div>
                        <BiLogOut
                            className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-700 hidden lg:block"
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                            }}
                            title="Logout"
                        />
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Sidebar;