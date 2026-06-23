import {BellIcon, HomeIcon, MessageCircleIcon, PlusIcon, SearchIcon, UserIcon, ZapIcon} from "lucide-react";
import { Link } from "react-router-dom";
import {GiFlowerTwirl} from "react-icons/gi";
import {SnitchLogoSmall} from "../svgs/snitch";
import {useAuthStore} from "../../store/useAuthStore";
import {useEffect, useState} from "react";
import {useChatStore} from "../../store/useChatStore";
import {BiLogOut} from "react-icons/bi";
import axiosInstance from "../../lib/axios";

const Sidebar = () => {
    const { logout, authUser, getProfile } = useAuthStore();
    const [isChatRestricted, setIsChatRestricted] = useState(false);

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

    return (
        <div className="h-screen w-full max-w-[225px] max-w-225px flex flex-col gap-2 border-r border-gray-200">
            <div className="rounded-lg bg-white p-4 space-y-2sticky top-0 left-0 h-screen flex flex-col  w-20 md:w-full">
                <div className=" flex flex-row space-x-2 items-center place-items-baseline py-4">
                    <SnitchLogoSmall/>
                    <h3 className="font-bold text-3xl text-blue-600">Snitch</h3>
                </div>
                <div className="space-y-2">
                    <Link to={"/"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500" title="home">
                        <HomeIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Home</span>
                    </Link>

                    {/* CHAT BUTTON WITH RESTRICTION */}
                    <Link
                        to={isChatRestricted ? "#" : "/chat"}
                        className={`btn w-full justify-start text-white ${
                            isChatRestricted
                                ? 'bg-gray-300 cursor-not-allowed opacity-50 pointer-events-none'
                                : 'bg-blue-500 hover:bg-blue-600 btn-primary'
                        }`}
                        onClick={(e) => {
                            if (isChatRestricted) {
                                e.preventDefault();
                                toast?.error?.('Chat access restricted due to reports');
                            }
                        }}
                        title={isChatRestricted ? 'Chat access restricted' : 'Chat'}
                    >
                        <MessageCircleIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">
                            {isChatRestricted ? 'Chat (Restricted)' : 'Chat'}
                        </span>
                    </Link>

                    <Link to={`/profile/${authUser?.username}`} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500" title="profile">
                        <UserIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Profile</span>
                    </Link>
                    <Link to={`/create-post/${authUser?.username}`}
                          className="btn btn-primary w-full justify-start text-white hover: bg-blue-500"  title="create post"
                    >
                        <PlusIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Create Post</span>
                    </Link>
                    <Link to={"/warp"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500" title="warp">
                        <ZapIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Warp</span>
                    </Link>
                    <Link to={"/search"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500" title="search">
                        <SearchIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Search</span>
                    </Link>
                    <Link to={`/notifications/${authUser?.username}`} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500" title="notification">
                        <BellIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Notification</span>
                    </Link>
                    <Link to={"/ai"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500" title="ai">
                        <GiFlowerTwirl className="mr-2 size-5"/>
                        <span className="hidden md:inline">AI</span>
                    </Link>
                </div>
                <Link
                    to={`/profile/${authUser?.username}`}
                    className='mt-auto mb-10 flex gap-2 items-start transition-all duration-300 hover:bg-blue-300 py-2 px-4 rounded-full'
                >
                    <div className='avatar hidden md:inline-flex'>
                        <div className='w-8 rounded-full'>
                            <img src={authUser?.avatarUrl || "/avatar.png"} alt={authUser?.username}/>
                        </div>
                    </div>
                    <div className='flex justify-between flex-1 space-x-1'>
                        <div className='hidden md:block'>
                            <p className='text-slate-500 font-bold text-sm w-20 truncate'>{authUser?.displayName}</p>
                            <p className='text-slate-500 text-sm w-20 truncate'>@{authUser?.username}</p>
                        </div>
                        <BiLogOut
                            className='w-5 h-5 cursor-pointer'
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                            }}
                            title="logout"
                        />
                    </div>
                </Link>
            </div>
        </div>
    );
}
export default Sidebar;