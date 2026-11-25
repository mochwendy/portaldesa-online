import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AGAMA_OPTIONS, PENDIDIKAN_OPTIONS, PERKAWINAN_OPTIONS, KELUARGA_OPTIONS,
  hitungKelompokUsia,
} from '@/lib/pendudukExcel';

export const emptyPenduduk = {
  nik: '', no_kk: '', nama_lengkap: '', jenis_kelamin: 'Laki-laki', tempat_lahir: '',
  tanggal_lahir: '', agama: 'Islam', pendidikan: 'SMA/SMK', pekerjaan: '',
  status_perkawinan: 'Belum Kawin', status_keluarga: 'Kepala Keluarga',
  status_rumah: '', disabilitas: '', listrik: '', alamat: '', rt: '', rw: '',
  status_kependudukan: 'Aktif',
};

const Field = ({ label, children, wide = false }) => (
  <div className={wide ? 'col-span-2' : ''}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

export default function PendudukFormDialog({ open, onOpenChange, initial, onSaved }) {
  const [form, setForm] = useState(emptyPenduduk);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...emptyPenduduk, ...initial } : emptyPenduduk);
  }, [open, initial]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        kelompok_usia: hitungKelompokUsia(form.tanggal_lahir),
        jumlah_anggota: undefined,
      };
      delete payload.id;
      delete payload.created_by_id;
      delete payload.created_by;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.jumlah_anggota;
      if (initial?.id) await base44.entities.Penduduk.update(initial.id, payload);
      else await base44.entities.Penduduk.create(payload);
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Edit Data Penduduk' : 'Tambah Data Penduduk'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="NIK (16 digit)">
            <Input value={form.nik} maxLength={16} onChange={(e) => set('nik', e.target.value)} />
          </Field>
          <Field label="Nomor Kartu Keluarga">
            <Input value={form.no_kk} maxLength={16} onChange={(e) => set('no_kk', e.target.value)} />
          </Field>
          <Field label="Nama Lengkap" wide>
            <Input value={form.nama_lengkap} onChange={(e) => set('nama_lengkap', e.target.value)} />
          </Field>
          <Field label="Jenis Kelamin">
            <Select value={form.jenis_kelamin} onValueChange={(v) => set('jenis_kelamin', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Laki-laki', 'Perempuan', 'Tidak Diisi'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status Hubungan Keluarga">
            <Select value={form.status_keluarga} onValueChange={(v) => set('status_keluarga', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KELUARGA_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tempat Lahir">
            <Input value={form.tempat_lahir} onChange={(e) => set('tempat_lahir', e.target.value)} />
          </Field>
          <Field label="Tanggal Lahir">
            <Input type="date" value={form.tanggal_lahir || ''} onChange={(e) => set('tanggal_lahir', e.target.value)} />
          </Field>
          <Field label="Agama">
            <Select value={form.agama} onValueChange={(v) => set('agama', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGAMA_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pendidikan Terakhir">
            <Select value={form.pendidikan} onValueChange={(v) => set('pendidikan', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PENDIDIKAN_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pekerjaan">
            <Input value={form.pekerjaan} onChange={(e) => set('pekerjaan', e.target.value)} />
          </Field>
          <Field label="Status Perkawinan">
            <Select value={form.status_perkawinan} onValueChange={(v) => set('status_perkawinan', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERKAWINAN_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Alamat / Kampung" wide>
            <Input value={form.alamat} onChange={(e) => set('alamat', e.target.value)} />
          </Field>
          <Field label="RT">
            <Input value={form.rt} onChange={(e) => set('rt', e.target.value)} />
          </Field>
          <Field label="RW">
            <Input value={form.rw} onChange={(e) => set('rw', e.target.value)} />
          </Field>
          <Field label="Status Kepemilikan Rumah">
            <Input value={form.status_rumah} onChange={(e) => set('status_rumah', e.target.value)} />
          </Field>
          <Field label="Disabilitas">
            <Input value={form.disabilitas} onChange={(e) => set('disabilitas', e.target.value)} />
          </Field>
          <Field label="Daya / Sambungan Listrik">
            <Input value={form.listrik} onChange={(e) => set('listrik', e.target.value)} />
          </Field>
          <Field label="Status Kependudukan">
            <Select value={form.status_kependudukan} onValueChange={(v) => set('status_kependudukan', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Aktif', 'Pindah', 'Meninggal', 'Perantau'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={save} disabled={saving || !form.nik || !form.nama_lengkap}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}