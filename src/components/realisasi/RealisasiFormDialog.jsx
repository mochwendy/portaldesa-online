import React, { useState, useEffect } from 'react';
import { createSupabaseEntity } from '@/api/supabaseAdapter';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import PhotoUploadField from './PhotoUploadField';

const SUMBER_DANA_OPTIONS = ['Dana Desa', 'APBD', 'APBN', 'PADes', 'Lainnya'];
const STATUS_OPTIONS = ['Belum Mulai', 'Persiapan', 'Pelaksanaan', 'Selesai', 'Tertunda'];

const DEFAULTS = {
  nama_kegiatan: '', tahun_anggaran: 2026, sumber_dana: 'Dana Desa',
  anggaran: 0, realisasi_anggaran: 0, persentase_progress: 0,
  status: 'Belum Mulai', lokasi: '', pelaksana: '',
  tanggal_mulai: '', tanggal_selesai: '',
  foto_0_uri: '', foto_50_uri: '', foto_100_uri: '', catatan: '',
};

export default function RealisasiFormDialog({ open, onOpenChange, editingItem, onSaved }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(editingItem ? { ...DEFAULTS, ...editingItem } : DEFAULTS);
      setError('');
    }
  }, [open, editingItem]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nama_kegiatan.trim()) {
      setError('Nama kegiatan wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        nama_kegiatan: form.nama_kegiatan.trim(),
        tahun_anggaran: Number(form.tahun_anggaran) || 2026,
        anggaran: Number(form.anggaran) || 0,
        realisasi_anggaran: Number(form.realisasi_anggaran) || 0,
        persentase_progress: Math.min(100, Math.max(0, Number(form.persentase_progress) || 0)),
      };
      const entity = createSupabaseEntity('RealisasiPembangunan');
      if (editingItem) {
        await entity.update(editingItem.id, data);
      } else {
        await entity.create(data);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Realisasi Pembangunan' : 'Tambah Realisasi Pembangunan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nama Kegiatan *</Label>
            <Input value={form.nama_kegiatan} onChange={(e) => set('nama_kegiatan', e.target.value)} placeholder="contoh: Pembangunan Jalan Dusun Cibogo" disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sumber Dana</Label>
              <Select value={form.sumber_dana} onValueChange={(v) => set('sumber_dana', v)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUMBER_DANA_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tahun Anggaran</Label>
              <Input type="number" value={form.tahun_anggaran} onChange={(e) => set('tahun_anggaran', e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Anggaran (Rp)</Label>
              <Input type="number" value={form.anggaran} onChange={(e) => set('anggaran', e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Realisasi Anggaran (Rp)</Label>
              <Input type="number" value={form.realisasi_anggaran} onChange={(e) => set('realisasi_anggaran', e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Persentase Progress (%)</Label>
              <Input type="number" min="0" max="100" value={form.persentase_progress} onChange={(e) => set('persentase_progress', e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lokasi Kegiatan</Label>
              <Input value={form.lokasi} onChange={(e) => set('lokasi', e.target.value)} placeholder="RT/RW, Dusun" disabled={loading} />
            </div>
            <div>
              <Label>Pelaksana / Kontraktor</Label>
              <Input value={form.pelaksana} onChange={(e) => set('pelaksana', e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={form.tanggal_mulai} onChange={(e) => set('tanggal_mulai', e.target.value)} disabled={loading} />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={form.tanggal_selesai} onChange={(e) => set('tanggal_selesai', e.target.value)} disabled={loading} />
            </div>
          </div>

          <div>
            <Label>Foto Kegiatan</Label>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <PhotoUploadField label="Progress 0%" fileUri={form.foto_0_uri} onChange={(uri) => set('foto_0_uri', uri)} disabled={loading} />
              <PhotoUploadField label="Progress 50%" fileUri={form.foto_50_uri} onChange={(uri) => set('foto_50_uri', uri)} disabled={loading} />
              <PhotoUploadField label="Progress 100%" fileUri={form.foto_100_uri} onChange={(uri) => set('foto_100_uri', uri)} disabled={loading} />
            </div>
          </div>

          <div>
            <Label>Catatan</Label>
            <Textarea value={form.catatan} onChange={(e) => set('catatan', e.target.value)} rows={2} disabled={loading} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Batal</Button></DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingItem ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}