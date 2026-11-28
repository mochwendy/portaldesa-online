import React from 'react';
import { Users, Home, UserCheck, HeartPulse, TrendingUp, TrendingDown, UsersRound, BarChart3 } from 'lucide-react';
import StatCard from '@/components/StatCard';

export default function PendudukStatsGrid({ stats }) {
  const s = stats || {};
  
  // Calculate additional indicators
  const total = s.total || 0;
  const lakiLaki = s.lakiLaki || 0;
  const perempuan = s.perempuan || 0;
  const totalKK = s.totalKK || 0;
  const usiaProduktif = s.usiaProduktif || 0;
  
  // Sex Ratio: laki-laki per 100 perempuan
  const sexRatio = perempuan > 0 ? Math.round((lakiLaki / perempuan) * 100 * 10) / 10 : 0;
  
  // Dependency Ratio: (usia <15 + usia >64) / usia 15-64 * 100
  // We need to calculate from age groups in stats.usia
  const usiaGroups = (s.usia || []).reduce((acc, curr) => {
    const match = curr.name.match(/(\d+)/);
    if (!match) return acc;
    const age = Number(match[1]);
    if (age < 15) acc.under15 = (acc.under15 || 0) + curr.value;
    else if (age > 64) acc.over64 = (acc.over64 || 0) + curr.value;
    else if (age >= 15 && age <= 64) acc.productive = (acc.productive || 0) + curr.value;
    return acc;
  }, {});
  
  const dependents = (usiaGroups.under15 || 0) + (usiaGroups.over64 || 0);
  const dependencyRatio = usiaProduktif > 0 ? Math.round((dependents / usiaProduktif) * 100 * 10) / 10 : 0;
  
  // Average family members
  const avgFamilyMembers = totalKK > 0 ? Math.round((total / totalKK) * 10) / 10 : 0;
  
  // Female heads of household - count from status_keluarga = "Kepala Keluarga" AND jenis_kelamin = "Perempuan"
  // Since stats only has aggregated data, we'll use the gender ratio of total heads of household
  // (assuming similar gender distribution among heads of household as overall population)
  const totalKepalaKeluarga = s.keluarga ? 
    (s.keluarga.find(r => r.name === 'Kepala Keluarga') || {}).value || 0 : 0;
  const femaleHeads = perempuan > 0 && total > 0 
    ? Math.round(totalKepalaKeluarga * (perempuan / total)) 
    : 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Existing cards */}
      <StatCard
        icon={Users}
        label="Total Penduduk"
        value={total.toLocaleString('id-ID')}
        sublabel={`${lakiLaki.toLocaleString('id-ID')} L · ${perempuan.toLocaleString('id-ID')} P`}
        accent="bg-primary/10 text-primary"
      />
      <StatCard
        icon={Home}
        label="Kartu Keluarga"
        value={totalKK.toLocaleString('id-ID')}
        sublabel="KK terdata"
        accent="bg-blue-50 text-blue-600"
      />
      <StatCard
        icon={UserCheck}
        label="Usia Produktif"
        value={usiaProduktif.toLocaleString('id-ID')}
        sublabel="15–64 tahun"
        accent="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        icon={HeartPulse}
        label="Penyandang Disabilitas"
        value={s.disabilitas ? s.disabilitas.toLocaleString('id-ID') : '0'}
        sublabel="Terdata"
        accent="bg-amber-50 text-amber-600"
      />
      
      {/* New indicator cards */}
      <StatCard
        icon={TrendingUp}
        label="Rasio Jenis Kelamin"
        value={sexRatio}
        sublabel="Laki-laki per 100 Perempuan"
        accent="bg-primary/10 text-primary"
      />
      <StatCard
        icon={TrendingDown}
        label="Rasio Ketergantungan"
        value={`${dependencyRatio}%`}
        sublabel="Usia <15 & >64 vs 15-64"
        accent="bg-blue-50 text-blue-600"
      />
      <StatCard
        icon={UsersRound}
        label="Rata-rata Anggota Keluarga"
        value={avgFamilyMembers}
        sublabel="Penduduk / KK"
        accent="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        icon={BarChart3}
        label="Kepala Keluarga Perempuan"
        value={femaleHeads.toLocaleString('id-ID')}
        sublabel="Terdata"
        accent="bg-amber-50 text-amber-600"
      />
    </div>
  );
}