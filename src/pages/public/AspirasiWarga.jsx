import React from 'react';
import { MessageSquare, ShieldCheck, Clock, Phone, Info } from 'lucide-react';
import AspirasiForm from '@/components/aspirasi/AspirasiForm';

const ALUR = [
  { icon: ShieldCheck, title: 'Verifikasi NIK', desc: 'NIK dicocokkan dengan data penduduk desa sebelum aspirasi diterima.' },
  { icon: Clock, title: 'Tindak Lanjut', desc: 'Perangkat desa menelaah laporan dan memberi tanggapan resmi.' },
  { icon: Phone, title: 'Penyelesaian', desc: 'Hasil tindak lanjut disampaikan melalui nomor WhatsApp pelapor.' },
];

export default function AspirasiWarga() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="py-16 bg-gradient-to-br from-sky-50 via-teal-50/60 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            SUARA WARGA, TINDAK DESA
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Sampaikan Aspirasi, Pengaduan, dan Permintaan Informasi</h1>
          <p className="text-slate-600 text-base max-w-2xl">
            Saluran resmi Pemerintah Desa Tagog Apu bagi warga terdaftar untuk menyampaikan laporan, usulan, dan permintaan informasi publik secara online. Setiap pengiriman menerima nomor tiket sebagai bukti penerimaan.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-7">
            <h2 className="font-bold text-lg text-slate-900 mb-1">Formulir Aspirasi Warga</h2>
            <p className="text-sm text-slate-500 mb-6">
              Isi data diri sesuai KTP. NIK wajib terdaftar dalam data penduduk desa.
            </p>
            <AspirasiForm />
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-base mb-4 text-slate-900">Alur Penanganan</h3>
              <ol className="space-y-4">
                {ALUR.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {step.title}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-500 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">Kategori Layanan</p>
                  <p><span className="font-medium text-slate-900">Pengaduan</span> — masalah layanan atau infrastruktur.</p>
                  <p><span className="font-medium text-slate-900">Aspirasi</span> — ide dan usulan pembangunan.</p>
                  <p><span className="font-medium text-slate-900">Permintaan Informasi</span> — data dan informasi publik desa.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
