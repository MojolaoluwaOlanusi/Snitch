import {FaArrowLeft} from "react-icons/fa";

const ProfileHeaderSkeleton = () => {
	return (
		<div className='flex flex-col gap-2 w-full my-2 p-4'>
			<div className='flex gap-2 items-center'>
				<div className='flex flex-1 gap-1'>
					<div className='flex flex-col gap-4 w-full'>
                        <div className="flex flex-col space-y-2">
                            <div className='skeleton h-4 w-1/4 rounded-full'></div>
                            <div className='skeleton h-4 w-20 rounded-full'></div>
                        </div>
                        <div className='skeleton h-40 w-full relative'>
                            <div className='skeleton h-20 w-20 rounded-full border absolute -bottom-10 left-3'></div>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <div className='skeleton h-4 w-1/4 rounded-full mt-4'></div>
                                <div className='skeleton h-4 w-24 rounded-full'></div>
                            </div>
                            <div className="flex flex-row space-x-1">
                                <div className='skeleton h-4 w-24 rounded-full'></div>
                                <div className='skeleton h-4 w-40 rounded-full'></div>
                                <div className='skeleton h-4 w-24 rounded-full'></div>
                                <div className='skeleton h-4 w-32 rounded-full'></div>
                            </div>
                            <div className="flex flex-row space-x-2">
                                <div className='skeleton h-4 w-16 rounded-full'></div>
                                <div className='skeleton h-4 w-16 rounded-full'></div>
                            </div>
                        </div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default ProfileHeaderSkeleton;
