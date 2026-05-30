import {useState} from "react";
import {useAuthStore} from "../../../store/useAuthStore";
import {LoaderIcon, MailIcon} from "lucide-react";
import {Link} from "react-router";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: ""});
    const {sentForgotPasswordCode, sendForgotPasswordCode} = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        sendForgotPasswordCode(formData);
    };

    return (
        <div className="bg-blue-200 flex items-center justify-center">
            <div className="flex items-center justify-center py-40 px-40">
                <div className="w-full flex flex-col md:flex-row bg-white rounded-2xl">
                    <div className="p-20 flex items-center justify-center md:border-r">
                        <div className="w-full max-w-md">
                            {/* HEADING TEXT */}
                            <div className="text-center mb-8 w-[350px]">
                                <h2 className="text-2xl font-bold text-blue-200 mb-2">Forgot Password</h2>
                                <p className="text-blue-400">Enter Your Email To Request A Code</p>
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
                                            placeholder="youremail@gmail.com"
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button className="btn btn-primary w-full" type="submit">
                                    {sentForgotPasswordCode ? (
                                        <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                    ) : (
                                        "Verify Code"
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/signup" className="auth-link">
                                    Don't have an account? Sign Up
                                </Link>
                            </div>
                            <div className="mt-6 text-center">
                                <Link to="/login" className="auth-link">
                                    Already have an account? Login
                                </Link>
                            </div>
                            <div className="mt-6 text-center">
                                <Link to="/verifyforgotpasswordcode" className="text-blue-600 underline">
                                    Received Code?
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default ForgotPasswordPage
