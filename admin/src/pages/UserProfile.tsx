import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Ban, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

export default function UserProfile() {
    const { id } = useParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [warnings, setWarnings] = useState([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get(`/auth/get-user-by-id/${id}`);
                setUser(data);
                const warningsRes = await api.get(`/admin/warnings/${id}`);
                setWarnings(warningsRes.data.warnings || []);
            } catch (err) {
                toast.error('Failed to load user');
            } finally {
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
            setUser((prev: any) => ({ ...prev, isBanned: !prev.isBanned }));
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const deleteUser = async () => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await api.delete(`/admin/delete-user/${user._id}`);
            toast.success('User deleted');
            window.location.href = '/users';
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!user) return <p className="text-base-content">User not found.</p>;

    return (
        <div className="max-w-3xl mx-auto">
            <Link to="/users" className="flex items-center gap-2 text-primary mb-6 hover:underline" aria-label="Back to users">
                <ArrowLeft className="w-5 h-5" /> Back to Users
            </Link>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body text-base-content">
                    <h1 className="card-title text-2xl">{user.displayName || user.username}</h1>
                    <p>@{user.username}</p>
                    <p>{user.email}</p>
                    <p>{user.bio}</p>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={toggleBan}
                            className={`btn ${user.isBanned ? 'btn-success' : 'btn-error'}`}
                            aria-label={user.isBanned ? 'Unban user' : 'Ban user'}
                            title={user.isBanned ? 'Unban' : 'Ban'}
                        >
                            {user.isBanned ? <CheckCircle className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                            {user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                        <button
                            onClick={deleteUser}
                            className="btn btn-error btn-outline"
                            aria-label="Delete user"
                            title="Delete user"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl mt-6">
                <div className="card-body text-base-content">
                    <h2 className="card-title">Warnings ({warnings.length})</h2>
                    {warnings.length === 0 ? (
                        <p className="text-base-content/60">No warnings.</p>
                    ) : (
                        <ul className="space-y-3">
                            {warnings.map((w: any) => (
                                <li key={w._id} className="border-b border-base-300 pb-2">
                                    <p className="font-medium">{w.reason}</p>
                                    <p className="text-sm text-base-content/60">{new Date(w.createdAt).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}