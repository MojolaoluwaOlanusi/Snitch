import { useEffect, useState, useRef } from "react";
import {useAuthStore} from "../../store/useAuthStore";

const EditProfileModal = ({ authUser }) => {
	const [formData, setFormData] = useState({
		displayName: "",
		username: "",
		email: "",
		bio: "",
		link: "",
        location: "",
		accountType: "",
        accountVisibility: "",
	});

	const { updateProfile, isUpdatingProfile, changePassword } = useAuthStore();

    const [changePasswordData, setChangePasswordData] = useState({ oldPassword: "", newPassword: "" });
    const modalRef = useRef(null);

    const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

    const handleCloseModal = () => {
        const modal = document.getElementById("edit_profile_modal");
        if (modal) {
            modal.close();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === modalRef.current) {
            handleCloseModal();
        }
    };

	useEffect(() => {
		if (authUser) {
			setFormData({
				displayName: authUser.displayName,
				username: authUser.username,
				email: authUser.email,
				bio: authUser.bio,
				link: authUser.link,
                location: authUser.location,
				accountType: authUser.accountType,
                accountVisibility: authUser.accountVisibility,
			});
		}
	}, [authUser]);

	return (
		<>
			<button
				className='btn btn-outline rounded-full btn-sm'
				onClick={() => document.getElementById("edit_profile_modal").showModal()}
			>
				Edit profile
			</button>
			<dialog id='edit_profile_modal' className='modal' ref={modalRef} onClick={handleBackdropClick}>
				<div className='modal-box border rounded-md border-gray-700 shadow-md' onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className='font-bold text-lg'>Update Profile</h3>
                        <button
                            onClick={handleCloseModal}
                            className="btn btn-sm btn-circle btn-ghost"
                        >
                            ✕
                        </button>
                    </div>
					<form
						className='flex flex-col gap-4'
						onSubmit={(e) => {
							e.preventDefault();
							updateProfile(formData);
							// only attempt a password change when both fields are provided (non-empty after trimming)
							const oldPwd = (changePasswordData.oldPassword || '').trim();
							const newPwd = (changePasswordData.newPassword || '').trim();
							if (oldPwd.length > 0 && newPwd.length > 0) {
								changePassword({ oldPassword: oldPwd, newPassword: newPwd });
							}
						}}
					>
						<div className='flex flex-wrap gap-2'>
							<input
								type='text'
								placeholder='Display Name'
								className='flex-1 input border border-gray-700 rounded p-2 input-md'
								value={formData.displayName}
								name='displayName'
								onChange={handleInputChange}
							/>
							<input
								type='text'
								placeholder='Username'
								className='flex-1 input border border-gray-700 rounded p-2 input-md'
								value={formData.username}
								name='username'
								onChange={handleInputChange}
							/>
						</div>
						<div className='flex flex-wrap gap-2'>
							<input
								type='email'
								placeholder='Email'
								className='flex-1 input border border-gray-700 rounded p-2 input-md'
								value={formData.email}
								name='email'
								onChange={handleInputChange}
							/>
							<textarea
								placeholder='Bio'
								className='flex-1 input border border-gray-700 rounded p-2 input-md'
								value={formData.bio}
								name='bio'
								onChange={handleInputChange}
							/>
						</div>
                        <div className='flex flex-wrap gap-2'>
                            <input
                                type='text'
                                placeholder='Old Password'
                                className='flex-1 input border border-gray-700 rounded p-2 input-md'
                                value={changePasswordData.oldPassword}
                                onChange={(e) => setChangePasswordData({ ...changePasswordData, oldPassword: e.target.value })}
                                name='Old Password'
                            />
                            <input
                                type='text'
                                placeholder='New Password'
                                className='flex-1 input border border-gray-700 rounded p-2 input-md'
                                value={changePasswordData.newPassword}
                                onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                                name='New Password'
                            />
                        </div>
						<div className='flex flex-wrap gap-2'>
                            <div className="relative w-full">
                                <select className="input select"
                                        value={formData.accountType}
                                        onChange={handleInputChange}
                                        name='accountType'
                                >
                                    <option>Select an accountType</option>
                                    <option>Business</option>
                                    <option>Personal</option>
                                    <option>Work</option>
                                </select>
                            </div>
						</div>
                        <div className='flex flex-wrap gap-2'>
                            <div className="relative w-full">
                                <select className="input select"
                                        value={formData.accountVisibility}
                                        onChange={handleInputChange}
                                        name='accountVisibility'
                                >
                                    <option>Select your account visibility</option>
                                    <option>Public</option>
                                    <option>Private</option>
                                    <option>Friends</option>
                                </select>
                            </div>
                        </div>
						<input
							type='text'
							placeholder='Link'
							className='flex-1 input border border-gray-700 rounded p-2 input-md'
							value={formData.link}
							name='link'
							onChange={handleInputChange}
						/>
                        <input
                            type='text'
                            placeholder='Location'
                            className='flex-1 input border border-gray-700 rounded p-2 input-md'
                            value={formData.location}
                            name='location'
                            onChange={handleInputChange}
                        />
						<button className='btn btn-primary rounded-full btn-sm text-white' onClick={handleCloseModal}>
							{isUpdatingProfile ? "Updating..." : "Update"}
						</button>
					</form>
				</div>
			</dialog>
		</>
	);
};
export default EditProfileModal;
