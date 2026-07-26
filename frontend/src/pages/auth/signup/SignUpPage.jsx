import {useState} from "react";
import { useAuthStore } from "../../../store/useAuthStore.js";
import {MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, Briefcase, User2Icon} from "lucide-react";
import { Link } from "react-router-dom";

function SignUpPage() {
    const [formData, setFormData] = useState({ username: "", email: "", password: "", accountType: "", displayName: "" });
    const submitData = { ...formData, username: formData.username.trim() };
    const { signup, isSigningUp } = useAuthStore();
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [displayNameError, setDisplayNameError] = useState('');
    const [accountTypeError, setAccountTypeError] = useState('');

    const validateUsername = (value) => {
        const raw = value;
        const cleaned = raw.replace(/[\s@]/g, '');
        if (raw !== cleaned) {
            setUsernameError('Username cannot contain spaces or "@"');
        } else if (cleaned.length < 3) {
            setUsernameError('Username must be at least 3 characters');
        } else if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
            setUsernameError('Username can only contain letters, numbers, and underscores');
        } else {
            setUsernameError('');
        }
        setFormData({ ...formData, username: cleaned });
    };

    const validateEmail = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError('Email is required');
        } else if (!emailRegex.test(value)) {
            setEmailError('Please provide a valid email address');
        } else {
            setEmailError('');
        }
        setFormData({ ...formData, email: value });
    };

    const validatePassword = (value) => {
        if (!value) {
            setPasswordError('Password is required');
        } else if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters');
        } else {
            setPasswordError('');
        }
        setFormData({ ...formData, password: value });
    };

    const validateDisplayName = (value) => {
        if (value.length > 50) {
            setDisplayNameError('Display name must not exceed 50 characters');
        } else {
            setDisplayNameError('');
        }
        setFormData({ ...formData, displayName: value });
    };

    const validateAccountType = (value) => {
        if (!value) {
            setAccountTypeError('Account type is required');
        } else {
            setAccountTypeError('');
        }
        setFormData({ ...formData, accountType: value });
    };

    const isFormValid = () => {
        return formData.username &&
               formData.email &&
               formData.password &&
               formData.accountType &&
               formData.displayName &&
               !usernameError &&
               !emailError &&
               !passwordError &&
               !displayNameError &&
               !accountTypeError;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) {
            signup(submitData);
        }
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
                                            onChange={(e) => validateUsername(e.target.value)}
                                            onBlur={(e) => validateUsername(e.target.value)}
                                            className={`input border-gray-400 ${usernameError ? 'input-error border-red-500' : ''}`}
                                            placeholder="Your Username"
                                        />
                                    </div>
                                    {usernameError && <p className="text-error text-xs mt-1">{usernameError}</p>}
                                </div>

                                {/* DISPLAY NAME */}
                                <div>
                                    <label className="auth-input-label">Display Name</label>
                                    <div className="relative">
                                        <User2Icon className="auth-input-icon" />
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => validateDisplayName(e.target.value)}
                                            onBlur={(e) => validateDisplayName(e.target.value)}
                                            className={`input border-gray-400 ${displayNameError ? 'input-error border-red-500' : ''}`}
                                            placeholder="Your Display Name"
                                        />
                                    </div>
                                    {displayNameError && <p className="text-error text-xs mt-1">{displayNameError}</p>}
                                </div>

                                {/* EMAIL INPUT */}
                                <div>
                                    <label className="auth-input-label">Email</label>
                                    <div className="relative">
                                        <MailIcon className="auth-input-icon" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => validateEmail(e.target.value)}
                                            onBlur={(e) => validateEmail(e.target.value)}
                                            className={`input border-gray-400 ${emailError ? 'input-error border-red-500' : ''}`}
                                            placeholder="youremail@gmail.com"
                                        />
                                    </div>
                                    {emailError && <p className="text-error text-xs mt-1">{emailError}</p>}
                                </div>

                                {/* PASSWORD INPUT */}
                                <div>
                                    <label className="auth-input-label">Password</label>
                                    <div className="relative">
                                        <LockIcon className="auth-input-icon" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => validatePassword(e.target.value)}
                                            onBlur={(e) => validatePassword(e.target.value)}
                                            className={`input border-gray-400 ${passwordError ? 'input-error border-red-500' : ''}`}
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                    {passwordError && <p className="text-error text-xs mt-1">{passwordError}</p>}
                                </div>

                                {/* ACCOUNT-TYPE INPUT */}
                                <div>
                                    <label className="auth-input-label">Account Type</label>
                                    <div className="relative">
                                        <Briefcase className="auth-input-icon" />
                                        <select
                                            className={`input border-gray-400 select ${accountTypeError ? 'input-error border-red-500' : ''}`}
                                            value={formData.accountType}
                                            onChange={(e) => validateAccountType(e.target.value)}
                                            onBlur={(e) => validateAccountType(e.target.value)}
                                        >
                                            <option value="">Select an account type</option>
                                            <option value="Business">Business</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Work">Work</option>
                                        </select>
                                    </div>
                                    {accountTypeError && <p className="text-error text-xs mt-1">{accountTypeError}</p>}
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    className="btn btn-primary w-full"
                                    type="submit"
                                    disabled={isSigningUp || !isFormValid()}
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