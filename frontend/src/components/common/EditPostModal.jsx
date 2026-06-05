import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {useUserStore} from "../../store/useUserStore";
import {EditIcon} from "lucide-react";
import {IoClose} from "react-icons/io5";
import MediaSelector from './MediaSelector';
import HashtagAutocomplete from './HashtagAutocomplete';
import MentionAutocomplete from './MentionAutocomplete';

const EditPostModal = ({ post }) => {
    const [formData, setFormData] = useState({
        text: "",
        mediaType: "",
        url: "",
        id: "",
        hashtags: [],
        mentions: [],
    });

    const [open, setOpen] = useState(false);
    const textareaRef = useRef(null);
    const { editPost, isEditing } = useUserStore();

    // local file state (not uploaded)
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (post) {
            setFormData({
                text: post.text || "",
                mediaType: post.mediaType || "",
                url: post.url || "",
                id: post._id,
                hashtags: post.hashtags || [],
                mentions: post.mentions || [],
            });
            setPreviewUrl(post.url || "");
        }
    }, [post]);

    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 0);
            const prev = document.body.style.overflow;
            // prevent background scroll while modal open
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [open]);

    const handleSelectFile = (f) => {
        // detect media type
        const type = f.type ? f.type.split('/')[0] : null;
        const mediaType = type === 'image' ? 'Image' : type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : '';
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
        setFormData({ ...formData, mediaType });
    };

    const handleRemoveFile = () => {
        // revoke any blob url used for preview
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        // clear local file and preview so MediaSelector shows the select button
        setFile(null);
        setPreviewUrl("");
        // clear media fields from form data so backend knows media removed/changed
        setFormData((prev) => ({ ...prev, mediaType: '', url: '' }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        // send the formData and file (file will be handled by createPost flow / upload middleware)
        const payload = { ...formData, id: formData.id };
        // attach file on payload so store handler can upload if needed
        payload._file = file; // store uses axios to PUT if this present (we'll handle in create flow)
        editPost(payload);
        setOpen(false);
    };

    const modalContent = (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4`} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            {/* overlay */}
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

            <form
                className='relative z-10 w-full max-w-2xl bg-white text-gray-800 border-2 border-blue-200 rounded-xl shadow-2xl p-6 ring-2 ring-blue-200'
                onClick={(e) => e.stopPropagation()}
                onSubmit={onSubmit}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-row justify-between items-center border-b border-gray-300 pb-4">
                    <h3 className='font-bold text-xl text-slate-800'>Edit Post</h3>
                    <button
                        type="button"
                        className='p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 outline-none'
                        onClick={() => setOpen(false)}
                        aria-label="Close edit post modal"
                    >
                        <IoClose className="h-6 w-6 text-gray-700"/>
                    </button>
                </div>

                <div className='flex flex-col gap-4 mt-3'>
                    {/* media selector */}
                    <div>
                        <MediaSelector
                            file={file}
                            previewUrl={previewUrl}
                            onSelect={handleSelectFile}
                            onRemove={handleRemoveFile}
                            buttonLabel={'Select Media'}
                        />
                    </div>

                    <textarea
                        ref={textareaRef}
                        placeholder='What would you like to say?'
                        name='text'
                        className='w-full border-2 border-gray-300 rounded-lg p-4 h-40 resize-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-200 transition-all duration-200'
                        value={formData.text}
                        onChange={handleInputChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-700 font-semibold mb-2 block">Hashtags</label>
                            <HashtagAutocomplete
                                value={Array.isArray(post?.hashtags) ? post?.hashtags.join(' ') : ''}
                                onChange={(value) => {
                                    // Store hashtags in a separate field or append to text
                                    const hashtags = value.split(' ').filter(h => h.trim());
                                    setFormData({ ...formData, hashtags });
                                }}
                                placeholder="Add hashtags..."
                            />
                        </div>
                        <div>
                            <label className="text-gray-700 font-semibold mb-2 block">Mentions</label>
                            <MentionAutocomplete
                                value={Array.isArray(post?.mentions) ? post?.mentions.join(' ') : ''}
                                onChange={(value) => {
                                    // Store mentions in a separate field or append to text
                                    const mentions = value.split(' ').filter(m => m.trim());
                                    setFormData({ ...formData, mentions });
                                }}
                                placeholder="Mention someone..."
                            />
                        </div>
                    </div>

                    {/* keep url hidden - backend expects url when media present; store/upload flow should set it on submit */}

                    <div className='flex justify-end gap-3 pt-2'>
                        <button type="button" className='px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200 font-medium' onClick={() => setOpen(false)}>Cancel</button>
                        <button type="submit" className='px-6 py-2.5 bg-blue-500 hover:bg-blue-600 border-2 border-blue-600 rounded-full text-white font-medium transition-colors duration-200 shadow-md hover:shadow-lg'>
                            {isEditing ? "Updating..." : "Update Post"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );

    return (
        <>
            <button
                className="text-gray-500 hover:text-blue-500 transition-colors duration-200"
                onClick={() => setOpen(true)}
            >
                <div className="flex flex-row group w-40 justify-between items-center">
                    <p className="group-hover:text-blue-500 font-medium">Edit post</p>
                    <EditIcon className="h-4 w-4 group-hover:text-blue-500" />
                </div>
            </button>

            {open && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null}
        </>
    );
 };
 export default EditPostModal;
