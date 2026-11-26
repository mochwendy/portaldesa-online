import React, { useState, useEffect } from 'react';
import { base44, toNumber } from '@/api/base44Client';
import { fetchPublicFileUrl } from '@/lib/publicFiles';
import { Download, FileText, MapPin, Loader2, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
const STATUS_STYLES = {
  'Disetujui': 'bg-emerald-100 text-emerald-700',
  'Direalisasi': 'bg-purple-100 text-purple-700',
  'Selesai': 'bg-teal-100 text-teal-700',
  'Diverifikasi': 'bg-blue-100 text-blue-700',
  'Diajukan': 'bg-amber-100 text-amber-700',
};

export default function RencanaPembangunanPublik() {
  const [usulan, setUsulan] = useState([]);
  const [dokumen, setDokumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, d] = await Promise.all([
          base44.entities.UsulanPembangunan.list('-tanggal_usulan', 500),
          base44.entities.DokumenPembangunan.filter({ status: 'Aktif' }),
        ]);
        setUsulan(u); setDokumen(d);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      const signedUrl = await fetchPublicFileUrl(doc.file_uri);
      if (signedUrl) window.open(signedUrl, '_blank');
    } catch (e) { console.error(e); }
    finally { setDownloading(null); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const approved = usulan.filter(u => ['Disetujui', 'Direalisasi', 'Selesai'].includes(u.status));
  const totalAnggaran = approved.reduce((s, u) => s + toNumber(u.estimasi_anggaran), 0);

  const kategoriData = {};
  approved.forEach(u => { kategoriData[u.kategori] = (kategoriData[u.kategori] || 0) + 1; });
  const kategoriChart = Object.entries(kategoriData).map(([name, value]) => ({ name, value }));

  const rwData = {};
  usulan.forEach(u => { const key = u.rw ? `RW ${u.rw}` : (u.dusun || '-'); rwData[key] = (rwData[key] || 0) + 1; });
  const rwChart = Object.entries(rwData).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));

  const grouped = {};
  approved.forEach(u => {
    const key = [u.dusun || '', u.rw ? `RW ${u.rw}` : ''].filter(Boolean).join(' - ') || 'Lainnya';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(u);
  });

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-2">Rencana Kerja Pembangunan Desa (RKPDes)</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Rencana Pembangunan Desa Tagog Apu 2026</h1>
          <p className="text-primary-foreground/80 max-w-2xl">
            Usulan pembangunan dari setiap RW dan Dusun yang telah disetujui, diselaraskan dengan APBDes tahun berjalan sesuai juklak/juknis.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CheckCircle2, label: 'Usulan Disetujui', value: approved.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Clock, label: 'Total Usulan', value: usulan.length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: TrendingUp, label: 'Total Anggaran', value: formatRupiah(totalAnggaran), color: 'text-primary', bg: 'bg-primary/10' },
            { icon: FileText, label: 'Dokumen Tersedia', value: dokumen.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-extrabold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-extrabold mb-4">Grafik Rencana Pembangunan</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-1">Usulan Disetujui per Kategori</h3>
            <p className="text-xs text-muted-foreground mb-4">Distribusi rencana pembangunan berdasarkan kategori</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={kategoriChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-1">Usulan per RW / Dusun</h3>
            <p className="text-xs text-muted-foreground mb-4">Sebaran usulan dari setiap wilayah</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rwChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(38 75% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-xl font-extrabold mb-4">Rencana Kerja Pembangunan per Wilayah</h2>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border">Belum ada usulan pembangunan yang disetujui.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).sort().map(([wilayah, items]) => (
              <div key={wilayah} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 bg-primary/5 border-b border-border flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-primary">{wilayah}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">{items.length} usulan</span>
                </div>
                <div className="divide-y divide-border">
                  {items.map(u => (
                    <div key={u.id} className="p-4 flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-sm">{u.judul_usulan}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[u.status] || 'bg-gray-100'}`}>{u.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{u.kategori} · Diusulkan oleh {u.pengusul}</p>
                        {u.deskripsi && <p className="text-sm text-muted-foreground mt-1">{u.deskripsi}</p>}
                        {u.lokasi && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {u.lokasi}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Estimasi Anggaran</p>
                        <p className="font-bold text-sm text-primary">{formatRupiah(toNumber(u.estimasi_anggaran))}</p>
                        {u.terkait_apbdes && <span className="text-xs text-emerald-600 font-medium">✓ Selaras APBDes</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-extrabold mb-1">Dokumen Juklak & Juknis</h2>
        <p className="text-sm text-muted-foreground mb-4">Unduh petunjuk pelaksanaan dan teknis pembangunan desa</p>
        {dokumen.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border">Belum ada dokumen tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dokumen.map(d => (
              <div key={d.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.nama_dokumen}</p>
                  <p className="text-xs text-muted-foreground">{d.jenis_dokumen} · Tahun {d.tahun}</p>
                  {d.deskripsi && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.deskripsi}</p>}
                </div>
                <button
                  onClick={() => handleDownload(d)}
                  disabled={downloading === d.id}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {downloading === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Unduh
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}