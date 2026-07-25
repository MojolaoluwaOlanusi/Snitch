import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        displayName: '',
        bio: '',
        avatarUrl: '',
        coverImg: '',
        link: '',
        location: '',
        accountType: 'Personal',
        accountVisibility: 'Public',
        gender: '',
        theme: 'winter',
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get(`/admin/users/${id}`);
                setUser(data);
                setFormData({
                    email: data.email || '',
                    username: data.username || '',
                    displayName: data.displayName || '',
                    bio: data.bio || '',
                    avatarUrl: data.avatarUrl || '',
                    coverImg: data.coverImg || '',
                    link: data.link || '',
                    location: data.location || '',
                    accountType: data.accountType || 'Personal',
                    accountVisibility: data.accountVisibility || 'Public',
                    gender: data.gender || '',
                    theme: data.theme || 'winter',
                });
            } catch (err) {
                toast.error('Failed to load user');
                navigate('/admin/users');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/admin/users/${id}`, formData);
            toast.success('User profile updated');
            navigate('/admin/users');
        } catch (err) {
            toast.error('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit User: {user?.username}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Email</label>
                    <input type="email" name="email" className="input input-bordered w-full" value={formData.email} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Username</label>
                    <input type="text" name="username" className="input input-bordered w-full" value={formData.username} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Display Name</label>
                    <input type="text" name="displayName" className="input input-bordered w-full" value={formData.displayName} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Bio</label>
                    <textarea name="bio" className="textarea textarea-bordered w-full" value={formData.bio} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Avatar URL</label>
                    <input type="url" name="avatarUrl" className="input input-bordered w-full" value={formData.avatarUrl} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Cover Image URL</label>
                    <input type="url" name="coverImg" className="input input-bordered w-full" value={formData.coverImg} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Link</label>
                    <input type="url" name="link" className="input input-bordered w-full" value={formData.link} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Location</label>
                    <input type="text" name="location" className="input input-bordered w-full" value={formData.location} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Account Type</label>
                    <select name="accountType" className="select select-bordered w-full" value={formData.accountType} onChange={handleChange}>
                        <option>Personal</option>
                        <option>Work</option>
                        <option>Business</option>
                    </select>
                </div>
                <div>
                    <label className="label">Account Visibility</label>
                    <select name="accountVisibility" className="select select-bordered w-full" value={formData.accountVisibility} onChange={handleChange}>
                        <option>Public</option>
                        <option>Private</option>
                        <option>Friends</option>
                    </select>
                </div>
                <div>
                    <label className="label">Gender</label>
                    <input type="text" name="gender" className="input input-bordered w-full" value={formData.gender} onChange={handleChange} />
                </div>
                <div>
                    <label className="label">Theme</label>
                    <input type="text" name="theme" className="input input-bordered w-full" value={formData.theme} onChange={handleChange} />
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/users')}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default UserDetail;