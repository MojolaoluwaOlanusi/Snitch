import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Posts from './pages/Posts';
import Reports from './pages/Reports';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem('admin-token');
    if (!token) return <Navigate to="/login" replace />;
    return <Layout>{children}</Layout>;
}

export default function App() {
    return (
        <div>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
                <Route path="/users/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
                <Route path="/posts" element={<PrivateRoute><Posts /></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            </Routes>

            <Toaster />
        </div>
    );
}