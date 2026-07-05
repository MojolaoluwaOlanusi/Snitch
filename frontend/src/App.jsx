import {Navigate, Route, Routes} from "react-router-dom";
import {useAuthStore} from "./store/useAuthStore";
import { Toaster } from 'sonner'
import { Suspense, lazy, useEffect } from "react";
// 👇 lazy load every page
const HomePage = lazy(() => import("./pages/home/HomePage"));
const LoginPage = lazy(() => import("./pages/auth/login/LoginPage"));
const SignUpPage = lazy(() => import("./pages/auth/signup/SignUpPage"));
const NotificationPage = lazy(() => import("./pages/notification/NotificationPage"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const CreatePostPage = lazy(() => import("./pages/post/CreatePostPage"));
const WarpPage = lazy(() => import("./pages/warp/WarpPage"));
const AIPage = lazy(() => import("./pages/ai/AIPage"));
const SearchPage = lazy(() => import("./pages/search/SearchPage"));
const NotFoundPage = lazy(() => import("./pages/404/404"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/forgot/ForgotPasswordPage"));
const VerifyForgotPasswordCodePage = lazy(() =>
    import("./pages/auth/forgot/VerifyForgotPasswordCodePage")
);
const VerifyAccountPage = lazy(() => import("./pages/auth/verification/VerifyAccountPage"));
const VerifyVerificationCodePage = lazy(() =>
    import("./pages/auth/verification/VerifyVerificationCodePage")
);
const PostPage = lazy(() => import("./pages/post/PostPage"));

function App () {
    const { checkAuthentication, isCheckingAuth, authUserId } = useAuthStore();

    useEffect(() => {
        checkAuthentication();
    }, [checkAuthentication]);

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
        </div>
    );
}

export default App;