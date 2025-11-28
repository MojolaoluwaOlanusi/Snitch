import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Posts from './pages/Posts';
import Events from './pages/Events';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import MakeAdmin from './pages/MakeAdmin';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const token = localStorage.getItem('adminToken');
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/make-admin" element={<MakeAdmin />} />
      {token ? (
        <>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="/posts" element={<Layout><Posts /></Layout>} />
          <Route path="/events" element={<Layout><Events /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}
