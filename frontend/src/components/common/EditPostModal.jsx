import { useEffect, useState } from "react";
import {useUserStore} from "../../store/useUserStore";
import {EditIcon} from "lucide-react";
import {IoClose} from "react-icons/io5";

const EditPostModal = ({ post }) => {
    const [formData, setFormData] = useState({
        text: "",
        mediaType: "",
        url: "",
        id: "",
    });

    const { editPost, isEditing } = useUserStore();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (post) {
            setFormData({
                text: post.text,
                mediaType: post.mediaType,
                url: post.url,
                id: post._id,
            });
        }
    }, [post]);

    return (
        <>
            <button
                className="text-gray-500"
                onClick={() => document.getElementById("edit_post_modal").showModal()}
            >
                <div className="flex flex-row group w-40 justify-between">
                    <p className="group-hover:text-blue-500">Edit post</p>
                    <EditIcon className="h-4 w-4 group-hover:text-blue-500" />
                </div>
            </button>
            <dialog id='edit_post_modal' className='modal'>
                <div className='modal-box border rounded-md border-gray-700 shadow-md'>
                    <div className="flex flex-row justify-between">
                        <h3 className='font-bold text-lg my-3'>Edit Post</h3>
                        <div>
                            <form method='dialog' className='modal-backdrop'>
                                <button className='outline-none'><IoClose className="text-black h-6 w-6"/></button>
                            </form>
                        </div>
                    </div>
                    <form
                        className='flex flex-col gap-4'
                        onSubmit={(e) => {
                            e.preventDefault();
                            editPost(formData);
                        }}
                    >
                        <div className='flex flex-wrap gap-2'>
                            <div className="justify-items-center flex items-center justify-center">
                                <h3 className="text-lg text-gray-500">Select Your MediaType</h3>
                            </div>
                            <div className="relative w-full">
                                <select className="input select"
                                        value={formData.mediaType}
                                        onChange={handleInputChange}
                                        name='mediaType'
                                >
                                    <option>Select a MediaType</option>
                                    <option>None</option>
                                    <option>Audio</option>
                                    <option>Video</option>
                                    <option>Image</option>
                                </select>
                            </div>
                        </div>
                        <input
                            type='text'
                            placeholder='Post Content'
                            className='flex-1 input border border-gray-700 rounded p-2 input-md h-52'
                            value={formData.text}
                            name='text'
                            onChange={handleInputChange}
                        />
                        <input
                            type='text'
                            placeholder='Media Url'
                            className='flex-1 input border border-gray-700 rounded p-2 input-md'
                            value={formData.url}
                            name='url'
                            onChange={handleInputChange}
                        />
                        <button className='btn btn-primary rounded-full btn-sm text-white'>
                            {isEditing ? "Updating..." : "Update"}
                        </button>
                    </form>
                </div>
                <form method='dialog' className='modal-backdrop'>
                    <button className='outline-none'>close</button>
                </form>
            </dialog>
        </>
    );
};
export default EditPostModal;
