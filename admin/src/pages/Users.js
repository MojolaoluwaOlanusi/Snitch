import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Trash2, Ban, CheckCircle, AlertTriangle, Eye, UserPlus, Copy } from 'lucide-react';
export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'banned' | 'admins'
    // Warn state
    const [selectedUser, setSelectedUser] = useState(null);
    const [showWarnModal, setShowWarnModal] = useState(false);
    const [warnReason, setWarnReason] = useState('');
    // Warnings history state
    const [showWarningsModal, setShowWarningsModal] = useState(false);
    const [warnings, setWarnings] = useState([]);
    // Invite admin state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [inviteExpiry, setInviteExpiry] = useState('');
    const fetchUsers = async () => {
        try {
            let endpoint = '/admin/users';
            if (activeTab === 'banned')
                endpoint = '/admin/users/banned';
            else if (activeTab === 'admins')
                endpoint = '/admin/admins';
            const { data } = await api.get(endpoint);
            // Admins endpoint returns { count, admins } – handle that
            if (activeTab === 'admins') {
                setUsers(data.admins || []);
            }
            else {
                setUsers(Array.isArray(data) ? data : data.users || []);
            }
        }
        catch (err) {
            toast.error('Failed to load users');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setLoading(true);
        fetchUsers();
    }, [activeTab]);
    const deleteUser = async (id) => {
        if (!window.confirm('Delete this user?'))
            return;
        try {
            await api.delete(`/admin/delete-user/${id}`);
            toast.success('User deleted');
            fetchUsers();
        }
        catch (err) {
            toast.error('Failed to delete');
        }
    };
    const toggleBan = async (user) => {
        try {
            const endpoint = user.isBanned ? `/admin/unban/${user._id}` : `/admin/ban/${user._id}`;
            const payload = user.isBanned ? {} : { reason: 'Banned by admin' };
            await api.patch(endpoint, payload);
            toast.success(user.isBanned ? 'User unbanned' : 'User banned');
            fetchUsers();
        }
        catch (err) {
            toast.error('Action failed');
        }
    };
    const openWarnModal = (user) => {
        setSelectedUser(user);
        setWarnReason('');
        setShowWarnModal(true);
    };
    const sendWarning = async () => {
        if (!warnReason.trim())
            return toast.error('Reason required');
        try {
            await api.post(`/admin/warn/${selectedUser._id}`, { reason: warnReason });
            toast.success('Warning sent');
            setShowWarnModal(false);
            fetchUsers();
        }
        catch (err) {
            toast.error('Failed to warn');
        }
    };
    const viewWarnings = async (userId) => {
        try {
            const { data } = await api.get(`/admin/warnings/${userId}`);
            setWarnings(data.warnings || []);
            setShowWarningsModal(true);
        }
        catch (err) {
            toast.error('No warnings found');
        }
    };
    const generateInvite = async () => {
        try {
            const { data } = await api.post('/admin/generate-invite', { expiresMinutes: 60 });
            setInviteCode(data.code);
            setInviteExpiry(new Date(data.expiresAt).toLocaleString());
            setShowInviteModal(true);
        }
        catch (err) {
            toast.error('Failed to generate invite');
        }
    };
    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode);
        toast.success('Invite code copied');
    };
    if (loading)
        return _jsx("div", { className: "loading", children: "Loading..." });
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-base-content", children: "Users" }), _jsxs("button", { onClick: generateInvite, className: "btn btn-primary btn-sm", "aria-label": "Invite Admin", title: "Generate an admin invitation code", children: [_jsx(UserPlus, { className: "w-4 h-4 mr-2" }), " Invite Admin"] })] }), _jsxs("div", { className: "tabs tabs-boxed mb-4", children: [_jsx("button", { className: `tab text-base-content ${activeTab === 'all' ? 'tab-active' : ''}`, onClick: () => setActiveTab('all'), children: "All" }), _jsx("button", { className: `tab text-base-content ${activeTab === 'banned' ? 'tab-active' : ''}`, onClick: () => setActiveTab('banned'), children: "Banned" }), _jsx("button", { className: `tab text-base-content ${activeTab === 'admins' ? 'tab-active' : ''}`, onClick: () => setActiveTab('admins'), children: "Admins" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "table w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-base-content/70", children: [_jsx("th", { children: "Email" }), _jsx("th", { children: "Username" }), activeTab !== 'admins' && _jsx("th", { children: "Warnings" }), activeTab !== 'admins' && _jsx("th", { children: "Banned" }), activeTab !== 'banned' && _jsx("th", { children: "Admin" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { className: "text-base-content", children: users.map((user) => (_jsxs("tr", { children: [_jsx("td", { children: user.email }), _jsx("td", { children: user.username }), activeTab !== 'admins' && _jsx("td", { children: user.warningsCount }), activeTab !== 'admins' && _jsx("td", { children: user.isBanned ? 'Yes' : 'No' }), activeTab !== 'banned' && _jsx("td", { children: user.isAdmin ? 'Yes' : 'No' }), _jsxs("td", { className: "flex gap-2", children: [_jsx(Link, { to: `/users/${user._id}`, className: "btn btn-xs btn-outline", "aria-label": `View profile of ${user.username}`, title: "View profile", children: _jsx(Eye, { className: "w-3 h-3" }) }), activeTab !== 'admins' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => toggleBan(user), className: "btn btn-xs btn-outline", "aria-label": user.isBanned ? `Unban ${user.username}` : `Ban ${user.username}`, title: user.isBanned ? 'Unban' : 'Ban', children: user.isBanned ? _jsx(CheckCircle, { className: "w-3 h-3" }) : _jsx(Ban, { className: "w-3 h-3" }) }), _jsx("button", { onClick: () => openWarnModal(user), className: "btn btn-xs btn-outline btn-warning", "aria-label": `Warn ${user.username}`, title: "Warn", children: _jsx(AlertTriangle, { className: "w-3 h-3" }) }), _jsx("button", { onClick: () => viewWarnings(user._id), className: "btn btn-xs btn-outline", "aria-label": `View warnings of ${user.username}`, title: "Warnings history", children: _jsx(Eye, { className: "w-3 h-3" }) }), _jsx("button", { onClick: () => deleteUser(user._id), className: "btn btn-xs btn-outline btn-error", "aria-label": `Delete ${user.username}`, title: "Delete user", children: _jsx(Trash2, { className: "w-3 h-3" }) })] }))] })] }, user._id))) })] }) }), _jsx("input", { type: "checkbox", id: "warn-modal", className: "modal-toggle", checked: showWarnModal, onChange: () => setShowWarnModal(false) }), _jsx("div", { className: "modal", children: _jsxs("div", { className: "modal-box bg-base-100 text-base-content", children: [_jsxs("h3", { className: "font-bold text-lg", children: ["Warn ", selectedUser?.username] }), _jsx("textarea", { className: "textarea textarea-bordered w-full mt-2 bg-base-200", placeholder: "Reason for warning", value: warnReason, onChange: (e) => setWarnReason(e.target.value) }), _jsxs("div", { className: "modal-action", children: [_jsx("button", { className: "btn btn-warning", onClick: sendWarning, "aria-label": "Send warning", children: "Send Warning" }), _jsx("button", { className: "btn", onClick: () => setShowWarnModal(false), "aria-label": "Cancel warning", children: "Cancel" })] })] }) }), _jsx("input", { type: "checkbox", id: "warnings-modal", className: "modal-toggle", checked: showWarningsModal, onChange: () => setShowWarningsModal(false) }), _jsx("div", { className: "modal", children: _jsxs("div", { className: "modal-box bg-base-100 text-base-content max-w-lg", children: [_jsx("h3", { className: "font-bold text-lg mb-4", children: "Warnings History" }), warnings.length === 0 ? (_jsx("p", { className: "text-base-content/60", children: "No warnings." })) : (_jsx("ul", { className: "space-y-2", children: warnings.map((w) => (_jsxs("li", { className: "border-b border-base-300 pb-2", children: [_jsxs("p", { className: "text-sm text-bold", children: ["Reason:", w.reason] }), _jsx("p", { className: "text-xs text-base-content/60", children: new Date(w.createdAt).toLocaleString() })] }, w._id))) })), _jsx("div", { className: "modal-action", children: _jsx("button", { className: "btn", onClick: () => setShowWarningsModal(false), "aria-label": "Close warnings", children: "Close" }) })] }) }), _jsx("input", { type: "checkbox", id: "invite-modal", className: "modal-toggle", checked: showInviteModal, onChange: () => setShowInviteModal(false) }), _jsx("div", { className: "modal", children: _jsxs("div", { className: "modal-box bg-base-100 text-base-content", children: [_jsx("h3", { className: "font-bold text-lg mb-2", children: "Admin Invitation Code" }), _jsxs("p", { className: "text-sm text-base-content/70 mb-4", children: ["Share this code with the user. It expires on ", inviteExpiry, "."] }), _jsxs("div", { className: "flex items-center gap-2 bg-base-200 p-3 rounded-lg mb-4", children: [_jsx("code", { className: "text-2xl font-bold flex-1 text-center tracking-widest", children: inviteCode }), _jsx("button", { onClick: copyToClipboard, className: "btn btn-outline btn-sm", "aria-label": "Copy invite code", title: "Copy code", children: _jsx(Copy, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "modal-action", children: _jsx("button", { className: "btn", onClick: () => setShowInviteModal(false), "aria-label": "Close invite modal", children: "Close" }) })] }) })] }));
}
