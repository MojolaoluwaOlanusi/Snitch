import { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/useAuthStore.js";
import { HashIcon, LockIcon, MailIcon, LoaderIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: "", providedCode: "", newPassword: "" });
    const [isVerifying, setIsVerifying] = useState(false);
    const { recoveredPassword, verifyForgotPasswordCode } = useAuthStore();
    const navigate = useNavigate();
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Redirect to login after successful password recovery
    useEffect(() => {
        if (recoveredPassword) {
            navigate("/login");
        }
    }, [recoveredPassword, navigate]);

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

    const validateCode = (value) => {
        if (!value) {
            setCodeError('Verification code is required');
        } else {
            setCodeError('');
        }
        setFormData({ ...formData, providedCode: value });
    };

    const validatePassword = (value) => {
        if (!value) {
            setPasswordError('Password is required');
        } else if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters');
        } else {
            setPasswordError('');
        }
        setFormData({ ...formData, newPassword: value });
    };

    const isFormValid = () => {
        return formData.email &&
               formData.providedCode &&
               formData.newPassword &&
               !emailError &&
               !codeError &&
               !passwordError;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) {
            setIsVerifying(true);
            verifyForgotPasswordCode(formData).finally(() => {
                setIsVerifying(false);
            });
        }
    };

    return (
        <main className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8 sm:py-16">
            <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-lg p-6 sm:p-10 md:p-20">
                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-primary/90 mb-2">
                        Verify Forgot Password Code
                    </h2>
                    <p className="text-primary/90 text-sm sm:text-base">
                        Enter The Provided Code To Continue
                    </p>
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
                                onChange={(e) => validateEmail(e.target.value)}
                                onBlur={(e) => validateEmail(e.target.value)}
                                className={`input border-gray-400 ${emailError ? 'input-error border-red-500' : ''}`}
                                placeholder="youremail@gmail.com"
                            />
                        </div>
                        {emailError && <p className="text-error text-xs mt-1">{emailError}</p>}
                    </div>

                    {/* PROVIDED CODE */}
                    <div>
                        <label className="auth-input-label">Provided Code</label>
                        <div className="relative">
                            <HashIcon className="auth-input-icon" />
                            <input
                                type="number"
                                value={formData.providedCode}
                                onChange={(e) => validateCode(e.target.value)}
                                onBlur={(e) => validateCode(e.target.value)}
                                className={`input border-gray-400 ${codeError ? 'input-error border-red-500' : ''}`}
                                placeholder="Your forgot password code"
                            />
                        </div>
                        {codeError && <p className="text-error text-xs mt-1">{codeError}</p>}
                    </div>

                    {/* NEW PASSWORD */}
                    <div>
                        <label className="auth-input-label">New Password</label>
                        <div className="relative">
                            <LockIcon className="auth-input-icon" />
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => validatePassword(e.target.value)}
                                onBlur={(e) => validatePassword(e.target.value)}
                                className={`input ${passwordError ? 'input-error border-red-500' : ''}`}
                                placeholder="Your new password"
                            />
                        </div>
                        {passwordError && <p className="text-error text-xs mt-1">{passwordError}</p>}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button className="btn btn-primary w-full" type="submit" disabled={isVerifying || !isFormValid()}>
                        {isVerifying ? (
                            <LoaderIcon className="w-full h-5 animate-spin text-center" />
                        ) : (
                            "Recover Password"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <Link to="/signup" className="auth-link text-sm block">
                        Don't have an account? Sign Up
                    </Link>
                    <Link to="/login" className="auth-link text-sm block">
                        Already have an account? Login
                    </Link>
                    <Link to="/forgotpassword" className="text-primary/90 underline text-sm block">
                        Haven't Received Code?
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default ForgotPasswordPage;