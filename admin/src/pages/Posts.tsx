import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/Card';

export default function Posts(){
  const [posts,setPosts]=useState<any[]>([]);
  useEffect(()=>{load();},[]);
  async function load(){
    try {
      const r = await api.get('/admin/posts');
      setPosts(r.data || []);
    } catch(e){ console.error(e); }
  }

  return (
    <Card title="Recent Posts">
      <div className="space-y-2">
        {posts.map(p=>(
          <div key={p._1} className="p-3 border rounded">
            <div className="font-semibold">{p.author?.username}</div>
            <div>{p.text}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
