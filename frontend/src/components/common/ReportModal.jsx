// @ts-nocheck
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const REASONS = [
    "pornographic",
    "piracy",
    "violence",
    "cyberbully",
    "impersonation",
    "abuse",
];

const ReportModal = ({ isOpen, onClose, onReport }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-base-100 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-base-content">
                                Report Post
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-base-200 rounded-full"
                                aria-label="Close report modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-base-content/70 mb-4">
                            Select a reason:
                        </p>
                        <div className="space-y-2">
                            {REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => {
                                        onReport(reason);
                                        onClose();
                                    }}
                                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-base-200 text-base-content capitalize"
                                    aria-label={`Report for ${reason}`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReportModal;