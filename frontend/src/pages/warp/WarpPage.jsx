import Sidebar from "../../components/common/Sidebar.jsx";

const WarpPage = () => {
    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar />
            <main className="flex-1 bg-base-100 overflow-y-auto">
                {/* Spacer for hamburger on mobile */}
                <div className="h-14 lg:hidden" />

                <div className="flex flex-col items-center justify-center h-full px-4 text-center space-y-4">
                    <span className="text-3xl sm:text-5xl md:text-6xl text-slate-400 font-bold animate-pulse">
                        Page in progress.
                    </span>
                    <span className="text-xl sm:text-3xl md:text-4xl text-slate-300 font-bold">
                        Coming soon...
                    </span>
                </div>
            </main>
        </div>
    );
};

export default WarpPage;