import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_STYLES } from '@/components/aspirasi/AspirasiTable';
import AspirasiProcessedDialog from '@/components/aspirasi/AspirasiProcessedDialog';

const STAT_ITEMS = [
  { key: 'baru', label: 'Baru', tone: 'bg-blue-50 text-blue-600' },
  { key: 'diproses', label: 'Diproses', tone: 'bg-amber-50 text-amber-600' },
  { key: 'selesai', label: 'Selesai', tone: 'bg-emerald-50 text-emerald-600' },
];

export default function DashboardAspirasiPanel({ items = [], stats = {} }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Aspirasi Warga</h3>
        <Link to="/admin/aspirasi" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          Detail <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {STAT_ITEMS.map((s) => (
          <div key={s.key} className={`rounded-xl p-3 ${s.tone}`}>
            <p className="text-xl font-extrabold">{stats[s.key] || 0}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{item.judul || item.nama}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.nomor_tiket || '-'} · {item.nama}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[item.status] || 'bg-muted'}`}>
              {item.status}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada aspirasi warga</p>
        )}
      </div>

      <Button variant="outline" className="w-full mt-4" onClick={() => setOpen(true)}>
        <MessagesSquare className="w-4 h-4" /> Lihat Data yang Sudah Diproses
      </Button>

      <AspirasiProcessedDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}