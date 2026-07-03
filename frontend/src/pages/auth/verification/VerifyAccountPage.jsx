import { useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { LoaderIcon, MailIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: "" });
    const { sentVerificationCode, sendVerificationCode, authUser } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        sendVerificationCode(formData);
    };

    return (
        <div className="min-h-screen bg-blue-200 flex items-center justify-center px-4 py-8 sm:py-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-10 md:p-20">
                {/* Back button */}
                <Link
                    to={authUser?.username ? `/profile/${authUser.username}` : "/"}
                    className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    <span className="text-sm">Back</span>
                </Link>

                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">
                        Verify Account
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
                        disabled={sentVerificationCode}
                    >
                        {sentVerificationCode ? (
                            <LoaderIcon className="w-full h-5 animate-spin text-center" />
                        ) : (
                            "Verify Code"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/verify-verification-code"
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