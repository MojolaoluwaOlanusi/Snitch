import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-base-200">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar (mobile) */}
                <header className="lg:hidden flex items-center gap-4 p-4 bg-base-100 border-b border-base-300">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-base-200 text-base-content rounded-lg"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-xl text-base-content">Snitch Admin</h1>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}