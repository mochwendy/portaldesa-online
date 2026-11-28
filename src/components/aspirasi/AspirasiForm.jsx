import React, { useState, useRef } from 'react';
import { supabaseSubmitAspirasi } from '@/api/supabaseAdapter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Loader2, Send, Camera, ImagePlus, X } from 'lucide-react';
import { buildWhatsAppLink, buildAspirasiTanggapanMessage } from '@/lib/whatsapp';

export const KATEGORI_OPTIONS = [
  { value: 'Pengaduan', label: 'Pengaduan', desc: 'Laporkan masalah pelayanan, infrastruktur, atau ketertiban.' },
  { value: 'Aspirasi', label: 'Aspirasi', desc: 'Sampaikan ide dan usulan perbaikan untuk desa.' },
  { value: 'Permintaan Informasi', label: 'Permintaan Informasi', desc: 'Minta data atau informasi publik desa.' },
];

const EMPTY = { nama: '', nik: '', no_telepon: '', kategori: 'Pengaduan', judul: '', isi: '' };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AspirasiForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran foto terlalu besar. Maksimal 5 MB.');
      return;
    }

    setError('');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const nikTrim = form.nik.trim();
    if (!/^\d{16}$/.test(nikTrim)) {
      setError('NIK harus terdiri dari 16 digit angka sesuai KTP.');
      return;
    }

    const namaTrim = (form.nama || '').trim();
    if (!namaTrim || namaTrim.length < 3) {
      setError('Nama lengkap wajib diisi minimal 3 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (photoFile) {
        payload.foto_bukti = photoFile;
      }

      const res = await supabaseSubmitAspirasi(payload);
      const result = res?.data;

      if (!result) {
        setError('Gagal mengirim aspirasi: layanan tidak merespons. Silakan coba lagi.');
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.message && !result.success) {
        setError(result.message);
        return;
      }

      const ticketData = result.data || (result.success && result.nomor_tiket ? result : null);

      if (!result.success || !ticketData) {
        setError('Gagal mengirim aspirasi. Silakan coba lagi.');
        return;
      }

      if (ticketData?.no_telepon) {
        try {
          const status = 'Diterima';
          const message = buildAspirasiTanggapanMessage(
            {
              nama: ticketData.nama || form.nama,
              no_telepon: ticketData.no_telepon,
              kategori: ticketData.kategori || form.kategori,
              judul: ticketData.judul || form.judul,
              nomor_tiket: ticketData.nomor_tiket,
            },
            '',
            status
          );
          const waLink = buildWhatsAppLink(ticketData.no_telepon, message);
          window.open(waLink, '_blank');
        } catch (waErr) {
          console.error('Gagal mengirim notifikasi WhatsApp:', waErr);
        }
      }

      setTicket({ ...ticketData, nama: ticketData.nama || form.nama });
      setForm(EMPTY);
      clearPhoto();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Gagal mengirim aspirasi. Silakan coba lagi.');
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

      <div>
        <Label>Foto Bukti Pendukung (opsional)</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          Unggah foto bukti laporan (JPG, PNG, WEBP, maks. 5 MB) atau ambil langsung dari kamera.
        </p>

        {photoPreview ? (
          <div className="mt-2 relative inline-block">
            <img
              src={photoPreview}
              alt="Preview foto bukti"
              className="max-w-xs max-h-64 rounded-xl border border-border object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:bg-destructive/90"
              title="Hapus foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <ImagePlus className="w-4 h-4 mr-1" />
              Pilih File Foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-1" />
              Ambil Foto Kamera
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
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