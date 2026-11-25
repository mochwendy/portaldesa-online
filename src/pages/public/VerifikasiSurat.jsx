import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import VerifikasiSuratHasil from '@/components/surat/VerifikasiSuratHasil';

export default function VerifikasiSurat() {
  const { kode: kodeParam } = useParams();
  const kodeQuery = new URLSearchParams(window.location.search).get('kode') || '';
  const kodeAwal = kodeParam || kodeQuery;
  const [kode, setKode] = useState(kodeAwal);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState('');

  const cek = async (nilai) => {
    const bersih = String(nilai || '').trim().toUpperCase();
    if (!bersih) {
      setError('Masukkan kode verifikasi yang tertera pada QR surat.');
      return;
    }
    setLoading(true);
    setError('');
    setHasil(null);
    try {
      const res = await base44.functions.invoke('verifySurat', { kode: bersih });
      setHasil(res.data);
    } catch (e) {
      setError(e?.message || 'Gagal memverifikasi surat. Coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kodeAwal) cek(kodeAwal);
  }, [kodeAwal]);

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" /> Verifikasi Keaslian Surat
          </h1>
          <p className="text-primary-foreground/70">
            Pindai QR pada surat atau masukkan kode verifikasi untuk memastikan surat resmi diterbitkan pemerintah desa melalui SIMDESTA.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <Label htmlFor="kode">Kode Verifikasi Surat</Label>
          <form
            className="flex flex-col sm:flex-row gap-2 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              cek(kode);
            }}
          >
            <Input
              id="kode"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              placeholder="Contoh: SMD-A1B2-C3D4"
              className="font-mono tracking-wider"
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Verifikasi
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          <p className="text-xs text-muted-foreground mt-3">
            Kode tercetak di bawah QR pada bagian tanda tangan surat.
          </p>
        </div>

        {loading && (
          <div className="text-center text-muted-foreground py-10">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Memeriksa data surat...
          </div>
        )}

        {!loading && hasil && <VerifikasiSuratHasil hasil={hasil} />}
      </div>
    </div>
  );
}