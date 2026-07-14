import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (_jsxs("div", { className: "flex h-screen bg-base-200", children: [sidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/30 z-20 lg:hidden", onClick: () => setSidebarOpen(false) })), _jsx(Sidebar, { open: sidebarOpen, onClose: () => setSidebarOpen(false) }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "lg:hidden flex items-center gap-4 p-4 bg-base-100 border-b border-base-300", children: [_jsx("button", { onClick: () => setSidebarOpen(true), className: "p-2 hover:bg-base-200 text-base-content rounded-lg", "aria-label": "Open menu", children: _jsx(Menu, { className: "w-6 h-6" }) }), _jsx("h1", { className: "font-bold text-xl text-base-content", children: "Snitch Admin" })] }), _jsx("main", { className: "flex-1 overflow-auto p-4 sm:p-6", children: children })] })] }));
}
