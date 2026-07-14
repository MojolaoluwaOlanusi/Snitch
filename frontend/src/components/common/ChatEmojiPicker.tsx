import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LazyPicker = lazy(async () => {
    const mod = await import("@emoji-mart/react");
    return { default: mod.default };
});
import data from "@emoji-mart/data";

interface Props {
    postId: string;
    onReact: (emoji: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

// Quick reaction emojis for fast access
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ReactionEmojiPicker: React.FC<Props> = ({ postId, onReact, onClose, isOpen }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const [showFullPicker, setShowFullPicker] = useState(false);

    const handleSelect = (emoji: any) => {
        onReact(emoji.native);
        onClose();
    };

    const handleQuickReact = (emoji: string) => {
        onReact(emoji);
        onClose();
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-1 z-50 bg-base-100 rounded-xl shadow-xl border border-base-300"
                >
                    {!showFullPicker ? (
                        // Quick reactions bar
                        <div className="flex items-center gap-1 p-1.5">
                            {QUICK_REACTIONS.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickReact(emoji)}
                                    className="w-9 h-9 flex items-center justify-center text-xl hover:bg-base-200 rounded-lg transition-colors hover:scale-125 transform"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowFullPicker(true)}
                                className="w-9 h-9 flex items-center justify-center text-lg hover:bg-base-200 rounded-lg transition-colors"
                                title="More reactions"
                            >
                                <SmileIcon />
                            </button>
                        </div>
                    ) : (
                        // Full emoji picker
                        <div className="w-72 max-h-80 overflow-auto p-2">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <button
                                    onClick={() => setShowFullPicker(false)}
                                    className="text-xs text-primary hover:text-primary"
                                >
                                    ← Quick
                                </button>
                                <span className="text-xs text-base-content/50">Choose reaction</span>
                            </div>
                            <Suspense fallback={<div className="text-center p-4 text-base-content/50 text-sm">Loading...</div>}>
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
            )}
        </AnimatePresence>
    );
};

// Simple smile icon for the "more" button
const SmileIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/60">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);

export default ReactionEmojiPicker;