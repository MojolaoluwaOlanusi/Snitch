import React from 'react';
import Card from '../components/Card';

export default function Dashboard(){
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card title="Total Users">1,240</Card>
      <Card title="Posts Today">52</Card>
      <Card title="Active Admins">3</Card>
    </div>
  )
}
