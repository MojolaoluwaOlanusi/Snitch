import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/Card';

export default function Events(){
  const [events,setEvents]=useState<any[]>([]);
  useEffect(()=>{load();},[]);
  async function load(){
    try {
      const r = await api.get('/admin/events');
      setEvents(r.data || []);
    } catch(e){ console.error(e); }
  }

  return (
    <Card title="Events Management">
      <div className="space-y-2">
        {events.map(ev=>(
          <div key={ev._id} className="p-3 border rounded">
            <div className="font-semibold">{ev.title}</div>
            <div className="text-gray-500">{new Date(ev.date).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
