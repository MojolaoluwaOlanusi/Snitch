import Sidebar from "../../components/common/Sidebar";
import { useUserStore } from "../../store/useUserStore";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import CreatePostRightPanel from "../../components/common/CreatePostRightPanel";
import { LoaderIcon } from "lucide-react";
import { useMediaStore } from "../../store/useMediaStore";
import axiosInstance from "../../lib/axios";
import MediaSelector from "../../components/common/MediaSelector";
import { MentionsInput, Mention } from "react-mentions";
import "./CreatePostPage.css";

function CreatePostPage() {
    const [formData, setFormData] = useState({
        text: "",
        isWarp: false,
        url: "",
        mediaType: "",
        mentions: [],
        hashtags: [],
    });
    const { isCreatingPost, createPost, getAllUsers } = useUserStore();
    const { authUserId } = useAuthStore();

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    const handleFileSelect = (f) => {
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
        const type = f.type ? f.type.split("/")[0] : null;
        const mediaType = type === "image" ? "Image" : type === "video" ? "Video" : type === "audio" ? "Audio" : "";
        setFormData((prev) => ({ ...prev, mediaType }));
    };

    const handleRemoveFile = () => {
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl("");
        setFormData((prev) => ({ ...prev, mediaType: "", url: "" }));
    };

    const isWarpTrue = useCallback((e) => {
        e.preventDefault();
        setFormData((prev) => ({ ...prev, isWarp: true }));
    }, []);

    const isWarpFalse = useCallback((e) => {
        e.preventDefault();
        setFormData((prev) => ({ ...prev, isWarp: false }));
    }, []);

    const cleanMarkup = (text) => {
        let cleaned = text.replace(/@\[([^\]]+)\]\(user:\/\/[^)]+\)/g, "@$1");
        cleaned = cleaned.replace(/#\[([^\]]+)\]\(hashtag:\/\/[^)]+\)/g, "#$1");
        return cleaned;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, text: cleanMarkup(formData.text) };
            if (file) {
                setIsUploadingMedia(true);
                const contentType = file.type;
                const folder =
                    formData.mediaType === "Audio" ? "Audio" : formData.mediaType === "Video" ? "Videos" : "Images";
                const token = localStorage.getItem("access-token");
                const res = await axiosInstance.post(
                    "/media/upload-url",
                    { contentType, folder },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const publicUrl = res.data.publicUrl;
                const uploadUrl = res.data.uploadUrl;
                await axiosInstance.put(uploadUrl, file, { headers: { "Content-Type": contentType } });
                setIsUploadingMedia(false);
                payload.url = publicUrl;
                await createPost(payload);
            } else {
                await createPost(payload);
            }
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
            setFile(null);
            setPreviewUrl("");
            setFormData({ text: "", mediaType: "", isWarp: false, url: "", mentions: [], hashtags: [] });
        } catch (err) {
            console.error("Create post failed", err);
            setIsUploadingMedia(false);
        }
    };

    const updateFormData = (newText) => {
        const mentionRegex = /@\[([^\]]+)\]\(user:\/\/[^)]+\)/g;
        const mentionMatches = newText.matchAll(mentionRegex);
        const mentions = Array.from(mentionMatches, (m) => m[1]);

        const hashtagRegex = /#\[([^\]]+)\]\(hashtag:\/\/[^)]+\)/g;
        const hashtagMatches = newText.matchAll(hashtagRegex);
        const hashtags = Array.from(hashtagMatches, (m) => m[1]);

        setFormData((prev) => ({ ...prev, text: newText, mentions, hashtags }));
    };

    const fetchUsers = async (query, callback) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("access-token");
            const response = await axiosInstance.get(`/search/user/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const users = response.data.users.map((u) => ({
                id: u.username,
                display: '@' + (u.displayName || u.username),
                avatar: u.avatarUrl,
            }));
            callback(users);
        } catch (error) {
            callback([]);
        }
    };

    const fetchHashtags = async (query, callback) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("access-token");
            const response = await axiosInstance.get(`/search/hashtag/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const hashtags = (response.data.suggestedHashtags || []).map((h) => ({
                id: h._id,
                display: '#' + h._id,
            }));
            if (!hashtags.find((h) => h.id === query)) {
                hashtags.push({ id: query, display: '#' + query });
            }
            callback(hashtags);
        } catch (error) {
            callback([]);
        }
    };

    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col items-center bg-gradient-to-br from-blue-50 to-white rounded-lg w-full h-full overflow-y-auto">
                {/* Hamburger spacer */}
                <div className="h-14 lg:hidden" />
                <div className="w-full max-w-3xl space-y-6 p-4 sm:p-6">
                    <div className="items-center flex flex-col p-6 bg-white rounded-xl border-2 border-blue-200 shadow-md">
                        <p className="text-lg sm:text-2xl text-blue-600 font-semibold text-center">
                            Share your thoughts with the world ✨
                        </p>
                    </div>

                    <form className="flex flex-col gap-5 w-full" onSubmit={handleSubmit}>
                        <div className="rounded-xl bg-white border-2 border-gray-300 p-5 shadow-sm">
                            <p className="text-gray-700 font-semibold mb-3 text-lg">What's on your mind?</p>
                            <div className="mentions-input-wrapper border-2 border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-200 transition-all duration-200 min-h-[11rem]">
                                <MentionsInput
                                    value={formData.text}
                                    onChange={(e) => updateFormData(e.target.value)}
                                    placeholder="Share something amazing today... Use @ to mention, # for hashtags"
                                    className="mentions-input"
                                >
                                    <Mention
                                        trigger="@"
                                        data={fetchUsers}
                                        markup="@[@__display__](user://__id__)"
                                        renderSuggestion={(suggestion) => (
                                            <div className="flex items-center gap-2 p-2">
                                                <img src={suggestion.avatar || "/avatar-placeholder.png"} className="w-8 h-8 rounded-full" alt="" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{suggestion.display}</span>
                                                    <span className="text-xs text-gray-500">@{suggestion.id}</span>
                                                </div>
                                            </div>
                                        )}
                                        className="mention-highlight"
                                    />
                                    <Mention
                                        trigger="#"
                                        data={fetchHashtags}
                                        markup="#[__display__](hashtag://__id__)"
                                        renderSuggestion={(suggestion) => (
                                            <div className="p-2">{suggestion.display}</div>
                                        )}
                                        className="hashtag-highlight"
                                    />
                                </MentionsInput>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white border-2 border-gray-300 p-5 shadow-sm">
                            <p className="text-gray-700 font-semibold mb-3 text-lg">Add Media</p>
                            <MediaSelector
                                file={file}
                                previewUrl={previewUrl}
                                onSelect={handleFileSelect}
                                onRemove={handleRemoveFile}
                                buttonLabel={"Select Media"}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 bg-white border-2 border-gray-300 rounded-xl p-5 shadow-sm">
                            <div className="flex flex-col">
                                <p className="text-gray-700 font-semibold mb-2">Warp</p>
                                {formData.isWarp === true ? (
                                    <div className="relative inline-block w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 bg-green-500" onClick={isWarpFalse}>
                                        <div className="absolute w-5 h-5 bg-white rounded-full transform transition-transform duration-300 translate-x-5 shadow-md" />
                                    </div>
                                ) : (
                                    <div className="relative inline-block w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 bg-gray-300" onClick={isWarpTrue}>
                                        <div className="absolute w-5 h-5 bg-white rounded-full transform transition-transform duration-300 translate-x-0 shadow-md" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg border-2 border-blue-600"
                            type="submit"
                            disabled={isCreatingPost || isUploadingMedia}
                        >
                            {isCreatingPost || isUploadingMedia ? (
                                <LoaderIcon className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                "Create Post"
                            )}
                        </button>
                    </form>
                </div>
            </div>
            {/* Right panel – hidden on mobile/tablet */}
            <div className="hidden lg:block">
                <CreatePostRightPanel />
            </div>
        </div>
    );
}

export default CreatePostPage;