import {useState} from "react";
import {useAuthStore} from "../../../store/useAuthStore";
import {LoaderIcon, MailIcon} from "lucide-react";
import {Link} from "react-router";
import {FaArrowLeft} from "react-icons/fa6";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ email: ""});
    const {sentVerificationCode, sendVerificationCode, authUser} = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        sendVerificationCode(formData);
    };

    return (
        <div className="bg-blue-200 flex items-center justify-center">
            <div className="flex items-center justify-center py-40 px-40">
                <div className="w-full flex flex-col md:flex-row bg-white rounded-2xl">
                    <div className="p-20 flex items-center justify-center md:border-r bg-">
                        <div className="w-full max-w-md">
                            <Link to={authUser?.username ? `/profile/${authUser.username}` : "/"}>
                                <FaArrowLeft className='w-4 h-4' />
                            </Link>
                            {/* HEADING TEXT */}
                            <div className="text-center mb-8 w-[350px]">
                                <h2 className="text-2xl font-bold text-blue-200 mb-2">Verify Account</h2>
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
                                    {sentVerificationCode ? (
                                        <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                    ) : (
                                        "Verify Code"
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/verify-verification-code" className="text-blue-600 underline">
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
