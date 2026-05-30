import Sidebar from "../../components/common/Sidebar.jsx";
import RightPanel from "../../components/common/RightPanel";
import {useUserStore} from "@/store/useUserStore";
import Posts from "../../components/common/Posts";
import {useChatStore} from "@/store/useChatStore";
import {useAuthStore} from "@/store/useAuthStore";
import {useState} from "react";
import FollowingPosts from "../../components/common/FollowingPosts";

function HomePage() {

    const [feedType, setFeedType] = useState("forYou");

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className="flex-col items-center bg-white blue-200 rounded-lg w-full h-screen">
                <div className="items-center justify-items-center">
                    <header className="items-center justify-content w-full">
                        <div className='flex w-full border-b border-gray-300'>
                            <div
                                className={
                                    "flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative"
                                }
                                onClick={() => setFeedType("forYou")}
                            >
                                <p className="text-black">For You</p>
                                {feedType === "forYou" && (
                                    <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                )}
                            </div>
                            <div
                                className='flex justify-center flex-1 p-3 hover:bg-gray-200 rounded-lg transition duration-300 cursor-pointer relative'
                                onClick={() => setFeedType("following")}
                            >
                                <p className="text-black">Following</p>
                                {feedType === "following" && (
                                    <div className='absolute bottom-0 w-10  h-1 rounded-full bg-primary'></div>
                                )}
                            </div>
                        </div>
                    </header>
                </div>
                { feedType === "forYou" && (
                    <Posts />
                ) }
                { feedType === "following" && (
                    <FollowingPosts />
                ) }
            </div>
            <RightPanel/>
        </div>


);
}
export default HomePage;
