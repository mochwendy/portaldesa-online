import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { STATUS_STYLES, KATEGORI_STYLES } from '@/components/aspirasi/AspirasiTable';

const PROCESSED_STATUS = ['Diproses', 'Dijawab', 'Selesai'];

const formatTanggal = (value) =>
  value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function AspirasiProcessedDialog({ open, onOpenChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    base44.entities.Aspirasi
      .filter({ status: { $in: PROCESSED_STATUS } }, { sort: '-updated_date', limit: 50 })
      .then((page) => {
        if (active) setItems(page.items || []);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aspirasi Warga yang Sudah Diproses</DialogTitle>
          <DialogDescription>
            Daftar aspirasi berstatus Diproses, Dijawab, dan Selesai beserta tindak lanjutnya.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-10">Memuat data aspirasi...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            Belum ada aspirasi yang diproses.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-border rounded-xl p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="font-mono text-xs font-semibold text-muted-foreground">
                    {item.nomor_tiket || '-'} · {formatTanggal(item.created_date)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[item.status] || 'bg-muted'}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KATEGORI_STYLES[item.kategori] || 'bg-muted'}`}>
                    {item.kategori}
                  </span>
                  <p className="text-sm font-semibold">{item.judul || '-'}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.isi}</p>
                <p className="text-xs text-muted-foreground">Pelapor: {item.nama}</p>
                {item.tanggapan ? (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      Tanggapan{item.petugas ? ` · ${item.petugas}` : ''}
                      {item.tanggal_tanggapan ? ` · ${formatTanggal(item.tanggal_tanggapan)}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{item.tanggapan}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Belum ada tanggapan tertulis.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}