import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem('adminToken');
    nav('/login');
  }

  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-3">
      <div className="font-semibold text-lg">Admin Panel</div>
      <button
        onClick={logout}
        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-500"
      >
        Logout
      </button>
    </header>
  );
}
