import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Ban, CheckCircle, Trash2 } from 'lucide-react';
export default function UserProfile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [warnings, setWarnings] = useState([]);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get(`/auth/get-user-by-id/${id}`);
                setUser(data);
                const warningsRes = await api.get(`/admin/warnings/${id}`);
                setWarnings(warningsRes.data.warnings || []);
            }
            catch (err) {
                toast.error('Failed to load user');
            }
            finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);
    const toggleBan = async () => {
        try {
            const endpoint = user.isBanned ? `/admin/unban/${user._id}` : `/admin/ban/${user._id}`;
            const payload = user.isBanned ? {} : { reason: 'Banned by admin' };
            await api.patch(endpoint, payload);
            toast.success(user.isBanned ? 'User unbanned' : 'User banned');
            setUser((prev) => ({ ...prev, isBanned: !prev.isBanned }));
        }
        catch (err) {
            toast.error('Action failed');
        }
    };
    const deleteUser = async () => {
        if (!window.confirm('Delete this user?'))
            return;
        try {
            await api.delete(`/admin/delete-user/${user._id}`);
            toast.success('User deleted');
            window.location.href = '/users';
        }
        catch (err) {
            toast.error('Failed to delete');
        }
    };
    if (loading)
        return _jsx("div", { className: "loading", children: "Loading..." });
    if (!user)
        return _jsx("p", { className: "text-base-content", children: "User not found." });
    return (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs(Link, { to: "/users", className: "flex items-center gap-2 text-primary mb-6 hover:underline", "aria-label": "Back to users", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), " Back to Users"] }), _jsx("div", { className: "card bg-base-100 shadow-xl", children: _jsxs("div", { className: "card-body text-base-content", children: [_jsx("h1", { className: "card-title text-2xl", children: user.displayName || user.username }), _jsxs("p", { children: ["@", user.username] }), _jsx("p", { children: user.email }), _jsx("p", { children: user.bio }), _jsxs("div", { className: "flex gap-4 mt-4", children: [_jsxs("button", { onClick: toggleBan, className: `btn ${user.isBanned ? 'btn-success' : 'btn-error'}`, "aria-label": user.isBanned ? 'Unban user' : 'Ban user', title: user.isBanned ? 'Unban' : 'Ban', children: [user.isBanned ? _jsx(CheckCircle, { className: "w-4 h-4 mr-2" }) : _jsx(Ban, { className: "w-4 h-4 mr-2" }), user.isBanned ? 'Unban' : 'Ban'] }), _jsxs("button", { onClick: deleteUser, className: "btn btn-error btn-outline", "aria-label": "Delete user", title: "Delete user", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), " Delete"] })] })] }) }), _jsx("div", { className: "card bg-base-100 shadow-xl mt-6", children: _jsxs("div", { className: "card-body text-base-content", children: [_jsxs("h2", { className: "card-title", children: ["Warnings (", warnings.length, ")"] }), warnings.length === 0 ? (_jsx("p", { className: "text-base-content/60", children: "No warnings." })) : (_jsx("ul", { className: "space-y-3", children: warnings.map((w) => (_jsxs("li", { className: "border-b border-base-300 pb-2", children: [_jsx("p", { className: "font-medium", children: w.reason }), _jsx("p", { className: "text-sm text-base-content/60", children: new Date(w.createdAt).toLocaleString() })] }, w._id))) }))] }) })] }));
}
