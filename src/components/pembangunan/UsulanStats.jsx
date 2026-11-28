import React from 'react';
import { ClipboardList, CheckCircle2, Clock, Search, TrendingUp, Wallet } from 'lucide-react';
import { toNumber } from '@/api/base44Client';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function UsulanStats({ usulan }) {
  const getStatus = (u) => u?.status || u?.data?.status || 'Menunggu';
  const total = usulan.filter(Boolean).length;
  const diajukan = usulan.filter(u => u && getStatus(u) === 'Diajukan').length;
  const diverifikasi = usulan.filter(u => u && getStatus(u) === 'Diverifikasi').length;
  const disetujui = usulan.filter(u => u && getStatus(u) === 'Disetujui').length;
  const masukAnggaran = usulan.filter(u => u && getStatus(u) === 'Masuk Anggaran').length;
  const totalAnggaran = usulan.filter(u => u && getStatus(u) !== 'Ditolak').reduce((s, u) => s + toNumber(u.estimasi_anggaran), 0);

  const stats = [
    { icon: ClipboardList, label: 'Total Usulan', value: total, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Clock, label: 'Diajukan', value: diajukan, color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Search, label: 'Diverifikasi', value: diverifikasi, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: CheckCircle2, label: 'Disetujui', value: disetujui, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Wallet, label: 'Masuk Anggaran', value: masukAnggaran, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TrendingUp, label: 'Total Estimasi', value: formatRupiah(totalAnggaran), color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
            <s.icon className="w-5 h-5" />
          </div>
          <p className="text-lg font-extrabold text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}