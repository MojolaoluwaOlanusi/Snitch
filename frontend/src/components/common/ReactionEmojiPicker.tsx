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
    const [search, setSearch] = useState("");
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
                    className="absolute right-0 bottom-full mb-2 z-50 bg-white p-2 rounded-xl shadow-2xl border-2 border-blue-200 w-90 max-h-64 overflow-auto"
                >
                    {/* Search */}
                    {/*<input*/}
                    {/*    type="text"*/}
                    {/*    value={search}*/}
                    {/*    onChange={(e) => setSearch(e.target.value)}*/}
                    {/*    placeholder="Search emoji..."*/}
                    {/*    className="w-full mb-2 p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-200 text-sm"*/}
                    {/*/>*/}

                    {/* Lazy-loaded emojis */}
                    <Suspense fallback={<div className="text-center p-4 text-gray-500">Loading emojis...</div>}>
                        <LazyPicker
                            data={data}
                            onEmojiSelect={handleSelect}
                            perLine={8}
                            theme="light"
                            previewPosition="none"
                            skinTonePosition="none"
                            search={search}
                        />
                    </Suspense>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReactionEmojiPicker;
