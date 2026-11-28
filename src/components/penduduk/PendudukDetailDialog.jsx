import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

const formatTanggal = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const isi = (value) => (value === null || value === undefined || String(value).trim() === '' ? '-' : value);

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{isi(value)}</p>
    </div>
  );
}

// Menampilkan seluruh indikator kependudukan hasil impor KK.
export default function PendudukDetailDialog({ open, onOpenChange, penduduk, onEdit }) {
  const p = penduduk || {};
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{isi(p.nama_lengkap)}</DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">NIK {isi(p.nik)}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nomor Kartu Keluarga" value={p.no_kk} />
          <Field label="No. WhatsApp / HP" value={p.no_wa} />
          <Field label="Status Hubungan Keluarga" value={p.status_keluarga} />
          <Field label="Jenis Kelamin" value={p.jenis_kelamin} />
          <Field label="Kelompok Usia" value={p.kelompok_usia} />
          <Field label="Tempat Lahir" value={p.tempat_lahir} />
          <Field label="Tanggal Lahir" value={formatTanggal(p.tanggal_lahir)} />
          <Field label="Agama" value={p.agama} />
          <Field label="Pendidikan Terakhir" value={p.pendidikan} />
          <Field label="Pekerjaan" value={p.pekerjaan} />
          <Field label="Status Perkawinan" value={p.status_perkawinan} />
          <Field label="Alamat" value={p.alamat} />
          <Field label="RT / RW" value={`${isi(p.rt)} / ${isi(p.rw)}`} />
          <Field label="Status Kepemilikan Rumah" value={p.status_rumah} />
          <Field label="Disabilitas" value={p.disabilitas} />
          <Field label="Daya / Sambungan Listrik" value={p.listrik} />
          <Field label="Status Kependudukan" value={p.status_kependudukan} />
          <Field label="Sumber Data" value={p.sumber_data} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          {onEdit && (
            <Button onClick={() => onEdit(p)}>
              <Pencil className="w-4 h-4 mr-1" /> Ubah Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}