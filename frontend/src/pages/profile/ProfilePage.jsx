// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import UserPosts from "../../components/common/UserPosts.jsx";
import LikedPosts from "../../components/common/LikedPosts.jsx";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton.jsx";
import EditProfileModal from "../../components/common/EditProfileModal.jsx";
import { Badge } from "../../components/common/badge.tsx";
import Sidebar from "../../components/common/Sidebar.jsx";
import { VerifiedSvg } from "../../components/svgs/verified.jsx";
import SettingsModal from "../../components/common/SettingsModal.jsx";

import {
    AlertTriangle, Briefcase, Building, CheckCircle2, User, Shield, MapPin,
    MessageCircle, Settings,
} from "lucide-react";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { GrUserAdmin } from "react-icons/gr";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

import { formatMemberSinceDate } from "../../utils/date/index.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useUserStore } from "../../store/useUserStore.js";
import { useMediaStore } from "../../store/useMediaStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import axiosInstance from "../../lib/axios.js";
import { toast } from "sonner";

const ProfilePage = () => {
    const { getUserProfile, isGettingUserProfile, user, isUpdatingProfile, updateProfile, authUser } = useAuthStore();
    const { userPosts, followUser, isFollowingUser } = useUserStore();
    const { uploadMedia } = useMediaStore();
    const { username } = useParams();
    const navigate = useNavigate();
    const { getConversation, selectConversation } = useChatStore();

    localStorage.setItem("username", username);

    const [coverImgUploadUrlData] = useState({ contentType: ".png", folder: "CoverImages" });
    const [avatarImgUploadUrlData] = useState({ contentType: ".png", folder: "Avatars" });
    const [formData, setFormData] = useState({ id: "" });

    const [showSettings, setShowSettings] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    const coverImgRef = useRef(null);
    const avatarImgRef = useRef(null);

    useEffect(() => {
        getUserProfile(username);
    }, [getUserProfile, username]);

    const handleChatWithUser = async () => {
        if (!user?._id) return;
        try {
            const conversation = await getConversation(user?._id);
            if (conversation) {
                selectConversation(conversation);
                navigate("/chat");
            }
        } catch (error) {
            toast.error("Could not open conversation");
        }
    };

    const uploadCoverImg = async (data) => {
        const token = localStorage.getItem("access-token");
        const res = await axiosInstance.post("/media/upload-url", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const coverImgUrl = res.data.publicUrl;
        const uploadUrl = res.data.uploadUrl;
        localStorage.setItem("uploadUrl", uploadUrl);
        await updateProfile({ coverImg: coverImgUrl });
        setTimeout(() => getUserProfile(username), 3000);
    };

    const uploadAvatarImg = async (data) => {
        const token = localStorage.getItem("access-token");
        const res = await axiosInstance.post("/media/upload-url", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const avatarUrl = res.data.publicUrl;
        const uploadUrl = res.data.uploadUrl;
        localStorage.setItem("uploadUrl", uploadUrl);
        await updateProfile({ avatarUrl: avatarUrl });
        setTimeout(() => getUserProfile(username), 3000);
    };

    const handleImgChange = async (e, state) => {
        const file = e.target.files[0];
        if (!file) return;
        if (state === "coverImg") {
            await uploadCoverImg(coverImgUploadUrlData);
            await uploadMedia(file);
        } else if (state === "avatarImg") {
            await uploadAvatarImg(avatarImgUploadUrlData);
            await uploadMedia(file);
        }
    };

    const isMyProfile = authUser?._id === user?._id;
    const memberSinceDate = formatMemberSinceDate(user?.createdAt);
    const amIFollowing = authUser?.following?.includes(user?._id);
    const [feedType, setFeedType] = useState("posts");

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />
            <main className="flex-1 flex flex-col items-center bg-base-100 rounded-lg h-full overflow-y-auto">
                {/* Hamburger spacer */}
                <div className="h-14 lg:hidden" />

                {/* HEADER */}
                {(isGettingUserProfile || isUpdatingProfile) && <ProfileHeaderSkeleton />}
                {!isGettingUserProfile && !isUpdatingProfile && !user && <p className="text-center text-lg mt-4">User not found ❌</p>}
                {!isGettingUserProfile && !isUpdatingProfile && user?.accountVisibility === "Private" && !isMyProfile && <p className="text-center text-lg mt-4">Sorry this is a private account 🔏</p>}
                {!isGettingUserProfile && !isUpdatingProfile && user?.accountVisibility === "Friends" && !isMyProfile && !amIFollowing && <p className="text-center text-lg mt-4">Sorry this is a friends only account 🫂</p>}

                <div className="flex flex-col max-h-screen w-full">
                    {!isGettingUserProfile && !isUpdatingProfile && user && (isMyProfile || (!isMyProfile && user?.accountVisibility === "Public") || (!isMyProfile && user?.accountVisibility === "Friends" && amIFollowing)) && (
                        <div className="h-screen overflow-y-auto w-full">
                            {/* Top bar */}
                            <div className="flex gap-4 sm:gap-10 px-4 py-2 items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Link to="/">
                                        <FaArrowLeft className="w-4 h-4" />
                                    </Link>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg text-base-content">{user?.displayName}</p>
                                            {user?.isAdmin && (
                                                <Badge variant="outline" className="flex items-center gap-1 bg-gold text-stone-400 border-yellow-200">
                                                    <GrUserAdmin className="w-4 h-4" />
                                                    <span className="capitalize">admin</span>
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm text-base-content/60">{userPosts?.length} posts</span>
                                    </div>
                                </div>

                                {isMyProfile && (
                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className="btn btn-outline bg-base-100 hover:bg-primary hover:text-primary-content rounded-full btn-sm flex items-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                )}
                            </div>

                            {/* Cover & avatar */}
                            <div className="relative group/cover">
                                <img
                                    src={user?.coverImg || "/cover.png"}
                                    className="h-52 w-full object-cover"
                                    alt="cover"
                                />
                                {isMyProfile && (
                                    <div
                                        className="absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200"
                                        onClick={() => coverImgRef.current.click()}
                                    >
                                        <MdEdit className="w-5 h-5 text-primary-content" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    ref={coverImgRef}
                                    onChange={(e) => handleImgChange(e, "coverImg")}
                                />
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    ref={avatarImgRef}
                                    onChange={(e) => handleImgChange(e, "avatarImg")}
                                />
                                <div className="avatar absolute -bottom-10 left-1">
                                    <div className="w-24 rounded-full ring-2 ring-white relative group/avatar">
                                        <img src={user?.avatarUrl || "/avatar-placeholder.png"} alt={user?.username} />
                                        {isMyProfile && (
                                            <div
                                                className="absolute top-5 right-3 p-1 bg-gray-800 rounded-full opacity-0 group-hover/avatar:opacity-100 cursor-pointer"
                                                onClick={() => avatarImgRef.current.click()}
                                            >
                                                <MdEdit className="w-4 h-4 text-primary-content" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex justify-end px-4 mt-5 gap-2 flex-wrap">
                                {isMyProfile && (
                                    <EditProfileModal
                                        authUser={authUser}
                                        isOpen={showEditProfile}
                                        onClose={() => setShowEditProfile(false)}
                                    />
                                )}
                                {!isMyProfile && (
                                    <>
                                        <button
                                            className="btn btn-outline bg-base-100 hover:bg-primary rounded-full btn-sm"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                setFormData({ ...formData, id: user?._id });
                                                await followUser(formData);
                                            }}
                                        >
                                            {isFollowingUser ? "Loading..." : amIFollowing ? "Unfollow" : "Follow"}
                                        </button>
                                        <button
                                            onClick={handleChatWithUser}
                                            className="btn btn-outline bg-base-100 hover:bg-primary hover:text-primary-content rounded-full btn-sm flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Chat
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Profile info */}
                            <div className="flex flex-col gap-4 mt-14 px-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{user?.displayName}</span>
                                        {user?.verified && <VerifiedSvg />}
                                    </div>
                                    <span className="text-sm text-base-content/60">@{user?.username}</span>
                                    <span className="text-sm my-1">{user?.bio}</span>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {user?.link && (
                                        <div className="flex gap-1 items-center">
                                            <FaLink className="w-3 h-3 text-base-content/60" />
                                            <a href={user.link} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                                {user.link}
                                            </a>
                                        </div>
                                    )}

                                    {user?.accountType === "Work" && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                                            <Briefcase className="w-4 h-4" />
                                            <span className="capitalize">{user.accountType}</span>
                                        </Badge>
                                    )}
                                    {user?.accountType === "Personal" && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-base-200 text-base-content/80 border-base-200">
                                            <User className="w-4 h-4" />
                                            <span className="capitalize">{user.accountType}</span>
                                        </Badge>
                                    )}
                                    {user?.accountType === "Business" && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-purple-100 text-purple-700 border-purple-200">
                                            <Building className="w-4 h-4" />
                                            <span className="capitalize">{user.accountType}</span>
                                        </Badge>
                                    )}

                                    {user?.warningsCount === 0 && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-success/10 text-green-700 border-green-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="capitalize">Account in Good Standing</span>
                                        </Badge>
                                    )}
                                    {user?.warningsCount === 1 && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="capitalize">Account Warning</span>
                                        </Badge>
                                    )}
                                    {user?.warningsCount === 2 && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="capitalize">Account Flagged for Ban</span>
                                        </Badge>
                                    )}
                                    {user?.warningsCount === 3 && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-error/10 text-error border-error">
                                            <Shield className="w-4 h-4" />
                                            <span className="capitalize">Account Suspended</span>
                                        </Badge>
                                    )}

                                    {user?.verified && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-success/10 text-green-700 border-green-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="capitalize">verified</span>
                                        </Badge>
                                    )}
                                    {!isMyProfile && !user?.verified && (
                                        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="capitalize">not verified</span>
                                        </Badge>
                                    )}
                                    {isMyProfile && !user?.verified && (
                                        <Link to={`/verify-account/${user?.username}`}>
                                            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="capitalize">Verify your account</span>
                                            </Badge>
                                        </Link>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <IoCalendarOutline className="w-4 h-4 text-base-content/60" />
                                        <span className="text-sm text-base-content/60">{memberSinceDate}</span>
                                    </div>
                                    {user?.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-base-content/60" />
                                            <span className="text-sm text-base-content/60 w-40 truncate hover:w-full">{user.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex gap-1 items-center">
                                        <span className="font-bold text-xs">{user?.following?.length}</span>
                                        <span className="text-base-content/60 text-xs">Following</span>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <span className="font-bold text-xs">{user?.followers?.length}</span>
                                        <span className="text-base-content/60 text-xs">Followers</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex w-full border-b border-base-content/40 mt-4">
                                <div
                                    className="flex justify-center flex-1 p-3 rounded-lg hover:bg-base-300 transition duration-300 relative cursor-pointer"
                                    onClick={() => setFeedType("posts")}
                                >
                                    Posts
                                    {feedType === "posts" && (
                                        <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                                    )}
                                </div>
                                <div
                                    className="flex justify-center flex-1 p-3 text-base-content/60 rounded-lg hover:bg-base-300 transition duration-300 relative cursor-pointer"
                                    onClick={() => setFeedType("likes")}
                                >
                                    Likes
                                    {feedType === "likes" && (
                                        <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                                    )}
                                </div>
                            </div>
                            {feedType === "posts" && <UserPosts />}
                            {feedType === "likes" && <LikedPosts />}
                        </div>
                    )}

                    {/* Settings modal */}
                    <SettingsModal
                        isOpen={showSettings}
                        onClose={() => setShowSettings(false)}
                        authUser={authUser}
                        onProfileUpdate={() => getUserProfile(username)}
                        onEditProfile={() => setShowEditProfile(true)}
                    />
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;