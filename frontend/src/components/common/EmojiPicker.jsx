import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LazyPicker = lazy(async () => {
    const mod = await import("@emoji-mart/react");
    return { default: mod.default };
});
import data from "@emoji-mart/data";

const EmojiPicker = ({ inputRef, value, setValue }) => {
    const [recent, setRecent] = useState([]);
    const pickerRef = useRef(null);

    // Load recent emojis from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem("recentEmojis");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) setRecent(parsed.slice(0, 20));
            }
        } catch {
            setRecent([]);
        }
    }, []);

    const saveRecent = (emoji) => {
        const updated = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 20);
        setRecent(updated);
        localStorage.setItem("recentEmojis", JSON.stringify(updated));
    };

    const handleSelect = (emoji) => {
        if (inputRef && inputRef.current) {
            const el = inputRef.current;
            const start = el.selectionStart || 0;
            const end = el.selectionEnd || 0;

            const newValue = value.slice(0, start) + emoji.native + value.slice(end);
            setValue(newValue);

            setTimeout(() => {
                el.focus();
                const newPos = start + emoji.native.length;
                el.setSelectionRange(newPos, newPos);
            }, 50);

            saveRecent(emoji.native);
        }
    };

    return (
        <div
            ref={pickerRef}
            className="bg-white rounded-xl shadow-xl border border-gray-100 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:w-80 max-h-96 overflow-hidden flex flex-col"
        >
            {/* Recent emojis */}
            {recent.length > 0 && (
                <div className="p-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 mb-1 px-1">Recent</p>
                    <div className="flex flex-wrap gap-0.5">
                        {recent.map((emoji, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect({ native: emoji })}
                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Full emoji picker – always 7 per row, emoji size 24 */}
            <div className="flex-1 overflow-y-auto">
                <Suspense fallback={
                    <div className="flex items-center justify-center p-8 text-gray-400 text-sm">
                        Loading emojis...
                    </div>
                }>
                    <LazyPicker
                        data={data}
                        onEmojiSelect={handleSelect}
                        perLine={7}
                        emojiSize={24}
                        theme="light"
                        previewPosition="none"
                        skinTonePosition="none"
                        maxFrequentRows={2}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default EmojiPicker;