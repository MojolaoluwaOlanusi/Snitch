import {useState} from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import {MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, Briefcase, User2Icon} from "lucide-react";
import { Link } from "react-router";

function SignUpPage() {
    const [formData, setFormData] = useState({ username: "", email: "", password: "", accountType: "", displayName: "" });
    const { signup, isSigningUp } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        signup(formData);
    };

    return (
        <div className="bg-blue-200 flex items-center justify-center">
            <div className="flex items-center justify-center py-20 px-20">
                <div className="relative w-full max-w-6xl md:h-[876px] h-[650px] bg-white rounded-2xl">
                    <div className="w-full flex flex-col md:flex-row">
                        {/* FORM COLUMN - LEFT SIDE */}
                        <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-blue-600/30">
                            <div className="w-full max-w-md">
                                {/* HEADING TEXT */}
                                <div className="text-center mb-8">
                                    <MessageCircleIcon className="w-12 h-12 mx-auto text-blue-400 mb-4" />
                                    <h2 className="text-2xl font-bold text-blue-200 mb-2">Create Account</h2>
                                    <p className="text-blue-400">Sign up for a new account</p>
                                </div>

                                {/* FORM */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* USERNAME */}
                                    <div>
                                        <label className="auth-input-label">User Name</label>
                                        <div className="relative">
                                            <UserIcon className="auth-input-icon" />

                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="input"
                                                placeholder="Your Username"
                                            />
                                        </div>
                                    </div>

                                    {/* DISPLAY NAME */}
                                    <div>
                                        <label className="auth-input-label">Display Name</label>
                                        <div className="relative">
                                            <User2Icon className="auth-input-icon" />

                                            <input
                                                type="text"
                                                value={formData.displayName}
                                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                className="input"
                                                placeholder="Your Display Name"
                                            />
                                        </div>
                                    </div>

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
                                                placeholder="youremail@gmail.com"
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

                                    {/* ACCOUNT-TYPE INPUT */}
                                    <div>
                                        <label className="auth-input-label">AccountType</label>
                                        <div className="relative">
                                            <Briefcase className="auth-input-icon" />

                                            <select className="input select"
                                                    value={formData.accountType}
                                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                            >
                                                <option>Select an accountType</option>
                                                <option>Business</option>
                                                <option>Personal</option>
                                                <option>Work</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* SUBMIT BUTTON */}
                                    <button className="auth-btn" type="submit" disabled={isSigningUp}>
                                        {isSigningUp ? (
                                            <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link to="/login" className="auth-link">
                                        Already have an account? Login
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
                        <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-blue-800/20 to-transparent">
                            <div>
                                <img
                                    src="/signup.png"
                                    alt="People using mobile devices"
                                    className="w-full h-auto object-contain"
                                />
                                <div className="mt-6 text-center">
                                    <h3 className="text-xl font-medium text-blue-400">Start Your Journey Today</h3>

                                    <div className="mt-4 flex justify-center gap-4">
                                        <span className="auth-badge">Free</span>
                                        <span className="auth-badge">Easy Setup</span>
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
export default SignUpPage;
