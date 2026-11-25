import React from 'react';
import { Users, Home, UserCheck, HeartPulse } from 'lucide-react';
import StatCard from '@/components/StatCard';

export default function PendudukStatsGrid({ stats }) {
  const s = stats || {};
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Penduduk"
        value={s.total || 0}
        sublabel={`${s.lakiLaki || 0} L · ${s.perempuan || 0} P`}
        accent="bg-primary/10 text-primary"
      />
      <StatCard
        icon={Home}
        label="Kartu Keluarga"
        value={s.totalKK || 0}
        sublabel="KK terdata"
        accent="bg-blue-50 text-blue-600"
      />
      <StatCard
        icon={UserCheck}
        label="Usia Produktif"
        value={s.usiaProduktif || 0}
        sublabel="15–64 tahun"
        accent="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        icon={HeartPulse}
        label="Penyandang Disabilitas"
        value={s.disabilitas || 0}
        sublabel="Terdata"
        accent="bg-amber-50 text-amber-600"
      />
    </div>
  );
}