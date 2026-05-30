const CreatePostRightPanelSkeleton = () => {
    return (
        <div className='flex flex-col gap-2 w-52 my-2'>
            <div className='flex gap-2 items-center'>
                <div className='flex flex-1 justify-between'>
                    <div className='flex flex-col gap-1'>
                        <div className='skeleton h-6 w-52 rounded-full'></div>
                        <div className='skeleton h-6 w-52 rounded-full'></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CreatePostRightPanelSkeleton;
