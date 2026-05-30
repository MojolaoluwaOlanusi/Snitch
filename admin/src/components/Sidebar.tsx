import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiCalendar, FiSettings } from 'react-icons/fi';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: <FiHome /> },
    { to: '/users', label: 'Users', icon: <FiUsers /> },
    { to: '/posts', label: 'Posts', icon: <FiFileText /> },
    { to: '/events', label: 'Events', icon: <FiCalendar /> },
    { to: '/settings', label: 'Settings', icon: <FiSettings /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-4 font-bold text-lg text-indigo-600">Snitch Admin</div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-indigo-50'
              }`
            }
          >
            {l.icon}
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
