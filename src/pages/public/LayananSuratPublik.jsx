import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, CheckCircle, ArrowRight, Phone, Loader2, AlertCircle } from 'lucide-react';
import PengajuanDitolak from '@/components/public/PengajuanDitolak';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { SURAT_NAMES } from '@/lib/suratTemplates';

const jenisSurat = SURAT_NAMES;

const today = new Date().toISOString().split('T')[0];

export default function LayananSuratPublik() {
  const [form, setForm] = useState({
    nomor_surat: '', nik_pemohon: '', nama_pemohon: '', no_telepon: '',
    jenis_surat: jenisSurat[0], keperluan: '', tanggal_pengajuan: today, catatan: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nikStatus, setNikStatus] = useState('idle'); // idle | checking | valid | invalid
  const [nikNama, setNikNama] = useState('');
  const [ditolak, setDitolak] = useState(null);

  const kosongkan = () => setForm({
    nomor_surat: '', nik_pemohon: '', nama_pemohon: '', no_telepon: '',
    jenis_surat: jenisSurat[0], keperluan: '', tanggal_pengajuan: today, catatan: ''
  });

  // Validasi NIK otomatis: berjalan sendiri begitu 16 digit terisi.
  useEffect(() => {
    const nik = form.nik_pemohon.replace(/\D/g, '');
    setNikNama('');
    if (nik.length !== 16) { setNikStatus('idle'); return undefined; }
    let batal = false;
    setNikStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await base44.functions.invoke('cekNikPenduduk', { nik });
        if (batal) return;
        if (data?.terdaftar) {
          setNikStatus('valid');
          setNikNama(data.nama || '');
          setForm((f) => (f.nama_pemohon ? f : { ...f, nama_pemohon: data.nama || '' }));
        } else {
          setNikStatus('invalid');
        }
      } catch { if (!batal) setNikStatus('idle'); }
    }, 500);
    return () => { batal = true; clearTimeout(timer); };
  }, [form.nik_pemohon]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nikStatus === 'checking') return;
    setSubmitting(true);
    try {
      const { data } = await base44.functions.invoke('ajukanSuratPortal', form);
      if (data?.diterima) { setSuccess(true); kosongkan(); setNikStatus('idle'); }
      else setDitolak(data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Gagal mengajukan surat. Silakan coba lagi.');
    } finally { setSubmitting(false); }
  };

  if (ditolak) {
    return (
      <PengajuanDitolak
        nomor_surat={ditolak.nomor_surat}
        alasan={ditolak.alasan}
        onReset={() => { setDitolak(null); kosongkan(); setNikStatus('idle'); }}
      />
    );
  }

  if (success) {
    return (
      <div>
        <section className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-extrabold">Layanan Surat Online</h1>
          </div>
        </section>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Pengajuan Berhasil!</h2>
          <p className="text-muted-foreground mb-6">
            Surat Anda telah diajukan dan akan diproses oleh perangkat desa. Anda akan menerima
            notifikasi WhatsApp saat surat selesai diproses.
          </p>
          <div className="bg-card rounded-2xl border border-border p-6 text-left mb-6">
            <h3 className="font-bold mb-3">Langkah Selanjutnya:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Pengajuan Anda akan ditinjau oleh perangkat desa</li>
              <li>2. Anda akan menerima notifikasi WhatsApp saat status diperbarui</li>
              <li>3. Ambil surat di Kantor Desa setelah selesai diproses</li>
            </ol>
          </div>
          <Button onClick={() => setSuccess(false)} className="bg-primary hover:bg-primary/90">
            Ajukan Surat Lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Layanan Surat Online</h1>
          <p className="text-primary-foreground/70">Ajukan surat keterangan tanpa datang ke kantor desa — cukup isi formulir di bawah</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Formulir Pengajuan Surat</h2>
              <p className="text-sm text-muted-foreground">Lengkapi data berikut dengan benar</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>NIK <span className="text-destructive">*</span></Label>
                <Input
                  required
                  value={form.nik_pemohon}
                  onChange={(e) => setForm({ ...form, nik_pemohon: e.target.value.replace(/\D/g, '') })}
                  placeholder="16 digit NIK"
                  maxLength={16}
                  inputMode="numeric"
                />
                {nikStatus === 'checking' && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa NIK...
                  </p>
                )}
                {nikStatus === 'valid' && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> NIK terdaftar{nikNama ? `: ${nikNama}` : ''}
                  </p>
                )}
                {nikStatus === 'invalid' && (
                  <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    NIK tidak terdaftar. Pengajuan akan ditolak — hubungi Kantor Desa pada jam layanan untuk verifikasi atau registrasi ulang data penduduk.
                  </p>
                )}
              </div>
              <div>
                <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
                <Input
                  required
                  value={form.nama_pemohon}
                  onChange={(e) => setForm({ ...form, nama_pemohon: e.target.value })}
                  placeholder="Sesuai KTP"
                />
              </div>
            </div>

            <div>
              <Label>Nomor WhatsApp <span className="text-destructive">*</span></Label>
              <Input
                required
                value={form.no_telepon}
                onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
                placeholder="08xx-xxxx-xxxx (untuk notifikasi)"
              />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Notifikasi status akan dikirim ke nomor ini
              </p>
            </div>

            <div>
              <Label>Jenis Surat <span className="text-destructive">*</span></Label>
              <Select value={form.jenis_surat} onValueChange={(v) => setForm({ ...form, jenis_surat: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {jenisSurat.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Keperluan <span className="text-destructive">*</span></Label>
              <Textarea
                required
                value={form.keperluan}
                onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
                placeholder="Jelaskan keperluan pengajuan surat..."
                rows={3}
              />
            </div>

            <div>
              <Label>Tanggal Pengajuan</Label>
              <Input type="date" value={form.tanggal_pengajuan} onChange={(e) => setForm({ ...form, tanggal_pengajuan: e.target.value })} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
              {submitting ? 'Mengajukan...' : 'Ajukan Surat'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sudah mengajukan? Cek status di{' '}
          <Link to="/admin/surat" className="text-primary font-medium hover:underline">Dashboard Admin</Link>
          {' '}atau hubungi kantor desa.
        </p>
      </div>
    </div>
  );
}