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
        <main className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8 sm:py-16">
            <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-lg p-6 sm:p-10 md:p-20">
                {/* Back button */}
                <Link
                    to={authUser?.username ? `/profile/${authUser.username}` : "/"}
                    className="inline-flex items-center mb-6 text-primary/90 hover:text-primary transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    <span className="text-sm">Back</span>
                </Link>

                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-primary/90 mb-2">
                        Verify Account
                    </h2>
                    <p className="text-primary/90 text-sm sm:text-base">
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
                                className="input border-gray-400"
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
                        className="text-primary/90 underline text-sm block"
                    >
                        Received Code?
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default ForgotPasswordPage;