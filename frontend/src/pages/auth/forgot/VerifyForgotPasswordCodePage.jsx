import {useState} from "react";
import {useAuthStore} from "../../../store/useAuthStore";
import {HashIcon, LockIcon, MailIcon} from "lucide-react";
import {Link} from "react-router-dom";
import {Navigate} from "react-router-dom";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: "", providedCode: "",newPassword: ""});
    const {recoveredPassword, verifyForgotPasswordCode} = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyForgotPasswordCode(formData);
    };

    return (
        <div className="bg-blue-200 flex items-center justify-center">
            <div className="flex items-center justify-center py-40 px-40">
                <div className="w-full flex flex-col md:flex-row bg-white rounded-2xl">
                    <div className="p-20 flex items-center justify-center md:border-r bg-">
                        <div className="w-full max-w-md">
                            {/* HEADING TEXT */}
                            <div className="text-center mb-8 w-[350px]">
                                <h2 className="text-2xl font-bold text-blue-200 mb-2">Verify Forgot Password Code</h2>
                                <p className="text-blue-400">Enter The Provided Code To Continue</p>
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

                                <div>
                                    <label className="auth-input-label">Provided Code</label>
                                    <div className="relative">
                                        <HashIcon className="auth-input-icon" />

                                        <input
                                            type="number"
                                            value={formData.providedCode}
                                            onChange={(e) => setFormData({ ...formData, providedCode: e.target.value })}
                                            className="input"
                                            placeholder="yourforgotpasswordcode"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="auth-input-label">New Password</label>
                                    <div className="relative">
                                        <LockIcon className="auth-input-icon" />

                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="input"
                                            placeholder="yourpassword"
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button className="btn btn-primary w-full" type="submit">
                                    {recoveredPassword ? (
                                        <Navigate to={"/login"} />
                                    ) : (
                                        "Recover Password"
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
                                <Link to="/forgotpassword" className="text-blue-600 underline">
                                    Haven't Received Code?
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
