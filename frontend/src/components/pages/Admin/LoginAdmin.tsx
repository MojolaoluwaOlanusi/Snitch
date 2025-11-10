// Admin Login & Accept page
// @ts-ignore
import React, { useState } from 'react';
import api, { setAuthToken } from '../../../lib/api';

export default function AdminLogin() {
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [code,setCode] = useState('');
    const [message,setMessage] = useState('');

    async function doLogin(e:any){
        e.preventDefault();
        try{
            const r = await api.post('/auth/signin', { email, password });
            const token = r.data.token;
            setAuthToken(token);
            localStorage.setItem('token', token);
            setMessage('Logged in. If you are not admin, enter invite code below');
        }catch(err:any){ setMessage(err?.response?.data?.message || String(err)); }
    }

    async function acceptCode(e:any){
        e.preventDefault();
        try{
            const r = await api.post('/admin/accept-invite', { code });
            setMessage('Success: ' + r.data.message);
        }catch(err:any){ setMessage(err?.response?.data?.error || err?.response?.data?.message || String(err)); }
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold">Admin Login</h2>
            <form onSubmit={doLogin} className="space-y-2">
                <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full"/>
                <input placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} type="password" className="border p-2 w-full"/>
                <button className="bg-indigo-600 text-white p-2 rounded">Sign in</button>
            </form>

            <hr className="my-4" />
            <h3 className="font-semibold">Enter invite code</h3>
            <form onSubmit={acceptCode}>
                <input placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value)} className="border p-2 w-full" />
                <button className="bg-green-600 text-white p-2 rounded mt-2">Accept Code</button>
            </form>
            <div className="mt-4 text-sm text-red-600">{message}</div>
        </div>
    );
}
