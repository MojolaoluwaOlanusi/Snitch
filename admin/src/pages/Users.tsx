import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import {Trash2, Ban, CheckCircle, AlertTriangle, Eye, UserPlus, Copy, History} from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'banned' | 'admins'

    // Warn state
    const [selectedUser, setSelectedUser] = useState<any>(null);
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
            if (activeTab === 'banned') endpoint = '/admin/users/banned';
            else if (activeTab === 'admins') endpoint = '/admin/admins';
            const { data } = await api.get(endpoint);
            // Admins endpoint returns { count, admins } – handle that
            if (activeTab === 'admins') {
                setUsers(data.admins || []);
            } else {
                setUsers(Array.isArray(data) ? data : data.users || []);
            }
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchUsers();
    }, [activeTab]);

    const deleteUser = async (id: string) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await api.delete(`/admin/delete-user/${id}`);
            toast.success('User deleted');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const toggleBan = async (user: any) => {
        try {
            const endpoint = user.isBanned ? `/admin/unban/${user._id}` : `/admin/ban/${user._id}`;
            const payload = user.isBanned ? {} : { reason: 'Banned by admin' };
            await api.patch(endpoint, payload);
            toast.success(user.isBanned ? 'User unbanned' : 'User banned');
            fetchUsers();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const openWarnModal = (user: any) => {
        setSelectedUser(user);
        setWarnReason('');
        setShowWarnModal(true);
    };

    const sendWarning = async () => {
        if (!warnReason.trim()) return toast.error('Reason required');
        try {
            await api.post(`/admin/warn/${selectedUser._id}`, { reason: warnReason });
            toast.success('Warning sent');
            setShowWarnModal(false);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to warn');
        }
    };

    const viewWarnings = async (userId: string) => {
        try {
            const { data } = await api.get(`/admin/warnings/${userId}`);
            setWarnings(data.warnings || []);
            setShowWarningsModal(true);
        } catch (err) {
            toast.error('No warnings found');
        }
    };

    const generateInvite = async () => {
        try {
            const { data } = await api.post('/admin/generate-invite', { expiresMinutes: 60 });
            setInviteCode(data.code);
            setInviteExpiry(new Date(data.expiresAt).toLocaleString());
            setShowInviteModal(true);
        } catch (err) {
            toast.error('Failed to generate invite');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode);
        toast.success('Invite code copied');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-base-content">Users</h1>
                <button
                    onClick={generateInvite}
                    className="btn btn-primary btn-sm"
                    aria-label="Invite Admin"
                    title="Generate an admin invitation code"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Admin
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed mb-4">
                <button
                    className={`tab text-base-content ${activeTab === 'all' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All
                </button>
                <button
                    className={`tab text-base-content ${activeTab === 'banned' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('banned')}
                >
                    Banned
                </button>
                <button
                    className={`tab text-base-content ${activeTab === 'admins' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('admins')}
                >
                    Admins
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    <tr className="text-base-content/70">
                        <th>Email</th>
                        <th>Username</th>
                        {activeTab !== 'admins' && <th>Warnings</th>}
                        {activeTab !== 'admins' && <th>Banned</th>}
                        {activeTab !== 'banned' && <th>Admin</th>}
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-base-content">
                    {users.map((user: any) => (
                        <tr key={user._id}>
                            <td>{user.email}</td>
                            <td>{user.username}</td>
                            {activeTab !== 'admins' && <td>{user.warningsCount}</td>}
                            {activeTab !== 'admins' && <td>{user.isBanned ? 'Yes' : 'No'}</td>}
                            {activeTab !== 'banned' && <td>{user.isAdmin ? 'Yes' : 'No'}</td>}
                            <td className="flex gap-2">
                                <Link
                                    to={`/users/${user._id}`}
                                    className="btn btn-xs btn-outline"
                                    aria-label={`View profile of ${user.username}`}
                                    title="View profile"
                                >
                                    <Eye className="w-3 h-3" />
                                </Link>
                                {activeTab !== 'admins' && (
                                    <>
                                        <button
                                            onClick={() => toggleBan(user)}
                                            className="btn btn-xs btn-outline"
                                            aria-label={user.isBanned ? `Unban ${user.username}` : `Ban ${user.username}`}
                                            title={user.isBanned ? 'Unban' : 'Ban'}
                                        >
                                            {user.isBanned ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                        </button>
                                        <button
                                            onClick={() => openWarnModal(user)}
                                            className="btn btn-xs btn-outline btn-warning"
                                            aria-label={`Warn ${user.username}`}
                                            title="Warn"
                                        >
                                            <AlertTriangle className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => viewWarnings(user._id)}
                                            className="btn btn-xs btn-outline"
                                            aria-label={`View warnings of ${user.username}`}
                                            title="Warnings history"
                                        >
                                            <History className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user._id)}
                                            className="btn btn-xs btn-outline btn-error"
                                            aria-label={`Delete ${user.username}`}
                                            title="Delete user"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Warn modal */}
            <input type="checkbox" id="warn-modal" className="modal-toggle" checked={showWarnModal} onChange={() => setShowWarnModal(false)} />
            <div className="modal">
                <div className="modal-box bg-base-100 text-base-content">
                    <h3 className="font-bold text-lg">Warn {selectedUser?.username}</h3>
                    <textarea
                        className="textarea textarea-bordered w-full mt-2 bg-base-200"
                        placeholder="Reason for warning"
                        value={warnReason}
                        onChange={(e) => setWarnReason(e.target.value)}
                    />
                    <div className="modal-action">
                        <button className="btn btn-warning" onClick={sendWarning} aria-label="Send warning">Send Warning</button>
                        <button className="btn" onClick={() => setShowWarnModal(false)} aria-label="Cancel warning">Cancel</button>
                    </div>
                </div>
            </div>

            {/* Warnings history modal */}
            <input type="checkbox" id="warnings-modal" className="modal-toggle" checked={showWarningsModal} onChange={() => setShowWarningsModal(false)} />
            <div className="modal">
                <div className="modal-box bg-base-100 text-base-content max-w-lg">
                    <h3 className="font-bold text-lg mb-4">Warnings History</h3>
                    {warnings.length === 0 ? (
                        <p className="text-base-content/60">No warnings.</p>
                    ) : (
                        <ul className="space-y-2">
                            {warnings.map((w: any) => (
                                <li key={w._id} className="border-b border-base-300 pb-2">
                                    <p className="text-sm text-bold">Reason: {w.reason}</p>
                                    <p className="text-xs text-base-content/60">{new Date(w.createdAt).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="modal-action">
                        <button className="btn" onClick={() => setShowWarningsModal(false)} aria-label="Close warnings">Close</button>
                    </div>
                </div>
            </div>

            {/* Invite Admin modal */}
            <input type="checkbox" id="invite-modal" className="modal-toggle" checked={showInviteModal} onChange={() => setShowInviteModal(false)} />
            <div className="modal">
                <div className="modal-box bg-base-100 text-base-content">
                    <h3 className="font-bold text-lg mb-2">Admin Invitation Code</h3>
                    <p className="text-sm text-base-content/70 mb-4">Share this code with the user. It expires on {inviteExpiry}.</p>
                    <div className="flex items-center gap-2 bg-base-200 p-3 rounded-lg mb-4">
                        <code className="text-2xl font-bold flex-1 text-center tracking-widest">{inviteCode}</code>
                        <button onClick={copyToClipboard} className="btn btn-outline btn-sm" aria-label="Copy invite code" title="Copy code">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="modal-action">
                        <button className="btn" onClick={() => setShowInviteModal(false)} aria-label="Close invite modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}