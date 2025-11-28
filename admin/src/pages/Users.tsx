import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/Card';

export default function Users(){
  const [users,setUsers]=useState<any[]>([]);
  useEffect(()=>{load();},[]);
  async function load(){
    try {
      const r = await api.get('/admin/users');
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
