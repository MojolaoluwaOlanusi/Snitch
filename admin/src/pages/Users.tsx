import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/Card';

export default function Users(){
  const [users,setUsers]=useState<any[]>([]);
  const [authMissing, setAuthMissing] = useState(false);

  useEffect(()=>{load();},[]);
  async function load(){
    try {
      // Read runtime token from the same storage AdminLogin writes to
      const token = (() => {
        try { return localStorage.getItem('adminToken'); } catch (e) { return null; }
      })();
      if (!token) {
        console.warn('Users: admin token not found in localStorage; aborting load.');
        setAuthMissing(true);
        setUsers([]);
        return;
      }

      // The shared `api` client will attach the token via interceptor or defaults.
      const r = await api.get('/admin/users');
      setUsers(r.data || []);
    } catch(e){
      console.error(e);
    }
  }

  if (authMissing) {
    return (
      <Card title="All Users">
        <div className="p-4 text-center text-sm text-red-600">Not authenticated as admin. Please login to view users.</div>
      </Card>
    );
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
