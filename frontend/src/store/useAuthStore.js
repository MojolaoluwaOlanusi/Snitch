import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { io } from 'socket.io-client';

export const useAuthStore = create((set, get) => ({
    authUserId: null,
    authUser: null,
    user: null,
    verifiedUser: false,
    recoveredPassword: false,
    sentVerificationCode: false,
    sentForgotPasswordCode: false,
    isCheckingAuth: true,
    isGettingProfile: false,
    isGettingUserProfile: false,
    isUpdatingProfile: false,
    isBlockingUser: false,
    isSigningUp: false,
    isLoggingIn: false,
    accessToken: null,
    isUsersLoading: false,
    hasBlockedUser: false,
    socket: null,
    isSocketConnected: false,

    checkAuthentication: async () => {
        try {
            const token = localStorage.getItem('access-token');
            if (!token) {
                set({ authUserId: null, isCheckingAuth: false });
                return;
            }
            const res = await axiosInstance.get("/auth/check", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            set({ authUserId: res.data.id });
            // Connect socket after auth check
            const { socket } = get();
            if (!socket?.connected) {
                await get().connectSocket();
            }
            // Register push notifications after auth
            await get().registerPushNotifications();
        } catch (error) {
            console.log("Auth check error:", error);
            set({ authUserId: null });
            localStorage.removeItem('access-token');
            get().disconnectSocket();
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUserId: res.data.id });
            localStorage.setItem('user', `${res.data.id}`);
            localStorage.setItem('access-token', `${res.data.access}`);
            await get().checkAuthentication();
            await get().connectSocket();
            toast.success("Account created successfully!");
            await get().registerPushNotifications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Signup failed");
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUserId: res.data.user.id });
            localStorage.setItem('user', `${res.data.user.id}`);
            localStorage.setItem('access-token', `${res.data.access}`);
            await get().checkAuthentication();
            await get().connectSocket();
            toast.success("Logged in successfully");
            await get().registerPushNotifications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/signout");
            set({ authUserId: null, authUser: null, user: null });
            localStorage.removeItem('access-token');
            localStorage.removeItem('user');
            await get().disconnectSocket();
            toast.success("Logged out successfully");
        } catch (error) {
            console.log("Logout error:", error);
            // Force logout even if API fails
            set({ authUserId: null, authUser: null, user: null });
            localStorage.removeItem('access-token');
            localStorage.removeItem('user');
            await get().disconnectSocket();
        }
    },

    getProfile: async () => {
        set({ isGettingProfile: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/auth/get-profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            set({ authUser: res.data });
        } catch (error) {
            console.log("Error getting profile:", error);
            toast.error(error.response?.data?.message || "Failed to load profile");
        } finally {
            set({ isGettingProfile: false });
        }
    },

    getUserProfile: async (username) => {
        set({ isGettingUserProfile: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/auth/get-user-profile/${username}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            set({ user: res.data });
            localStorage.setItem('user', `${res.data._id}`);
        } catch (error) {
            console.log("Error getting user profile:", error);
            toast.error(error.response?.data?.message || "Failed to load user profile");
        } finally {
            set({ isGettingUserProfile: false });
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put("/auth/update-profile", data, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
            return res.data;
        } catch (error) {
            console.log("Error updating profile:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    sendVerificationCode: async (data) => {
        try {
            await axiosInstance.post("/auth/send-verification-code", data);
            set({ sentVerificationCode: true });
            toast.success("Verification code sent!");
        } catch (error) {
            console.log("Error sending verification code:", error);
            toast.error(error.response?.data?.message || "Failed to send code");
            set({ sentVerificationCode: false });
        }
    },

    sendForgotPasswordCode: async (data) => {
        try {
            await axiosInstance.post("/auth/send-forgot-password-code", data);
            set({ sentForgotPasswordCode: true });
            toast.success("Reset code sent!");
        } catch (error) {
            console.log("Error sending forgot password code:", error);
            toast.error(error.response?.data?.message || "Failed to send code");
            set({ sentForgotPasswordCode: false });
        }
    },

    verifyVerificationCode: async (data) => {
        try {
            await axiosInstance.post("/auth/verify-verification-code", data);
            set({ verifiedUser: true });
            toast.success("Account verified!");
        } catch (error) {
            console.log("Failed to verify:", error);
            toast.error(error.response?.data?.message || "Verification failed");
            set({ verifiedUser: false });
        }
    },

    verifyForgotPasswordCode: async (data) => {
        try {
            await axiosInstance.post("/auth/verify-forgot-password-code", data);
            toast.success("Password reset successfully!");
            set({ recoveredPassword: true });
        } catch (error) {
            console.log("Failed to recover password:", error);
            toast.error(error.response?.data?.message || "Recovery failed");
        }
    },

    changePassword: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.patch("/auth/change-password", data, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            toast.success("Password updated");
        } catch (error) {
            console.log("Failed to change password:", error);
            toast.error(error.response?.data?.message || "Failed to change password");
        }
    },

    blockUser: async (data) => {
        set({ isBlockingUser: true });
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post(`/auth/block/${data}`, {}, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            set({ hasBlockedUser: true });
            toast.success("User blocked");
        } catch (error) {
            console.log("Error blocking user:", error);
            toast.error(error.response?.data?.message || "Failed to block user");
            set({ hasBlockedUser: false });
        } finally {
            set({ isBlockingUser: false });
        }
    },

    unblockUser: async (data) => {
        set({ isBlockingUser: true });
        try {
            const token = localStorage.getItem('access-token');
            await axiosInstance.post(`/auth/unblock/${data}`, {}, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            set({ hasBlockedUser: false });
            toast.success("User unblocked");
        } catch (error) {
            console.log("Error unblocking user:", error);
            toast.error(error.response?.data?.message || "Failed to unblock user");
            set({ hasBlockedUser: true });
        } finally {
            set({ isBlockingUser: false });
        }
    },

    registerPushNotifications: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    import.meta.env.VITE_VAPID_PUBLIC_KEY
                ),
            });

            const token = localStorage.getItem('access-token');
            await axiosInstance.post('/auth/push-subscription', { subscription }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Push subscription failed:', error);
        }
    },

    // ==================== Socket Connection ====================

    connectSocket: async () => {
        const { socket, authUserId } = get();

        // Don't connect if already connected or no user
        if (socket?.connected) return;
        if (!authUserId && !localStorage.getItem('access-token')) return;

        const token = localStorage.getItem("access-token");
        if (!token) return;

        // Disconnect existing socket if any
        if (socket) {
            socket.disconnect();
        }

        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4500', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });

        set({ socket: newSocket });

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected:', newSocket.id);
            set({ isSocketConnected: true });
            // Request online users
            newSocket.emit('get_online_users');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            set({ isSocketConnected: false });
        });

        newSocket.on('connect_error', (err) => {
            console.error('🔌 Socket connection error:', err.message);
            set({ isSocketConnected: false });
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
            set({ isSocketConnected: true });
            newSocket.emit('get_online_users');
        });

        newSocket.on('reconnect_error', (err) => {
            console.error('🔌 Socket reconnect error:', err.message);
        });

        // Presence events
        newSocket.on('users_online', (users) => {
            console.log('Online users:', users?.length || 0);
        });

        newSocket.on('user_online', (id) => {
            console.log('User online:', id);
        });

        newSocket.on('user_offline', (id) => {
            console.log('User offline:', id);
        });
    },

    disconnectSocket: async () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isSocketConnected: false });
            console.log('Socket disconnected manually');
        }
    },
}));

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}