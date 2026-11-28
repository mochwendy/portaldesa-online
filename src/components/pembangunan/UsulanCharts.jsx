import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toNumber } from '@/api/base44Client';

const CHART_COLORS = [
  'hsl(160 58% 32%)', 'hsl(38 75% 50%)', 'hsl(200 55% 45%)',
  'hsl(25 70% 55%)', 'hsl(280 50% 55%)', 'hsl(340 70% 50%)',
  'hsl(100 50% 40%)', 'hsl(190 60% 45%)',
];

export default function UsulanCharts({ usulan }) {
  const getStatus = (u) => u?.status || u?.data?.status || 'Menunggu';
  const kategoriData = {};
  usulan.forEach(u => { if (u) kategoriData[u.kategori] = (kategoriData[u.kategori] || 0) + 1; });
  const kategoriChart = Object.entries(kategoriData).map(([name, value]) => ({ name, value }));

  const rwData = {};
  usulan.forEach(u => { if (u) { const key = u.rw ? `RW ${u.rw}` : (u.dusun || '-'); rwData[key] = (rwData[key] || 0) + 1; } });
  const rwChart = Object.entries(rwData).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));

  const prioritasData = {};
  usulan.forEach(u => { if (u) prioritasData[u.prioritas] = (prioritasData[u.prioritas] || 0) + 1; });
  const prioritasChart = Object.entries(prioritasData).map(([name, value]) => ({ name, value }));

  const anggaranData = {};
  usulan.filter(u => u && getStatus(u) !== 'Ditolak').forEach(u => {
    anggaranData[u.kategori] = (anggaranData[u.kategori] || 0) + toNumber(u.estimasi_anggaran);
  });
  const anggaranChart = Object.entries(anggaranData).map(([name, value]) => ({ name, value: Math.round(value / 1000000) }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-bold text-sm mb-1">Usulan per Kategori</h3>
        <p className="text-xs text-muted-foreground mb-4">Distribusi usulan berdasarkan kategori pembangunan</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={kategoriChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} interval={0} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-bold text-sm mb-1">Usulan per RW / Dusun</h3>
        <p className="text-xs text-muted-foreground mb-4">Sebaran usulan dari setiap wilayah</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rwChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(38 75% 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-bold text-sm mb-1">Prioritas Usulan</h3>
        <p className="text-xs text-muted-foreground mb-4">Tingkat prioritas usulan pembangunan</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={prioritasChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
              {prioritasChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-bold text-sm mb-1">Estimasi Anggaran per Kategori</h3>
        <p className="text-xs text-muted-foreground mb-4">Dalam jutaan Rupiah (exclude yang ditolak)</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={anggaranChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
            <Tooltip formatter={(v) => 'Rp ' + new Intl.NumberFormat('id-ID').format(v) + ' Jt'} />
            <Bar dataKey="value" fill="hsl(200 55% 45%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}