// @ts-ignore
import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';

export default function AdminDashboard(){
    const [admins,setAdmins] = useState<any[]>([]);
    const [warnings,setWarnings] = useState<any[]>([]);

    useEffect(()=>{ fetchData(); }, []);
    async function fetchData(){
        try{
            const a = await api.get('/admin/admins');
            setAdmins(a.data.admins || []);
            const w = await api.get('/admin/warnings');
            setWarnings(w.data || []);
        }catch(err){ console.error(err); }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <section className="mt-4">
                <h2 className="font-semibold">Admins</h2>
                <ul>{admins.map(a=> <li key={a._id}>{a.username} — {a.email}</li>)}</ul>
            </section>
            <section className="mt-4">
                <h2 className="font-semibold">Recent Warnings</h2>
                <ul>{warnings.map(w=> <li key={w._id}>{w.reason} — for {w.userId?.email}</li>)}</ul>
            </section>
        </div>
    );
}
