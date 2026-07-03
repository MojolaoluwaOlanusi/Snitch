import { useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { LoaderIcon, MailIcon } from "lucide-react";
import { Link } from "react-router-dom";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: "" });
    const { sentForgotPasswordCode, sendForgotPasswordCode } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        sendForgotPasswordCode(formData);
    };

    return (
        <div className="min-h-screen bg-blue-200 flex items-center justify-center px-4 py-8 sm:py-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-10 md:p-20">
                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">
                        Forgot Password
                    </h2>
                    <p className="text-blue-400 text-sm sm:text-base">
                        Enter Your Email To Request A Code
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
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="input"
                                placeholder="youremail@gmail.com"
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        className="btn btn-primary w-full"
                        type="submit"
                        disabled={sentForgotPasswordCode}
                    >
                        {sentForgotPasswordCode ? (
                            <LoaderIcon className="w-full h-5 animate-spin text-center" />
                        ) : (
                            "Verify Code"
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
                    <Link
                        to="/verifyforgotpasswordcode"
                        className="text-blue-600 underline text-sm block"
                    >
                        Received Code?
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;