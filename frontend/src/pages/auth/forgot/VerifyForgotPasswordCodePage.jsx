import { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/useAuthStore.js";
import { HashIcon, LockIcon, MailIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: "", providedCode: "", newPassword: "" });
    const { recoveredPassword, verifyForgotPasswordCode } = useAuthStore();
    const navigate = useNavigate();

    // Redirect to login after successful password recovery
    useEffect(() => {
        if (recoveredPassword) {
            navigate("/login");
        }
    }, [recoveredPassword, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyForgotPasswordCode(formData);
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
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input border-gray-400"
                                placeholder="youremail@gmail.com"
                            />
                        </div>
                    </div>

                    {/* PROVIDED CODE */}
                    <div>
                        <label className="auth-input-label">Provided Code</label>
                        <div className="relative">
                            <HashIcon className="auth-input-icon" />
                            <input
                                type="number"
                                value={formData.providedCode}
                                onChange={(e) => setFormData({ ...formData, providedCode: e.target.value })}
                                className="input border-gray-400"
                                placeholder="Your forgot password code"
                            />
                        </div>
                    </div>

                    {/* NEW PASSWORD */}
                    <div>
                        <label className="auth-input-label">New Password</label>
                        <div className="relative">
                            <LockIcon className="auth-input-icon" />
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                className="input"
                                placeholder="Your new password"
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button className="btn btn-primary w-full" type="submit">
                        Recover Password
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