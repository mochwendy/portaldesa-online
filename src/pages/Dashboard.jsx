import React, { useState, useEffect } from 'react';
import { toNumber } from '@/lib/supabaseClient.js';
import { createSupabaseEntity } from '@/api/supabaseAdapter.js';
import { Link } from 'react-router-dom';
import {
  Users, FileText, Wallet, Store, Share2, TrendingUp,
  CheckCircle, Clock, AlertCircle, ArrowRight, Activity
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import DashboardUsulanCharts from '@/components/dashboard/DashboardUsulanCharts';
import DashboardAspirasiPanel from '@/components/dashboard/DashboardAspirasiPanel';
import RealisasiStats from '@/components/realisasi/RealisasiStats';
import RealisasiCharts from '@/components/realisasi/RealisasiCharts';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import PendudukStatsGrid from '@/components/penduduk/PendudukStatsGrid';
import PendudukCharts from '@/components/penduduk/PendudukCharts';
import { fetchPendudukStats } from '@/lib/pendudukStats';

const EMPTY_DATA = {
  pendudukStats: null, 
  surat: [], 
  apbdes: [], 
  umkm: [],
  aspirasi: [], 
  aspirasiStats: { baru: 0, diproses: 0, selesai: 0 },
  usulan: [], 
  realisasi: [],
  userGroups: [],
  akunAkses: [],
  websiteSetting: {},
  demografiSummary: {},
};

const safeArray = (val) => (Array.isArray(val) ? val : []);
const safeObject = (val) => (val && typeof val === 'object' ? val : {});

export default function Dashboard() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const suratEntity = createSupabaseEntity('SuratKeterangan');
        const apbdesEntity = createSupabaseEntity('APBDes');
        const umkmEntity = createSupabaseEntity('UMKM');
        const aspirasiEntity = createSupabaseEntity('Aspirasi');
        const usulanEntity = createSupabaseEntity('UsulanPembangunan');
        const realisasiEntity = createSupabaseEntity('RealisasiPembangunan');
        const userGroupEntity = createSupabaseEntity('UserGroup');
        const akunAksesEntity = createSupabaseEntity('AkunAkses');
        const websiteSettingEntity = createSupabaseEntity('WebsiteSetting');
        const pendudukEntity = createSupabaseEntity('Penduduk');

        const results = await Promise.allSettled([
          fetchPendudukStats(),
          suratEntity.list('-created_date', 10),
          apbdesEntity.filter({ tahun_anggaran: 2026 }),
          umkmEntity.filter({ status: 'Aktif' }),
          aspirasiEntity.list('-created_date', 6),
          aspirasiEntity.count({ status: 'Baru' }),
          aspirasiEntity.count({ status: { $in: ['Diproses', 'Dijawab'] } }),
          aspirasiEntity.count({ status: 'Selesai' }),
          usulanEntity.list('-created_date', 100),
          realisasiEntity.list('-created_date', 100),
          userGroupEntity.list({ limit: 500 }),
          akunAksesEntity.list({ limit: 500 }),
          websiteSettingEntity.list('-created_date', 1),
          pendudukEntity.list({ limit: 1 }), // triggers demografi_summary via appSettings
        ]);
        // Satu permintaan gagal tidak boleh mengosongkan seluruh dashboard.
        const [
          pendudukStats, surat, apbdes, umkm, aspirasi, aspirasiBaru, aspirasiDiproses, aspirasiSelesai, 
          usulan, realisasi, userGroups, akunAkses, websiteSetting, pendudkTrigger
        ] = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
        
        setData({
          pendudukStats: pendudukStats || null,
          surat: safeArray(surat),
          apbdes: safeArray(Array.isArray(apbdes) ? apbdes : apbdes?.items),
          umkm: safeArray(umkm),
          aspirasi: safeArray(aspirasi),
          aspirasiStats: { baru: aspirasiBaru || 0, diproses: aspirasiDiproses || 0, selesai: aspirasiSelesai || 0 },
          usulan: safeArray(usulan),
          realisasi: safeArray(realisasi),
          userGroups: safeArray(userGroups),
          akunAkses: safeArray(akunAkses),
          websiteSetting: safeObject(websiteSetting),
          demografiSummary: safeObject(pendudukStats), // stats already has demografi
        });
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

  const totalPenduduk = data.pendudukStats?.total || 0;
  const lakiLaki = data.pendudukStats?.lakiLaki || 0;
  const perempuan = data.pendudukStats?.perempuan || 0;
  const suratSelesai = data.surat.filter((s) => s.status === 'Selesai').length;
  const suratProses = data.surat.filter((s) => s.status === 'Diproses' || s.status === 'Diajukan').length;

  const apbdesItems = safeArray(data.apbdes);
  const umkmItems = safeArray(data.umkm);

  const totalPendapatan = apbdesItems.filter((a) => a.jenis === 'Pendapatan').reduce((sum, a) => sum + toNumber(a.anggaran), 0);
  const totalBelanja = apbdesItems.filter((a) => a.jenis === 'Belanja').reduce((sum, a) => sum + toNumber(a.anggaran), 0);
  const totalRealisasi = apbdesItems.filter((a) => a.jenis === 'Belanja').reduce((sum, a) => sum + toNumber(a.realisasi), 0);
  const persentaseRealisasi = totalBelanja > 0 ? Math.round((totalRealisasi / totalBelanja) * 100) : 0;

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const belanjaByKategori = {};
  apbdesItems
    .filter((a) => a.jenis === 'Belanja')
    .forEach((a) => {
      const key = a.kategori || 'Lainnya';
      if (!belanjaByKategori[key]) belanjaByKategori[key] = 0;
      belanjaByKategori[key] += toNumber(a.anggaran);
    });
  const belanjaChart = Object.entries(belanjaByKategori).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative">
          <p className="text-primary-foreground/70 text-sm font-medium">Selamat Datang di</p>
          <h1 className="text-2xl lg:text-4xl font-extrabold mt-1 tracking-tight">
            Sistem Informasi Manajemen Desa Terintegrasi
          </h1>
          <p className="text-primary-foreground/70 mt-2 max-w-2xl text-sm lg:text-base">
            Tata Kelola Layanan Dan Inovasi Digital Pemerintah Desa
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/admin/surat"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              <FileText className="w-4 h-4" /> Layanan Suket
            </Link>
            <Link
              to="/admin/apbdes"
              className="inline-flex items-center gap-2 bg-white/10 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              <Wallet className="w-4 h-4" /> Lihat APBDes
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Penduduk" value={totalPenduduk} sublabel={`${lakiLaki} L / ${perempuan} P`} accent="bg-primary/10 text-primary" />
        <StatCard icon={FileText} label="Surat Bulan Ini" value={safeArray(data.surat).length} sublabel={`${suratSelesai} selesai · ${suratProses} proses`} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={Wallet} label="Realisasi APBDes" value={`${persentaseRealisasi}%`} sublabel={formatRupiah(totalRealisasi)} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={Store} label="UMKM Aktif" value={umkmItems.length} sublabel="Terdaftar di marketplace" accent="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Data Kependudukan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Data Kependudukan</h2>
            <p className="text-sm text-muted-foreground">Indikator demografi berbasis Data Kartu Keluarga desa</p>
          </div>
          <Link to="/admin/penduduk" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Kelola <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <PendudukStatsGrid stats={data.pendudukStats} />
        <PendudukCharts stats={data.pendudukStats} />
      </div>

      {/* Charts */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-lg mb-1">Belanja APBDes 2026</h3>
        <p className="text-sm text-muted-foreground mb-4">Distribusi per kategori (Rp)</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={belanjaChart} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} fontSize={12} />
            <YAxis type="category" dataKey="name" fontSize={12} width={90} />
            <Tooltip formatter={(v) => formatRupiah(v)} />
            <Bar dataKey="value" fill="hsl(160 58% 32%)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Usulan Pembangunan */}
      <DashboardUsulanCharts usulan={data.usulan} />

      {/* Realisasi Pembangunan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Realisasi Pembangunan</h2>
            <p className="text-sm text-muted-foreground">Progress fisik & anggaran kegiatan pembangunan desa</p>
          </div>
          <Link to="/admin/realisasi" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Kelola <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <RealisasiStats items={data.realisasi} />
        <RealisasiCharts items={data.realisasi} />
      </div>

      {/* Recent + Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Surat Terbaru</h3>
            <Link to="/admin/surat" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.surat.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{s.nama_pemohon}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.jenis_surat}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {data.surat.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada surat</p>
            )}
          </div>
        </div>

        <DashboardAspirasiPanel items={data.aspirasi} stats={data.aspirasiStats} />
      </div>
    </div>
  );
}