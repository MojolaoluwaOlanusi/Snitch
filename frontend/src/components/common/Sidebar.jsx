import {BellIcon, HomeIcon, MessageCircleIcon, PlusIcon, SearchIcon, UserIcon, ZapIcon} from "lucide-react";
import { Link } from "react-router-dom";
import {GiFlowerTwirl} from "react-icons/gi";
import {SnitchLogoSmall} from "../svgs/snitch";
import {useAuthStore} from "../../store/useAuthStore";
import {useEffect} from "react";
import {useChatStore} from "../../store/useChatStore";
import {BiLogOut} from "react-icons/bi";

const Sidebar = () => {
    const { logout, authUser,getProfile } = useAuthStore();

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    return (
        <div className="h-screen w-full max-w-[200px] max-w-200px flex flex-col gap-2 border-r border-gray-200">
            <div className="rounded-lg bg-white p-4 space-y-2sticky top-0 left-0 h-screen flex flex-col  w-20 md:w-full">
                <div className=" flex flex-row space-x-2 items-center place-items-baseline py-4">
                    <SnitchLogoSmall/>
                    <h3 className="font-bold text-3xl text-blue-600">Snitch</h3>
                </div>
                <div className="space-y-2">
                    <Link to={"/"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <HomeIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Home</span>
                    </Link>
                    <Link to={"/chat"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <MessageCircleIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Chat</span>
                    </Link>
                    <Link to={`/profile/${authUser?.username}`} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <UserIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Profile</span>
                    </Link>
                    <Link to={`/create-post/${authUser?.username}`}
                          className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <PlusIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Create Post</span>
                    </Link>
                    <Link to={"/warp"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <ZapIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Warp</span>
                    </Link>
                    <Link to={"/search"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <SearchIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Search</span>
                    </Link>
                    <Link to={`/notifications/${authUser?.username}`} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
                        <BellIcon className="mr-2 size-5"/>
                        <span className="hidden md:inline">Notification</span>
                    </Link>
                    <Link to={"/ai"} className="btn btn-primary w-full justify-start text-white hover: bg-blue-500">
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
                        />
                    </div>
                </Link>
            </div>
        </div>
    );
}
export default Sidebar;