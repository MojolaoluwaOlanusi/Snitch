// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/common/Sidebar";
import { useUserStore } from "../../store/useUserStore";
import { useAuthStore } from "../../store/useAuthStore";
import CreatePostRightPanel from "../../components/common/CreatePostRightPanel";
import { LoaderIcon, Smile, ImageIcon, X } from "lucide-react";
import axiosInstance from "../../lib/axios";
import getCaretCoordinates from "textarea-caret";
import EmojiPicker from "../../components/common/EmojiPicker";
import "./CreatePostPage.css";
import {toast} from "sonner";

const MAX_CHARS = 1000;
const AUTO_SAVE_KEY = "snitch_draft_text";

function CreatePostPage() {
    const [text, setText] = useState("");
    const mentions = [...text.matchAll(/@(\w+)/g)].map((m) => m[1]);
    const hashtags = [...text.matchAll(/#([\w-]+)/g)].map((m) => m[1]);

    const [suggestions, setSuggestions] = useState([]);
    const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentTrigger, setCurrentTrigger] = useState(null);

    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    const [linkPreviews, setLinkPreviews] = useState([]);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPos, setEmojiPickerPos] = useState({ top: 0, left: 0 });

    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef(null);
    const dropZoneRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const [scheduledAt, setScheduledAt] = useState("");   // ISO string from datetime-local input
    const fetchPreviewTimeoutRef = useRef(null);

    // Prevent suggestions from reappearing immediately after selection
    const preventSuggestionsRef = useRef(false);
    const blurTimeoutRef = useRef(null);

    const { isCreatingPost, createPost } = useUserStore();
    const { authUser } = useAuthStore();

    // ── draft auto‑save ──────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) setText(saved);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (text.trim()) localStorage.setItem(AUTO_SAVE_KEY, text);
            else localStorage.removeItem(AUTO_SAVE_KEY);
        }, 2000);
        return () => clearTimeout(timer);
    }, [text]);

    // ── link previews – unique, max 2, scrollable ────────
    useEffect(() => {
        const urlRegex = /(https?:\/\/\S+)/g;
        const urls = [...new Set(text.match(urlRegex) || [])];

        if (fetchPreviewTimeoutRef.current) clearTimeout(fetchPreviewTimeoutRef.current);

        if (urls.length === 0) {
            setLinkPreviews([]);
            return;
        }

        setIsFetchingPreview(true);
        fetchPreviewTimeoutRef.current = setTimeout(async () => {
            const previews = [];
            for (const url of urls.slice(-2)) {
                try {
                    const token = localStorage.getItem("access-token");
                    const res = await axiosInstance.post(
                        "/chat/link-preview",
                        { url },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    previews.push({ url, preview: res.data });
                } catch {}
            }
            setLinkPreviews(previews);
            setIsFetchingPreview(false);
        }, 400);
    }, [text]);

    // ── close emoji picker on outside click ───────────────
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

    // ── fetch users for @ ────────────────────────────────
    const fetchUsers = async (query, callback) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.get(`/search/user/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const users = res.data.users.map((u) => ({
                id: u.username,
                display: u.displayName || u.username,
                avatar: u.avatarUrl,
            }));
            callback(users);
        } catch { callback([]); }
    };

    // ── fetch hashtags for # ─────────────────────────────
    const fetchHashtags = async (query, callback) => {
        if (!query) return;
        try {
            const token = localStorage.getItem("access-token");
            const res = await axiosInstance.get(`/search/hashtag/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const tags = (res.data.suggestedHashtags || []).map((h) => ({
                id: h._id,
                display: h._id,
            }));
            if (!tags.find((t) => t.id === query)) tags.push({ id: query, display: query });
            callback(tags);
        } catch { callback([]); }
    };

    // ── suggestion handler with suppression logic ─────────
    const handleTextChange = (e) => {
        const value = e.target.value;
        setText(value);

        // If we just inserted a suggestion, wait for a space before re-enabling
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
        const textBeforeCursor = value.substring(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const hashIndex = textBeforeCursor.lastIndexOf("#");

        if (atIndex > hashIndex && atIndex !== -1) {
            const query = textBeforeCursor.substring(atIndex + 1).toLowerCase();
            fetchUsers(query, (users) => {
                setSuggestions(users);
                setShowSuggestions(users.length > 0);
                setCurrentTrigger("@");
                const caret = getCaretCoordinates(e.target, cursorPos);
                const rect = e.target.getBoundingClientRect();
                setSuggestionPos({
                    top: rect.top + caret.top + caret.height + 4,
                    left: rect.left + caret.left,
                });
            });
        } else if (hashIndex > atIndex && hashIndex !== -1) {
            const query = textBeforeCursor.substring(hashIndex + 1).toLowerCase();
            fetchHashtags(query, (tags) => {
                setSuggestions(tags);
                setShowSuggestions(tags.length > 0);
                setCurrentTrigger("#");
                const caret = getCaretCoordinates(e.target, cursorPos);
                const rect = e.target.getBoundingClientRect();
                setSuggestionPos({
                    top: rect.top + caret.top + caret.height + 4,
                    left: rect.left + caret.left,
                });
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

    // Hide suggestions on blur (with delay so click on suggestion registers)
    const handleBlur = () => {
        blurTimeoutRef.current = setTimeout(() => {
            setShowSuggestions(false);
        }, 200);
    };

    const handleFocus = () => {
        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };

    // ── emoji insertion ──────────────────────────────────
    const openEmojiPicker = () => {
        const el = textareaRef.current;
        const caret = getCaretCoordinates(el, el.selectionStart);
        const rect = el.getBoundingClientRect();
        const pickerWidth = 352;
        const pickerHeight = 400;

        let top = rect.top + caret.top - pickerHeight - 10;
        let left = rect.left + caret.left;

        if (left + pickerWidth > window.innerWidth - 20) {
            left = window.innerWidth - pickerWidth - 20;
        }
        if (left < 10) left = 10;
        if (top < 10) top = rect.top + caret.top + caret.height + 10;

        setEmojiPickerPos({ top, left });
        setShowEmojiPicker(true);
    };

    const handleEmojiSelect = (emoji) => {
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newText = text.substring(0, start) + emoji.native + text.substring(end);
        setText(newText);
        setShowEmojiPicker(false);
        setTimeout(() => {
            el.focus();
            const newPos = start + emoji.native.length;
            el.setSelectionRange(newPos, newPos);
        }, 50);
    };

    // ── single media handling ────────────────────────────
    const setSingleFile = (newFile) => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setFile(newFile);
        setFilePreview(newFile ? URL.createObjectURL(newFile) : null);
    };

    const handleFileSelect = (e) => {
        const f = e.target.files?.[0];
        if (f) setSingleFile(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) setSingleFile(f);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const blob = item.getAsFile();
                if (blob) { setSingleFile(blob); break; }
            }
        }
    };

    const removeFile = () => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setFile(null);
        setFilePreview(null);
    };

    // ── submit ───────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !file) return;

        // Validate scheduled time
        if (scheduledAt) {
            const selectedDate = new Date(scheduledAt);
            if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
                toast.error('The schedule time must be in the future');
                return;
            }
        }

        setIsSending(true);

        try {
            let mediaUrl = null;
            let mediaType = "";

            if (file) {
                setIsUploadingMedia(true);
                const contentType = file.type;
                const folder = file.type.startsWith("image") ? "Images"
                    : file.type.startsWith("video") ? "Videos"
                        : "Audio";
                const token = localStorage.getItem("access-token");
                const res = await axiosInstance.post("/media/upload-url",
                    { contentType, folder },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const publicUrl = res.data.publicUrl;
                const uploadUrl = res.data.uploadUrl;
                await axiosInstance.put(uploadUrl, file, { headers: { "Content-Type": contentType } });
                mediaUrl = publicUrl;
                mediaType = file.type.startsWith("image") ? "Image"
                    : file.type.startsWith("video") ? "Video"
                        : "Audio";
                setIsUploadingMedia(false);
            }

            const payload = {
                text,
                mentions: [...new Set(mentions)],
                hashtags: [...new Set(hashtags)],
                url: mediaUrl,
                mediaType,
                isWarp: false,
            };

            const token = localStorage.getItem("access-token");

            if (scheduledAt) {
                await axiosInstance.post(
                    "/posts/schedule",
                    { ...payload, scheduledAt },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Post scheduled successfully!");
            } else {
                await createPost(payload);
                toast.success("Post created!");
            }

            // Reset form
            setText("");
            removeFile();
            setLinkPreviews([]);
            setScheduledAt("");
            localStorage.removeItem(AUTO_SAVE_KEY);
        } catch (err) {
            const message = err?.response?.data?.message || "Failed to create post";
            toast.error(message);
            console.error("Create post failed", err);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />
            <main className="flex-1 flex flex-col items-center bg-base-100 rounded-lg w-full h-full overflow-y-auto">
                <div className="h-14 lg:hidden" />
                <div className="w-full max-w-3xl space-y-6 p-4 sm:p-6">
                    <div className="items-center flex flex-col p-6 bg-base-100 rounded-xl border-2 border-primary/20 shadow-md">
                        <p className="text-lg sm:text-2xl text-primary/90 font-semibold text-center">
                            Share your thoughts with the world ✨
                        </p>
                    </div>

                    <form className="flex flex-col gap-5 w-full" onSubmit={handleSubmit}>
                        <div className="rounded-xl bg-base-100 border-2 border-primary/20 p-5 shadow-sm">
                            <p className="text-base-content/80 font-semibold mb-3 text-lg">What's on your mind?</p>
                            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="Share something amazing today... Use @ to mention, # for hashtags"
                    className="w-full min-h-[12rem] p-4 rounded-lg bg-base-300 border-2 border-base-200 focus:outline-none focus:ring-2 focus:ring-primary text-lg resize-none"
                    maxLength={MAX_CHARS}
                />
                                <div className="absolute bottom-2 right-2 text-xs text-base-content/50">
                                    {text.length}/{MAX_CHARS}
                                </div>
                            </div>

                            {/* Suggestions dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="fixed z-50 bg-base-100 border rounded-xl shadow-lg max-h-40 overflow-y-auto"
                                        style={{ top: suggestionPos.top, left: suggestionPos.left }}
                                    >
                                        {suggestions.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-2 p-2 hover:bg-base-200 cursor-pointer"
                                                onClick={() => selectSuggestion(item)}
                                            >
                                                {currentTrigger === "@" && (
                                                    <img
                                                        src={item.avatar || "/avatar-placeholder.png"}
                                                        className="w-8 h-8 rounded-full"
                                                        alt=""
                                                    />
                                                )}
                                                <span className="text-sm font-medium">
                          {currentTrigger === "@"
                              ? `${item.display} (@${item.id})`
                              : `#${item.display}`}
                        </span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Drag & drop zone */}
                            <div
                                ref={dropZoneRef}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="mt-3 border-2 border-dashed border-base-300 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                                onClick={() => document.getElementById("media-upload").click()}
                            >
                                {filePreview ? (
                                    <div className="relative inline-block">
                                        {file.type.startsWith("image") ? (
                                            <img src={filePreview} className="max-h-40 rounded-lg" alt="preview" />
                                        ) : file.type.startsWith("video") ? (
                                            <video src={filePreview} className="max-h-40 rounded-lg" controls />
                                        ) : (
                                            /* Audio fallback – show an icon + filename */
                                            <div className="h-20 flex items-center justify-center gap-2 bg-base-200 rounded-lg px-4">
                                                <span className="text-2xl">🎵</span>
                                                <span className="text-sm text-base-content/60">
                                                    Audio file
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 p-1 bg-error text-primary-content rounded-full md:opacity-0 md:hover:opacity-100 transition"
                                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="w-8 h-8 text-base-content/50" />
                                        <p className="text-sm text-base-content/60">Drag & drop an image, video, or audio file here</p>
                                        <p className="text-xs text-base-content/50">or click to select</p>
                                    </div>
                                )}
                                <input
                                    id="media-upload"
                                    type="file"
                                    accept="image/*,video/*,audio/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Link previews – max 2, scrollable */}
                            <AnimatePresence>
                                {linkPreviews.length > 0 && (
                                    <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                                        {linkPreviews.map(({ url, preview }) => (
                                            <motion.div
                                                key={url}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="border rounded-lg p-3 bg-base-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {preview.image && (
                                                        <img src={preview.image} alt="" className="w-20 h-20 object-cover rounded" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-primary/90 line-clamp-2">
                                                            {preview.title}
                                                        </p>
                                                        <p className="text-xs text-base-content/60 line-clamp-2 mt-1">
                                                            {preview.description}
                                                        </p>
                                                        <p className="text-xs text-base-content/50 mt-1">{preview.domain}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-base-200"
                                onClick={openEmojiPicker}
                                title="Emoji"
                            >
                                <Smile className="w-5 h-5 text-base-content/60" />
                            </button>

                            <AnimatePresence>
                                {showEmojiPicker && (
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Schedule Post */}
                        <div className="rounded-xl bg-base-100 border-2 border-primary/20 p-5 shadow-sm">
                            <p className="text-gray-700 font-semibold mb-3 text-lg">Schedule (optional)</p>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                min={new Date().toISOString().slice(0, 16)}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="w-full border border-primary/20 rounded-lg bg-base-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <p className="text-xs text-gray-400 mt-1">Leave empty to post immediately</p>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isSending || isCreatingPost || isUploadingMedia}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-content rounded-xl py-4 text-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {isSending || isUploadingMedia ? (
                                <LoaderIcon className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                "Post"
                            )}
                        </button>
                    </form>
                </div>
            </main>
            <div className="hidden lg:block">
                <CreatePostRightPanel />
            </div>
        </div>
    );
}

export default CreatePostPage;