import React from 'react';
import { HardHat, Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function RealisasiStats({ items }) {
  const total = items.length;
  const totalAnggaran = items.reduce((s, i) => s + (i.anggaran || 0), 0);
  const totalRealisasi = items.reduce((s, i) => s + (i.realisasi_anggaran || 0), 0);
  const selesai = items.filter((i) => i.status === 'Selesai').length;
  const avgProgress = total > 0
    ? Math.round(items.reduce((s, i) => s + (i.persentase_progress || 0), 0) / total)
    : 0;

  const stats = [
    { icon: HardHat, label: 'Total Kegiatan', value: total, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Wallet, label: 'Total Anggaran', value: formatRupiah(totalAnggaran), color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: TrendingUp, label: 'Realisasi Anggaran', value: formatRupiah(totalRealisasi), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: CheckCircle2, label: 'Rata-rata Progress', value: `${avgProgress}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
            <s.icon className="w-5 h-5" />
          </div>
          <p className="text-lg font-extrabold text-foreground truncate">{s.value}</p>
          <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}