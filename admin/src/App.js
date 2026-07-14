import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Posts from './pages/Posts';
import Reports from './pages/Reports';
import Layout from './components/Layout';
function PrivateRoute({ children }) {
    const token = localStorage.getItem('admin-token');
    if (!token)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(Layout, { children: children });
}
export default function App() {
    return (_jsxs("div", { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(PrivateRoute, { children: _jsx(Users, {}) }) }), _jsx(Route, { path: "/users/:id", element: _jsx(PrivateRoute, { children: _jsx(UserProfile, {}) }) }), _jsx(Route, { path: "/posts", element: _jsx(PrivateRoute, { children: _jsx(Posts, {}) }) }), _jsx(Route, { path: "/reports", element: _jsx(PrivateRoute, { children: _jsx(Reports, {}) }) })] }), _jsx(Toaster, {})] }));
}
