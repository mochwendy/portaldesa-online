import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  AGAMA_OPTIONS, PENDIDIKAN_OPTIONS, PERKAWINAN_OPTIONS, KELUARGA_OPTIONS,
  hitungKelompokUsia,
  validateNikFormat,
  normalizeNoWa,
  validateNoWaFormat,
} from '@/lib/pendudukExcel';

export const emptyPenduduk = {
  nik: '', no_kk: '', nama_lengkap: '', jenis_kelamin: 'Laki-laki', tempat_lahir: '',
  tanggal_lahir: '', agama: 'Islam', pendidikan: 'SMA/SMK', pekerjaan: '',
  status_perkawinan: 'Belum Kawin', status_keluarga: 'Kepala Keluarga',
  status_rumah: '', disabilitas: '', listrik: '', alamat: '', rt: '', rw: '',
  no_wa: '',
  status_kependudukan: 'Aktif',
};

const Field = ({ label, children, wide = false, error, hint }) => (
  <div className={wide ? 'col-span-2' : ''}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="mt-1">{children}</div>
    {error && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    {hint && !error && <p className="text-muted-foreground text-xs mt-1">{hint}</p>}
  </div>
);

export default function PendudukFormDialog({ open, onOpenChange, initial, onSaved }) {
  const [form, setForm] = useState(emptyPenduduk);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingNik, setCheckingNik] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...emptyPenduduk, ...initial } : emptyPenduduk);
    setErrors({});
  }, [open, initial]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateField = (key, value) => {
    const newErrors = { ...errors };
    if (key === 'nik') {
      if (!value) {
        newErrors.nik = 'NIK wajib diisi';
      } else if (!validateNikFormat(value)) {
        newErrors.nik = 'NIK harus 16 digit angka';
      } else {
        delete newErrors.nik;
      }
    } else if (key === 'no_kk') {
      if (value && !validateNikFormat(value)) {
        newErrors.no_kk = 'No. KK harus 16 digit angka';
      } else {
        delete newErrors.no_kk;
      }
    } else if (key === 'no_wa') {
      if (value && !validateNoWaFormat(value)) {
        newErrors.no_wa = 'Format No. WA tidak valid (contoh: 0812-3456-7890)';
      } else {
        delete newErrors.no_wa;
      }
    } else if (key === 'nama_lengkap') {
      if (!value) {
        newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
      } else {
        delete newErrors.nama_lengkap;
      }
    }
    setErrors(newErrors);
  };

  const checkNikDuplicate = async (nik) => {
    if (!nik || !validateNikFormat(nik)) return;
    setCheckingNik(true);
    try {
      const existing = await base44.entities.Penduduk.filter(
        { nik: { $regex: `^${nik}$` } },
        { limit: 1 }
      );
      const newErrors = { ...errors };
      if (existing.items && existing.items.length > 0) {
        const existingId = existing.items[0].id;
        if (!initial?.id || initial.id !== existingId) {
          newErrors.nik = 'NIK sudah terdaftar (duplikat)';
        } else {
          delete newErrors.nik;
        }
      } else {
        delete newErrors.nik;
      }
      setErrors(newErrors);
    } catch (e) {
      console.error('Check NIK duplicate error:', e);
    } finally {
      setCheckingNik(false);
    }
  };

  const handleNikChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    set('nik', cleaned);
    validateField('nik', cleaned);
  };

  const handleNoKkChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    set('no_kk', cleaned);
    validateField('no_kk', cleaned);
  };

  const handleNoWaChange = (value) => {
    set('no_wa', value);
    validateField('no_wa', value);
  };

  const handleBlurNik = () => {
    if (form.nik) checkNikDuplicate(form.nik);
  };

  const handleNamaChange = (value) => {
    set('nama_lengkap', value);
    validateField('nama_lengkap', value);
  };

  const save = async () => {
    validateField('nik', form.nik);
    validateField('no_kk', form.no_kk);
    validateField('no_wa', form.no_wa);
    validateField('nama_lengkap', form.nama_lengkap);
    
    if (Object.keys(errors).length > 0) return;
    
    if (checkingNik) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (Object.keys(errors).length > 0) return;
    }

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
          <Field 
            label="NIK (16 digit)" 
            error={errors.nik} 
            hint={checkingNik ? 'Memeriksa duplikat...' : 'Hanya angka, 16 digit'}
          >
            <Input 
              value={form.nik} 
              maxLength={16} 
              onChange={(e) => handleNikChange(e.target.value)} 
              onBlur={handleBlurNik}
              className={errors.nik ? 'border-destructive' : ''}
            />
          </Field>
          <Field 
            label="Nomor Kartu Keluarga" 
            error={errors.no_kk} 
            hint="Hanya angka, 16 digit (opsional)"
          >
            <Input 
              value={form.no_kk} 
              maxLength={16} 
              onChange={(e) => handleNoKkChange(e.target.value)} 
              className={errors.no_kk ? 'border-destructive' : ''}
            />
          </Field>
          <Field 
            label="Nama Lengkap" 
            wide 
            error={errors.nama_lengkap}
          >
            <Input 
              value={form.nama_lengkap} 
              onChange={(e) => handleNamaChange(e.target.value)} 
              className={errors.nama_lengkap ? 'border-destructive' : ''}
            />
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
          <Field 
            label="No. WhatsApp / HP" 
            error={errors.no_wa} 
            hint="Format: 0812-3456-7890 atau 6281234567890 (opsional)"
          >
            <Input 
              value={form.no_wa} 
              onChange={(e) => handleNoWaChange(e.target.value)} 
              placeholder="0812-3456-7890"
              className={errors.no_wa ? 'border-destructive' : ''}
            />
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
          <Button onClick={save} disabled={saving || !form.nik || !form.nama_lengkap || Object.keys(errors).length > 0 || checkingNik}>
            {saving ? 'Menyimpan...' : checkingNik ? 'Memeriksa NIK...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}