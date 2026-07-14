import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileText, Flag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
                    api.get('/admin/posts'), // adjust if needed
                    api.get('/admin/reports'),
                ]);
                setStats({
                    users: usersRes.data.length,
                    posts: postsRes.data.length,
                    reports: reportsRes.data.length,
                });
            }
            catch (err) {
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
                    users: u.data.find((d) => d._id === i + 1)?.count || 0,
                    posts: p.data.find((d) => d._id === i + 1)?.count || 0,
                    reports: r.data.find((d) => d._id === i + 1)?.count || 0,
                }));
                // @ts-ignore
                setUserChart(combined);
                // @ts-ignore
                setPostChart(combined);
                // @ts-ignore
                setReportChart(combined);
            }
            catch (err) {
                console.error(err);
            }
        };
        fetchStats();
        fetchCharts();
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-base-content", children: "Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx("div", { className: "card bg-base-100 shadow-xl", children: _jsxs("div", { className: "card-body", children: [_jsx(Users, { className: "w-8 h-8 text-primary" }), _jsx("h2", { className: "card-title text-base-content", children: stats.users }), _jsx("p", { className: "text-base-content", children: "Total Users" })] }) }), _jsx("div", { className: "card bg-base-100 shadow-xl", children: _jsxs("div", { className: "card-body", children: [_jsx(FileText, { className: "w-8 h-8 text-secondary" }), _jsx("h2", { className: "card-title text-base-content", children: stats.posts }), _jsx("p", { className: "text-base-content", children: "Total Posts" })] }) }), _jsx("div", { className: "card bg-base-100 shadow-xl", children: _jsxs("div", { className: "card-body", children: [_jsx(Flag, { className: "w-8 h-8 text-warning" }), _jsx("h2", { className: "card-title text-base-content", children: stats.reports }), _jsx("p", { className: "text-base-content", children: "Open Reports" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "card bg-base-100 shadow-xl p-4", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-base-content", children: "New Users (per month)" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: userChart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "users", fill: "#6366f1", radius: [4, 4, 0, 0] })] }) })] }), _jsxs("div", { className: "card bg-base-100 shadow-xl p-4 text-base-content", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "New Posts (per month)" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: postChart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "posts", fill: "#10b981", radius: [4, 4, 0, 0] })] }) })] }), _jsxs("div", { className: "card bg-base-100 shadow-xl p-4 lg:col-span-2 text-base-content", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Reports (per month)" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(LineChart, { data: reportChart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "reports", stroke: "#ef4444", strokeWidth: 2 })] }) })] })] })] }));
}
