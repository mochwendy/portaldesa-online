import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CHART_COLORS = [
  'hsl(160 58% 32%)', 'hsl(38 75% 50%)', 'hsl(200 55% 45%)',
  'hsl(25 70% 55%)', 'hsl(280 50% 55%)',
];

const STATUS_COLORS = {
  'Belum Mulai': 'hsl(0 0% 60%)',
  'Persiapan': 'hsl(38 75% 50%)',
  'Pelaksanaan': 'hsl(200 55% 45%)',
  'Selesai': 'hsl(160 58% 32%)',
  'Tertunda': 'hsl(0 72% 50%)',
};

export default function RealisasiCharts({ items }) {
  const progressData = items.map((i) => ({
    name: i.nama_kegiatan?.length > 20 ? i.nama_kegiatan.substring(0, 18) + '…' : i.nama_kegiatan,
    progress: i.persentase_progress || 0,
  }));

  const statusData = {};
  items.forEach((i) => { statusData[i.status] = (statusData[i.status] || 0) + 1; });
  const statusChart = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Progress per Kegiatan */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-lg mb-1">Progress per Kegiatan</h3>
        <p className="text-sm text-muted-foreground mb-4">Persentase penyelesaian tiap kegiatan</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={progressData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} interval={0} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="progress" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-lg mb-1">Distribusi Status</h3>
        <p className="text-sm text-muted-foreground mb-4">Jumlah kegiatan per status pelaksanaan</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
              {statusChart.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}