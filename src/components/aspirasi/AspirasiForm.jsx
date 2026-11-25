import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

export const KATEGORI_OPTIONS = [
  { value: 'Pengaduan', label: 'Pengaduan', desc: 'Laporkan masalah pelayanan, infrastruktur, atau ketertiban.' },
  { value: 'Aspirasi', label: 'Aspirasi', desc: 'Sampaikan ide dan usulan perbaikan untuk desa.' },
  { value: 'Permintaan Informasi', label: 'Permintaan Informasi', desc: 'Minta data atau informasi publik desa.' },
];

const EMPTY = { nama: '', nik: '', no_telepon: '', kategori: 'Pengaduan', judul: '', isi: '' };

export default function AspirasiForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{16}$/.test(form.nik.trim())) {
      setError('NIK harus terdiri dari 16 digit angka sesuai KTP.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('submitAspirasi', form);
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setTicket(res.data);
        setForm(EMPTY);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Gagal mengirim aspirasi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (ticket) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="font-heading font-bold text-lg">Aspirasi berhasil dikirim</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Terima kasih, {ticket.nama}. Simpan nomor tiket berikut untuk menanyakan tindak lanjut.
        </p>
        <p className="mt-4 inline-block font-mono text-base font-bold bg-muted px-4 py-2 rounded-lg tracking-wider">
          {ticket.nomor_tiket}
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setTicket(null)}>
            <Send className="w-4 h-4 mr-1" /> Kirim aspirasi lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nama">Nama Lengkap (sesuai KTP)</Label>
          <Input
            id="nama"
            value={form.nama}
            onChange={(e) => onChange('nama', e.target.value)}
            placeholder="Contoh: Ahmad Suryana"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="nik">NIK (16 digit)</Label>
          <Input
            id="nik"
            inputMode="numeric"
            maxLength={16}
            value={form.nik}
            onChange={(e) => onChange('nik', e.target.value.replace(/\D/g, ''))}
            placeholder="32xxxxxxxxxxxxxx"
            className="mt-1.5 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="telepon">Nomor WhatsApp</Label>
          <Input
            id="telepon"
            inputMode="tel"
            value={form.no_telepon}
            onChange={(e) => onChange('no_telepon', e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="judul">Judul / Ringkasan</Label>
          <Input
            id="judul"
            value={form.judul}
            onChange={(e) => onChange('judul', e.target.value)}
            placeholder="Contoh: Lampu jalan RT 03 padam"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label>Kategori</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
          {KATEGORI_OPTIONS.map((opt) => {
            const active = form.kategori === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('kategori', opt.value)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40'
                }`}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="isi">Uraian Lengkap</Label>
        <Textarea
          id="isi"
          rows={6}
          value={form.isi}
          onChange={(e) => onChange('isi', e.target.value)}
          placeholder="Jelaskan laporan, aspirasi, atau informasi yang dibutuhkan secara rinci (waktu, lokasi, dan kronologi)."
          className="mt-1.5"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          Data Anda hanya digunakan untuk verifikasi kependudukan dan tindak lanjut aspirasi.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
          Kirim Aspirasi
        </Button>
      </div>
    </form>
  );
}