import React, { useState, useEffect } from 'react';
import { base44, toNumber } from '@/api/base44Client';
import { HardHat, Wallet, TrendingUp, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RealisasiPhotoGallery from '@/components/realisasi/RealisasiPhotoGallery';

const formatRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);

const STATUS_STYLES = {
  'Belum Mulai': 'bg-muted text-muted-foreground',
  'Persiapan': 'bg-amber-100 text-amber-700',
  'Pelaksanaan': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-emerald-100 text-emerald-700',
  'Tertunda': 'bg-red-100 text-red-700',
};

export default function RealisasiPembangunanPublik() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { items: data } = await base44.entities.RealisasiPembangunan.filter(
          {},
          { sort: '-persentase_progress', limit: 100 }
        );
        setItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalAnggaran = items.reduce((s, i) => s + toNumber(i.anggaran), 0);
  const totalRealisasi = items.reduce((s, i) => s + toNumber(i.realisasi_anggaran), 0);
  const avgProgress = items.length > 0
    ? Math.round(items.reduce((s, i) => s + toNumber(i.persentase_progress), 0) / items.length)
    : 0;

  const progressChart = items.map((i) => ({
    name: i.nama_kegiatan?.length > 18 ? i.nama_kegiatan.substring(0, 16) + '…' : i.nama_kegiatan,
    progress: toNumber(i.persentase_progress),
  }));

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-2">Transparansi Pelaksanaan Pembangunan</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Realisasi Pembangunan Desa Tagog Apu</h1>
          <p className="text-primary-foreground/80 max-w-2xl">
            Informasi perkembangan pelaksanaan kegiatan pembangunan yang bersumber dari APBDes — lengkap dengan progress, anggaran, dan dokumentasi foto.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: HardHat, label: 'Total Kegiatan', value: items.length, color: 'text-primary', bg: 'bg-primary/10' },
            { icon: Wallet, label: 'Total Anggaran', value: formatRupiah(totalAnggaran), color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: TrendingUp, label: 'Realisasi Anggaran', value: formatRupiah(totalRealisasi), color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: CheckCircle2, label: 'Rata-rata Progress', value: `${avgProgress}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-extrabold truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chart */}
      {items.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-extrabold mb-4">Progress Pelaksanaan per Kegiatan</h2>
          <div className="bg-card rounded-xl border border-border p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={progressChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} interval={0} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="progress" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Activity Cards */}
      <section className="max-w-7xl mx-auto px-4 py-4 pb-12">
        <h2 className="text-xl font-extrabold mb-4">Daftar Kegiatan Pembangunan</h2>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border">
            Belum ada kegiatan pembangunan yang terealisasi.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {items.map((item) => {
              const progress = toNumber(item.persentase_progress);
              return (
                <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base text-foreground">{item.nama_kegiatan}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[item.status] || 'bg-muted text-muted-foreground'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.lokasi || '-'}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {item.tanggal_mulai || '-'} s/d {item.tanggal_selesai || '-'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground">Anggaran</p>
                        <p className="font-bold text-sm text-foreground">{formatRupiah(toNumber(item.anggaran))}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Sumber: {item.sumber_dana}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground">Realisasi</p>
                        <p className="font-bold text-sm text-foreground">{formatRupiah(toNumber(item.realisasi_anggaran))}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Pelaksana: {item.pelaksana || '-'}</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-semibold text-muted-foreground">Progress Pekerjaan</p>
                        <p className="text-sm font-extrabold text-primary">{progress}%</p>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {item.catatan && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 mb-4">{item.catatan}</p>
                    )}
                  </div>
                  {/* Photos */}
                  <div className="px-5 pb-5">
                    <RealisasiPhotoGallery
                      foto0={item.foto_0_uri}
                      foto50={item.foto_50_uri}
                      foto100={item.foto_100_uri}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}