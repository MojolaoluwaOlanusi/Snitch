// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../../store/useUserStore.js";
import { EditIcon, LoaderIcon, Smile, ImageIcon, X } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import getCaretCoordinates from "textarea-caret";
import EmojiPicker from "./EmojiPicker.jsx";

const MAX_CHARS = 1000;

function EditPostModal({ post }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const mentions = [...text.matchAll(/@(\w+)/g)].map(m => m[1]);
    const hashtags = [...text.matchAll(/#([\w-]+)/g)].map(m => m[1]);

    // media states
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [existingUrl, setExistingUrl] = useState("");   // the original media url
    const [existingMediaType, setExistingMediaType] = useState("");

    // suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentTrigger, setCurrentTrigger] = useState(null);
    const preventSuggestionsRef = useRef(false);
    const blurTimeoutRef = useRef(null);

    // emoji picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPos, setEmojiPickerPos] = useState({ top: 0, left: 0 });
    const emojiPickerRef = useRef(null);

    const textareaRef = useRef(null);
    const { editPost, isEditing } = useUserStore();

    // ── Initialise from post prop ───────────────────────
    useEffect(() => {
        if (post) {
            setText(post.text || "");
            if (post.mediaType && post.url) {
                setExistingUrl(post.url);
                setExistingMediaType(post.mediaType);
                setPreviewUrl(post.url);
                setFile(null);
            } else {
                setExistingUrl("");
                setExistingMediaType("");
                setPreviewUrl("");
                setFile(null);
            }
        }
    }, [post]);

    // ── Lock body scroll when open ─────────────────────
    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 0);
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [open]);

    // ── Close emoji picker on outside click ────────────
    useEffect(() => {
        const handler = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) {
            document.addEventListener("mousedown", handler);
            return () => document.removeEventListener("mousedown", handler);
        }
    }, [showEmojiPicker]);

    // ── Helper APIs ────────────────────────────────────
    const fetchUsers = async (query, callback) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.get(`/search/user/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const users = res.data.users.map(u => ({
                id: u.username,
                display: u.displayName || u.username,
                avatar: u.avatarUrl,
            }));
            callback(users);
        } catch { callback([]); }
    };

    const fetchHashtags = async (query, callback) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.get(`/search/hashtag/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const tags = (res.data.suggestedHashtags || []).map(h => ({
                id: h._id,
                display: h._id,
            }));
            if (!tags.find(t => t.id === query)) tags.push({ id: query, display: query });
            callback(tags);
        } catch { callback([]); }
    };

    // ── Text change handler ───────────────────────────
    const handleTextChange = (e) => {
        const value = e.target.value;
        setText(value);

        if (preventSuggestionsRef.current) {
            const lastChar = value.charAt(e.target.selectionStart - 1);
            if (lastChar === " ") {
                preventSuggestionsRef.current = false;
            } else {
                setShowSuggestions(false);
                return;
            }
        }

        const cursorPos = e.target.selectionStart;
        const textBefore = value.substring(0, cursorPos);
        const atIndex = textBefore.lastIndexOf("@");
        const hashIndex = textBefore.lastIndexOf("#");

        if (atIndex > hashIndex && atIndex !== -1) {
            const query = textBefore.substring(atIndex + 1).toLowerCase();
            fetchUsers(query, users => {
                setSuggestions(users);
                setShowSuggestions(users.length > 0);
                setCurrentTrigger("@");
                const caret = getCaretCoordinates(e.target, cursorPos);
                const rect = e.target.getBoundingClientRect();
                setSuggestionPos({ top: rect.top + caret.top + caret.height + 4, left: rect.left + caret.left });
            });
        } else if (hashIndex > atIndex && hashIndex !== -1) {
            const query = textBefore.substring(hashIndex + 1).toLowerCase();
            fetchHashtags(query, tags => {
                setSuggestions(tags);
                setShowSuggestions(tags.length > 0);
                setCurrentTrigger("#");
                const caret = getCaretCoordinates(e.target, cursorPos);
                const rect = e.target.getBoundingClientRect();
                setSuggestionPos({ top: rect.top + caret.top + caret.height + 4, left: rect.left + caret.left });
            });
        } else {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (item) => {
        const el = textareaRef.current;
        const start = el.selectionStart;
        const textBefore = text.substring(0, start);
        const textAfter = text.substring(start);
        const triggerIndex = Math.max(textBefore.lastIndexOf("@"), textBefore.lastIndexOf("#"));
        const newText = textBefore.substring(0, triggerIndex + 1) + item.id + " " + textAfter;
        setText(newText);
        setShowSuggestions(false);
        preventSuggestionsRef.current = true;
        setTimeout(() => {
            el.focus();
            const newPos = triggerIndex + item.id.length + 2;
            el.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleBlur = () => {
        blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 200);
    };
    const handleFocus = () => {
        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };

    // ── Emoji ─────────────────────────────────────────
    const openEmojiPicker = () => {
        const el = textareaRef.current;
        const caret = getCaretCoordinates(el, el.selectionStart);
        const rect = el.getBoundingClientRect();
        const pickerWidth = 352, pickerHeight = 400;
        let top = rect.top + caret.top - pickerHeight - 10;
        let left = rect.left + caret.left;
        if (left + pickerWidth > window.innerWidth - 20) left = window.innerWidth - pickerWidth - 20;
        if (left < 10) left = 10;
        if (top < 10) top = rect.top + caret.top + caret.height + 10;
        setEmojiPickerPos({ top, left });
        setShowEmojiPicker(true);
    };

    const handleEmojiSelect = (emoji) => {
        const el = textareaRef.current;
        const start = el.selectionStart, end = el.selectionEnd;
        const newText = text.substring(0, start) + emoji.native + text.substring(end);
        setText(newText);
        setShowEmojiPicker(false);
        setTimeout(() => {
            el.focus();
            const newPos = start + emoji.native.length;
            el.setSelectionRange(newPos, newPos);
        }, 50);
    };

    // ── Media ─────────────────────────────────────────
    const handleFileSelect = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        setExistingUrl("");       // clear old url so new file will be uploaded
        setExistingMediaType("");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (!f) return;
        handleFileSelect({ target: { files: [f] } });
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const blob = item.getAsFile();
                if (blob) {
                    handleFileSelect({ target: { files: [blob] } });
                    break;
                }
            }
        }
    };

    const removeFile = () => {
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl("");
        setExistingUrl("");
        setExistingMediaType("");
    };

    // ── Submit ────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !file && !existingUrl) return;

        let finalUrl = existingUrl;
        let finalMediaType = existingMediaType;

        if (file) {
            setIsUploadingMedia(true);
            try {
                const contentType = file.type;
                const folder = file.type.startsWith("image") ? "Images"
                    : file.type.startsWith("video") ? "Videos" : "Audio";
                const token = localStorage.getItem("access-token");
                const res = await axiosInstance.post("/media/upload-url",
                    { contentType, folder },
                    { headers: { Authorization: `Bearer ${token}` } });
                const uploadUrl = res.data.uploadUrl;
                const publicUrl = res.data.publicUrl;
                await axiosInstance.put(uploadUrl, file, { headers: { "Content-Type": contentType } });
                finalUrl = publicUrl;
                finalMediaType = file.type.startsWith("image") ? "Image"
                    : file.type.startsWith("video") ? "Video" : "Audio";
            } catch (err) {
                console.error("Upload failed", err);
                setIsUploadingMedia(false);
                return;
            } finally {
                setIsUploadingMedia(false);
            }
        } else if (existingUrl) {
            // keep existing media
        } else {
            // media removed
            finalUrl = "";
            finalMediaType = "";
        }

        editPost({
            id: post._id,
            text,
            mentions: [...new Set(mentions)],
            hashtags: [...new Set(hashtags)],
            url: finalUrl,
            mediaType: finalMediaType,
        });
        setOpen(false);
    };

    // ── Modal content ────────────────────────────────
    const modalContent = (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    {/* overlay */}
                    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-base-100 text-base-content rounded-xl shadow-2xl p-4 sm:p-6 ring-2 ring-primary/20"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* header */}
                        <div className="flex items-center justify-between border-b border-base-300 pb-4 mb-4">
                            <h3 className="font-bold text-xl text-base-content">Edit Post</h3>
                            <button
                                type="button"
                                className="p-2 rounded-full hover:bg-base-300 transition-colors"
                                onClick={() => setOpen(false)}
                                aria-label="Close edit post modal"
                            >
                                <X className="h-6 w-6 text-base-content/80" />
                            </button>
                        </div>

                        {/* textarea with suggestions */}
                        <div className="relative mb-4">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={handleTextChange}
                                onBlur={handleBlur}
                                onFocus={handleFocus}
                                onPaste={handlePaste}
                                onKeyDown={(e) => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit(e);
                                }}
                                placeholder="Edit your post..."
                                className="w-full min-h-[10rem] p-4 rounded-lg border-2 border-base-200 focus:outline-none focus:ring-2 focus:ring-primary text-lg resize-none bg-base-200 text-base-content placeholder:text-base-content/50"
                                maxLength={MAX_CHARS}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-base-content/50">
                                {text.length}/{MAX_CHARS}
                            </div>

                            {/* suggestions dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="fixed z-50 bg-base-100 border rounded-xl shadow-lg max-h-40 overflow-y-auto"
                                        style={{ top: suggestionPos.top, left: suggestionPos.left }}
                                    >
                                        {suggestions.map(item => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-2 p-2 hover:bg-base-200 cursor-pointer"
                                                onClick={() => selectSuggestion(item)}
                                            >
                                                {currentTrigger === "@" && (
                                                    <img src={item.avatar || "/avatar-placeholder.png"} className="w-8 h-8 rounded-full" alt="" />
                                                )}
                                                <span className="text-sm font-medium">
                                                    {currentTrigger === "@" ? `${item.display} (@${item.id})` : `#${item.display}`}
                                                </span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* media drop zone */}
                        <div
                            className="mb-4 border-2 border-dashed border-base-300 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => document.getElementById("edit-media-upload")?.click()}
                        >
                            {previewUrl ? (
                                <div className="relative inline-block">
                                    {/* Image or existing Image media type */}
                                    {existingMediaType?.toLowerCase().startsWith("image") ||
                                    file?.type?.startsWith("image/") ? (
                                        <img
                                            src={previewUrl}
                                            className="max-h-40 rounded-lg"
                                            alt="preview"
                                        />
                                    ) : existingMediaType?.toLowerCase().startsWith("video") ||
                                    file?.type?.startsWith("video/") ? (
                                        <video
                                            src={previewUrl}
                                            className="max-h-40 rounded-lg"
                                            controls
                                        />
                                    ) : (
                                        /* Audio fallback – show an icon + filename */
                                        <div className="h-20 flex items-center justify-center gap-2 bg-base-200 rounded-lg px-4">
                                            <span className="text-2xl">🎵</span>
                                            <span className="text-sm text-base-content/60">
                                                Audio file
                                            </span>
                                        </div>
                                    )}
                                    {/* Remove button (always visible on mobile, hover on desktop) */}
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 p-1 bg-error text-primary-content rounded-full md:opacity-0 md:hover:opacity-100 transition"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile();
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <ImageIcon className="w-8 h-8 text-base-content/50" />
                                    <p className="text-sm text-base-content/60">
                                        Drag &amp; drop a new image, video, or audio file
                                    </p>
                                    <p className="text-xs text-base-content/50">or click to replace existing media</p>
                                </div>
                            )}
                            <input
                                id="edit-media-upload"
                                type="file"
                                accept="image/*,video/*,audio/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>

                        {/* emoji button */}
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-base-200"
                                onClick={openEmojiPicker}
                                title="Emoji"
                            >
                                <Smile className="w-5 h-5 text-base-content/60" />
                            </button>

                            {/* emoji picker portal */}
                            {showEmojiPicker && typeof document !== 'undefined' && createPortal(
                                <motion.div
                                    ref={emojiPickerRef}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="fixed z-50"
                                    style={{ top: emojiPickerPos.top, left: emojiPickerPos.left }}
                                >
                                    <EmojiPicker
                                        inputRef={textareaRef}
                                        value={text}
                                        setValue={setText}
                                    />
                                </motion.div>,
                                document.body
                            )}
                        </div>

                        {/* buttons */}
                        <div className="flex justify-end gap-3 pt-2 border-t border-base-200">
                            <button
                                type="button"
                                className="px-6 py-2.5 border-2 border-base-300 text-base-content/80 rounded-full hover:bg-base-200 transition-colors font-medium"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isEditing || isUploadingMedia}
                                onClick={handleSubmit}
                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 border-2 border-primary rounded-full text-primary-content font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                {isEditing || isUploadingMedia ? (
                                    <LoaderIcon className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Update Post"
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* trigger button */}
            <button
                className="text-base-content/60 hover:text-primary transition-colors duration-200"
                onClick={() => setOpen(true)}
            >
                <div className="flex flex-row group w-40 justify-between items-center">
                    <p className="group-hover:text-primary font-medium">Edit post</p>
                    <EditIcon className="h-4 w-4 group-hover:text-primary" />
                </div>
            </button>

            {open && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
        </>
    );
}

export default EditPostModal;