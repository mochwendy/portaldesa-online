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
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-3">
            <MessageSquare className="w-4 h-4" /> Saluran Aspirasi Warga
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight max-w-3xl">
            Sampaikan Pengaduan, Aspirasi, dan Permintaan Informasi Desa
          </h1>
          <p className="text-primary-foreground/75 mt-3 max-w-2xl text-sm md:text-base">
            Saluran resmi Pemerintah Desa Tagog Apu bagi warga terdaftar untuk menyampaikan laporan dan usulan
            secara langsung. Setiap pengiriman mendapat nomor tiket sebagai bukti penerimaan.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 md:p-7">
            <h2 className="font-heading font-bold text-lg mb-1">Formulir Aspirasi</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Isi data diri sesuai KTP. NIK wajib terdaftar dalam data penduduk desa.
            </p>
            <AspirasiForm />
          </div>

          <aside className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading font-bold text-base mb-4">Alur Penanganan</h3>
              <ol className="space-y-4">
                {ALUR.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {index + 1}. {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div className="text-xs text-foreground/80 leading-relaxed">
                  <p className="font-semibold text-foreground mb-1">Kategori layanan</p>
                  <p><span className="font-medium">Pengaduan</span> — masalah layanan atau infrastruktur.</p>
                  <p><span className="font-medium">Aspirasi</span> — ide dan usulan pembangunan.</p>
                  <p><span className="font-medium">Permintaan Informasi</span> — data dan informasi publik desa.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}