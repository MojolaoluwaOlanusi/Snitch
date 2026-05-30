import React, { useState } from 'react';
import api from '../lib/api';

export default function MakeAdmin(){
  const [code,setCode]=useState('');
  const [email,setEmail]=useState('');

  async function submit(e:any){
    e.preventDefault();
    try {
      await api.post('/admin/make-admin',{email,code});
      alert('User promoted to admin successfully!');
    } catch(e:any){ alert(e?.response?.data?.message || String(e)); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-4">Make Admin</h1>
        <form onSubmit={submit} className="space-y-3">
          <input className="border p-2 w-full rounded" placeholder="User Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="border p-2 w-full rounded" placeholder="6-digit Code" value={code} onChange={e=>setCode(e.target.value)} />
          <button className="w-full bg-indigo-600 text-white py-2 rounded">Submit</button>
        </form>
      </div>
    </div>
  )
}
