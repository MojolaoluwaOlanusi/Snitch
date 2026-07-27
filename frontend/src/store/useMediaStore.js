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
    uploadToCloudinary: async (file, folder) => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        set({ isUploading: true });
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', `snitch/${folder}`);
            
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000,
                }
            );
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Cloudinary error:', data);
                throw new Error(data.error?.message || 'Cloudinary upload failed');
            }

            return {
                url: response.data.secure_url,
                publicId: response.data.public_id,
                width: response.data.width,
                height: response.data.height,
                format: response.data.format,
                bytes: response.data.bytes,
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            toast.error("Failed to upload to Cloudinary");
            throw error;
        } finally {
            set({ isUploading: false });
        }
    }
}));