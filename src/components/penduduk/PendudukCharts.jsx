import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts';
import ChartCard from '@/components/penduduk/ChartCard';

const PIE_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(200 40% 65%)',
];

const tooltipStyle = { borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 };

function PieBlock({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
          {data.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function VerticalBars({ data, color = 'hsl(var(--chart-1))', height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={10} interval={0} tickLine={false} angle={-20} textAnchor="end" height={45} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={38} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function HorizontalBars({ data, color = 'hsl(var(--chart-2))', height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" fontSize={10} width={130} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RwBars({ data, height = 260 }) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Belum ada data wilayah RW
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={10} interval={0} tickLine={false} axisLine={false} />
        <YAxis fontSize={10} tickLine={false} axisLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} jiwa`, 'Jumlah']} />
        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={48}>
          <LabelList dataKey="value" position="top" fontSize={10} fill="hsl(var(--muted-foreground))" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function PendudukCharts({ stats }) {
  const s = stats || {};
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Komposisi Jenis Kelamin" subtitle="Jumlah penduduk terdata">
        <PieBlock data={s.gender || []} />
      </ChartCard>
      <ChartCard title="Kelompok Usia" subtitle="Struktur umur penduduk">
        <VerticalBars data={(s.usia || []).filter((r) => r.value > 0)} />
      </ChartCard>
      <ChartCard title="Pendidikan Terakhir" subtitle="Jenjang pendidikan warga">
        <VerticalBars data={s.pendidikan || []} color="hsl(var(--chart-3))" />
      </ChartCard>
      <ChartCard title="Mata Pencaharian" subtitle="10 pekerjaan terbanyak">
        <HorizontalBars data={s.pekerjaan || []} height={280} />
      </ChartCard>
      <ChartCard title="Sebaran Penduduk per RW" subtitle="Jumlah warga tiap wilayah RW" height={260}>
        <RwBars data={s.wilayah || []} height={260} />
      </ChartCard>
      <ChartCard title="Status Perkawinan" subtitle="Komposisi status kawin warga">
        <PieBlock data={s.perkawinan || []} />
      </ChartCard>
    </div>
  );
}