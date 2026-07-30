import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const PullToRefreshIndicator = ({ pullDistance, isRefreshing }) => {
    return (
        <AnimatePresence>
            {(pullDistance > 20 || isRefreshing) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: Math.max(pullDistance - 40, 0) }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10"
                >
                    <div className="bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-primary/20">
                        <RefreshCw
                            className={`w-4 h-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
                        />
                        <span className="text-xs text-primary font-medium">
              {isRefreshing
                  ? 'Refreshing...'
                  : pullDistance > 80
                      ? 'Release to refresh'
                      : 'Pull to refresh'}
            </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PullToRefreshIndicator;