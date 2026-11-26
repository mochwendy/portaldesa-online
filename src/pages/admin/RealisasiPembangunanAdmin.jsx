import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import RealisasiFormDialog from '@/components/realisasi/RealisasiFormDialog';
import RealisasiDetailDialog from '@/components/realisasi/RealisasiDetailDialog';
import RealisasiStats from '@/components/realisasi/RealisasiStats';
import RealisasiCharts from '@/components/realisasi/RealisasiCharts';
import RealisasiBanner from '@/components/realisasi/RealisasiBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Image, Download, FileDown, Eye } from 'lucide-react';
import { exportRealisasiPdf } from '@/lib/realisasiPdf';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const STATUS_STYLES = {
  'Belum Mulai': 'bg-muted text-muted-foreground',
  'Persiapan': 'bg-amber-100 text-amber-700',
  'Pelaksanaan': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-emerald-100 text-emerald-700',
  'Tertunda': 'bg-red-100 text-red-700',
};

export default function RealisasiPembangunanAdmin() {
  const [items, setItems] = useState([]);
  const [profilDesa, setProfilDesa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bannerItem, setBannerItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [res, profilRes] = await Promise.all([
        base44.entities.RealisasiPembangunan.filter({}, { sort: '-created_date', limit: 100 }),
        base44.entities.ProfilDesa.filter({}, { limit: 1 }),
      ]);
      setItems(res.items || []);
      if (profilRes.items?.length > 0) setProfilDesa(profilRes.items[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setDialogOpen(true); };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus kegiatan "${item.nama_kegiatan}"?`)) return;
    setDeletingId(item.id);
    try {
      await base44.entities.RealisasiPembangunan.delete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Realisasi Pembangunan" subtitle="Kelola pelaksanaan kegiatan pembangunan bersumber dari APBDes — progress, foto, dan banner kegiatan">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportRealisasiPdf(items, profilDesa)} disabled={items.length === 0}>
            <FileDown className="w-4 h-4" /> Unduh PDF
          </Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4" /> Tambah Kegiatan</Button>
        </div>
      </PageHeader>

      <RealisasiStats items={items} />

      {items.length > 0 && <RealisasiCharts items={items} />}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-xl shadow-sm overflow-hidden">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Kegiatan</th>
                <th className="text-left font-medium px-4 py-3">Sumber Dana</th>
                <th className="text-right font-medium px-4 py-3">Anggaran</th>
                <th className="text-left font-medium px-4 py-3 min-w-[160px]">Progress</th>
                <th className="text-center font-medium px-4 py-3">Status</th>
                <th className="text-center font-medium px-4 py-3">Foto</th>
                <th className="text-right font-medium px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const progress = item.persentase_progress || 0;
                const fotoCount = ['foto_0_uri', 'foto_50_uri', 'foto_100_uri'].filter((k) => item[k]).length;
                return (
                  <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.nama_kegiatan}</p>
                      <p className="text-xs text-muted-foreground">{item.lokasi || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{item.sumber_dana}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">TA {item.tahun_anggaran}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold">{formatRupiah(item.anggaran)}</p>
                      <p className="text-xs text-muted-foreground">Real: {formatRupiah(item.realisasi_anggaran)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground w-9 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || 'bg-muted text-muted-foreground'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs ${fotoCount > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        <Image className="w-3.5 h-3.5" />
                        {fotoCount}/3
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Lihat Detail" onClick={() => setDetailItem(item)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Generate Banner" onClick={() => setBannerItem(item)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item)} disabled={deletingId === item.id}>
                          {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Belum ada kegiatan. Klik "Tambah Kegiatan" untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RealisasiFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingItem={editing} onSaved={load} />
      <RealisasiDetailDialog open={!!detailItem} onOpenChange={(v) => !v && setDetailItem(null)} item={detailItem} onEdit={openEdit} />
      <RealisasiBanner open={!!bannerItem} onOpenChange={(v) => !v && setBannerItem(null)} kegiatan={bannerItem} profilDesa={profilDesa} />
    </div>
  );
}