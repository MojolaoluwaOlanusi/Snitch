import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {useUserStore} from "../../store/useUserStore";
import {EditIcon} from "lucide-react";
import {IoClose} from "react-icons/io5";
import MediaSelector from './MediaSelector';

const EditPostModal = ({ post }) => {
    const [formData, setFormData] = useState({
        text: "",
        mediaType: "",
        url: "",
        id: "",
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
            });
            setPreviewUrl(post.url || "");
        }
    }, [post]);

    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 0);
            const prev = document.body.style.overflow;
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center`}
             onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="absolute inset-0 bg-black/40" />
            <form
                className='relative z-10 w-full max-w-3xl bg-base-100 text-base-content border rounded-md border-base-300 shadow-md p-6'
                onClick={(e) => e.stopPropagation()}
                onSubmit={onSubmit}
            >
                <div className="flex flex-row justify-between items-start">
                    <h3 className='font-bold text-lg my-1'>Edit Post</h3>
                    <div>
                        <button
                            type="button"
                            className='outline-none'
                            onClick={() => setOpen(false)}
                            aria-label="Close edit post modal"
                        >
                            <IoClose className="h-6 w-6 text-gray-900 dark:text-white"/>
                        </button>
                    </div>
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
                        placeholder='Post Content'
                        className='w-full border border-base-300 rounded p-2 h-48 resize-none bg-base-100 text-base-content'
                        value={formData.text}
                        name='text'
                        onChange={handleInputChange}
                    />

                    {/* keep url hidden - backend expects url when media present; store/upload flow should set it on submit */}

                    <div className='flex justify-end gap-2'>
                        <button type="button" className='btn btn-outline rounded-full btn-sm' onClick={() => setOpen(false)}>Cancel</button>
                        <button type="submit" className='btn btn-primary rounded-full btn-sm text-white'>
                            {isEditing ? "Updating..." : "Update"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );

    return (
        <>
            <button
                className="text-gray-500"
                onClick={() => setOpen(true)}
            >
                <div className="flex flex-row group w-40 justify-between">
                    <p className="group-hover:text-blue-500">Edit post</p>
                    <EditIcon className="h-4 w-4 group-hover:text-blue-500" />
                </div>
            </button>

            {open && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null}
        </>
    );
 };
 export default EditPostModal;
