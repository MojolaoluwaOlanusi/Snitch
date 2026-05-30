import { create } from "zustand";
import axiosInstance  from "../lib/axios";
import toast from "react-hot-toast";
import { io } from 'socket.io-client';

export const useAuthStore = create((set, get) => ({
    authUserId: null,
    authUser: null,
    User: null,
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

    checkAuthentication: async () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/auth/check",{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ authUserId: res.data.id });
            const socket = get().socket
            if (!socket) {
                await get().connectSocket();
            }
        } catch (error) {
            console.log("Error in authCheck:", error);
            set({ authUserId: null });
            localStorage.removeItem('access-token');
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });

        async function checkAuth() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get("/auth/check", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({authUserId: res.data.id});
            } catch (error) {
                console.log("Error in authCheck:", error);
                set({authUserId: null});
                localStorage.removeItem('access-token');
            } finally {
                set({isCheckingAuth: false});
            }
        }

        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUserId: res.data.id });
            localStorage.setItem('user', `${res.data.id}`);
            localStorage.setItem('access-token',`${res.data.access}`)
            await checkAuth();
            await get().connectSocket();
            toast.success("Account created successfully!");
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });

        async function checkAuth() {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get("/auth/check", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({authUserId: res.data.id});
            } catch (error) {
                console.log("Error in authCheck:", error);
                set({authUserId: null});
                localStorage.removeItem('access-token');
            } finally {
                set({isCheckingAuth: false});
            }
        }

        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUserId: res.data.user.id });
            localStorage.setItem('user', `${res.data.user.id}`);
            localStorage.setItem('access-token',`${res.data.access}`);
            await checkAuth();
            await get().connectSocket();
            toast.success("Logged in successfully");
        } catch (error) {
            toast.error(error);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {

        try {
            await axiosInstance.post("/auth/signout");
            set({ authUserId: null });
            localStorage.removeItem('access-token');
            await get().disconnectSocket();
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Error logging out");
            console.log("Logout error:", error);
        }
    },

    getProfile: async  () => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get("/auth/get-profile",{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingProfile: true });
            set({ authUser: res.data });
        } catch (error) {
            console.log("Error in getting Profile:", error);
            set({ isGettingProfile: false });
            toast.error(error.response.data.message);
        } finally {
            set({ isGettingProfile: false });
        }
    },

    getUserProfile: async  (username) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get(`/auth/get-user-profile/${username}`,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isGettingUserProfile: true });
            set({ user: res.data });
            localStorage.setItem('user', `${res.data._id}`);
        } catch (error) {
            console.log("Error in getting Profile:", error);
            set({ isGettingUserProfile: false });
            toast.error(error.response.data.message);
        } finally {
            set({ isGettingUserProfile: false });
        }
    },

    updateProfile: async (data) => {

        async function refreshProfile(username) {
            try {
                const token = localStorage.getItem('access-token');
                const res = await axiosInstance.get(`/auth/get-user-profile/${username}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                set({isGettingUserProfile: true});
                set({user: res.data});
                localStorage.setItem('user', `${res.data._id}`);
            } catch (error) {
                console.log("Error in getting Profile:", error);
                set({isGettingUserProfile: false});
                toast.error(error.response.data.message);
            } finally {
                set({isGettingUserProfile: false});
            }
        }

        try {
            const username = localStorage.getItem('username');
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.put("/auth/update-profile", data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isUpdatingProfile: true });
            set({ authUserId: res.data._id });
            set({ authUser: res.data });
            await refreshProfile(username);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("Error in update profile:", error);
            set({ isUpdatingProfile: false });
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    sendVerificationCode: async (data) =>  {
        try {
            await axiosInstance.post("/auth/send-verification-code", data);
            set({ sentVerificationCode: true});
            toast.success("Verification code sent!");
        } catch (error) {
            console.log("Error in sending verification code:", error);
            if (error.response.data.message === "getaddrinfo ENOTFOUND smtp.gmail.com") {
                toast.error("No Internet Connection!");
            } else {
                toast.error(error.response.data.message);
            }
            set({ sentVerificationCode: false});
        } finally {
            set({ sentVerificationCode: false });
        }
    },

    sendForgotPasswordCode: async (data) =>  {
        try {
            await axiosInstance.post("/auth/send-forgot-password-code", data);
            set({ sentForgotPasswordCode: true});
            toast.success("Forgot Password Code Sent!")
        } catch (error) {
            console.log("Error in sending forgot password code:", error);
            if (error.response.data.message === "getaddrinfo ENOTFOUND smtp.gmail.com") {
                toast.error("No Internet Connection!");
            } else {
                toast.error(error.response.data.message);
            }
            set({ sentForgotPasswordCode: false});
        } finally {
            set({ sentForgotPasswordCode: false });
        }
    },

    verifyVerificationCode: async  (data) => {
        try {
            await axiosInstance.post("/auth/verify-verification-code", data);
            set({ verifiedUser: true});
            toast.success("Successfully Verified your account");
        } catch (error) {
            console.log("Failed to verify the verification code", error);
            toast.error("Failed to verify account");
            set({verifiedUser: false});
        }
    },

    verifyForgotPasswordCode: async  (data) => {
        try {
            await axiosInstance.post("/auth/verify-forgot-password-code", data);
            toast.success("Successfully recovered password!");
            set({recoveredPassword: true});
        } catch (error) {
            console.log("Failed to recover password", error);
            toast.error("Failed to recover password!");
        }
    },

    changePassword: async (data) => {
      try {
          const token = localStorage.getItem('access-token');
          await axiosInstance.patch("/auth/change-password", data, {
              headers: {
                  "Authorization": `Bearer ${token}`
              }
          });
          toast.success("Successfully Updated Password");
      }  catch (error) {
          console.log("Failed to change Password", error);
          toast.error("Failed to change password!");
      }
    },

    blockUser: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/auth/block/${data}`, data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isBlockingUser: true });
            set({ hasBlockedUser: true });
            if (res.data.message === "You have successfully blocked the User"){
                toast.success("Successfully blocked User");
            } else {
                toast.error("Something went wrong, Please try again!")
            }

        } catch (error) {
            console.log("Error in following user:", error);
            if (error.response.data.message === "No User to block Found!") {
                toast.error("The User you want to block was not Found!");
            } else {
                toast.error("Something went wrong,Please try again.");
            }
            set({ isBlockingUser: false });
            set({ hasBlockedUser: false });
        } finally {
            set({ isBlockingUser: false });
        }
    },

    unblockUser: async (data) => {
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.post(`/auth/unblock/${data}`, data,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            set({ isBlockingUser: true });
            set({ hasBlockedUser: false });
            if (res.data.message === "You have successfully unblocked the User"){
                toast.success("Successfully unblocked User");
            } else {
                toast.error("Something went wrong, Please try again!")
            }
        } catch (error) {
            console.log("Error in following user:", error);
            if (error.response.data.message === "No User to block Found!") {
                toast.error("The User you want to block was not Found!");
            } else {
                toast.error("Something went wrong,Please try again.");
            }
            set({ hasBlockedUser: true });
            set({ isBlockingUser: false });
        } finally {
            set({ isBlockingUser: false });
        }
    },

    connectSocket: async () => {
        const token = localStorage.getItem("access-token");
        const socket = io(import.meta.env.CLIENT_SOCKET_URL || 'http://localhost:4500', {
            auth: { token }, // handshake auth
            transports: ['websocket'],
        });

        set({ socket: socket });

        socket.on('connect', () => {
            console.log('connected', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('connect_error', err.message);
        });

        socket.on('users_online', (users) => console.log('online users', users));
        socket.on('user_online', (id) => console.log('user online', id));
        socket.on('user_offline', (id) => console.log('user offline', id));

        socket.on('receive_message', (message) => {
            console.log('incoming', message);
        });

        socket.on('message_sent', (message) => {
            console.log('message saved for sender', message);
        });

        socket.on('reaction:update', ({ messageId, reactions }) => {
            console.log('reaction update', messageId, reactions);
        });

        socket.on('message:read', ({ messageId, userId }) => {
            console.log(`${userId} read ${messageId}`);
        });

        socket.on('typing:start', ({ from }) => console.log(from, 'is typing'));
        socket.on('typing:stop', ({ from }) => console.log(from, 'stopped typing'));

        socket.on('webrtc:call:incoming', async ({ callId, from, roomId, isVideo }) => {
            console.log('incoming call from', from, callId);
            toast.success("Incoming call");
            // show incoming UI to user; if accepted:
            socket.emit('webrtc:call:join', { callId: callId, role: 'member' }, (ack) => {
                if (!ack.ok) return console.error('join failed');
                toast.success("Joined call");
                const participants = ack.participants; // list of participants with socketIds
                console.log('participants:',participants);
                // create RTCPeerConnection(s) and exchange SDP via webrtc:signal
            });
        });

        socket.on('webrtc:signal', ({ from, type, data }) => {
            if (type === 'offer') {
                // set remote description and create answer
                toast.success("Received offer");
            } else if (type === 'answer') {
                // set remote description
                toast.success("Received answer");
            } else if (type === 'ice') {
                // add ICE candidate
                toast.success("Received ice");
            }
        });

        socket.on('webrtc:call:participants', (participants) => {
            console.log('participants changed', participants);
        });

        socket.on('webrtc:group:message', (message) => {
            console.log('group message', message);
        });

        socket.on('webrtc:group:participant_joined', ({ userId }) => {
            console.log('user joined group', userId);
        });

        socket.on('webrtc:call:ended', ({ callId }) => {
            console.log('call ended:', callId);
            toast.success("Leaving...");
        });

        socket.on('webrtc:call:participant_left', ({ userId }) => {
            console.log('user left call:', userId);
        });

        socket.on('webrtc:call:controller', (msg) => {
            console.log(`user ${msg.from} did ${msg.action}, data: ${msg.data}`,);
        });

    },

    disconnectSocket: async () => {
        if (get().socket?.connected) get().socket.disconnect();
    },

}));