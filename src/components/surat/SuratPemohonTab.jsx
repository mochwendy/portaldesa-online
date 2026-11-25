import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel
} from '@/components/ui/select';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SURAT_TEMPLATES, KATEGORI } from '@/lib/suratTemplates';

export default function SuratPemohonTab({ s, set, onValidate, template }) {
  const p = s.penduduk;
  return (
    <div className="space-y-4">
      <div>
        <Label>Nomor Induk Kependudukan (NIK)</Label>
        <div className="flex gap-2">
          <Input value={s.nik} maxLength={16} placeholder="16 digit NIK"
            onChange={(e) => set({ nik: e.target.value, penduduk: null, nikError: '' })} />
          <Button type="button" onClick={onValidate} disabled={s.validating || !s.nik}>
            {s.validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Validasi NIK
          </Button>
        </div>
        {s.nikError && (
          <p className="text-sm text-destructive mt-2 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {s.nikError}
          </p>
        )}
      </div>

      {p && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
          <p className="col-span-2 font-bold text-emerald-700">Data penduduk ditemukan</p>
          {[
            ['Nama', p.nama_lengkap], ['Jenis Kelamin', p.jenis_kelamin],
            ['Tempat, Tgl Lahir', `${p.tempat_lahir || '-'}, ${p.tanggal_lahir || '-'}`], ['Agama', p.agama],
            ['Pekerjaan', p.pekerjaan], ['Status Pernikahan', p.status_perkawinan],
            ['Alamat', `${p.alamat || '-'} RT.${p.rt || '-'} RW.${p.rw || '-'}`], ['Status', p.status_kependudukan],
          ].map(([l, v]) => (
            <p key={l}><span className="text-muted-foreground">{l}: </span><span className="font-medium">{v || '-'}</span></p>
          ))}
        </div>
      )}

      <div>
        <Label>Jenis Surat</Label>
        <Select value={s.jenis} onValueChange={(v) => set({ jenis: v, extras: {} })}>
          <SelectTrigger><SelectValue placeholder="Pilih jenis surat" /></SelectTrigger>
          <SelectContent>
            {KATEGORI.map((k) => (
              <SelectGroup key={k}>
                <SelectLabel>{k}</SelectLabel>
                {SURAT_TEMPLATES.filter((t) => t.kategori === k).map((t) => (
                  <SelectItem key={t.nama} value={t.nama}>{t.nama}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {template?.extras.map((x) => (
        <div key={x.key}>
          <Label>{x.label}</Label>
          <Input value={s.extras[x.key] || ''} onChange={(e) => set({ extras: { ...s.extras, [x.key]: e.target.value } })} />
        </div>
      ))}

      <div>
        <Label>Keperluan / Tujuan</Label>
        <Textarea rows={2} value={s.keperluan} onChange={(e) => set({ keperluan: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>Nomor Surat</Label><Input value={s.nomor} onChange={(e) => set({ nomor: e.target.value })} /></div>
        <div><Label>Tanggal Surat</Label><Input type="date" value={s.tanggalSurat} onChange={(e) => set({ tanggalSurat: e.target.value })} /></div>
        <div><Label>No. WhatsApp</Label><Input value={s.telp} onChange={(e) => set({ telp: e.target.value })} placeholder="08xx..." /></div>
      </div>
    </div>
  );
}