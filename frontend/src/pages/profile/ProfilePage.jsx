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
import FollowersModal from "../../components/common/FollowersModal.jsx";

import {
    AlertTriangle, Briefcase, Building, CheckCircle2, User, Shield, MapPin,
    MessageCircle, Settings, Copy, Check,
} from "lucide-react";

import {FaArrowLeft, FaEnvelope, FaFacebook, FaTelegram, FaWhatsapp, FaXTwitter} from "react-icons/fa6";
import {IoCalendarOutline, IoClose} from "react-icons/io5";
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
    const { getUserProfile, isGettingUserProfile, user, isUpdatingProfile, updateProfile, authUser, invitedCount } = useAuthStore();
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
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    const coverImgRef = useRef(null);
    const avatarImgRef = useRef(null);

    useEffect(() => {
        getUserProfile(username);
    }, [getUserProfile, username]);

    useEffect(() => {
        // Sync local isFollowing state with authUser's following list
        setIsFollowing(authUser?.following?.includes(user?._id) || false);
    }, [authUser, user]);

    const [shareModal, setShareModal] = useState({ open: false, postId: null, url: "", title: "Share Post", text: "" });
    useEffect(() => {
        const handler = (e) => setShareModal({
            open: true,
            postId: e.detail.postId,
            url: e.detail.url,
            title: e.detail.title || "Share Post",
            text: e.detail.text || ""
        });
        window.addEventListener("prOpenShareModal", handler);
        return () => window.removeEventListener("prOpenShareModal", handler);
    }, []);

    const handleShare = async (postId, url, title = 'Check out this post on Snitch', text = 'I found this interesting post on Snitch!') => {
        // If Web Share API is supported, use it
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url,
                });
                // Exit early - don't open the modal
                return;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                }
                // If user cancelled (AbortError), don't show modal
                if (error.name === 'AbortError') {
                    return;
                }
                // Fallback to modal if share fails for other reasons
            }
        }

        // Fallback: open the share modal (only if navigator.share not supported or failed)
        window.dispatchEvent(
            new CustomEvent("prOpenShareModal", {
                detail: { postId, url, title, text },
            })
        );
    };

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

    const handleFollow = async () => {
        if (!user?._id) return;
        
        // Optimistic update
        const previousState = isFollowing;
        setIsFollowing(true);
        
        try {
            const result = await followUser({ id: user._id });
            // Refresh auth user to get updated following list
            const { getProfile } = useAuthStore();
            await getProfile();
            await getUserProfile(username);
        } catch (error) {
            // Rollback on error
            setIsFollowing(previousState);
            console.error('Follow failed:', error);
        }
    };

    const handleUnfollow = async () => {
        if (!user?._id) return;
        
        // Optimistic update
        const previousState = isFollowing;
        setIsFollowing(false);
        
        try {
            const result = await followUser({ id: user._id });
            // Refresh auth user to get updated following list
            const { getProfile } = useAuthStore();
            await getProfile();
            await getUserProfile(username);
        } catch (error) {
            // Rollback on error
            setIsFollowing(previousState);
            console.error('Unfollow failed:', error);
        }
    };

    const uploadCoverImg = async (data) => {
        const useCloudinary = import.meta.env.VITE_USE_CLOUDINARY === 'true';
        
        try {
            if (useCloudinary) {
                // Use Cloudinary direct upload with automatic profile update
                const file = data.file;
                const { uploadToCloudinary } = useMediaStore.getState();
                const result = await uploadToCloudinary(file, 'CoverImages', 'coverImg');
                // Update authUser state with the profile response
                if (result.profileUpdated) {
                    useAuthStore.setState({ authUser: result.profileUpdated });
                }
                toast.success('Cover image updated successfully');
            } else {
                // Use existing S3/MinIO upload logic
                const token = localStorage.getItem("access-token");
                const res = await axiosInstance.post("/media/upload-url", data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const coverImgUrl = res.data.publicUrl;
                const uploadUrl = res.data.uploadUrl;
                localStorage.setItem("uploadUrl", uploadUrl);
                await uploadMedia(file);
                const updatedProfile = await updateProfile({ coverImg: coverImgUrl });
                toast.success('Cover image updated successfully');
            }
            // Refresh both auth user and profile user
            await getUserProfile(username);
            const { getProfile } = useAuthStore();
            await getProfile();
        } catch (error) {
            console.error('Error uploading cover image:', error);
            // Only show error toast if it's not already shown by the upload function
            if (!error.message || !error.message.includes('Failed to upload')) {
                toast.error('Failed to upload cover image');
            }
        }
    };

    const uploadAvatarImg = async (data) => {
        const useCloudinary = import.meta.env.VITE_USE_CLOUDINARY === 'true';
        
        try {
            if (useCloudinary) {
                // Use Cloudinary direct upload with automatic profile update
                const file = data.file;
                const { uploadToCloudinary } = useMediaStore.getState();
                const result = await uploadToCloudinary(file, 'Avatars', 'avatarUrl');
                // Update authUser state with the profile response
                if (result.profileUpdated) {
                    useAuthStore.setState({ authUser: result.profileUpdated });
                }
                toast.success('Avatar updated successfully');
            } else {
                // Use existing S3/MinIO upload logic
                const token = localStorage.getItem("access-token");
                const res = await axiosInstance.post("/media/upload-url", data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const avatarUrl = res.data.publicUrl;
                const uploadUrl = res.data.uploadUrl;
                localStorage.setItem("uploadUrl", uploadUrl);
                await uploadMedia(file);
                const updatedProfile = await updateProfile({ avatarUrl: avatarUrl });
                toast.success('Avatar updated successfully');
            }
            // Refresh both auth user and profile user
            await getUserProfile(username);
            const { getProfile } = useAuthStore();
            await getProfile();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            // Only show error toast if it's not already shown by the upload function
            if (!error.message || !error.message.includes('Failed to upload')) {
                toast.error('Failed to upload avatar');
            }
        }
    };

    const handleImgChange = async (e, state) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const useCloudinary = import.meta.env.VITE_USE_CLOUDINARY === 'true';
        
        if (state === "coverImg") {
            if (useCloudinary) {
                await uploadCoverImg({ file, ...coverImgUploadUrlData });
            } else {
                await uploadCoverImg(coverImgUploadUrlData);
                await uploadMedia(file);
            }
        } else if (state === "avatarImg") {
            if (useCloudinary) {
                await uploadAvatarImg({ file, ...avatarImgUploadUrlData });
            } else {
                await uploadAvatarImg(avatarImgUploadUrlData);
                await uploadMedia(file);
            }
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
                                            className={`btn btn-outline rounded-full btn-sm transition-all duration-200 ${
                                                isFollowing ? 'bg-base-100 hover:bg-base-200' : 'bg-base-100 hover:bg-primary hover:text-primary-content'
                                            } ${isFollowingUser ? 'scale-95 opacity-70' : ''}`}
                                            onClick={isFollowing ? handleUnfollow : handleFollow}
                                            disabled={isFollowingUser}
                                        >
                                            {isFollowing ? 'Unfollow' : 'Follow'}
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

                                <div className="flex gap-2 items-center">
                                    <div 
                                        className="flex gap-1 items-center cursor-pointer hover:underline"
                                        onClick={() => setShowFollowersModal(true)}
                                    >
                                        <span className="font-bold text-xs">{user?.following?.length}</span>
                                        <span className="text-base-content/60 text-xs">Following</span>
                                    </div>
                                    <div 
                                        className="flex gap-1 items-center cursor-pointer hover:underline"
                                        onClick={() => setShowFollowersModal(true)}
                                    >
                                        <span className="font-bold text-xs">{user?.followers?.length}</span>
                                        <span className="text-base-content/60 text-xs">Followers</span>
                                    </div>
                                    {isMyProfile && (
                                        <div className="flex gap-1 items-center">
                                            <span className="font-bold text-xs">{invitedCount}</span>
                                            <span className="text-base-content/60 text-xs">Invited</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            const inviteUrl = `${window.location.origin}/profile/${authUser?.username}`;
                                            const inviteText = `Hey! I'm on Snitch – a cool new social app. Follow me @${authUser?.username} and let's connect! 🚀`;
                                            handleShare(null, inviteUrl, "Invite a friend to Snitch", inviteText);
                                        }}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        Invite a friend
                                    </button>
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

                    {/* Followers modal */}
                    <FollowersModal
                        isOpen={showFollowersModal}
                        onClose={() => setShowFollowersModal(false)}
                        userId={user?._id}
                        username={user?.username}
                    />

                    {shareModal.open && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShareModal({ open: false, postId: null, url: "", title: "Share Post", text: "" })}>
                            <div className="bg-base-100 rounded-2xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">{shareModal.title}</h3>
                                    <button onClick={() => setShareModal({ open: false, postId: null, url: "", title: "Share Post", text: "" })} className="p-2 hover:bg-base-200 rounded-full">
                                        <IoClose className="w-5 h-5 text-base-content/60" />
                                    </button>
                                </div>
                                {shareModal.text && (
                                    <div className="mb-4 p-3 bg-base-200 rounded-lg text-sm text-base-content/70">
                                        {shareModal.text}
                                    </div>
                                )}
                                <button onClick={() => {
                                    const shareText = shareModal.text ? `${shareModal.text} ${shareModal.url}` : shareModal.url;
                                    navigator.clipboard.writeText(shareText);
                                    toast.success("Link copied to clipboard");
                                }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 rounded-xl mb-2 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center">
                                        <Copy className="w-5 h-5 text-base-content/70" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-medium text-base-content">Copy Link</p>
                                        <p className="text-xs text-base-content/50">{shareModal.url}</p>
                                    </div>
                                    <Check className="w-4 h-4 text-base-content/50" />
                                </button>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModal.url)}&quote=${encodeURIComponent(shareModal.text || '')}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/10 rounded-xl transition-colors">
                                        <FaFacebook className="w-5 h-5 text-primary/90" />
                                        <span className="text-sm font-medium text-primary">Facebook</span>
                                    </button>
                                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareModal.url)}&text=${encodeURIComponent(shareModal.text || '')}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-base-200 hover:bg-base-200 rounded-xl transition-colors">
                                        <FaXTwitter className="w-5 h-5 text-base-content" />
                                        <span className="text-sm font-medium text-base-content/80">X</span>
                                    </button>
                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareModal.text ? `${shareModal.text} ${shareModal.url}` : shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-success/10 hover:bg-success/10 rounded-xl transition-colors">
                                        <FaWhatsapp className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">WhatsApp</span>
                                    </button>
                                    <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareModal.url)}&text=${encodeURIComponent(shareModal.text || '')}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-info/10 hover:bg-info/20 rounded-xl transition-colors">
                                        <FaTelegram className="w-5 h-5 text-info" />
                                        <span className="text-sm font-medium text-info">Telegram</span>
                                    </button>
                                    <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(shareModal.title)}&body=${encodeURIComponent(shareModal.text ? `${shareModal.text} ${shareModal.url}` : shareModal.url)}`, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-error/10 hover:bg-error/10 rounded-xl transition-colors col-span-2">
                                        <FaEnvelope className="w-5 h-5 text-error/90" />
                                        <span className="text-sm font-medium text-error">Email</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;