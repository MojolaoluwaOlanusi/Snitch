// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore.js";

const EditProfileModal = ({ authUser, isOpen, onClose }) => {
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
    const dialogRef = useRef(null);

    // Sync form with authUser
    useEffect(() => {
        if (authUser) {
            setFormData({
                displayName: authUser.displayName || "",
                username: authUser.username || "",
                email: authUser.email || "",
                bio: authUser.bio || "",
                link: authUser.link || "",
                location: authUser.location || "",
                accountType: authUser.accountType || "",
                accountVisibility: authUser.accountVisibility || "",
            });
        }
    }, [authUser]);

    // Handle open/close for controlled mode
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [isOpen]);

    const handleClose = () => {
        onClose?.();
    };

    const handleBackdropClick = (e) => {
        if (e.target === dialogRef.current) {
            handleClose();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile(formData);
        const oldPwd = (changePasswordData.oldPassword || "").trim();
        const newPwd = (changePasswordData.newPassword || "").trim();
        if (oldPwd.length > 0 && newPwd.length > 0) {
            changePassword({ oldPassword: oldPwd, newPassword: newPwd });
        }
        handleClose();
    };

    return (
        <>
            {/* Only show the trigger button if not controlled */}
            {isOpen === undefined && (
                <button
                    className="btn btn-outline rounded-full btn-sm"
                    onClick={() => dialogRef.current?.showModal()}
                >
                    Edit profile
                </button>
            )}

            <dialog
                id="edit_profile_modal"
                className="modal"
                ref={dialogRef}
                onClick={handleBackdropClick}
            >
                <div
                    className="modal-box border rounded-md border-base-content/40 shadow-md bg-base-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Update Profile</h3>
                        <button
                            onClick={handleClose}
                            className="btn btn-sm btn-circle btn-ghost"
                        >
                            ✕
                        </button>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                placeholder="Display Name"
                                className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                                value={formData.displayName}
                                name="displayName"
                                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                                value={formData.username}
                                name="username"
                                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                                value={formData.email}
                                name="email"
                                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            />
                            <textarea
                                placeholder="Bio"
                                className="flex-1 input border border-base-content/40 rounded p-2 input-md bg-base-200 text-base-content placeholder:text-base-content/50 focus:border-primary focus:ring-1 focus:ring-primary"
                                value={formData.bio}
                                name="bio"
                                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <input
                                type="password"
                                placeholder="Old Password"
                                className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                                value={changePasswordData.oldPassword}
                                onChange={(e) =>
                                    setChangePasswordData({ ...changePasswordData, oldPassword: e.target.value })
                                }
                                name="oldPassword"
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                                value={changePasswordData.newPassword}
                                onChange={(e) =>
                                    setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })
                                }
                                name="newPassword"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <select
                                className="input select"
                                value={formData.accountType}
                                name="accountType"
                                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            >
                                <option>Select an accountType</option>
                                <option>Business</option>
                                <option>Personal</option>
                                <option>Work</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <select
                                className="input select"
                                value={formData.accountVisibility}
                                name="accountVisibility"
                                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            >
                                <option>Select your account visibility</option>
                                <option>Public</option>
                                <option>Private</option>
                                <option>Friends</option>
                            </select>
                        </div>

                        <input
                            type="text"
                            placeholder="Link"
                            className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                            value={formData.link}
                            name="link"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            className="flex-1 input border border-base-content/40 rounded p-2 input-md"
                            value={formData.location}
                            name="location"
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        />

                        <button
                            className="btn btn-primary rounded-full btn-sm text-primary-content"
                            type="submit"
                        >
                            {isUpdatingProfile ? "Updating..." : "Update"}
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
};

export default EditProfileModal;