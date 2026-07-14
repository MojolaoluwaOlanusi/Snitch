import {useState} from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import {MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, Briefcase, User2Icon} from "lucide-react";
import { Link } from "react-router-dom";

function SignUpPage() {
    const [formData, setFormData] = useState({ username: "", email: "", password: "", accountType: "", displayName: "" });
    const { signup, isSigningUp } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        signup(formData);
    };

    return (
        <main className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8 sm:py-16">
            <div className="w-full max-w-4xl bg-base-100 rounded-2xl shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* FORM COLUMN – LEFT SIDE */}
                    <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex items-center justify-center md:border-r border-base-content/30/30">
                        <div className="w-full max-w-md">
                            {/* HEADING TEXT */}
                            <div className="text-center mb-8">
                                <MessageCircleIcon className="w-12 h-12 mx-auto text-primary mb-4" />
                                <h2 className="text-2xl font-bold text-primary/90 mb-2">Create Account</h2>
                                <p className="text-primary/90">Sign up for a new account</p>
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
                                            className="input border-gray-400"
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
                                            className="input border-gray-400"
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
                                            className="input border-gray-400"
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
                                            className="input border-gray-400"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>

                                {/* ACCOUNT-TYPE INPUT */}
                                <div>
                                    <label className="auth-input-label">Account Type</label>
                                    <div className="relative">
                                        <Briefcase className="auth-input-icon" />
                                        <select
                                            className="input border-gray-400 select"
                                            value={formData.accountType}
                                            onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                        >
                                            <option value="">Select an account type</option>
                                            <option value="Business">Business</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Work">Work</option>
                                        </select>
                                    </div>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    className="btn btn-primary w-full"
                                    type="submit"
                                    disabled={isSigningUp}
                                >
                                    {isSigningUp ? (
                                        <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center space-y-2">
                                <Link to="/login" className="auth-link text-sm block">
                                    Already have an account? Login
                                </Link>
                                <Link to="/forgotpassword" className="text-primary/90 underline text-sm block">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ILLUSTRATION – RIGHT SIDE (hidden on mobile) */}
                    <div className="hidden md:flex md:w-1/2 items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
                        <div>
                            <img
                                src="/signup.webp"
                                alt="People using mobile devices"
                                className="w-full h-auto object-contain"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="mt-6 text-center">
                                <h3 className="text-xl font-medium text-primary">Start Your Journey Today</h3>
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
        </main>
    );
}
export default SignUpPage;