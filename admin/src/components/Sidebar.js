import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, AlertTriangle, LogOut, Sun, Moon, X, } from 'lucide-react';
import { useEffect, useState } from 'react';
const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/posts', label: 'Posts', icon: FileText },
    { to: '/reports', label: 'Reports', icon: AlertTriangle },
];
export default function Sidebar({ open, onClose }) {
    const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'winter');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);
    const toggleTheme = () => {
        setTheme((t) => (t === 'winter' ? 'dark' : 'winter'));
    };
    return (_jsxs("aside", { className: `fixed inset-y-0 left-0 z-30 w-64 bg-base-100 border-r border-base-300 transform transition-transform lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-base-300", children: [_jsx("span", { className: "font-bold text-xl text-base-content", children: "Snitch Admin" }), _jsx("button", { onClick: onClose, className: "lg:hidden p-2 hover:bg-base-200 rounded-lg", "aria-label": "Close sidebar", title: "Close sidebar", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("nav", { className: "flex-1 space-y-1 p-2", children: links.map(({ to, label, icon: Icon }) => (_jsxs(NavLink, { to: to, end: to === '/', onClick: onClose, className: ({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'}`, "aria-label": label, title: label, children: [_jsx(Icon, { className: "w-5 h-5" }), label] }, to))) }), _jsxs("div", { className: "p-4 border-t border-base-300 space-y-2", children: [_jsx("button", { onClick: toggleTheme, className: "flex w-full items-center gap-3 px-4 py-2 rounded-lg hover:bg-base-200 transition-colors text-base-content", "aria-label": "Toggle theme", title: "Switch between light and dark theme", children: theme === 'winter' ? (_jsxs(_Fragment, { children: [_jsx(Moon, { className: "w-5 h-5" }), " Dark Mode"] })) : (_jsxs(_Fragment, { children: [_jsx(Sun, { className: "w-5 h-5" }), " Light Mode"] })) }), _jsxs("button", { onClick: () => {
                            localStorage.removeItem('admin-token');
                            window.location.href = '/login';
                        }, className: "flex w-full items-center gap-3 px-4 py-2 rounded-lg text-error hover:bg-error/10 transition-colors", "aria-label": "Logout", title: "Logout", children: [_jsx(LogOut, { className: "w-5 h-5" }), " Logout"] })] })] }));
}
