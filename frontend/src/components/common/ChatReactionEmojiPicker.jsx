import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load emoji picker
const LazyPicker = lazy(async () => {
    const mod = await import("@emoji-mart/react");
    return { default: mod.default };
});
import data from "@emoji-mart/data";

const ReactionEmojiPicker = ({ postId, onReact, onClose, isOpen }) => {
    const pickerRef = useRef(null);

    const handleSelect = (emoji) => {
        onReact(emoji.native);
        onClose();
    };

    // Close on outside click
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

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100"
                >
                    <Suspense fallback={
                        <div className="text-center p-4 text-gray-400 text-sm">Loading...</div>
                    }>
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
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReactionEmojiPicker;