import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const STATUS_STYLES = {
  Baru: 'bg-blue-100 text-blue-700',
  Diproses: 'bg-amber-100 text-amber-700',
  Dijawab: 'bg-purple-100 text-purple-700',
  Selesai: 'bg-emerald-100 text-emerald-700',
  Ditolak: 'bg-red-100 text-red-700',
};

export const KATEGORI_STYLES = {
  Pengaduan: 'bg-red-50 text-red-600',
  Aspirasi: 'bg-purple-50 text-purple-600',
  'Permintaan Informasi': 'bg-blue-50 text-blue-600',
};

const formatTanggal = (value) => (value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

export default function AspirasiTable({ items, loading, onDetail, onDelete }) {
  if (loading) {
    return <p className="text-center text-muted-foreground py-14">Memuat aspirasi warga...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-14">
        <p className="font-medium">Belum ada aspirasi yang sesuai</p>
        <p className="text-sm text-muted-foreground mt-1">Aspirasi yang dikirim warga melalui portal akan tampil di sini.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-left p-3 font-medium">Tiket / Tanggal</th>
            <th className="text-left p-3 font-medium">Pelapor</th>
            <th className="text-left p-3 font-medium">Kategori</th>
            <th className="text-left p-3 font-medium">Judul</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-center p-3 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30 align-top">
              <td className="p-3 whitespace-nowrap">
                <p className="font-mono text-xs font-semibold">{item.nomor_tiket || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTanggal(item.created_date)}</p>
              </td>
              <td className="p-3">
                <p className="font-medium">{item.nama}</p>
                <p className="text-xs text-muted-foreground font-mono">{item.nik}</p>
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${KATEGORI_STYLES[item.kategori] || 'bg-muted'}`}>
                  {item.kategori}
                </span>
              </td>
              <td className="p-3 max-w-[260px]">
                <p className="font-medium line-clamp-2">{item.judul || '-'}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.isi}</p>
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[item.status] || 'bg-muted'}`}>
                  {item.status}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Kelola aspirasi" onClick={() => onDetail(item)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Hapus" onClick={() => onDelete(item)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}