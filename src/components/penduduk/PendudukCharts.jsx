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
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
          {data.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={(value, name) => [`${value} jiwa (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function VerticalBars({ data, color = 'hsl(var(--chart-1))', height = 220 }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          fontSize={10} 
          interval={0} 
          tickLine={false} 
          angle={-35} 
          textAnchor="end" 
          height={55}
          tick={{ fontSize: 9 }}
        />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={38} />
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={(value, name) => [`${value} jiwa (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function HorizontalBars({ data, color = 'hsl(var(--chart-2))', height = 260 }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" fontSize={10} width={160} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={(value, name) => [`${value} jiwa (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
        />
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
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          fontSize={10} 
          interval={0} 
          tickLine={false} 
          axisLine={false} 
          tick={{ fontSize: 9 }}
        />
        <YAxis fontSize={10} tickLine={false} axisLine={false} width={36} />
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={(value, name) => [`${value} jiwa (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
        />
        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={48}>
          <LabelList dataKey="value" position="top" fontSize={10} fill="hsl(var(--muted-foreground))" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HorizontalBarsStacked({ data, colors, height = 260 }) {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Belum ada data
      </div>
    );
  }
  
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  // Convert to stacked format for horizontal bar chart
  const seriesData = data.map(item => ({
    name: item.name,
    ...(item.values || {}),
    total: item.value
  }));
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={seriesData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" fontSize={10} width={160} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={(value, name) => [`${value} jiwa (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
        />
        {colors.map((color, index) => (
          <Bar 
            key={index} 
            dataKey={`col${index}`} 
            fill={color} 
            radius={[0, 6, 6, 0]} 
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data, height = 220 }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  
  // If no data or all zeros, show empty state
  if (!data.length || total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Data tidak tersedia
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
          {data.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip 
          contentStyle={tooltipStyle} 
          formatter={(value, name) => [`${value} jiwa (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function PendudukCharts({ stats }) {
  const s = stats || {};
  
  // Helper to calculate age policy segments
  const agePolicySegments = [
    { name: 'Balita (0-5 th)', min: 0, max: 5 },
    { name: 'Usia Sekolah (6-18 th)', min: 6, max: 18 },
    { name: 'Pemuda (19-30 th)', min: 19, max: 30 },
    { name: 'Dewasa (31-59 th)', min: 31, max: 59 },
    { name: 'Lansia (60+ th)', min: 60, max: 150 }
  ];
  
  // Map usia groups to policy segments
  const policySegments = agePolicySegments.map(segment => {
    let count = 0;
    (s.usia || []).forEach(group => {
      const match = group.name.match(/(\d+)/);
      if (match) {
        const age = Number(match[1]);
        if (age >= segment.min && age <= segment.max) {
          count += group.value;
        }
      }
    });
    return { name: segment.name, value: count };
  });
  
  // Calculate blood type (if available in data - we'll check if summary has it)
  // Since the current summary doesn't have blood type, we'll show placeholder
  const bloodTypes = [
    { name: 'A', value: 0 },
    { name: 'B', value: 0 },
    { name: 'AB', value: 0 },
    { name: 'O', value: 0 },
    { name: 'Belum Terdata', value: 0 }
  ];
  
  // Religion is already in s.agama
  
  return (
    <div className="demografi-responsive-grid">
      {/* Existing charts (6 charts) */}
      <ChartCard title="Komposisi Jenis Kelamin" subtitle="Jumlah penduduk terdata" style={{ width: '100%', minWidth: 0 }}>
        <PieBlock data={s.gender || []} />
      </ChartCard>
      <ChartCard title="Kelompok Usia" subtitle="Struktur umur penduduk" style={{ width: '100%', minWidth: 0 }}>
        <VerticalBars data={(s.usia || []).filter((r) => r.value > 0)} />
      </ChartCard>
      <ChartCard title="Pendidikan Terakhir" subtitle="Jenjang pendidikan warga" style={{ width: '100%', minWidth: 0 }}>
        <VerticalBars data={s.pendidikan || []} color="hsl(var(--chart-3))" />
      </ChartCard>
      <ChartCard title="Mata Pencaharian" subtitle="10 pekerjaan terbanyak" style={{ width: '100%', minWidth: 0 }}>
        <VerticalBars data={s.pekerjaan || []} height={280} />
      </ChartCard>
      <ChartCard title="Sebaran Penduduk per RW" subtitle="Jumlah warga tiap wilayah RW" height={260} style={{ width: '100%', minWidth: 0 }}>
        <RwBars data={s.wilayah || []} height={260} />
      </ChartCard>
      <ChartCard title="Status Perkawinan" subtitle="Komposisi status kawin warga" style={{ width: '100%', minWidth: 0 }}>
        <PieBlock data={s.perkawinan || []} />
      </ChartCard>
      
      {/* New charts (3 charts) */}
      <ChartCard title="Segmentasi Usia Kebijakan" subtitle="Klasifikasi usia berdasarkan kebijakan" height={260} style={{ width: '100%', minWidth: 0 }}>
        <HorizontalBars data={policySegments} color="hsl(var(--chart-4))" />
      </ChartCard>
      <ChartCard title="Distribusi Golongan Darah" subtitle="Pengelompokan golongan darah" height={220} style={{ width: '100%', minWidth: 0 }}>
        <DonutChart data={bloodTypes} />
      </ChartCard>
      <ChartCard title="Komposisi Agama" subtitle="Pengelompokan berdasarkan agama" height={220} style={{ width: '100%', minWidth: 0 }}>
        <DonutChart data={s.agama || []} />
      </ChartCard>
    </div>
  );
}