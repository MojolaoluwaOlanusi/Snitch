import Sidebar  from "../../components/common/Sidebar";
import {useUserStore} from "@/store/useUserStore";
import {useCallback, useEffect, useState} from "react";
import {useAuthStore} from "@/store/useAuthStore";
import CreatePostRightPanel from "../../components/common/CreatePostRightPanel";
import {LoaderIcon} from "lucide-react";
import {useMediaStore} from "@/store/useMediaStore";
import axiosInstance from "@/lib/axios";

function CreatePostPage () {
    const [formData, setFormData] = useState({ text: "", isWarp: false, url: "", mediaType: "", mentions: [], hashtags: []});
    const { isCreatingPost, createPost, getAllUsers, users } = useUserStore();
    const { authUserId } = useAuthStore();

    const [uploadUrlData, setUploadUrlData] = useState({ contentType: "", folder: "" });
    const [file, setFile] = useState(null);

    async function uploadFile(data) {
        const token = localStorage.getItem('access-token');
        const res = await axiosInstance.post("/media/upload-url", data, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const publicUrl = res.data.publicUrl;
        const uploadUrl = res.data.uploadUrl;

        localStorage.setItem("uploadUrl", uploadUrl);

        setFormData({...formData, url: publicUrl});
    }

    const handleFileChange = async (event) => {
        setFile(event.target.files[0]);
        await uploadFile(uploadUrlData);
    };

    const isWarpTrue = useCallback((e) => {
        e.preventDefault();
        setFormData({ ...formData, isWarp: true })
    }, [formData]);

    const isWarpFalse = useCallback((e) => {
        e.preventDefault();
        setFormData({ ...formData, isWarp: false })
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const uploadUrl = localStorage.getItem("uploadUrl");
        await axiosInstance.put(uploadUrl, file);
        await createPost(formData);
        setFile(null);
        setFormData({ text: "", mediaType: "", isWarp: false, url: "", mentions: [], hashtags: [] });
    };

    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className=" sticky flex-col items-center bg-white rounded-lg w-full h-full p-4">
                <div className="space-y-5">
                    <div>

                        <div className="items-center flex flex-col p-2 space-x-8 bg-gray-100 rounded-lg">
                            <p className="text-2xl text-crimson-400">Start your day with a new post 😊</p>
                        </div>

                        <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>

                            <div className="rounded-lg ">
                                <p className="text-gray-700 text-bold text-1xl">Select a MediaType below</p>
                                <select className="select w-40 h-[30px] p-2 resize-none  bg-gray-200 focus:outline-none  border-blue-400 items-center"
                                        value={formData.mediaType}
                                        onChange={(e) => {
                                            setFormData({...formData, mediaType: e.target.value})
                                            if (e.target.value === "Audio") {
                                                setUploadUrlData({...uploadUrlData, contentType: ".mp3", folder: "Audio" });
                                            }
                                            if (e.target.value === "Video") {
                                                setUploadUrlData({...uploadUrlData, contentType: ".mp4", folder: "Videos" });
                                            }
                                            if (e.target.value === "Image") {
                                                setUploadUrlData({...uploadUrlData, contentType: ".png", folder: "Images" });
                                            }
                                            if (e.target.value === "None") {
                                                setUploadUrlData({...uploadUrlData, contentType: ".txt" });
                                            }
                                        }}
                                >
                                    <option>Select a MediaType</option>
                                    <option>None</option>
                                    <option>Audio</option>
                                    <option>Video</option>
                                    <option>Image</option>
                                </select>
                            </div>
                            <div className="rounded-lg ">
                                <p className="text-gray-700 text-bold text-1xl">Enter your post content</p>
                                <textarea
                                    name={authUserId}
                                    className='textarea w-full h-[270px] text-lg resize-none border-none bg-gray-200 p-2 focus:outline-none  border-gray-800'
                                    placeholder='What do you have to say today.'
                                    value={formData.text}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                />
                            </div>
                            <div>
                                <p className="text-gray-700 text-bold text-1xl">Select Media</p>
                                <div className="justify-center justify-items-center">
                                    <div className="rounded-lg w-full h-14 bg-gray-200 justify-center justify-items-center flex ">
                                        <input type='file' onChange={handleFileChange} className="py-3 px-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="items-center">
                                <div className="flex flex-row justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-gray-700 text-bold text-1xl">Is Warp</p>
                                        {formData.isWarp === true ? (
                                            <div className="relative inline-block w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 bg-green-500" onClick={isWarpFalse} >
                                                <div className="absolute w-4 h-4 bg-white rounded-full transform transition-transform duration-300 translate-x-4"/>
                                            </div>
                                        ) : (
                                            <div className="relative inline-block w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 bg-gray-300" onClick={isWarpTrue} >
                                                <div className="absolute w-4 h-4 bg-white rounded-full transform transition-transform duration-300 translate-x-0"/>
                                            </div>
                                        )}
                                    </div>

                                    <div className="">
                                        <textarea
                                            name={authUserId}
                                            className="h-full"
                                            placeholder='Do you have any Hashtags'
                                            value={formData.hashtags}
                                            onChange={(e) => setFormData({ ...formData, hashtags: [e.target.value] })}
                                        />
                                    </div>

                                    <div className="">
                                        <select className="select"
                                                value={formData.mentions}
                                                onChange={(e) => setFormData({ ...formData, mentions: [e.target.value] })}
                                        >
                                            <option disabled={true}>Mention someone</option>
                                            {users?.map((user) => (
                                                <option>{user?.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button className=" btn btn-primary w-full" type="submit" disabled={isCreatingPost}>
                                {isCreatingPost ? (
                                    <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                ) : (
                                    "Create Post"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <CreatePostRightPanel />
        </div>
    )
}

export default CreatePostPage
