import {useParams} from "react-router-dom";
import {useUserStore} from "../../store/useUserStore";
import {FaArrowLeft} from "react-icons/fa6";
import {MoreHorizontal} from "lucide-react";
import {useEffect} from "react";
import PostPageSkeleton from "../../components/skeletons/PostPageSkeleton";
import Sidebar from "../../components/common/Sidebar";

const PostPage = () => {

    const { postId } = useParams();

    const { getPostById, singlePost, isGettingSinglePost } = useUserStore();

    useEffect(() => {
        getPostById(postId);
        console.log(singlePost);

    }, [getPostById, postId]);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className='flex-col items-center bg-white blue-200 rounded-lg w-full h-screen'>
                {isGettingSinglePost && (
                    <PostPageSkeleton/>
                )}
                {!isGettingSinglePost && (
                        <div className='flex flex-col max-h-screen space-y-4'>
                        <div className="justify-between flex flex-col">
                        <FaArrowLeft className='w-4 h-4' />
                        <p>Post</p>
                        <MoreHorizontal className="h-5 w-5" />
                        </div>
                        {singlePost?.mediaType === "Image" && (
                            <div className="p-4">
                                <img
                                    src={singlePost?.url}
                                    className="h-80 w-full object-fill rounded-lg"
                                    alt="Post Media"/>
                            </div>
                        )}
                        {singlePost?.mediaType === "Video" && (
                            <div className="p-4">
                                <video
                                    src={singlePost?.url}
                                    className="h-80 w-full object-contain rounded-lg"
                                    controls={true}/>
                            </div>
                        )}
                        {singlePost?.mediaType === "Audio" && (
                            <div className="p-4">
                                <audio
                                    src={singlePost?.url}
                                    className="h-80 w-full object-contain rounded-lg"
                                    controls={true}/>
                            </div>
                        )}
                        <div className="rounded-l-lg p-4">
                            <text className="text-black font-bold font-sans rounded-lg">{singlePost?.text}</text>
                        </div>
                    </div>
                )
                }
            </div>
        </div>
    )
}
export default PostPage;
