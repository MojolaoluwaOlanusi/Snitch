import Sidebar  from "../../components/common/Sidebar";
import {useUserStore} from "../../store/useUserStore";
import {useCallback, useEffect, useState} from "react";
import {useAuthStore} from "../../store/useAuthStore";
import CreatePostRightPanel from "../../components/common/CreatePostRightPanel";
import {LoaderIcon} from "lucide-react";
import {useMediaStore} from "../../store/useMediaStore";
import axiosInstance from "../../lib/axios";
import MediaSelector from '../../components/common/MediaSelector';

function CreatePostPage () {
    const [formData, setFormData] = useState({ text: "", isWarp: false, url: "", mediaType: "", mentions: [], hashtags: []});
    const { isCreatingPost, createPost, getAllUsers, users } = useUserStore();
    const { authUserId } = useAuthStore();

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const handleFileSelect = (f) => {
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
        const type = f.type ? f.type.split('/')[0] : null;
        const mediaType = type === 'image' ? 'Image' : type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : '';
        setFormData((prev) => ({ ...prev, mediaType }));
    };

    const handleRemoveFile = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl("");
        setFormData((prev) => ({ ...prev, mediaType: '', url: '' }));
    };

    const isWarpTrue = useCallback((e) => {
        e.preventDefault();
        setFormData((prev) => ({ ...prev, isWarp: true }))
    }, []);

    const isWarpFalse = useCallback((e) => {
        e.preventDefault();
        setFormData((prev) => ({ ...prev, isWarp: false }))
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // if there's a file, request upload url then put file
            if (file) {
                const contentType = file.type;
                // choose folder based on mediaType (fallback to Images)
                const folder = formData.mediaType === 'Audio' ? 'Audio' : formData.mediaType === 'Video' ? 'Videos' : 'Images';
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.post('/media/upload-url', { contentType, folder }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const publicUrl = res.data.publicUrl;
                const uploadUrl = res.data.uploadUrl;
                // upload file to presigned url
                await axiosInstance.put(uploadUrl, file, { headers: { 'Content-Type': contentType } });
                // set the url in payload
                const payload = { ...formData, url: publicUrl };
                await createPost(payload);
            } else {
                // no file
                await createPost(formData);
            }

            // reset
            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            setFile(null);
            setPreviewUrl("");
            setFormData({ text: "", mediaType: "", isWarp: false, url: "", mentions: [], hashtags: [] });
        } catch (err) {
            console.error('Create post failed', err);
        }
    };

    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className=" sticky flex-col items-center bg-base-100 rounded-lg w-full h-full p-4 overflow-auto">
                <div className="space-y-5">
                    <div>

                        <div className="items-center flex flex-col p-2 space-x-8 bg-gray-100 rounded-lg">
                            <p className="text-2xl text-crimson-400">Start your day with a new post 😊</p>
                        </div>

                        <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>

                            <div className="rounded-lg ">
                                <div className="rounded-lg ">
                                    <p className="text-gray-700 text-bold text-1xl">Enter your post content</p>
                                    <textarea
                                        name={authUserId}
                                        className='textarea w-full h-[270px] text-lg resize-none border-none bg-base-100 p-2 focus:outline-none  border-gray-800'
                                        placeholder='What do you have to say today.'
                                        value={formData.text}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-700 text-bold text-1xl">Select Media</p>
                                <MediaSelector
                                    file={file}
                                    previewUrl={previewUrl}
                                    onSelect={handleFileSelect}
                                    onRemove={handleRemoveFile}
                                    buttonLabel={'Select Media'}
                                />
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
                                                <option key={user?._id}>{user?.username}</option>
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
