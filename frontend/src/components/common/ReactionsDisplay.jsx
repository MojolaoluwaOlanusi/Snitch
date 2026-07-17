// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ReactionsDisplay = ({ reactions = [] }) => {
    const [showAll, setShowAll] = useState(false);
    if (!reactions.length) return null;

    const countMap = reactions.reduce((acc, r) => {
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});
    const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    const top3 = sorted.slice(0, 3);
    const more = sorted.length > 3;

    return (
        <>
            <div className="flex items-center gap-0.5">
                {top3.map(([emoji]) => (
                    <span
                        key={emoji}
                        className="text-xs bg-base-200 rounded-full px-1.5 py-0.5"
                    >
            {emoji}
          </span>
                ))}
                {more && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-xs text-primary hover:underline ml-1"
                        aria-label="Show all reactions"
                    >
                        +{sorted.length - 3}
                    </button>
                )}
            </div>

            {/* Full reactions modal */}
            <AnimatePresence>
                {showAll && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowAll(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-base-100 rounded-2xl border p-6 w-full max-w-sm shadow-xl max-h-80 overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-base-content">
                                    Reactions
                                </h3>
                                <button
                                    onClick={() => setShowAll(false)}
                                    className="p-2 hover:bg-base-200 rounded-full"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {sorted.map(([emoji, count]) => (
                                    <div
                                        key={emoji}
                                        className="flex items-center gap-1 bg-base-200 rounded-lg p-2"
                                    >
                                        <span className="text-lg">{emoji}</span>
                                        <span className="text-sm text-base-content">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ReactionsDisplay;