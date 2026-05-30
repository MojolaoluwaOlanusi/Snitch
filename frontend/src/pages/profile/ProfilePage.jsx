import {useEffect, useRef, useState} from "react";
import { Link, useParams } from "react-router-dom";

import UserPosts from "../../components/common/UserPosts";
import LikedPosts from "../../components/common/LikedPosts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "../../components/common/EditProfileModal";
import { Badge } from "@/components/common/badge";
import Sidebar from "../../components/common/Sidebar";
import { VerifiedSvg } from "@/components/svgs/verified";

import {AlertTriangle, Briefcase, Building, CheckCircle2, User, Shield, MapPin, EyeOff, EyeIcon} from "lucide-react";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import {GrUserAdmin} from "react-icons/gr";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

import { formatMemberSinceDate } from "@/utils/date";
import {useAuthStore} from "@/store/useAuthStore";
import {useUserStore} from "@/store/useUserStore";
import {useMediaStore} from "@/store/useMediaStore";
import ThemeSelector from "../../components/common/ThemeSelector";
import axiosInstance from "@/lib/axios";


const ProfilePage = () => {

    const { getUserProfile, isGettingUserProfile, user, isUpdatingProfile, updateProfile, authUser } = useAuthStore();
    const { userPosts, followUser, isFollowingUser, goIncognito, isIncognito } = useUserStore();
    const { uploadMedia } = useMediaStore();
    const { username } = useParams();

    localStorage.setItem('username', username);

    const [coverImgUploadUrlData, setCoverImgUploadUrlData] = useState({ contentType: ".png", folder: "CoverImages" });
    const [avatarImgUploadUrlData, setAvatarImgUploadUrlData] = useState({contentType: ".png", folder: "Avatars"});

    const [formData, setFormData] = useState({id: ""});

    const coverImgRef = useRef(null);
    const avatarImgRef = useRef(null);

    useEffect( () => {
        getUserProfile(username);
    }, [getUserProfile]);

    async function uploadCoverImg(data) {
        const token = localStorage.getItem('access-token');
        const res = await axiosInstance.post("/media/upload-url", data, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const coverImgUrl = res.data.publicUrl;
        const uploadUrl = res.data.uploadUrl;

        localStorage.setItem("uploadUrl", uploadUrl);

        await updateProfile({ coverImg: coverImgUrl });
    }

    async function uploadAvatarImg(data) {
        const token = localStorage.getItem('access-token');
        const res = await axiosInstance.post("/media/upload-url", data, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const avatarUrl = res.data.publicUrl;
        const uploadUrl = res.data.uploadUrl;

        localStorage.setItem("uploadUrl", uploadUrl);

        await updateProfile({ avatarUrl: avatarUrl });
    }

    const handleImgChange = async (e, state) => {
        const file = e.target.files[0];
        if (file) {
            if (state === "coverImg") {
                await uploadCoverImg(coverImgUploadUrlData);
                await uploadMedia(file);
            }
            if (state === "avatarImg") {
                await uploadAvatarImg(avatarImgUploadUrlData)
                await uploadMedia(file);
            }
        }
    };

    const isMyProfile = authUser?._id === user?._id;
    const memberSinceDate = formatMemberSinceDate(user?.createdAt);
    const amIFollowing = authUser?.following.includes(user?._id);

    const [feedType, setFeedType] = useState("posts");

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className='flex-col items-center bg-white blue-200 rounded-lg w-full h-screen'>
                {/* HEADER */}
                {(isGettingUserProfile || isUpdatingProfile) && <ProfileHeaderSkeleton />}
                {!isGettingUserProfile && !isUpdatingProfile && !user && <p className='text-center text-lg mt-4'>User not found ❌</p>}
                {!isGettingUserProfile && !isUpdatingProfile && user?.accountVisibility === "Private" && !isMyProfile && <p className='text-center text-lg mt-4'>Sorry this is a private account 🔏</p>}
                {!isGettingUserProfile && !isUpdatingProfile && user?.accountVisibility === "Friends" && !isMyProfile && <p className='text-center text-lg mt-4'>Sorry this is a friends only account 🫂</p>}
                <div className='flex flex-col max-h-screen'>
                    {!isGettingUserProfile && !isUpdatingProfile && user && (isMyProfile || (!isMyProfile && user?.accountVisibility === "Public") || (!isMyProfile && user?.accountVisibility === "Friends" && amIFollowing)) && (
                        <div className="h-screen overflow-y-auto">
                            <div className='flex gap-10 px-4 py-2 items-center'>
                                <Link to='/'>
                                    <FaArrowLeft className='w-4 h-4' />
                                </Link>
                                <div className='flex flex-col'>
                                    <div className="flex flex-row justify-between w-[1000px]">
                                        <div className="flex flex-row gap-4">
                                            <p className='font-bold text-lg text-gray-800'>{user?.displayName}</p>
                                            {user?.isAdmin === true && (
                                                <Badge variant="outline" className={'flex items-center gap-1 bg-gold text-stone-400 border-yellow-200'}>
                                                    <GrUserAdmin className="w-4 h-4" />
                                                    <span className="capitalize">admin</span>
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-x-2 flex flex-row">
                                            <ThemeSelector />
                                            <div>
                                                {isIncognito && (
                                                    <EyeIcon className="w-5 h-5 hover:text-red-600" onClick={async (e) => {
                                                        e.preventDefault();
                                                        await goIncognito();
                                                    }} />
                                                )}
                                                {!isIncognito && (
                                                    <EyeOff className="w-5 h-5 hover:text-red-600" onClick={async (e) => {
                                                        e.preventDefault();
                                                        await goIncognito();
                                                    }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className='text-sm text-slate-500'>{userPosts?.length} posts</span>
                                </div>
                            </div>
                            {/* COVER IMG */}
                            <div className='relative group/cover'>
                                <img
                                    src={ user?.coverImg || "/cover.png"}
                                    className='h-52 w-full object-cover'
                                    alt='cover image'
                                />
                                {isMyProfile && (
                                    <div
                                        className='absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200'
                                        // onClick={() => document.getElementById("edit_coverImg_modal").showModal()}
                                        onClick={() => coverImgRef.current.click()}
                                    >
                                        <MdEdit className='w-5 h-5 text-white' />
                                        {/*<dialog id='edit_coverImg_modal' className='modal'>*/}
                                        {/*    <div className='modal-box border rounded-md border-gray-700 shadow-md'>*/}
                                        {/*        <h3 className='font-bold text-lg my-3'>Update CoverImg</h3>*/}
                                        {/*        <form*/}
                                        {/*            className='flex flex-col gap-4'*/}
                                        {/*            onSubmit={async (e) => {*/}
                                        {/*                e.preventDefault();*/}
                                        {/*                await updateProfile(updateCoverImgData);*/}
                                        {/*            }}*/}
                                        {/*        >*/}
                                        {/*            <div className='flex flex-wrap gap-2'>*/}
                                        {/*                <input*/}
                                        {/*                    type='text'*/}
                                        {/*                    placeholder='CoverImg Url'*/}
                                        {/*                    className='flex-1 input border border-gray-700 rounded p-2 input-md'*/}
                                        {/*                    value={updateCoverImgData.coverImg}*/}
                                        {/*                    name='CoverImg Url'*/}
                                        {/*                    onChange={handleInputChange}*/}
                                        {/*                />*/}
                                        {/*            </div>*/}
                                        {/*            <button className='btn btn-primary rounded-full btn-sm text-white'>*/}
                                        {/*                {isUpdatingProfile ? "Updating..." : "Update"}*/}
                                        {/*            </button>*/}
                                        {/*        </form>*/}
                                        {/*    </div>*/}
                                        {/*    <form method='dialog' className='modal-backdrop'>*/}
                                        {/*        <button className='outline-none'>close</button>*/}
                                        {/*    </form>*/}
                                        {/*</dialog>*/}
                                    </div>
                                )}
                                <input
                                    type='file'
                                    hidden
                                    accept='image/*'
                                    ref={coverImgRef}
                                    onChange={(e) => handleImgChange(e, "coverImg")}
                                />
                                <input
                                    type='file'
                                    hidden
                                    accept='image/*'
                                    ref={avatarImgRef}
                                    onChange={(e) => handleImgChange(e, "avatarImg")}
                                />
                                {/* USER AVATAR */}
                                <div className='avatar absolute -bottom-10 left-1'>
                                    <div className='w-24 rounded-full ring-2 ring-white relative group/avatar'>
                                        <img src={ user?.avatarUrl || "/avatar-placeholder.png"} alt={user?.username} />
                                        <div className='absolute top-5 right-3 p-1 bg-gray-800 rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer'>
                                            {isMyProfile && (
                                                <div
                                                    // onClick={() => document.getElementById("edit_avatarUrl_modal").showModal()}
                                                    onClick={() => avatarImgRef.current.click()}>
                                                    <MdEdit
                                                        className='w-4 h-4 text-white'
                                                    />
                                                    {/*<dialog id='edit_avatarUrl_modal' className='modal'>*/}
                                                    {/*    <div className='modal-box border rounded-md border-gray-700 shadow-md'>*/}
                                                    {/*        <h3 className='font-bold text-lg my-3'>Update Avatar</h3>*/}
                                                    {/*        <form*/}
                                                    {/*            className='flex flex-col gap-4'*/}
                                                    {/*            onSubmit={async (e) => {*/}
                                                    {/*                e.preventDefault();*/}
                                                    {/*                await updateProfile(updateAvatarUrlData);*/}
                                                    {/*            }}*/}
                                                    {/*        >*/}
                                                    {/*            <div className='flex flex-wrap gap-2'>*/}
                                                    {/*                <input*/}
                                                    {/*                    type='text'*/}
                                                    {/*                    placeholder='Avatar Url'*/}
                                                    {/*                    className='flex-1 input border border-gray-700 rounded p-2 input-md'*/}
                                                    {/*                    value={updateAvatarUrlData.avatarUrl}*/}
                                                    {/*                    name='Avatar Url'*/}
                                                    {/*                    onChange={handleAvatarInputChange}*/}
                                                    {/*                />*/}
                                                    {/*            </div>*/}
                                                    {/*            <button className='btn btn-primary rounded-full btn-sm text-white'>*/}
                                                    {/*                {isUpdatingProfile ? "Updating..." : "Update"}*/}
                                                    {/*            </button>*/}
                                                    {/*        </form>*/}
                                                    {/*    </div>*/}
                                                    {/*    <form method='dialog' className='modal-backdrop'>*/}
                                                    {/*        <button className='outline-none'>close</button>*/}
                                                    {/*    </form>*/}
                                                    {/*</dialog>*/}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='flex justify-end px-4 mt-5'>
                                {isMyProfile && <EditProfileModal authUser={authUser} />}
                                {!isMyProfile && (
                                    <button
                                        className='btn btn-outline bg-white hover:bg-blue-500 rounded-full btn-sm'
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setFormData({...formData, id: `${user?._id}`});
                                            await followUser(formData);
                                        }}
                                    >
                                        {isFollowingUser && "Loading..."}
                                        {!isFollowingUser && amIFollowing && "Unfollow"}
                                        {!isFollowingUser && !amIFollowing && "Follow"}
                                    </button>
                                )}
                            </div>

                            <div className='flex flex-col gap-4 mt-14 px-4'>
                                <div className='flex flex-col'>
                                    <div className="flex flex-row space-x-2">
                                        <span className='font-bold text-lg'>{user?.displayName}</span>
                                        <span className="font-bold text-lg">{ user?.verified && (<VerifiedSvg/>) }</span>
                                    </div>
                                    <span className='text-sm text-slate-500'>@{user?.username}</span>
                                    <span className='text-sm my-1'>{user?.bio}</span>
                                </div>

                                <div className='flex gap-2 flex-wrap'>
                                    {user?.link && (
                                        <div className='flex gap-1 items-center '>
                                            <>
                                                <FaLink className='w-3 h-3 text-slate-500' />
                                                <a
                                                    href= {user?.link}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    className='text-sm text-blue-500 hover:underline'
                                                >
                                                    {user?.link}
                                                </a>
                                            </>
                                        </div>
                                    )}
                                    <div>
                                        {user?.accountType === "Work" && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-200'}>
                                                <Briefcase className="w-4 h-4" />
                                                <span className="capitalize">{user?.accountType}</span>
                                            </Badge>
                                        )}
                                        {user?.accountType === "Personal" && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-200'}>
                                                <User className="w-4 h-4" />
                                                <span className="capitalize">{user?.accountType}</span>
                                            </Badge>
                                        )}
                                        {user?.accountType === "Business" && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-purple-100 text-purple-700 border-purple-200'}>
                                                <Building className="w-4 h-4" />
                                                <span className="capitalize">{user?.accountType}</span>
                                            </Badge>
                                        )}
                                    </div>
                                    <div>
                                        {user?.warningsCount === 0 && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-green-100 text-green-700 border-green-500'}>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="capitalize">Account in Good Standing</span>
                                            </Badge>
                                        )}
                                        {user?.warningsCount === 1 && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500'}>
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="capitalize">Account Warning</span>
                                            </Badge>
                                        )}
                                        {user?.warningsCount === 2 && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500'}>
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="capitalize">Account Flagged for Ban</span>
                                            </Badge>
                                        )}
                                        {user?.warningsCount === 3 && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-red-100 text-red-700 border-red-500'}>
                                                <Shield className="w-4 h-4" />
                                                <span className="capitalize">Account Suspended</span>
                                            </Badge>
                                        )}
                                    </div>
                                    <div>
                                        {user?.verified === true && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-green-100 text-green-700 border-green-500'}>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="capitalize">verified</span>
                                            </Badge>
                                        )}
                                        {!isMyProfile && user?.verified === false && (
                                            <Badge variant="outline" className={'flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500'}>
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="capitalize">not verified</span>
                                            </Badge>
                                        )}
                                        {isMyProfile && user?.verified === false && (
                                            <Link to={`/verify-account/${user?.username}`}>
                                                <Badge variant="outline" className={'flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-500'}>
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span className="capitalize">Verify your account</span>
                                                </Badge>
                                            </Link>
                                        )}
                                    </div>
                                    <div className='flex gap-2 items-center'>
                                        <IoCalendarOutline className='w-4 h-4 text-slate-500' />
                                        <span className='text-sm text-slate-500'>{memberSinceDate}</span>
                                    </div>
                                    { user?.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <span className='text-sm text-slate-500 w-40 truncate hover:w-full'>{user?.location}</span>
                                        </div>
                                    ) }
                                </div>
                                <div className='flex gap-2'>
                                    <div className='flex gap-1 items-center'>
                                        <span className='font-bold text-xs'>{user?.following.length}</span>
                                        <span className='text-slate-500 text-xs'>Following</span>
                                    </div>
                                    <div className='flex gap-1 items-center'>
                                        <span className='font-bold text-xs'>{user?.followers.length}</span>
                                        <span className='text-slate-500 text-xs'>Followers</span>
                                    </div>
                                </div>
                            </div>
                            <div className='flex w-full border-b border-gray-700 mt-4'>
                                <div
                                    className='flex justify-center flex-1 p-3 rounded-lg hover:bg-gray-200 transition duration-300 relative cursor-pointer'
                                    onClick={() => setFeedType("posts")}
                                >
                                    Posts
                                    {feedType === "posts" && (
                                        <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary' />
                                    )}
                                </div>
                                <div
                                    className='flex justify-center flex-1 p-3 text-slate-500 rounded-lg hover:bg-gray-200 transition duration-300 relative cursor-pointer'
                                    onClick={() => setFeedType("likes")}
                                >
                                    Likes
                                    {feedType === "likes" && (
                                        <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary' />
                                    )}
                                </div>
                            </div>
                            {feedType === "posts" && (
                                <UserPosts />
                            )}
                            {feedType === "likes" && (
                                <LikedPosts />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
