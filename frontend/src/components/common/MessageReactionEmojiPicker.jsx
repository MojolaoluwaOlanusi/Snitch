// ChatReactionEmojiPicker.jsx
import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LazyPicker = lazy(() => import("@emoji-mart/react"));
import data from "@emoji-mart/data";
import {PlusCircle} from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const SmileIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);

const MessageReactionEmojiPicker = ({ postId, onReact, onClose, isOpen }) => {
    const pickerRef = useRef(null);
    const [showFullPicker, setShowFullPicker] = useState(false);

    const handleSelect = (emoji) => {
        onReact(emoji.native);
        onClose();
    };

    const handleQuickReact = (emoji) => {
        onReact(emoji);
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }

    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={pickerRef}
                initial={{ opacity: 0, y: 0, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 bottom-full mb-2 z-50 bg-white p-2 rounded-xl shadow-2xl border-2 border-blue-200 w-80 max-h-64 overflow-auto"
            >
                {!showFullPicker ? (
                    <div className="flex items-center gap-1 p-1.5">
                        {QUICK_REACTIONS.map((emoji, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickReact(emoji)}
                                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors hover:scale-125 transform"
                            >
                                {emoji}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowFullPicker(true)}
                            className="w-9 h-9 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <PlusCircle />
                        </button>
                    </div>
                ) : (
                    <div className="w-72 max-h-80 overflow-auto p-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <button onClick={() => setShowFullPicker(false)} className="text-xs text-blue-400 hover:text-blue-500">
                                ← Quick
                            </button>
                            <span className="text-xs text-gray-400">Choose a reaction</span>
                        </div>
                        <Suspense fallback={<div className="text-center p-4 text-gray-400 text-sm">Loading...</div>}>
                            <LazyPicker
                                data={data}
                                onEmojiSelect={handleSelect}
                                perLine={7}
                                theme="light"
                                previewPosition="none"
                                skinTonePosition="none"
                                maxFrequentRows={0}
                            />
                        </Suspense>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default MessageReactionEmojiPicker;