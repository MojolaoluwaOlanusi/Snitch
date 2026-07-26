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
    
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [displayNameError, setDisplayNameError] = useState('');
    const [bioError, setBioError] = useState('');
    const [linkError, setLinkError] = useState('');
    const [oldPasswordError, setOldPasswordError] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');

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

    const validateUsername = (value) => {
        const cleaned = value.replace(/[\s@]/g, '');
        if (value !== cleaned) {
            setUsernameError('Username cannot contain spaces or "@"');
        } else if (cleaned.length < 3) {
            setUsernameError('Username must be at least 3 characters');
        } else if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
            setUsernameError('Username can only contain letters, numbers, and underscores');
        } else {
            setUsernameError('');
        }
        setFormData({ ...formData, username: cleaned });
    };

    const validateEmail = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError('Email is required');
        } else if (!emailRegex.test(value)) {
            setEmailError('Please provide a valid email address');
        } else {
            setEmailError('');
        }
        setFormData({ ...formData, email: value });
    };

    const validateDisplayName = (value) => {
        if (value.length > 50) {
            setDisplayNameError('Display name must not exceed 50 characters');
        } else {
            setDisplayNameError('');
        }
        setFormData({ ...formData, displayName: value });
    };

    const validateBio = (value) => {
        if (value.length > 500) {
            setBioError('Bio must not exceed 500 characters');
        } else {
            setBioError('');
        }
        setFormData({ ...formData, bio: value });
    };

    const validateLink = (value) => {
        if (!value) {
            setLinkError('');
            setFormData({ ...formData, link: value });
            return;
        }
        try {
            new URL(value);
            setLinkError('');
        } catch {
            setLinkError('Please provide a valid URL');
        }
        setFormData({ ...formData, link: value });
    };

    const validateOldPassword = (value) => {
        if (!value) {
            setOldPasswordError('Current password is required');
        } else {
            setOldPasswordError('');
        }
        setChangePasswordData({ ...changePasswordData, oldPassword: value });
    };

    const validateNewPassword = (value) => {
        if (!value) {
            setNewPasswordError('New password is required');
        } else if (value.length < 8) {
            setNewPasswordError('Password must be at least 8 characters');
        } else {
            setNewPasswordError('');
        }
        setChangePasswordData({ ...changePasswordData, newPassword: value });
    };

    const isFormValid = () => {
        const hasPasswordChange = changePasswordData.oldPassword || changePasswordData.newPassword;
        const passwordValid = !hasPasswordChange || (!oldPasswordError && !newPasswordError && changePasswordData.oldPassword && changePasswordData.newPassword);
        return !usernameError && !emailError && !displayNameError && !bioError && !linkError && passwordValid;
    };

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
        if (isFormValid()) {
            updateProfile(formData);
            const oldPwd = (changePasswordData.oldPassword || "").trim();
            const newPwd = (changePasswordData.newPassword || "").trim();
            if (oldPwd.length > 0 && newPwd.length > 0) {
                changePassword({ oldPassword: oldPwd, newPassword: newPwd });
            }
            handleClose();
        }
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
                                className={`flex-1 input border border-base-content/40 rounded p-2 input-md ${displayNameError ? 'border-red-500' : ''}`}
                                value={formData.displayName}
                                name="displayName"
                                onChange={(e) => validateDisplayName(e.target.value)}
                                onBlur={(e) => validateDisplayName(e.target.value)}
                            />
                            {displayNameError && <p className="text-error text-xs mt-1">{displayNameError}</p>}
                            <input
                                type="text"
                                placeholder="Username"
                                className={`flex-1 input border border-base-content/40 rounded p-2 input-md ${usernameError ? 'border-red-500' : ''}`}
                                value={formData.username}
                                name="username"
                                onChange={(e) => validateUsername(e.target.value)}
                                onBlur={(e) => validateUsername(e.target.value)}
                            />
                            {usernameError && <p className="text-error text-xs mt-1">{usernameError}</p>}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                className={`flex-1 input border border-base-content/40 rounded p-2 input-md ${emailError ? 'border-red-500' : ''}`}
                                value={formData.email}
                                name="email"
                                onChange={(e) => validateEmail(e.target.value)}
                                onBlur={(e) => validateEmail(e.target.value)}
                            />
                            {emailError && <p className="text-error text-xs mt-1">{emailError}</p>}
                            <textarea
                                placeholder="Bio"
                                className={`flex-1 input border border-base-content/40 rounded p-2 input-md bg-base-200 text-base-content placeholder:text-base-content/50 focus:border-primary focus:ring-1 focus:ring-primary ${bioError ? 'border-red-500' : ''}`}
                                value={formData.bio}
                                name="bio"
                                onChange={(e) => validateBio(e.target.value)}
                                onBlur={(e) => validateBio(e.target.value)}
                            />
                            {bioError && <p className="text-error text-xs mt-1">{bioError}</p>}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <input
                                type="password"
                                placeholder="Old Password"
                                className={`flex-1 input border border-base-content/40 rounded p-2 input-md ${oldPasswordError ? 'border-red-500' : ''}`}
                                value={changePasswordData.oldPassword}
                                onChange={(e) => validateOldPassword(e.target.value)}
                                onBlur={(e) => validateOldPassword(e.target.value)}
                                name="oldPassword"
                            />
                            {oldPasswordError && <p className="text-error text-xs mt-1">{oldPasswordError}</p>}
                            <input
                                type="password"
                                placeholder="New Password"
                                className={`flex-1 input border border-base-content/40 rounded p-2 input-md ${newPasswordError ? 'border-red-500' : ''}`}
                                value={changePasswordData.newPassword}
                                onChange={(e) => validateNewPassword(e.target.value)}
                                onBlur={(e) => validateNewPassword(e.target.value)}
                                name="newPassword"
                            />
                            {newPasswordError && <p className="text-error text-xs mt-1">{newPasswordError}</p>}
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
                            className={`flex-1 input border border-base-content/40 rounded p-2 input-md ${linkError ? 'border-red-500' : ''}`}
                            value={formData.link}
                            name="link"
                            onChange={(e) => validateLink(e.target.value)}
                            onBlur={(e) => validateLink(e.target.value)}
                        />
                        {linkError && <p className="text-error text-xs mt-1">{linkError}</p>}
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
                            disabled={isUpdatingProfile || !isFormValid()}
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