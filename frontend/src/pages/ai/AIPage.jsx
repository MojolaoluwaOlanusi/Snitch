import Sidebar from "../../components/common/Sidebar";

const AIPage = () => {
    return (
        <div className="w-full flex flex-col md:flex-row h-screen">
            <Sidebar/>
            <div className="flex-col items-center w-full h-screen">
                <div className="h-screen w-full bg-blue-100 rounded-lg ">
                    <div className="justify-items-center justify-center items-center flex flex-col px-6 py-60 space-y-5">
                        <span className="text-6xl text-slate-400 font-bold animate-pulse skeleton">Page in progress.</span>
                        <span className="text-slate-300 font-bold text-4xl">Coming soon...</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default AIPage
