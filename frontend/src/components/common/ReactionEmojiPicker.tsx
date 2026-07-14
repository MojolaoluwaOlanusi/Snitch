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

const ReactionEmojiPicker: React.FC<Props> = ({ postId, onReact, onClose, isOpen }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    const handleSelect = (emoji: any) => {
        onReact(emoji.native);
        onClose();
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-full mb-2 z-50 bg-base-100 p-2 rounded-xl shadow-2xl border-2 border-primary/20 w-80 max-h-64 overflow-auto"
                >
                    {/* Lazy-loaded emojis */}
                    <Suspense fallback={<div className="text-center p-4 text-base-content/60">Loading emojis...</div>}>
                        <LazyPicker
                            data={data}
                            onEmojiSelect={handleSelect}
                            perLine={8}
                            theme="light"
                            previewPosition="none"
                            skinTonePosition="none"
                        />
                    </Suspense>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReactionEmojiPicker;
