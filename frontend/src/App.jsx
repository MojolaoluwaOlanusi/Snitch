import {Navigate, Route, Routes} from "react-router-dom";
import { useNavigate, useLocation } from 'react-router-dom';
import {useAuthStore} from "./store/useAuthStore.js";
import {toast, Toaster} from 'sonner'
import { Suspense, lazy, useEffect } from "react";
import { Analytics } from '@vercel/analytics/react';
import { usePushNotifications } from "./hooks/usePushNotifications.js";
import { useCallSocketListeners } from './hooks/useCallSocketListeners.js';
import { useChatStore } from "./store/useChatStore.js";
import { updateAppBadge } from "./utils/appBadge.js";
import CallModal from "./components/common/CallModal.jsx";
import InstallPrompt from './components/common/InstallPrompt.jsx';
// 👇 lazy load every page
const HomePage = lazy(() => import("./pages/home/HomePage.jsx"));
const LoginPage = lazy(() => import("./pages/auth/login/LoginPage.jsx"));
const SignUpPage = lazy(() => import("./pages/auth/signup/SignUpPage.jsx"));
const NotificationPage = lazy(() => import("./pages/notification/NotificationPage.jsx"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage.jsx"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage.jsx"));
const CreatePostPage = lazy(() => import("./pages/post/CreatePostPage.jsx"));
const WarpPage = lazy(() => import("./pages/warp/WarpPage.jsx"));
const AIPage = lazy(() => import("./pages/ai/AIPage.jsx"));
const SearchPage = lazy(() => import("./pages/search/SearchPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/404/404.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/forgot/ForgotPasswordPage.jsx"));
const VerifyForgotPasswordCodePage = lazy(() =>
    import("./pages/auth/forgot/VerifyForgotPasswordCodePage.jsx")
);
const VerifyAccountPage = lazy(() => import("./pages/auth/verification/VerifyAccountPage.jsx"));
const VerifyVerificationCodePage = lazy(() =>
    import("./pages/auth/verification/VerifyVerificationCodePage.jsx")
);
const PostPage = lazy(() => import("./pages/post/PostPage.jsx"));
const SharePage = lazy(() => import("./pages/share/SharePage.jsx"));
import PeriodicSyncPrompt from './components/common/PeriodicSyncPrompt.jsx';
import { useAppTheme } from "./hooks/useAppTheme.js";

function App () {
    const { checkAuthentication, isCheckingAuth, authUserId, authUser } = useAuthStore();
    const { setupPushNotifications } = usePushNotifications();
    const totalUnread = useChatStore((state) => state.totalUnread);
    const navigate = useNavigate();
    const location = useLocation();
    useCallSocketListeners();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
            if (event.data?.type === 'SYNC_MESSAGES') {
                console.log('[App] Received sync request from SW');
                try {
                    useChatStore.getState().syncPendingMessages();
                } catch (error) {
                    console.error('[App] Sync failed:', error);
                }
            }
        });
    }

    useEffect(() => {
        const handleOnline = () => {
            console.log('[App] Online – checking for pending messages');
            if (useChatStore.getState().syncPendingMessages) {
                useChatStore.getState().syncPendingMessages();
            }
        };

        const handleOffline = () => {
            console.log('[App] Offline');
            toast.warning('You are offline. Messages will be saved and sent when you reconnect.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', async (event) => {
                if (event.data?.type === 'PERIODIC_SYNC') {
                    console.log('[App] Periodic sync received – refreshing data...');
                    await useChatStore.getState().refreshData();
                    await useUserStore.getState().refreshData();
                }
            });
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const action = params.get('action');

        if (action) {
            // Clear the URL parameter to avoid re-triggering
            window.history.replaceState({}, document.title, '/');

            switch (action) {
                case 'new-post':
                    if (authUserId) {
                        navigate(`/create-post/${authUser?.username}`);
                    } else {
                        navigate('/login');
                    }
                    break;
                case 'messages':
                    navigate('/chat');
                    break;
                case 'search':
                    navigate('/search');
                    break;
                case 'notifications':
                    if (authUserId) {
                        navigate(`/notifications/${authUser?.username}`);
                    } else {
                        navigate('/login');
                    }
                    break;
                default:
                    break;
            }
        }
    }, [location, authUserId, authUser, navigate]);

    useEffect(() => {
        const requestPeriodicSync = async () => {
            if ('periodicSync' in navigator && 'permissions' in navigator) {
                try {
                    // Check permission state
                    const status = await navigator.permissions.query({
                        name: 'periodic-background-sync',
                    });

                    if (status.state === 'granted') {
                        console.log('[App] Periodic sync permission granted.');
                        // Actually register the sync (this needs to be done in the service worker)
                        if ('serviceWorker' in navigator) {
                            const registration = await navigator.serviceWorker.ready;
                            if (registration.periodicSync) {
                                await registration.periodicSync.register('fetch-updates', {
                                    minInterval: 12 * 60 * 60 * 1000, // 12 hours
                                });
                                console.log('[App] Periodic sync registered!');
                            }
                        }
                    } else if (status.state === 'prompt') {
                        console.log('[App] Periodic sync permission needs user consent.');
                        // Show the PeriodicSyncPrompt component (already handled in App.jsx)
                    } else {
                        console.log('[App] Periodic sync permission denied.');
                    }
                } catch (error) {
                    console.warn('[App] Periodic sync not supported:', error);
                }
            }
        };
        requestPeriodicSync();
    }, []);
    useEffect(() => {
        checkAuthentication();
    }, [checkAuthentication]);

    // Setup push notifications when user is logged in
    useEffect(() => {
        if (authUserId && authUserId._id) {
            // Setup push notifications on login
            setupPushNotifications().catch(err =>
                console.error('Push setup during login:', err)
            );
        }
    }, [authUserId?._id, setupPushNotifications]);

    useEffect(() => {
        updateAppBadge(totalUnread);
    }, [totalUnread]);

    useAppTheme();

    if (isCheckingAuth) return null;

    return (
        <div>
            <Suspense fallback={null}>
                <Routes>
                    <Route path='/' element={authUserId ? <HomePage /> : <Navigate to={"/login"} />} />
                    <Route path='/login' element={!authUserId ? <LoginPage /> : <Navigate to={"/"} />} />
                    <Route path='/signup' element={!authUserId ? <SignUpPage /> : <Navigate to={"/"} />} />
                    <Route path='/chat' element={authUserId ? <ChatPage /> : <Navigate to={"/login"} />} />
                    <Route path='/profile/:username' element={authUserId ? <ProfilePage /> : <Navigate to={"/login"} />} />
                    <Route path='/create-post/:username' element={authUserId ? <CreatePostPage /> : <Navigate to={"/login"} />} />
                    <Route path='/post/:postId' element={authUserId ? <PostPage /> : <Navigate to={"/login"} />} />
                    <Route path='/warp' element={authUserId ? <WarpPage /> : <Navigate to={"/login"} />} />
                    <Route path='/ai' element={authUserId ? <AIPage /> : <Navigate to={"/login"} />} />
                    <Route path='/search' element={authUserId ? <SearchPage /> : <Navigate to={"/login"} />} />
                    <Route path='/notifications/:username' element={authUserId ? <NotificationPage /> : <Navigate to={"/login"} />} />
                    <Route path="/share" element={authUserId ? <SharePage /> : <Navigate to="/login" />} />
                    <Route path='/*' element={<NotFoundPage />} />
                    <Route path='/forgotpassword' element={!authUserId ? <ForgotPasswordPage /> : <Navigate to={"/"} />} />
                    <Route path='/verify-account/:username' element={authUserId ? <VerifyAccountPage /> : <Navigate to={"/login"} />} />
                    <Route path='/verifyforgotpasswordcode' element={!authUserId ? <VerifyForgotPasswordCodePage /> : <Navigate to={"/"}/>} />
                    <Route path='/verify-verification-code' element={authUserId ? <VerifyVerificationCodePage /> : <Navigate to={"/login"}/>} />
                </Routes>
            </Suspense>

            <CallModal />
            <PeriodicSyncPrompt />
            <InstallPrompt />
            <Toaster position="top-right" richColors />
            <Analytics />
        </div>
    );
}

export default App;
