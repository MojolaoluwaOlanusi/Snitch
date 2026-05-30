import {Navigate, Route, Routes} from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import NotificationPage from "./pages/notification/NotificationPage";
import ChatPage from "./pages/chat/ChatPage";
import ProfilePage from "./pages/profile/ProfilePage";
import CreatePostPage from "./pages/post/CreatePostPage";
import WarpPage from "./pages/warp/WarpPage";
import AIPage from "./pages/ai/AIPage";
import SearchPage from "./pages/search/SearchPage";
import {useEffect} from "react";
import PageLoader from "./components/common/PageLoader";
import {useAuthStore} from "./store/useAuthStore";
import {Toaster} from "react-hot-toast";
import NotFoundPage from "./pages/404/404";
import ForgotPasswordPage from "./pages/auth/forgot/ForgotPasswordPage";
import VerifyForgotPasswordCodePage from "./pages/auth/forgot/VerifyForgotPasswordCodePage";
import VerifyAccountPage from "../src/pages/auth/verification/VerifyAccountPage";
import VerifyVerificationCodePage from "../src/pages/auth/verification/VerifyVerificationCodePage";
import PostPage from "../src/pages/post/PostPage";
import {useChatStore} from "./store/useChatStore";

function App () {
    const { checkAuthentication, isCheckingAuth, authUserId } = useAuthStore();

    useEffect(() => {
        checkAuthentication();
    }, [checkAuthentication]);

    if (isCheckingAuth) return <PageLoader />;

    return (
        <div>
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

            <Toaster />
        </div>
    );
}

export default App;
