import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, MapPin, Calendar, Wallet, User, FileText, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const formatRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const STATUS_STYLES = {
  'Diajukan': 'bg-muted text-muted-foreground',
  'Diverifikasi': 'bg-blue-100 text-blue-700',
  'Disetujui': 'bg-emerald-100 text-emerald-700',
  'Masuk Anggaran': 'bg-emerald-100 text-emerald-700',
  'Ditolak': 'bg-red-100 text-red-700',
  'Direalisasi': 'bg-amber-100 text-amber-700',
  'Selesai': 'bg-emerald-100 text-emerald-700',
};

function getStatus(u) {
  return u?.status || u?.data?.status || 'Menunggu';
}

const PRIORITAS_STYLES = {
  'Sangat Tinggi': 'bg-red-100 text-red-700',
  'Tinggi': 'bg-orange-100 text-orange-700',
  'Sedang': 'bg-yellow-100 text-yellow-700',
  'Rendah': 'bg-gray-100 text-gray-700',
};

export default function UsulanDetailDialog({ open, onOpenChange, item, onEdit }) {
  if (!item) return null;
  
  const [musdusUrl, setMusdusUrl] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setMusdusUrl(null);
    if (item.musdus_file_uri) {
      setLoadingDoc(true);
      let active = true;
      (async () => {
        try {
          const { signed_url } = await supabase.storage.from('surat-pdf').createSignedUrl(item.musdus_file_uri, 3600 || 3600);
          if (active) setMusdusUrl(signed_url);
        } catch (e) { console.error(e); }
        finally { if (active) setLoadingDoc(false); }
      })();
      return () => { active = false; };
    }
  }, [open, item]);

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3 pr-8">
            <span>Detail Usulan Pembangunan</span>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[getStatus(item)] || 'bg-muted text-muted-foreground'}`}>
              {getStatus(item)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Judul & pengusul */}
          <div>
            <h3 className="text-base font-bold text-foreground">{item.judul_usulan}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.pengusul}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(item.tanggal_usulan)}</span>
              {item.lokasi && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.lokasi}</span>}
            </div>
          </div>

          {/* Grid info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Kategori</p>
              <p className="text-sm font-medium text-foreground">{item.kategori}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prioritas</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITAS_STYLES[item.prioritas] || 'bg-gray-100'}`}>{item.prioritas}</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">RW / Dusun</p>
              <p className="text-sm font-medium text-foreground">{item.rw ? `RW ${item.rw}` : '-'}{item.dusun ? ` / ${item.dusun}` : ''}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tahun Anggaran</p>
              <p className="text-sm font-medium text-foreground">{item.tahun_anggaran}</p>
            </div>
          </div>

          {/* Anggaran */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Estimasi Anggaran</p>
            <p className="text-lg font-extrabold text-primary mt-1">{formatRupiah(item.estimasi_anggaran)}</p>
          </div>

          {/* Deskripsi */}
          {item.deskripsi && (
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3.5 h-3.5" /> Deskripsi Usulan</p>
              <p className="text-sm text-foreground whitespace-pre-wrap p-3 rounded-lg bg-muted/30 border border-border">{item.deskripsi}</p>
            </div>
          )}

          {/* Catatan verifikasi */}
          {item.catatan_verifikasi && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Catatan Verifikasi</p>
              <p className="text-sm text-foreground whitespace-pre-wrap p-3 rounded-lg bg-amber-50 border border-amber-200">{item.catatan_verifikasi}</p>
            </div>
          )}

          {/* APBDes & MUSDUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Selaras APBDes</p>
              {item.terkait_apbdes
                ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Selaras</Badge>
                : <span className="text-sm text-muted-foreground">Tidak</span>}
            </div>
            <div className="p-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Dokumen MUSDUS</p>
              {item.musdus_file_uri ? (
                musdusUrl ? (
                  <a href={musdusUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Download className="w-3.5 h-3.5" /> Lihat / Unduh
                  </a>
                ) : loadingDoc ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyiapkan...</span>
                ) : <span className="text-sm text-muted-foreground">Dokumen terlampir</span>
              ) : <span className="text-sm text-muted-foreground">Tidak ada dokumen</span>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose>
          <Button type="button" onClick={handleEdit}>
            <Pencil className="w-4 h-4" /> Edit & Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}