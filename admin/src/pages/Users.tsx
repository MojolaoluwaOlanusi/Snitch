import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/Card';
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzFlZjZjODZhYWNmMTEwMmM4ZWZhNSIsImlhdCI6MTc2NDg5Mzk2NywiZXhwIjoxNzY0ODk0ODY3fQ.zqVmFJ6HZYGfV-IgcE02hR2IDU1JlM5uB1St4YBy3G8';

export default function Users(){
  const [users,setUsers]=useState<any[]>([]);
  useEffect(()=>{load();},[]);
  async function load(){
    try {
      const r = await api.get('/admin/users',{headers: {'Authorization': `Bearer ${accessToken}`}});
      setUsers(r.data || []);
    } catch(e){ console.error(e); }
  }

  return (
    <Card title="All Users">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th>Name</th><th>Email</th><th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u:any)=>(
            <tr key={u._id} className="border-b">
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.isAdmin ? 'Admin' : 'User'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
