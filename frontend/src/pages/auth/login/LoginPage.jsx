import {useState} from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon } from "lucide-react";
import { Link } from "react-router-dom";

function LoginPage() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { login, isLoggingIn } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        login(formData);
    };

    return (
        <div className="bg-blue-200 flex items-center justify-center">
            <div className="flex items-center justify-center py-20 px-20">
                <div className="relative w-full max-w-6xl md:h-[669px] h-[650px] bg-white rounded-2xl">
                    <div className="w-full flex flex-col md:flex-row">
                        {/* FORM COLUMN - LEFT SIDE */}
                        <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">
                        <div className="w-full max-w-md">
                            {/* HEADING TEXT */}
                            <div className="text-center mb-8">
                                <MessageCircleIcon className="w-12 h-12 mx-auto text-blue-400 mb-4" />
                                <h2 className="text-2xl font-bold text-blue-200 mb-2">Welcome Back</h2>
                                <p className="text-blue-400">Login to access to your account</p>
                            </div>

                            {/* FORM */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* EMAIL INPUT */}
                                <div>
                                    <label className="auth-input-label">Email</label>
                                    <div className="relative">
                                        <MailIcon className="auth-input-icon" />

                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="input"
                                            placeholder="johndoe@gmail.com"
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD INPUT */}
                                <div>
                                    <label className="auth-input-label">Password</label>
                                    <div className="relative">
                                        <LockIcon className="auth-input-icon" />

                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="input"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button className="btn btn-primary w-full" type="submit" disabled={isLoggingIn}>
                                    {isLoggingIn ? (
                                        <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                    ) : (
                                        "Sign In"
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/signup" className="auth-link">
                                    Don't have an account? Sign Up
                                </Link>
                            </div>
                            <div className="mt-6 text-center">
                                <Link to="/forgotpassword" className="text-blue-600 underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                    </div>

                        {/* FORM ILLUSTRATION - RIGHT SIDE */}
                        <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
                        <div>
                            <img
                                src="/login.png"
                                alt="People using mobile devices"
                                className="w-full h-auto object-contain"
                            />
                            <div className="mt-6 text-center">
                                <h3 className="text-xl font-medium text-blue-400">Connect anytime, anywhere</h3>

                                <div className="mt-4 flex justify-center gap-4">
                                    <span className="auth-badge">Free</span>
                                    <span className="auth-badge">Quick</span>
                                    <span className="auth-badge">Private</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default LoginPage;
