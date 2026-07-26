import { BellIcon, HomeIcon, MessageCircleIcon, PlusIcon, SearchIcon, UserIcon, ZapIcon, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { GiFlowerTwirl } from "react-icons/gi";
import { SnitchLogoSmall } from "../svgs/snitch.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useEffect, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import axiosInstance from "../../lib/axios.js";
import { toast } from 'sonner'
import { useChatStore } from "../../store/useChatStore.js";

const Sidebar = () => {
    const { logout, authUser, getProfile } = useAuthStore();
    const { selectedConversation } = useChatStore();
    const [isChatRestricted, setIsChatRestricted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [framerModule, setFramerModule] = useState(null);
    const location = useLocation();

    // Get total unread messages from chat store
    const { totalUnread } = useChatStore();

    useEffect(() => {
        getProfile();
        checkChatRestriction();
    }, [getProfile]);

    useEffect(() => {
        if (mobileMenuOpen && !framerModule) {
            import("framer-motion").then((mod) => setFramerModule(mod));
        }
    }, [mobileMenuOpen, framerModule]);

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

    // 🔥 Shared function to build the link className
    const getLinkClassName = (link, isActive) => {
        const isChat = link.label === "Chat" && link.restricted;

        let buttonClass = 'btn w-full rounded-lg transition-all duration-200 border-0 shadow-none text-left';

        // Desktop: justify-start, Mobile: justify-start (consistent)
        buttonClass += ' justify-start';

        if (isChat) {
            buttonClass += ' bg-gray-300 cursor-not-allowed opacity-50 pointer-events-none';
        } else if (isActive) {
            // ✅ SELECTED: Blue background, white text, subtle shadow
            buttonClass += ' bg-primary text-primary-content shadow-md hover:bg-primary/90';
        } else {
            // ✅ UNSELECTED: Same color as sidebar, slightly darker, subtle shadow
            buttonClass += ' bg-base-200/50 text-base-content/70 hover:bg-base-200 hover:text-base-content hover:shadow-sm';
        }

        return buttonClass;
    };

    // 🔥 Shared function to render a single link
    const renderLink = (link, mobile = false) => {
        const isChat = link.label === "Chat" && link.restricted;
        const to = isChat ? "#" : link.to;

        // Custom active check for dynamic routes
        const isActive = !isChat && (() => {
            if (link.to === '/') {
                return location.pathname === '/';
            }
            const basePath = link.to.split('/').slice(0, 2).join('/');
            return location.pathname.startsWith(basePath + '/');
        })();

        const className = getLinkClassName(link, isActive);

        return (
            <NavLink
                key={link.label}
                to={to}
                className={className}
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
                {/* 🔥 Unread badge - only show on Chat button */}
                {link.label === "Chat" && totalUnread > 0 && !link.restricted && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </NavLink>
        );
    };

    return (
        <>
            {/* Hamburger button – visible only on mobile (smaller than md) */}
            {!selectedConversation && !mobileMenuOpen && (
                <button
                    className="md:hidden fixed top-4 left-4 z-50 p-2 bg-base-100 rounded-full shadow-md"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6 text-base-content/80" />
                </button>
            )}

            {/* Mobile Drawer – dynamic framer-motion */}
            {framerModule && (() => {
                const { motion: Motion, AnimatePresence } = framerModule;
                return (
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <Motion.div
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
                                <Motion.div
                                    className="absolute top-0 left-0 h-full w-64 bg-base-100 shadow-xl p-6 flex flex-col"
                                    initial={{ x: -300 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -300 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <SnitchLogoSmall />
                                            <h3 className="font-bold text-2xl text-primary/90">Snitch</h3>
                                        </div>
                                        <button
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="p-2 hover:bg-base-200 rounded-full"
                                        >
                                            <X className="w-5 h-5 text-base-content/60" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1">
                                        {links.map((link) => renderLink(link, true))}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="btn btn-ghost w-full justify-start text-error mt-4 rounded-lg"
                                    >
                                        <BiLogOut className="w-5 h-5 mr-2" />
                                        <span>Logout</span>
                                    </button>
                                </Motion.div>
                            </Motion.div>
                        )}
                    </AnimatePresence>
                );
            })()}

            {/* Desktop Sidebar (visible on md and above) */}
            <div className="hidden md:flex h-screen w-full max-w-[80px] lg:max-w-[225px] flex-col gap-2 border-r border-base-200 bg-base-100">
                <div className="rounded-lg bg-base-100 p-4 sticky top-0 left-0 h-screen flex flex-col w-full">
                    <div className="flex items-center justify-center lg:justify-start space-x-2 py-4">
                        <SnitchLogoSmall />
                        <h3 className="hidden lg:block font-bold text-3xl text-primary/90">Snitch</h3>
                    </div>

                    <div className="space-y-1">
                        {links.map((link) => renderLink(link, false))}
                    </div>

                    {/* Profile & Logout */}
                    <Link
                        to={`/profile/${authUser?.username}`}
                        className="mt-auto mb-4 flex items-center justify-center lg:justify-start gap-2 transition-all duration-300 hover:bg-primary/60 py-2 px-2 lg:px-4 rounded-lg"
                    >
                        <div className="avatar">
                            <div className="w-8 rounded-full">
                                <img src={authUser?.avatarUrl || "/avatar.png"} alt={authUser?.username} />
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-col flex-1 truncate">
                            <p className="text-base-content/60 font-bold text-sm truncate">{authUser?.displayName}</p>
                            <p className="text-base-content/60 text-xs truncate">@{authUser?.username}</p>
                        </div>
                        <BiLogOut
                            className="w-5 h-5 cursor-pointer text-error hover:text-error hidden lg:block"
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