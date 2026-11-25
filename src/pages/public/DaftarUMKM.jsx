import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import UmkmDaftarForm from '@/components/umkm/UmkmDaftarForm';

export default function DaftarUMKM() {
  const [submitted, setSubmitted] = useState(null);

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Store className="w-3.5 h-3.5" /> Pendaftaran UMKM Mandiri
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Daftarkan UMKM Anda</h1>
          <p className="text-primary-foreground/70 max-w-2xl">
            Warga Desa Tagog Apu dapat mendaftarkan usaha secara mandiri. Data yang dikirim langsung
            tampil di marketplace portal desa tanpa perlu menunggu persetujuan admin.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {submitted ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">UMKM Berhasil Didaftarkan</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{submitted.nama_usaha}</span> sudah tampil di
              marketplace desa dan bisa ditemukan warga lain.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Link
                to="/marketplace-umkm"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90"
              >
                <ShoppingBag className="w-4 h-4" /> Lihat di Marketplace
              </Link>
              <button
                onClick={() => setSubmitted(null)}
                className="inline-flex items-center justify-center gap-2 border border-border px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary"
              >
                Daftarkan UMKM Lain <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <UmkmDaftarForm onSubmitted={setSubmitted} />
        )}
      </div>
    </div>
  );
}