import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LazyPicker = lazy(async () => {
    const mod = await import("@emoji-mart/react");
    return { default: mod.default };
});
import data from "@emoji-mart/data";

interface Props {
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
}

const categories = [
    { id: "smileys", label: "😊" },
    { id: "people", label: "🧑" },
    { id: "animals", label: "🐶" },
    { id: "food", label: "🍔" },
    { id: "activity", label: "⚽" },
    { id: "travel", label: "✈️" },
    { id: "objects", label: "💡" },
    { id: "symbols", label: "❤️" },
    { id: "flags", label: "🏳️" },
];

const EmojiPicker: React.FC<Props> = ({ inputRef, value, setValue }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [recent, setRecent] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("smileys");
    const [panelBottom, setPanelBottom] = useState(40);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    // Load recent emojis
    useEffect(() => {
        const stored = localStorage.getItem("recentEmojis");
        try {
            const stored = localStorage.getItem("recentEmojis");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setRecent(parsed);
                } else {
                    setRecent([]);
                }
            }
        } catch (err) {
            setRecent([]);
        }
    }, []);

    const saveRecent = (emoji: string) => {
        const updated = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 20);
        setRecent(updated);
        localStorage.setItem("recentEmojis", JSON.stringify(updated));
    };

    const handleSelect = (emoji: any) => {
        if (inputRef.current) {
            const el = inputRef.current;
            const start = el.selectionStart || 0;
            const end = el.selectionEnd || 0;

            const newValue =
                value.slice(0, start) +
                emoji.native +
                value.slice(end);

            setValue(newValue);

            setTimeout(() => {
                el.focus();
                el.setSelectionRange(
                    start + emoji.native.length,
                    start + emoji.native.length
                );
            }, 0);

            saveRecent(emoji.native);
        }
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(e.target as Node) &&
            buttonRef.current &&
            !buttonRef.current.contains(e.target as Node)
        ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard-aware dynamic panel
    useEffect(() => {
        const updatePanel = () => {
            let viewportHeight = window.visualViewport?.height || window.innerHeight;
            let inputBottom = inputRef.current?.getBoundingClientRect().bottom || viewportHeight;
            const bottomOffset = viewportHeight - inputBottom + 10; // panel floats above input
            setPanelBottom(Math.max(bottomOffset, 10));
        };

        window.addEventListener("resize", updatePanel);
        window.addEventListener("focusin", updatePanel);
        window.addEventListener("focusout", updatePanel);
        window.visualViewport?.addEventListener("resize", updatePanel);

        return () => {
            window.removeEventListener("resize", updatePanel);
            window.removeEventListener("focusin", updatePanel);
            window.removeEventListener("focusout", updatePanel);
            window.visualViewport?.removeEventListener("resize", updatePanel);
        };
    }, [inputRef]);

    // Snap to active category
    useEffect(() => {
        if (categoryScrollRef.current) {
            const activeBtn = categoryScrollRef.current.querySelector(`#cat-${activeCategory}`);
            if (activeBtn) {
                (activeBtn as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "center" });
            }
        }
    }, [activeCategory]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative w-full md:w-auto">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="text-2xl p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
                😊
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={pickerRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 z-50 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg flex flex-col md:max-w-[360px] w-full"
                        style={{ bottom: panelBottom }}
                    >
                        {/* Search */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search emoji..."
                            className="w-full mb-2 p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />

                        {/* Sticky bottom categories */}
                        <div
                            ref={categoryScrollRef}
                            className="flex gap-1 overflow-x-auto py-1 sticky bottom-0 bg-white dark:bg-gray-800 z-20 border-t dark:border-gray-600"
                        >
                            {categories.map((c) => (
                                <button
                                    id={`cat-${c.id}`}
                                    key={c.id}
                                    onClick={() => setActiveCategory(c.id)}
                                    className={`text-lg p-1 flex-shrink-0 rounded ${
                                        activeCategory === c.id ? "bg-gray-300 dark:bg-gray-700" : ""
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        {/* Recently used */}
                        {recent.length > 0 && (
                            <div className="flex flex-wrap mb-2 gap-1">
                                {recent.map((e, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect({ native: e })}
                                        className="text-xl hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition"
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Lazy-loaded emojis */}
                        <Suspense fallback={<div className="text-center p-4">Loading emojis...</div>}>
                            <LazyPicker
                                data={data}
                                onEmojiSelect={handleSelect}
                                perLine={4}
                                theme="light"
                                previewPosition="none"
                                skinTonePosition="none"
                                search={search}
                            />
                        </Suspense>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmojiPicker;