import { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from '@/hooks/useAppTheme.js';

const LazyPicker = lazy(() => import("@emoji-mart/react"));
import data from "@emoji-mart/data";
import { PlusCircle } from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageReactionEmojiPicker = ({ postId, onReact, onClose, isOpen, position, currentUserReaction, isOwn }) => {
    const pickerRef = useRef(null);
    const [showFullPicker, setShowFullPicker] = useState(false);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const appTheme = useAppTheme();

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // No longer needed – overlay click will handle close
    // useEffect for outside click removed

    const handleSelect = (emoji) => {
        onReact(emoji.native);
        onClose();
    };

    const handleQuickReact = (emoji) => {
        onReact(emoji);
        onClose();
    };

    const isMobile = screenWidth < 768;

    const getDesktopStyle = () => {
        if (!position) return {};
        const top = Math.min(position.top, window.innerHeight - 300);
        if (isOwn) {
            const left = Math.max(10, position.left - 280);
            return { top: `${top}px`, left: `${left}px` };
        } else {
            const left = Math.min(position.left + 40, window.innerWidth - 290);
            return { top: `${top}px`, left: `${left}px` };
        }
    };

    if (!isOpen) return null;

    // Quick picker content
    const quickPickerContent = (
        <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 bg-base-100 rounded-xl shadow-xl border border-base-300"
            style={
                isMobile
                    ? {
                        top: `${(position?.top || 0) - 70}px`,
                        left: `${Math.max(10, (position?.left || 0) + 20 - 140)}px`,
                    }
                    : getDesktopStyle()
            }
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-1 p-1.5 flex-wrap">
                {QUICK_REACTIONS.map((emoji, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleQuickReact(emoji)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl hover:bg-base-200 rounded-lg transition-colors hover:scale-125 transform ${
                            currentUserReaction === emoji ? "bg-primary/10 ring-2 ring-primary" : ""
                        }`}
                    >
                        {emoji}
                    </button>
                ))}
                <button
                    onClick={() => setShowFullPicker(true)}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl hover:bg-base-200 rounded-lg transition-colors"
                >
                    <PlusCircle className="w-5 h-5 sm:w-auto sm:h-auto" />
                </button>
            </div>
        </motion.div>
    );

    // Full picker content
    const fullPickerContent = (
        <motion.div
            ref={pickerRef}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="bg-base-100 rounded-xl shadow-xl border border-base-300 w-[90vw] max-w-xs sm:max-w-sm md:w-72 max-h-80 overflow-auto"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                    <button
                        onClick={() => setShowFullPicker(false)}
                        className="text-xs text-primary hover:text-primary shrink-0"
                    >
                        ← Quick
                    </button>
                    <span className="text-[10px] sm:text-xs text-base-content/50 truncate ml-2">
                        Choose a reaction
                    </span>
                </div>
                <Suspense fallback={<div className="text-center p-4 text-base-content/50 text-sm">Loading...</div>}>
                    <LazyPicker
                        data={data}
                        onEmojiSelect={handleSelect}
                        perLine={isMobile ? 7 : 7}
                        theme={appTheme}
                        previewPosition="none"
                        skinTonePosition="none"
                        maxFrequentRows={0}
                    />
                </Suspense>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {!showFullPicker ? (
                // Quick picker with transparent overlay
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50"
                    onClick={onClose}
                >
                    {quickPickerContent}
                </motion.div>
            ) : (
                // Full picker overlay with background
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                    onClick={() => setShowFullPicker(false)}
                >
                    {fullPickerContent}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MessageReactionEmojiPicker;