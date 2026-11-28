import React, { useState } from 'react';
import { Pencil, Trash2, Search, Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const PRIORITAS_STYLES = {
  'Sangat Tinggi': 'bg-red-100 text-red-700',
  'Tinggi': 'bg-orange-100 text-orange-700',
  'Sedang': 'bg-yellow-100 text-yellow-700',
  'Rendah': 'bg-gray-100 text-gray-700',
};

const STATUS_OPTIONS = ['Diajukan', 'Diverifikasi', 'Disetujui', 'Masuk Anggaran', 'Ditolak', 'Direalisasi', 'Selesai'];

const formatRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);

export default function UsulanTable({ usulan, onEdit, onDelete, onStatusChange, onDetail, filters, onFilterChange }) {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (u) => {
    setDownloading(u.id);
    try {
      const { signed_url } = await supabase.storage.from('surat-pdf').createSignedUrl(u.musdus_file_uri, 3600 || 3600);
      window.open(signed_url, '_blank');
    } catch (e) { console.error(e); }
    finally { setDownloading(null); }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari usulan atau pengusul..."
            value={filters.search}
            onChange={e => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select value={filters.status} onValueChange={v => onFilterChange({ ...filters, status: v })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.kategori} onValueChange={v => onFilterChange({ ...filters, kategori: v })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {KATEGORI_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left p-3 font-medium">Judul / Pengusul</th>
              <th className="text-left p-3 font-medium">RW / Dusun</th>
              <th className="text-left p-3 font-medium">Kategori</th>
              <th className="text-left p-3 font-medium">Prioritas</th>
              <th className="text-right p-3 font-medium">Estimasi</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-center p-3 font-medium">APBDes</th>
              <th className="text-center p-3 font-medium">MUSDUS</th>
              <th className="text-center p-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usulan.length === 0 ? (
              <tr><td colSpan={9} className="text-center p-8 text-muted-foreground">Tidak ada usulan ditemukan.</td></tr>
            ) : usulan.map(u => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <p className="font-medium text-foreground">{u.judul_usulan}</p>
                  <p className="text-xs text-muted-foreground">{u.pengusul} · {u.tanggal_usulan ? new Date(u.tanggal_usulan).toLocaleDateString('id-ID') : '-'}</p>
                </td>
                <td className="p-3 text-xs whitespace-nowrap">{u.rw ? `RW ${u.rw}` : '-'}{u.dusun ? ` / ${u.dusun}` : ''}</td>
                <td className="p-3 text-xs whitespace-nowrap">{u.kategori}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITAS_STYLES[u.prioritas] || 'bg-gray-100'}`}>{u.prioritas}</span></td>
                <td className="p-3 text-right text-xs font-medium whitespace-nowrap">{formatRupiah(u.estimasi_anggaran)}</td>
                <td className="p-3">
                  <Select value={u.status} onValueChange={v => onStatusChange(u.id, v)}>
                    <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-center">
                  {u.terkait_apbdes ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Selaras</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                </td>
                <td className="p-3 text-center">
                  {u.musdus_file_uri ? (
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview MUSDUS" onClick={() => handleDownload(u)} disabled={downloading === u.id}>
                        {downloading === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Unduh MUSDUS" onClick={() => handleDownload(u)} disabled={downloading === u.id}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Lihat Detail" onClick={() => onDetail(u)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(u)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}