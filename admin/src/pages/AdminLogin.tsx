import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
const accessToken = '8faf706b7031dec317d2b87357ab5bb179a11ed0e4ee1874d4f272be0f0c6f25bdd944d5024fa7546c5d9dbedd3c5e859ab06c6c54379095cb9e052e3b19f203';


export default function AdminLogin(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const nav = useNavigate();

  async function submit(e:any){
    e.preventDefault();
    try {
      const r = await api.post('/auth/login',{email,password,Headers: {
        'Authorization': `Bearer ${accessToken}`
      }
      });
      localStorage.setItem('adminToken',r.data.token);
      nav('/');
    } catch(e:any){ alert(e?.response?.data?.message || String(e)); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-4">Admin Login</h1>
        <form onSubmit={submit} className="space-y-3">
          <input className="border p-2 w-full rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="border p-2 w-full rounded" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-indigo-600 text-white py-2 rounded">Login</button>
        </form>
      </div>
    </div>
  )
}
