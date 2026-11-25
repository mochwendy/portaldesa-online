import React from 'react';
import { XCircle, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Tampilan penolakan otomatis saat NIK tidak terdaftar pada data penduduk desa.
export default function PengajuanDitolak({ nomor_surat, alasan, onReset }) {
  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold">Layanan Surat Online</h1>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Pengajuan Ditolak</h2>
        <p className="text-muted-foreground mb-6">
          Status pengajuan: <span className="font-semibold text-red-600">Ditolak</span>
          {nomor_surat ? <> · Nomor: <span className="font-semibold">{nomor_surat}</span></> : null}
        </p>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-left mb-6">
          <h3 className="font-bold mb-2 flex items-center gap-2 text-red-700">
            <Building2 className="w-4 h-4" /> NIK Tidak Terdaftar
          </h3>
          <p className="text-sm text-red-800">{alasan}</p>
          <p className="text-sm text-red-800 mt-3 flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Bawa KTP dan Kartu Keluarga untuk verifikasi atau registrasi ulang data penduduk pada jam layanan kantor desa.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onReset} className="bg-primary hover:bg-primary/90">Ajukan Ulang</Button>
          <Button asChild variant="outline">
            <Link to="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}