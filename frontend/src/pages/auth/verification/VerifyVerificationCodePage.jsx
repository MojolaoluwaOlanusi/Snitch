import { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { HashIcon, MailIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

function VerifyCodePage() {
    const [formData, setFormData] = useState({ email: "", providedCode: "" });
    const { verifyVerificationCode, verifiedUser, authUser } = useAuthStore();
    const navigate = useNavigate();

    // Redirect to login when verification succeeds
    useEffect(() => {
        if (verifiedUser) {
            navigate("/login");
        }
    }, [verifiedUser, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyVerificationCode(formData);
    };

    return (
        <main className="min-h-screen bg-blue-200 flex items-center justify-center px-4 py-8 sm:py-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-10 md:p-20">
                {/* Back button */}
                <Link
                    to={`/verify-account/${authUser?.username || ""}`}
                    className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    <span className="text-sm">Back</span>
                </Link>

                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">
                        Verify Verification Code
                    </h2>
                    <p className="text-blue-600 text-sm sm:text-base">
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
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
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
                                onChange={(e) =>
                                    setFormData({ ...formData, providedCode: e.target.value })
                                }
                                className="input border-gray-400"
                                placeholder="Your verification code"
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button className="btn btn-primary w-full" type="submit">
                        Verify Code
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to={`/verify-account/${authUser?.username || ""}`}
                        className="text-blue-600 underline text-sm block"
                    >
                        Haven't Received Code?
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default VerifyCodePage;