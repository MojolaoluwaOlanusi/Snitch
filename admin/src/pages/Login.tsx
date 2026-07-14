import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            const userRes = await api.get('/auth/get-profile', {
                headers: { Authorization: `Bearer ${data.access}` },
            });
            if (!userRes.data.isAdmin) {
                toast.error('Not an admin');
                return;
            }
            localStorage.setItem('admin-token', data.access);
            toast.success('Logged in');
            navigate('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-base-200 px-4">
            <form
                onSubmit={handleSubmit}
                className="bg-base-100 p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4"
            >
                <h1 className="text-2xl font-bold text-center">Admin Login</h1>
                <input
                    type="email"
                    placeholder="Email"
                    className="input input-bordered w-full"
                    value={email}
                    aria-label="Email"
                    title="Email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="input input-bordered w-full"
                    value={password}
                    aria-label="Password"
                    title="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    className="btn btn-primary w-full"
                    disabled={loading}
                    aria-label="Login"
                    title="Login"
                >
                    {loading ? <span className="loading loading-spinner" /> : 'Login'}
                </button>
            </form>
        </div>
    );
}