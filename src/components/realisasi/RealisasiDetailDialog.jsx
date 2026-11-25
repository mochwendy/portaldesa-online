import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageComponent } from '@/components/ui/image';
import { Pencil, MapPin, Calendar, Wallet, User, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const STATUS_STYLES = {
  'Belum Mulai': 'bg-muted text-muted-foreground',
  'Persiapan': 'bg-amber-100 text-amber-700',
  'Pelaksanaan': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-emerald-100 text-emerald-700',
  'Tertunda': 'bg-red-100 text-red-700',
};

function PhotoPreview({ uri, label }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(!!uri);

  useEffect(() => {
    if (!uri) { setLoading(false); return; }
    let active = true;
    (async () => {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
        if (active) setSignedUrl(signed_url);
      } catch (e) { console.error(e); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [uri]);

  if (!uri) {
    return (
      <div className="aspect-video rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
        <span className="text-xs text-muted-foreground">Belum ada foto</span>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="aspect-video rounded-lg border border-border flex items-center justify-center bg-muted/30">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <ImageComponent src={signedUrl} alt={label} className="aspect-video rounded-lg border border-border object-cover w-full" />
      <p className="text-xs text-center text-muted-foreground">{label}</p>
    </div>
  );
}

export default function RealisasiDetailDialog({ open, onOpenChange, item, onEdit }) {
  if (!item) return null;

  const progress = item.persentase_progress || 0;
  const serapan = item.anggaran > 0 ? Math.min(100, Math.round((item.realisasi_anggaran / item.anggaran) * 100)) : 0;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3 pr-8">
            <span>Detail Realisasi Pembangunan</span>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || 'bg-muted text-muted-foreground'}`}>
              {item.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Identitas */}
          <div>
            <h3 className="text-base font-bold text-foreground">{item.nama_kegiatan}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              {item.lokasi && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.lokasi}</span>}
              <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> TA {item.tahun_anggaran}</span>
              <Badge variant="outline" className="text-xs">{item.sumber_dana}</Badge>
            </div>
          </div>

          {/* Anggaran */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Anggaran</p>
              <p className="text-sm font-bold text-foreground mt-1">{formatRupiah(item.anggaran)}</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Realisasi Anggaran</p>
              <p className="text-sm font-bold text-foreground mt-1">{formatRupiah(item.realisasi_anggaran)}</p>
              <p className="text-xs text-muted-foreground">Serapan: {serapan}%</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">Progress Fisik</p>
              <p className="text-sm font-bold text-foreground mt-1">{progress}%</p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Pelaksana & tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3.5 h-3.5" /> Pelaksana</p>
              <p className="text-sm text-foreground">{item.pelaksana || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tanggal Mulai</p>
              <p className="text-sm text-foreground">{formatDate(item.tanggal_mulai)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tanggal Selesai</p>
              <p className="text-sm text-foreground">{formatDate(item.tanggal_selesai)}</p>
            </div>
          </div>

          {/* Catatan */}
          {item.catatan && (
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3.5 h-3.5" /> Catatan</p>
              <p className="text-sm text-foreground whitespace-pre-wrap p-3 rounded-lg bg-muted/30 border border-border">{item.catatan}</p>
            </div>
          )}

          {/* Foto progress */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Dokumentasi Foto Kegiatan</p>
            <div className="grid grid-cols-3 gap-3">
              <PhotoPreview uri={item.foto_0_uri} label="Progress 0%" />
              <PhotoPreview uri={item.foto_50_uri} label="Progress 50%" />
              <PhotoPreview uri={item.foto_100_uri} label="Progress 100%" />
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