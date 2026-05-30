const PostPageSkeleton = () => {
    return (
        <div className='flex flex-col gap-2 w-full my-2 p-4'>
            <div className='flex gap-2 items-center'>
                <div className='flex flex-1 gap-1'>
                    <div className='flex flex-col gap-1 w-full space-y-4'>
                        <div className='skeleton h-80 w-full relative'></div>
                        <div className="flex flex-col gap-1 w-full">
                            <div className='skeleton h-4 w-3/3 rounded-full'></div>
                            <div className='skeleton h-4 w-3/3 rounded-full'></div>
                            <div className='skeleton h-4 w-3/3 rounded-full'></div>
                        </div>
                        <div className="flex flex-row justify-between">
                            <div className='skeleton h-4 w-12 rounded-full'></div>
                            <div className='skeleton h-4 w-12 rounded-full'></div>
                            <div className='skeleton h-4 w-12 rounded-full'></div>
                            <div className='skeleton h-4 w-12 rounded-full'></div>
                        </div>
                        <div className='skeleton h-32 w-full relative'></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default PostPageSkeleton
