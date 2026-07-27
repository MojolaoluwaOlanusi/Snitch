import { create } from 'zustand';
import axiosInstance  from "../lib/axios.js";
import { toast } from 'sonner'
import axios from "axios";

export const useMediaStore = create((set) => ({
    uploadUrl: "",
    publicUrl: "",
    avatarUrl: "",
    coverImgUrl: "",
    hasSignedUrl: false,
    isUploading: false,

    getUploadUrl: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post("/media/upload-url", data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ uploadUrl: res.data.uploadUrl });
            set({ publicUrl: res.data.publicUrl });
            set({ hasSignedUrl: true });
            localStorage.setItem('uploadUrl', `${res.data.uploadUrl}`);
            localStorage.setItem('publicUrl', `${res.data.publicUrl}`);
        } catch (error) {
            console.log("Error in getting Upload Url:", error);
            set({ uploadUrl: "" });
            set({ hasSignedUrl: false });
        } finally {
            set({ hasSignedUrl: false });
        }
    },

    getCoverImgUploadUrl: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post("/media/upload-url", data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ uploadUrl: res.data.uploadUrl });
            set({ coverImgUrl: res.data.publicUrl });
            set({ hasSignedUrl: true });
            localStorage.setItem('uploadUrl', `${res.data.uploadUrl}`)
            localStorage.setItem('coverImgPublicUrl', `${res.data.publicUrl}`)
        } catch (error) {
            console.log("Error in getting Upload Url:", error);
            set({ uploadUrl: "" });
            set({ hasSignedUrl: false });
        } finally {
            set({ hasSignedUrl: false });
        }
    },

    getAvatarImgUploadUrl: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post("/media/upload-url", data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ uploadUrl: res.data.uploadUrl });
            set({ avatarUrl: res.data.publicUrl });
            set({ hasSignedUrl: true });
            localStorage.setItem('uploadUrl', `${res.data.uploadUrl}`)
            localStorage.setItem('avatarImgPublicUrl', `${res.data.publicUrl}`)
        } catch (error) {
            console.log("Error in getting Upload Url:", error);
            set({ uploadUrl: "" });
            set({ hasSignedUrl: false });
        } finally {
            set({ hasSignedUrl: false });
        }
    },

    uploadMedia: async (data) => {
        set({ isUploading: true });
        try {
            const uploadUrl = localStorage.getItem('uploadUrl');
            await axiosInstance.put( `${uploadUrl}`, data);
        } catch (error) {
            console.log(`Error in uploading Media : ${error}`);
            toast.error("Failed to Upload Media");
            set({ isUploading: false });
        } finally {
            set({ isUploading: false });
        }
    },

    // Upload directly to Cloudinary (for avatar/cover images)
    uploadToCloudinary: async (file, folder, updateProfileField = null) => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        set({ isUploading: true });
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', `snitch/${folder}`);
            
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 600000, // 10 minutes for large files
                }
            );
            
            const data = response.data;
            
            if (!data.secure_url) {
                throw new Error('No URL returned from Cloudinary');
            }

            // If updateProfileField is provided, update the user profile
            if (updateProfileField) {
                const token = localStorage.getItem('access-token');
                const profileRes = await axiosInstance.put('/auth/update-profile', 
                    { [updateProfileField]: data.secure_url },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                // Return the profile response so the caller can update the state
                return {
                    url: data.secure_url,
                    publicId: data.public_id,
                    width: data.width,
                    height: data.height,
                    format: data.format,
                    bytes: data.bytes,
                    profileUpdated: profileRes.data,
                };
            }

            return {
                url: data.secure_url,
                publicId: data.public_id,
                width: data.width,
                height: data.height,
                format: data.format,
                bytes: data.bytes,
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to upload to Cloudinary';
            toast.error(errorMessage);
            throw new Error(errorMessage);
        } finally {
            set({ isUploading: false });
        }
    }
}));