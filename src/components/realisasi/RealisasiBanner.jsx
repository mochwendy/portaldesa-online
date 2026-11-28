import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');

export default function RealisasiBanner({ open, onOpenChange, kegiatan, profilDesa }) {
  const bannerRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [photoUrls, setPhotoUrls] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (!kegiatan) return;
    setLoadingPhotos(true);
    const urls = {};
    const keys = ['foto_0_uri', 'foto_50_uri', 'foto_100_uri'];
    await Promise.all(keys.map(async (key) => {
      if (kegiatan[key]) {
        try {
          const { signed_url } = await supabase.storage.from('surat-pdf').createSignedUrl(kegiatan[key], 3600 || 3600);
          urls[key] = signed_url;
        } catch (e) { /* ignore */ }
      }
    }));
    setPhotoUrls(urls);
    setLoadingPhotos(false);
  }, [kegiatan]);

  useEffect(() => {
    if (open && kegiatan) {
      setPhotoUrls({});
      loadPhotos();
    }
  }, [open, kegiatan, loadPhotos]);

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      const safeName = (kegiatan.nama_kegiatan || 'kegiatan').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      link.download = `Banner_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
      alert('Gagal generate banner: ' + (e?.message || 'unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  if (!kegiatan) return null;

  const progress = kegiatan.persentase_progress || 0;
  const namaDesa = profilDesa?.nama_desa || 'Desa Tagog Apu';
  const kabupaten = profilDesa?.kabupaten || 'Kab. Bandung Barat';
  const kecamatan = profilDesa?.kecamatan ? `Kec. ${profilDesa.kecamatan}` : '';
  const kades = profilDesa?.kepala_desa || '_________________';
  const sekdes = profilDesa?.sekretaris_desa || '_________________';

  const photos = [
    { label: 'KONDISI AWAL (0%)', url: photoUrls.foto_0_uri },
    { label: 'PELAKSANAAN (50%)', url: photoUrls.foto_50_uri },
    { label: 'SELESAI (100%)', url: photoUrls.foto_100_uri },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Banner Kegiatan</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Banner informasi kegiatan & anggaran dalam format PNG — siap diunduh, dicetak, dan ditempat di lokasi kegiatan.
        </p>

        {/* Banner Preview */}
        <div className="flex justify-center bg-muted/30 p-4 rounded-lg overflow-auto">
          <div
            ref={bannerRef}
            style={{ width: '720px', minHeight: '1018px' }}
            className="bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-5 text-center">
              <div className="flex items-center justify-center gap-3">
                <Building2 className="w-9 h-9 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-extrabold text-lg leading-tight">
                    PEMERINTAH DESA {namaDesa.toUpperCase()}
                  </p>
                  <p className="text-xs opacity-80">{kecamatan} {kabupaten}</p>
                </div>
              </div>
            </div>

            {/* Title Bar */}
            <div className="bg-accent text-accent-foreground py-3 text-center">
              <p className="font-extrabold text-xl tracking-wide">INFORMASI KEGIATAN PEMBANGUNAN DESA</p>
              <p className="font-semibold text-sm mt-0.5">Tahun Anggaran {kegiatan.tahun_anggaran || 2026}</p>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 space-y-5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Nama Kegiatan</p>
                <p className="font-extrabold text-2xl text-primary mt-1">{kegiatan.nama_kegiatan}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="border-b border-border pb-2">
                  <p className="text-muted-foreground text-xs">Anggaran</p>
                  <p className="font-bold text-base text-foreground">{formatRupiah(kegiatan.anggaran)}</p>
                </div>
                <div className="border-b border-border pb-2">
                  <p className="text-muted-foreground text-xs">Sumber Dana</p>
                  <p className="font-bold text-base text-foreground">{kegiatan.sumber_dana}</p>
                </div>
                <div className="border-b border-border pb-2">
                  <p className="text-muted-foreground text-xs">Lokasi</p>
                  <p className="font-bold text-foreground">{kegiatan.lokasi || '-'}</p>
                </div>
                <div className="border-b border-border pb-2">
                  <p className="text-muted-foreground text-xs">Pelaksana</p>
                  <p className="font-bold text-foreground">{kegiatan.pelaksana || '-'}</p>
                </div>
                <div className="border-b border-border pb-2 col-span-2">
                  <p className="text-muted-foreground text-xs">Waktu Pelaksanaan</p>
                  <p className="font-bold text-foreground">
                    {kegiatan.tanggal_mulai || '-'} s/d {kegiatan.tanggal_selesai || '-'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold text-muted-foreground">PROGRESS PEKERJAAN</p>
                  <p className="text-sm font-extrabold text-primary">{progress}%</p>
                </div>
                <div className="w-full h-7 bg-muted rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold transition-all"
                    style={{ width: `${Math.max(progress, progress > 0 ? 8 : 0)}%` }}
                  >
                    {progress > 12 ? `${progress}%` : ''}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((p, i) => (
                  <div key={i} className="border-2 border-border rounded-lg overflow-hidden">
                    {p.url ? (
                      <img
                        src={p.url}
                        alt={p.label}
                        className="w-full h-28 object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-28 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        Belum ada foto
                      </div>
                    )}
                    <p className="text-center text-[10px] font-bold py-1.5 bg-primary/5 text-primary">
                      {p.label}
                    </p>
                  </div>
                ))}
              </div>

              {kegiatan.catatan && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Catatan:</p>
                  <p className="text-foreground">{kegiatan.catatan}</p>
                </div>
              )}
            </div>

            {/* Footer Officials */}
            <div className="bg-primary/5 border-t-2 border-primary/20 p-5">
              <div className="grid grid-cols-2 gap-8 text-center text-sm">
                <div>
                  <p className="font-semibold text-foreground">Mengetahui,</p>
                  <p className="text-muted-foreground text-xs">Kepala Desa</p>
                  <div className="h-20" />
                  <p className="font-bold underline text-foreground">{kades}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">&nbsp;</p>
                  <p className="text-muted-foreground text-xs">Sekretaris Desa</p>
                  <div className="h-20" />
                  <p className="font-bold underline text-foreground">{sekdes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={generating}>Tutup</Button></DialogClose>
          <Button onClick={handleDownload} disabled={generating || loadingPhotos}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loadingPhotos ? 'Menyiapkan foto...' : 'Download PNG'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}