import Sidebar  from "../../components/common/Sidebar";
import {useUserStore} from "../../store/useUserStore";
import {useCallback, useEffect, useState} from "react";
import {useAuthStore} from "../../store/useAuthStore";
import CreatePostRightPanel from "../../components/common/CreatePostRightPanel";
import {LoaderIcon} from "lucide-react";
import {useMediaStore} from "../../store/useMediaStore";
import axiosInstance from "../../lib/axios";
import MediaSelector from '../../components/common/MediaSelector';
import HashtagAutocomplete from '../../components/common/HashtagAutocomplete';
import MentionAutocomplete from '../../components/common/MentionAutocomplete';

function CreatePostPage () {
    const [formData, setFormData] = useState({ text: "", isWarp: false, url: "", mediaType: "", mentions: [], hashtags: []});
    const { isCreatingPost, createPost, getAllUsers } = useUserStore();
    const { authUserId } = useAuthStore();

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

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
            // perform upload only when creating (upload to presigned then call createPost)
            if (file) {
                setIsUploadingMedia(true);
                const contentType = file.type;
                const folder = formData.mediaType === 'Audio' ? 'Audio' : formData.mediaType === 'Video' ? 'Videos' : 'Images';
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.post('/media/upload-url', { contentType, folder }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const publicUrl = res.data.publicUrl;
                const uploadUrl = res.data.uploadUrl;
                // upload file to presigned url
                await axiosInstance.put(uploadUrl, file, { headers: { 'Content-Type': contentType } });
                setIsUploadingMedia(false);
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
            setIsUploadingMedia(false);
        }
    };

    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className="flex-1 flex flex-col items-center bg-gradient-to-br from-blue-50 to-white rounded-lg w-full h-full p-6 overflow-auto">
                <div className="w-full max-w-3xl space-y-6">
                    <div className="items-center flex flex-col p-6 bg-white rounded-xl border-2 border-blue-200 shadow-md">
                        <p className="text-2xl text-blue-600 font-semibold">Share your thoughts with the world ✨</p>
                    </div>

                    <form className="flex flex-col gap-5 w-full" onSubmit={handleSubmit}>

                        <div className="rounded-xl bg-white border-2 border-gray-300 p-5 shadow-sm">
                            <p className="text-gray-700 font-semibold mb-3 text-lg">What's on your mind?</p>
                            <textarea
                                name={authUserId}
                                className='textarea w-full h-44 text-lg resize-none border-2 border-gray-300 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-200 rounded-lg transition-all duration-200'
                                placeholder='Share something amazing today...'
                                value={formData.text}
                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            />
                        </div>
                        <div className="rounded-xl bg-white border-2 border-gray-300 p-5 shadow-sm">
                            <p className="text-gray-700 font-semibold mb-3 text-lg">Add Media</p>
                            <MediaSelector
                                file={file}
                                previewUrl={previewUrl}
                                onSelect={handleFileSelect}
                                onRemove={handleRemoveFile}
                                buttonLabel={'Select Media'}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 bg-white border-2 border-gray-300 rounded-xl p-5 shadow-sm">
                            <div className="flex flex-col">
                                <p className="text-gray-700 font-semibold mb-2">Warp</p>
                                {formData.isWarp === true ? (
                                    <div className="relative inline-block w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 bg-green-500" onClick={isWarpFalse} >
                                        <div className="absolute w-5 h-5 bg-white rounded-full transform transition-transform duration-300 translate-x-5 shadow-md"/>
                                    </div>
                                ) : (
                                    <div className="relative inline-block w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 bg-gray-300" onClick={isWarpTrue} >
                                        <div className="absolute w-5 h-5 bg-white rounded-full transform transition-transform duration-300 translate-x-0 shadow-md"/>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <label className="text-gray-700 font-semibold mb-2 block">Hashtags</label>
                                <HashtagAutocomplete
                                    value={formData.hashtags}
                                    onChange={(value) => setFormData({ ...formData, hashtags: value })}
                                    placeholder="Add hashtags..."
                                />
                            </div>

                            <div className="w-56">
                                <label className="text-gray-700 font-semibold mb-2 block">Mention Someone</label>
                                <MentionAutocomplete
                                    value={formData.mentions}
                                    onChange={(value) => setFormData({ ...formData, mentions: value })}
                                    placeholder="Mention someone..."
                                />
                            </div>
                        </div>
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg border-2 border-blue-600" type="submit" disabled={isCreatingPost || isUploadingMedia}>
                            {isCreatingPost || isUploadingMedia ? (
                                <LoaderIcon className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                "Create Post"
                            )}
                        </button>
                    </form>
                </div>
            </div>
            <CreatePostRightPanel />
        </div>
    )
}

export default CreatePostPage
