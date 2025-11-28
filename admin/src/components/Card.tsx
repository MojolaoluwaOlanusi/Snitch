import React from 'react';

export default function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      {children}
    </div>
  );
}
