import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileText, Flag } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
    const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0 });
    const [userChart, setUserChart] = useState([]);
    const [postChart, setPostChart] = useState([]);
    const [reportChart, setReportChart] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, postsRes, reportsRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/posts'),        // adjust if needed
                    api.get('/admin/reports'),
                ]);
                setStats({
                    users: usersRes.data.length,
                    posts: postsRes.data.length,
                    reports: reportsRes.data.length,
                });
            } catch (err) {
                console.error(err);
            }
        };

        const fetchCharts = async () => {
            try {
                const [u, p, r] = await Promise.all([
                    api.get('/admin/stats/users'),
                    api.get('/admin/stats/posts'),
                    api.get('/admin/stats/reports'),
                ]);
                // Transform data to { month: 'Jan', users: 0, posts: 0, reports: 0 }
                const combined = MONTHS.map((m, i) => ({
                    month: m,
                    users: u.data.find((d: any) => d._id === i+1)?.count || 0,
                    posts: p.data.find((d: any) => d._id === i+1)?.count || 0,
                    reports: r.data.find((d: any) => d._id === i+1)?.count || 0,
                }));
                // @ts-ignore
                setUserChart(combined);
                // @ts-ignore
                setPostChart(combined);
                // @ts-ignore
                setReportChart(combined);
            } catch (err) {
                console.error(err);
            }
        };

        fetchStats();
        fetchCharts();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-base-content">Dashboard</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <Users className="w-8 h-8 text-primary" />
                        <h2 className="card-title text-base-content">{stats.users}</h2>
                        <p className="text-base-content">Total Users</p>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <FileText className="w-8 h-8 text-secondary" />
                        <h2 className="card-title text-base-content">{stats.posts}</h2>
                        <p className="text-base-content">Total Posts</p>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <Flag className="w-8 h-8 text-warning" />
                        <h2 className="card-title text-base-content">{stats.reports}</h2>
                        <p className="text-base-content">Open Reports</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User registrations */}
                <div className="card bg-base-100 shadow-xl p-4">
                    <h2 className="text-lg font-semibold mb-4 text-base-content">New Users (per month)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={userChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="users" fill="#6366f1" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* New posts */}
                <div className="card bg-base-100 shadow-xl p-4 text-base-content">
                    <h2 className="text-lg font-semibold mb-4">New Posts (per month)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={postChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="posts" fill="#10b981" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Reports */}
                <div className="card bg-base-100 shadow-xl p-4 lg:col-span-2 text-base-content">
                    <h2 className="text-lg font-semibold mb-4">Reports (per month)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={reportChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}