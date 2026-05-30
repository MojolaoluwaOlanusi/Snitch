import {create} from "zustand";
import axiosInstance  from "../lib/axios";
import toast from "react-hot-toast";
import {useAuthStore} from "./useAuthStore";

export const useUserStore = create((set) => ({
    searchResult: [],
    suggestedUsers: [],
    users: [],
    userPosts: [],
    truncatedPosts: [],
    isReporting: false,
    singlePost: null,
    Posts: [],
    isReposting: false,
    isIncognito: false,
    isDeleting: false,
    isCommenting: false,
    isLiking: false,
    isReacting: false,
    notifications: null,
    comment: null,
    commentedPost: false,
    likedPosts: [],
    likedPost: false,
    deletedPost: false,
    reactedToPost: false,
    editedPost: false,
    isFollowingUser: false,
    isCreatingPost: false,
    reposted: false,
    Repost: null,
    post: null,
    postAuthor: null,
    createdPost: false,
    isGettingSinglePost: false,
    isGettingFollowingPosts: false,
    isGettingNotifications: false,
    isGettingPostAuthor: false,
    isGettingSuggestedUsers: false,
    isSearching: false,
    isGettingUsers: false,
    isEditing: false,
    isGettingUserPosts: false,
    isGettingLikedPosts: false,
    isGettingPosts: false,
    followingPosts: [],

    getSuggestedUsers: async () => {
        set({ isGettingSuggestedUsers: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/auth/get-suggested-users",{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            set({ suggestedUsers: res.data });

        } catch (error) {
            console.log("Error in getting suggested users:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isGettingSuggestedUsers: false });
        }
    },

    getAllUsers: async () => {
        set({ isGettingUsers: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/auth/get-users",{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            set({ users: res.data });

        } catch (error) {
            console.log("Error in getting users:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isGettingUsers: false });
        }
    },

    getPostAuthor: async (data) => {
        set({ isGettingPostAuthor: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/auth/get-user-by-id/${data}`,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            set({ postAuthor: res.data });

        } catch (error) {
            console.log("Error in getting post author:", error);
        } finally {
            set({ isGettingPostAuthor: false });
        }
    },

    followUser: async (data) => {
        async function refreshSuggestedUsers() {
            set({ isGettingSuggestedUsers: true });
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get("/auth/get-suggested-users",{
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                set({ suggestedUsers: res.data });

            } catch (error) {
                console.log("Error in getting suggested users:", error);
                toast.error(error.response.data.message);
            } finally {
                set({ isGettingSuggestedUsers: false });
            }
        }
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/auth/follow`, data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            await refreshSuggestedUsers();
            set({ isFollowingUser: true });
            if (res.data.message === "User followed successfully"){
                toast.success("Successfully followed User");
            }
            if (res.data.message === "User unfollowed successfully"){
                toast.success("Successfully unfollowed User");
            }
        } catch (error) {
            console.log("Error in following user:", error);
            if (error.response.data.message === "You can't follow/unfollow yourself") {
                toast.error("You can't follow Yourself!");
            } else {
                toast.error("Something went wrong,Please try again.");
            }
            set({ isFollowingUser: false });
        } finally {
            set({ isFollowingUser: false });
        }
    },

    createPost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        async function refreshTruncatedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-truncated-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ truncatedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Truncated Posts:", error);
                toast.error("Failed to get User Posts!");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            const res = await axiosInstance.post(`/posts/`, data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isCreatingPost: true });
            set({ post : res.data });
            set({ createdPost: true });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
                await refreshTruncatedPosts(user);
            }
            toast.success("Post created successfully");
        } catch (error) {
            console.log("Error in Creating Post:", error);
            toast.error(error.response.data.message);
            set({ isCreatingPost: false });
            set({ createdPost: false });
        } finally {
            set({ isCreatingPost: false });
            set({ createdPost: false });
        }
    },

    getUserPosts: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingUserPosts: true });
            set({ userPosts: res.data });
        } catch (error) {
            console.log("Error in Getting User Posts:", error);
            toast.error("Failed to get User Posts!");
            set({ isGettingUserPosts: false });
        } finally {
            set({ isGettingUserPosts: false });
        }
    },

    getTruncatedPosts: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/posts/get-truncated-posts/${data}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingUserPosts: true });
            set({ truncatedPosts: res.data });
        } catch (error) {
            console.log("Error in Getting Truncated Posts:", error);
            toast.error("Failed to get User Posts!");
            set({ isGettingUserPosts: false });
        } finally {
            set({ isGettingUserPosts: false });
        }
    },

    getLikedPosts: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingLikedPosts: true });
            set({ likedPosts: res.data });
        } catch (error) {
            console.log("Error in Getting Liked Posts:", error);
            toast.error("Failed to get Liked Posts!");
            set({ isGettingLikedPosts: false });
        } finally {
            set({ isGettingLikedPosts: false });
        }
    },

    getFollowingPosts: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/posts/get-following-posts`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingFollowingPosts: true });
            set({ followingPosts: res.data });
        } catch (error) {
            console.log("Error in Getting Liked Posts:", error);
            toast.error("Failed to get Liked Posts!");
            set({ isGettingFollowingPosts: false });
        } finally {
            set({ isGettingFollowingPosts: false });
        }
    },

    getPosts: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/posts/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingPosts: true });
            set({ Posts: res.data });
        } catch (error) {
            console.log("Error in Getting  Posts:", error);
            toast.error("Failed to get  Posts");
            set({ isGettingPosts: false });
        } finally {
            set({ isGettingPosts: false });
        }
    },

    likePost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            const res = await axiosInstance.post(`/posts/like/${data}`, data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({isLiking: true});
            set({ likedPost: true });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
            if (res.data.message === "Successfully Unliked Post"){
                toast.success("Successfully unliked post");
            }
            if (res.data.message === "Successfully Liked Post"){
                toast.success("Successfully liked post");
            }
        } catch (error) {
            console.log("Error in Liking  Post:", error);
            toast.error("Failed to like post!");
            set({ likedPost: false });
            set({isLiking: false});
        } finally {
            set({isLiking: false});
        }
    },

    deletePost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            await axiosInstance.delete(`/posts/delete/${data}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ deletedPost: true });
            set({ isDeleting: true });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
            toast.success("Successfully deleted post");
        } catch (error) {
            console.log("Error in Deleting Post:", error);
            toast.error("Failed to delete post!");
            set({ deletedPost: false });
            set({ isDeleting: false });
        } finally {
            set({ isDeleting: false });
        }
    },

    reactToPost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            await axiosInstance.post(`/posts/react`, data, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isReacting: true });
            set({ reactedToPost: true });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
            toast.success("Successfully reacted to post");
        } catch (error) {
            console.log("Error in Reacting to Post:", error);
            toast.error("Failed to react to post!");
            set({ reactedToPost: false });
            set({ isReacting: false });
        } finally {
            set({ isReacting: false });
        }
    },

    editPost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            const res = await axiosInstance.put(`/posts/edit-post/${data.id}`, data, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isEditing: true });
            set({ editedPost: true });
            set({ post : res.data });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
            toast.success("Successfully edited post");
        } catch (error) {
            console.log("Error in Editing  Post:", error);
            toast.error("Failed to edit post!");
            set({ isEditing: false });
            set({ editedPost: false });
        } finally {
            set({ isEditing: false });
        }
    },

    getPostById: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/posts/get-post/${data}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingSinglePost: true });
            set({ singlePost : res.data });
        } catch (error) {
            console.log("Error in Finding  Post:", error);
            toast.error("Failed to find post!");
            set({ isGettingSinglePost: false });
        } finally {
            set({ isGettingSinglePost: false });
        }
    },

    commentPost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            const res = await axiosInstance.post(`/posts/comment`, data, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ commentedPost: true });
            set({isCommenting: true});
            set({ comment : res.data });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
            toast.success("Successfully commented on post");
        } catch (error) {
            console.log("Error in Commenting on Post:", error);
            toast.error("Failed to comment on post!");
            set({ commentedPost: false });
            set({isCommenting: false});
        } finally {
            set({isCommenting: false});
        }
    },

    repost: async (data) => {
        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            const res = await axiosInstance.post(`/reposts/${data}`, data, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ reposted: true });
            set({isReposting: true});
            set({ Repost: res.data });
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
            toast.success("Successfully Reposted")
        } catch (error) {
            console.log("Error in Reposting:", error);
            toast.error("Failed to Repost!");
            set({ reposted: false });
            set({isReposting: false});
        } finally {
            set({isReposting: false});
        }
    },

    getNotifications: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/notifications/get-notifications`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingNotifications: true });
            set({ notifications: res.data });
        } catch (error) {
            console.log("Error in Getting Notifications:", error);
            toast.error("Failed to get Notifications");
            set({ isGettingNotifications: false });
        } finally {
            set({ isGettingNotifications: false });
        }
    },

    deleteNotifications: async () => {
        async function refreshNotifications () {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/notifications/get-notifications`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingNotifications: true });
                set({ notifications: res.data });
            } catch (error) {
                console.log("Error in Getting Notifications:", error);
                toast.error("Failed to get Notifications");
                set({ isGettingNotifications: false });
            } finally {
                set({ isGettingNotifications: false });
            }
        }

        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.delete(`/notifications/delete-notification`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            toast.success("Successfully deleted Notifications");
            await refreshNotifications();
        } catch (error) {
            console.log("Error in Deleting Notifications:", error);
            toast.error("Failed to delete Notifications");
        }
    },

    reportPost: async (data) => {

        async function refreshPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingPosts: true});
                set({Posts: res.data});
            } catch (error) {
                console.log("Error in Getting  Posts:", error);
                toast.error("Failed to get  Posts");
                set({isGettingPosts: false});
            } finally {
                set({isGettingPosts: false});
            }
        }

        async function refreshFollowingPosts() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-following-posts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingFollowingPosts: true });
                set({ followingPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingFollowingPosts: false });
            } finally {
                set({ isGettingFollowingPosts: false });
            }
        }

        async function refreshUserPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/get-user-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingUserPosts: true });
                set({ userPosts: res.data });
            } catch (error) {
                console.log("Error in Getting User Posts:", error);
                toast.error("Failed to get User Posts!, Try refreshing the page.");
                set({ isGettingUserPosts: false });
            } finally {
                set({ isGettingUserPosts: false });
            }
        }

        async function refreshLikedPosts(data) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/posts/liked-posts/${data}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({ isGettingLikedPosts: true });
                set({ likedPosts: res.data });
            } catch (error) {
                console.log("Error in Getting Liked Posts:", error);
                toast.error("Failed to get Liked Posts!");
                set({ isGettingLikedPosts: false });
            } finally {
                set({ isGettingLikedPosts: false });
            }
        }


        set({ isReporting: true });
        try {
            const token = localStorage.getItem('access-token');
            const user = localStorage.getItem('user');
            await axiosInstance.post(`/auth/report/${data.id}`, data.reason, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            toast.success("Successfully reported post");
            await refreshPosts();
            await refreshFollowingPosts();
            if (user) {
                await refreshUserPosts(user);
                await refreshLikedPosts(user);
            }
        }  catch (error) {
            console.log(`Failed to report post: ${error}`);
            toast.error("Failed to report post!");
            set({ isReporting: false });
        } finally {
            set({ isReporting: false });
        }
    },

    goIncognito: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post('/incognito/toggle', {},  {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.data.incognito === true) {
                toast.success("Incognito On!");
                set({ isIncognito: true });
            }
            if (res.data.incognito === false) {
                toast.success("Incognito Off!");
                set({ isIncognito: false });
            }
        }  catch (error) {
            console.log(`Failed to toggle incognito: ${error}`);
            toast.error("Failed to toggle incognito!");
        }
    },

    searchItem: async (data) => {
        try{
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/search/${data.searchType}/${data.searchWord}/${data.limit}`,  {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            set({ isSearching: true });
            set({ searchResult: res.data });

        } catch (e) {
            console.log(`Failed to search ${data.searchType}: ${e}`);
            toast.error(`Failed to search ${data.searchType}`);
            set({ isSearching: false });
        } finally {
            set({ isSearching: false });
        }
    }
}));