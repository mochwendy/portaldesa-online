import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Wallet, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const STATUS_STYLES = {
  'Belum Mulai': 'bg-slate-100 text-slate-600',
  'Persiapan': 'bg-amber-100 text-amber-700',
  'Pelaksanaan': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-emerald-100 text-emerald-700',
  'Tertunda': 'bg-red-100 text-red-700',
};

export default function BerandaRealisasi({ items = [] }) {
  const total = items.length;
  const totalAnggaran = items.reduce((s, i) => s + (i.anggaran || 0), 0);
  const totalRealisasi = items.reduce((s, i) => s + (i.realisasi_anggaran || 0), 0);
  const selesai = items.filter((i) => i.status === 'Selesai').length;

  const stats = [
    { icon: HardHat, label: 'Kegiatan', value: total },
    { icon: Wallet, label: 'Anggaran', value: formatRupiah(totalAnggaran) },
    { icon: TrendingUp, label: 'Realisasi', value: formatRupiah(totalRealisasi) },
    { icon: CheckCircle2, label: 'Selesai', value: selesai },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold">Realisasi Pembangunan Desa</h2>
          <p className="text-muted-foreground text-sm mt-1">Transparansi progres fisik & anggaran kegiatan pembangunan</p>
        </div>
        <Link to="/realisasi-pembangunan" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
          Lihat semua <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-extrabold text-foreground truncate">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.slice(0, 3).map((i, idx) => (
            <Link key={i.id || idx} to="/realisasi-pembangunan" className="group bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{i.nama_kegiatan}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLES[i.status] || 'bg-slate-100 text-slate-600'}`}>{i.status}</span>
              </div>
              {i.lokasi && <p className="text-xs text-muted-foreground mb-3">{i.lokasi}</p>}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress fisik</span>
                  <span className="font-bold">{i.persentase_progress || 0}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${i.persentase_progress || 0}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-border">
                <span className="text-muted-foreground">Anggaran</span>
                <span className="font-semibold">{formatRupiah(i.anggaran)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <HardHat className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada kegiatan pembangunan yang direalisasikan.</p>
        </div>
      )}
    </section>
  );
}