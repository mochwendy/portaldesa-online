import React from 'react';
import { cn } from '@/lib/utils';

const styles = {
  Diajukan: 'bg-blue-50 text-blue-700 border-blue-200',
  Diproses: 'bg-amber-50 text-amber-700 border-amber-200',
  Disetujui: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Ditolak: 'bg-red-50 text-red-700 border-red-200',
  Selesai: 'bg-primary/10 text-primary border-primary/20',
  Berhasil: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Gagal: 'bg-red-50 text-red-700 border-red-200',
  Proses: 'bg-amber-50 text-amber-700 border-amber-200',
  Terjadwal: 'bg-blue-50 text-blue-700 border-blue-200',
  Aktif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Nonaktif: 'bg-muted text-muted-foreground border-border',
  Draft: 'bg-muted text-muted-foreground border-border',
  Dipublikasi: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Arsip: 'bg-muted text-muted-foreground border-border',
};

export default function StatusBadge({ status }) {
  const style = styles[status] || 'bg-muted text-muted-foreground border-border';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', style)}>
      {status}
    </span>
  );
}