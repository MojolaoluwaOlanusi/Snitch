import {Navigate, Route, Routes} from "react-router-dom";
import {useAuthStore} from "./store/useAuthStore.js";
import { Toaster } from 'sonner'
import { Suspense, lazy, useEffect } from "react";
import { Analytics } from '@vercel/analytics/react';
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
import { useAppTheme } from "./hooks/useAppTheme.js";

function App () {
    const { checkAuthentication, isCheckingAuth, authUserId } = useAuthStore();

    useEffect(() => {
        checkAuthentication();
    }, [checkAuthentication]);

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
                    <Route path='/*' element={<NotFoundPage />} />
                    <Route path='/forgotpassword' element={!authUserId ? <ForgotPasswordPage /> : <Navigate to={"/"} />} />
                    <Route path='/verify-account/:username' element={authUserId ? <VerifyAccountPage /> : <Navigate to={"/login"} />} />
                    <Route path='/verifyforgotpasswordcode' element={!authUserId ? <VerifyForgotPasswordCodePage /> : <Navigate to={"/"}/>} />
                    <Route path='/verify-verification-code' element={authUserId ? <VerifyVerificationCodePage /> : <Navigate to={"/login"}/>} />
                </Routes>
            </Suspense>

            <Toaster position="top-right" richColors />
            <Analytics />
        </div>
    );
}

export default App;
