// @ts-nocheck
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Edit3, Bookmark,EyeOff,
    Twitter, Instagram, Globe, Link as LinkIcon, Plus, AlertTriangle,
} from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { toast } from "sonner";
import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore.js';
import { useAuthStore } from '@/store/useAuthStore.js';
import {Link, useParams} from 'react-router-dom';

const SOCIAL_PLATFORMS = [
    { name: "twitter", label: "Twitter", icon: Twitter },
    { name: "instagram", label: "Instagram", icon: Instagram },
    { name: "website", label: "Website", icon: Globe },
    { name: "other", label: "Other", icon: LinkIcon },
];

const THEMES = [
    "winter", "light", "dark", "cupcake", "bumblebee", "emerald",
    "corporate", "synthwave", "retro", "cyberpunk", "valentine",
    "halloween", "garden", "forest", "aqua", "lofi", "pastel",
    "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk",
    "autumn", "business", "acid", "lemonade", "night", "coffee", "dim", "nord", "sunset"
];

const SettingsModal = ({ isOpen, onClose, authUser, onProfileUpdate, onEditProfile }) => {
    const [activeTab, setActiveTab] = useState("profile");
    const [gender, setGender] = useState(authUser?.gender || "");
    const [socialHandles, setSocialHandles] = useState(authUser?.socialHandles || []);
    const [newPlatform, setNewPlatform] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isIncognito, setIsIncognito] = useState(authUser?.incognito || false);
    const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem("snitch-theme") || "winter");
    const [isSaving, setIsSaving] = useState(false);
    const { getBookmarkedPosts } = useUserStore();
    const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);
    const [adminInviteCode, setAdminInviteCode] = useState("");
    const { getUserProfile, user } = useAuthStore();

    const { username } = useParams();

    useEffect(() => {
        if (authUser) {
            setGender(authUser.gender || "");
            setSocialHandles(authUser.socialHandles || []);
            setIsIncognito(authUser.incognito || false);
        }
    }, [authUser]);

    useEffect(() => {
        if (activeTab === 'bookmarks') {
            setLoadingBookmarks(true);
            getBookmarkedPosts().then(posts => {
                setBookmarkedPosts(posts || []);
                setLoadingBookmarks(false);
            });
        }
    }, [activeTab]);

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("access-token");
            await axiosInstance.put("/auth/update-profile",
                { gender, socialHandles },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Profile updated");
            onProfileUpdate?.();
        } catch (err) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const addSocialHandle = () => {
        if (!newPlatform || !newUrl) return;
        if (socialHandles.find(s => s.platform === newPlatform)) {
            toast.error("Platform already exists");
            return;
        }
        setSocialHandles([...socialHandles, { platform: newPlatform, url: newUrl }]);
        setNewPlatform("");
        setNewUrl("");
    };

    const removeSocialHandle = (platform) => {
        setSocialHandles(socialHandles.filter(s => s.platform !== platform));
    };

    const toggleIncognito = async () => {
        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.post("/incognito/toggle", {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsIncognito(res.data.incognito);
            onProfileUpdate?.();
            toast.success(res.data.incognito ? "Incognito mode on" : "Incognito mode off");
        } catch (err) {
            toast.error("Failed to toggle incognito");
        }
    };

    const changeTheme = (theme) => {
        setSelectedTheme(theme);
        localStorage.setItem("snitch-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        toast.success(`Theme changed to ${theme}`);
    };

    const deleteAccount = async () => {
        try {
            const token = localStorage.getItem("access-token");
            await axiosInstance.delete("/auth/account",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Account deleted. Goodbye.");
            window.location.href = "/login";
        } catch (err) {
            toast.error("Failed to delete account");
        }
    };

    const becomeAdmin = async (data) => {
        try {
            const token = localStorage.getItem("access-token");
            await axiosInstance.post("/admin/accept-invite", {code : data},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("You are now an admin");
            await getUserProfile(username);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to become admin");
            console.error(err)
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="bg-base-100 border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">Settings</h3>
                            <button onClick={onClose} className="p-2 hover:bg-base-200 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b px-4 gap-2 overflow-x-auto">
                            {["profile", "bookmarks", "appearance", "danger", "admin"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-2 px-3 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab ? "border-primary text-primary/90" : "border-transparent text-base-content/60 hover:text-base-content/80"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="p-4 space-y-4">
                            {activeTab === "profile" && (
                                <>
                                    {/* Edit Profile button -> opens existing modal */}
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onEditProfile?.();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 rounded-xl"
                                    >
                                        <Edit3 className="w-5 h-5 text-base-content/60" />
                                        <span className="text-sm">Edit Profile</span>
                                    </button>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm font-medium text-base-content/80 mb-1">Gender</label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="w-full border border-base-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Prefer not to say</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="non-binary">Non-binary</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {/* Social Handles */}
                                    <div>
                                        <p className="text-sm font-medium text-base-content/80 mb-2">Social Handles</p>
                                        <div className="space-y-2 mb-2">
                                            {socialHandles.map((s, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-base-200 px-3 py-1.5 rounded-lg">
                                                    <span className="text-sm capitalize flex-1">{s.platform}: {s.url}</span>
                                                    <button onClick={() => removeSocialHandle(s.platform)} className="text-error hover:text-error/90">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={newPlatform}
                                                onChange={(e) => setNewPlatform(e.target.value)}
                                                className="border border-base-300 rounded-lg px-2 py-1.5 text-sm"
                                            >
                                                <option value="">Select platform</option>
                                                {SOCIAL_PLATFORMS.map(p => (
                                                    <option key={p.name} value={p.name}>{p.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="url"
                                                placeholder="URL"
                                                value={newUrl}
                                                onChange={(e) => setNewUrl(e.target.value)}
                                                className="flex-1 border border-base-300 rounded-lg px-3 py-1.5 text-sm"
                                            />
                                            <button
                                                onClick={addSocialHandle}
                                                disabled={!newPlatform || !newUrl}
                                                className="p-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={saveProfile}
                                        disabled={isSaving}
                                        className="w-full py-2.5 bg-primary text-primary-content rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </>
                            )}

                            {activeTab === 'bookmarks' && (
                                <div>
                                    {loadingBookmarks ? (
                                        <p className="text-center text-base-content/50 py-8">Loading...</p>
                                    ) : bookmarkedPosts.length === 0 ? (
                                        <div className="text-center py-8 text-base-content/60">
                                            <Bookmark className="w-8 h-8 mx-auto mb-2 text-base-content/50" />
                                            <p className="text-sm">No bookmarked posts yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {bookmarkedPosts.map(post => (
                                                <Link
                                                    key={post._id}
                                                    to={`/post/${post._id}`}
                                                    className="block p-3 hover:bg-base-200 rounded-lg cursor-pointer"
                                                    onClick={onClose}
                                                >
                                                    <p className="text-sm font-medium line-clamp-2">
                                                        {post.text?.substring(0, 100)}
                                                    </p>
                                                    <p className="text-xs text-base-content/60 mt-1">
                                                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}


                            {activeTab === "appearance" && (
                                <div className="space-y-3">
                                    {/* Incognito toggle */}
                                    <button
                                        onClick={toggleIncognito}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-base-200 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <EyeOff className="w-5 h-5 text-base-content/60" />
                                            <span className="text-sm">Go Incognito</span>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors ${isIncognito ? 'bg-primary' : 'bg-gray-300'}`}>
                                            <div className={`w-5 h-5 bg-base-100 rounded-full shadow transition-transform ${isIncognito ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                        </div>
                                    </button>

                                    {/* Theme switcher */}
                                    <div>
                                        <p className="text-sm font-medium text-base-content/80 mb-2">Theme</p>
                                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                            {THEMES.map(theme => (
                                                <button
                                                    key={theme}
                                                    onClick={() => changeTheme(theme)}
                                                    className={`text-xs px-2 py-1 rounded-lg border capitalize ${
                                                        selectedTheme === theme
                                                            ? "border-primary bg-primary/10 text-primary/90"
                                                            : "border-base-200 text-base-content/70 hover:bg-base-200"
                                                    }`}
                                                >
                                                    {theme}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "danger" && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-error/10 rounded-xl border border-error/20">
                                        <div className="flex items-center gap-2 text-error/90 mb-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            <span className="font-semibold">Danger Zone</span>
                                        </div>
                                        <p className="text-sm text-error mb-4">
                                            Permanently delete your account and all data. This action cannot be undone.
                                        </p>
                                        {!showDeleteConfirm ? (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="px-4 py-2 bg-error text-primary-content rounded-lg font-medium hover:bg-red-600"
                                            >
                                                Delete Account
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={deleteAccount}
                                                    className="px-4 py-2 bg-red-600 text-primary-content rounded-lg font-medium hover:bg-red-700"
                                                >
                                                    Confirm Delete
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="px-4 py-2 bg-base-300 text-base-content/80 rounded-lg font-medium hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "admin" && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-base-200 rounded-xl border border-gold">
                                        {user.isAdmin ? (
                                            <div className="flex justify-center items-center">
                                                <button
                                                    className="px-4 py-2 bg-gold text-primary-content rounded-lg font-medium hover:bg-gold/60"
                                                    onClick={() => window.open(import.meta.env.VITE_ADMIN_URL, '_blank')}
                                                >
                                                    Go to Admin Dashboard
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 text-error/90 mb-2">
                                                    <span className="font-semibold text-gold">Become an Admin</span>
                                                </div>
                                                <p className="text-sm text-base-content mb-4">
                                                    Use the admin invitation code provided by an admin to become a Snitch Admin.
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={adminInviteCode}
                                                        onChange={(e) => {
                                                            const input = e.target.value;
                                                            if (/^\d*$/.test(input) && input.length <= 6) {
                                                                setAdminInviteCode(input);
                                                            }
                                                        }}
                                                        className="bg-base-200 w-full border rounded-lg py-2 pl-10 pr-4 text-base-content placeholder-base-content border-gold "
                                                        placeholder="Enter the Code"
                                                        maxLength={6}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            becomeAdmin(adminInviteCode);
                                                        }}
                                                        disabled={!adminInviteCode}
                                                        className="px-4 py-2 bg-gold text-primary-content rounded-lg font-medium hover:bg-gold/80"
                                                    >
                                                        Use Code
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;