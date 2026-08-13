import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

export default function Analytics() {
  const [data, setData] = useState([{ time: 'Loading...', count: 0 }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/analytics');
        // Extract hourly data 
        const chartData = response.data.hourly.map(item => ({
          time: item.name,
          count: item.count
        }));
        setData(chartData.length > 0 ? chartData : [{ time: 'No data', count: 0 }]);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setData([{ time: 'Error', count: 0 }]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200 animate-fade-in mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Activity</h2>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', color: '#111827' }}
              itemStyle={{ color: '#0d9488' }}
            />
            <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-gray-500 text-sm mt-4 text-center">Coconuts counted per hour</p>
    </div>
  );
}
