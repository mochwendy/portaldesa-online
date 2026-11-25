import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowRight } from 'lucide-react';

const CHART_COLORS = [
  'hsl(160 58% 32%)', 'hsl(38 75% 50%)', 'hsl(200 55% 45%)',
  'hsl(25 70% 55%)', 'hsl(280 50% 55%)', 'hsl(340 70% 50%)',
  'hsl(100 50% 40%)', 'hsl(190 60% 45%)',
];

const STATUS_COLORS = {
  'Diajukan': 'hsl(200 55% 45%)',
  'Diverifikasi': 'hsl(38 75% 50%)',
  'Disetujui': 'hsl(160 58% 32%)',
  'Masuk Anggaran': 'hsl(280 50% 55%)',
  'Ditolak': 'hsl(0 72% 50%)',
  'Direalisasi': 'hsl(25 70% 55%)',
  'Selesai': 'hsl(100 50% 40%)',
};

export default function DashboardUsulanCharts({ usulan }) {
  const total = usulan.length;

  const kategoriData = {};
  usulan.forEach(u => { kategoriData[u.kategori] = (kategoriData[u.kategori] || 0) + 1; });
  const kategoriChart = Object.entries(kategoriData).map(([name, value]) => ({ name, value }));

  const statusData = {};
  usulan.forEach(u => { statusData[u.status] = (statusData[u.status] || 0) + 1; });
  const statusChart = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">Usulan Pembangunan</h3>
          <p className="text-sm text-muted-foreground">{total} usulan tercatat</p>
        </div>
        <Link to="/admin/pembangunan" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          Detail <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Per Kategori</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={kategoriChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Per Status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
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
    </div>
  );
}