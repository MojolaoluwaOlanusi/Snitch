import { RefreshCw } from 'lucide-react';

const PullToRefreshIndicator = ({ pullDistance, isRefreshing }) => {
    if (pullDistance < 20 && !isRefreshing) return null;

    return (
        <div
            className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none transition-all duration-200 z-10"
            style={{ transform: `translateY(${Math.max(pullDistance - 40, 0)}px)` }}
        >
            <div className="bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-primary/20">
                <RefreshCw className={`w-4 h-4 text-primary ${isRefreshing || pullDistance > 80 ? 'animate-spin' : ''}`} />
                <span className="text-xs text-primary font-medium">
                    {isRefreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
                </span>
            </div>
        </div>
    );
};

export default PullToRefreshIndicator;