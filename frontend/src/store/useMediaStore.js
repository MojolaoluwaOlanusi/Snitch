import { create } from 'zustand';
import axiosInstance  from "../lib/axios";
import toast from "react-hot-toast";

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
    }
}));