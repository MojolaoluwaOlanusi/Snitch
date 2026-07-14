const AppSkeleton = () => (
    <div className="w-full h-screen flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-[80px] lg:w-[225px] border-r border-base-200 bg-base-100 flex-col p-4">
            <div className="animate-pulse space-y-4">
                <div className="w-10 h-10 bg-base-300 rounded-full mx-auto" />
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-full h-8 bg-base-300 rounded" />
                    ))}
                </div>
            </div>
        </div>
        {/* Main content skeleton */}
        <div className="flex-1 bg-base-200 p-6">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-base-300 rounded w-1/3" />
                <div className="h-48 bg-base-300 rounded" />
                <div className="h-48 bg-base-300 rounded" />
            </div>
        </div>
    </div>
);

export default AppSkeleton;