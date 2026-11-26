import { FileText } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44, fetchEntitiesLocal, fetchFunctionLocal } from '@/api/base44Client';
import {
  Users, Store, Wallet, ArrowRight,
  MapPin, MessagesSquare, ShoppingBag, ClipboardList
} from 'lucide-react';
import BerandaRealisasi from '@/components/public/BerandaRealisasi';
import BerandaUmkm from '@/components/public/BerandaUmkm';
import PendudukStatsGrid from '@/components/penduduk/PendudukStatsGrid';
import PendudukCharts from '@/components/penduduk/PendudukCharts';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';
import { IS_LOCALHOST } from '@/api/base44Client';

// Fungsi bantu untuk memastikan nilai adalah array
const safeArray = (val) => (Array.isArray(val) ? val : []);
const safeNum = (val) => (val != null ? val : 0);

// Satu bagian gagal tidak boleh mengosongkan seluruh beranda, termasuk bagi pengunjung tanpa login.
const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    return fallback;
  };
};

export default function Beranda() {
  const [data, setData] = useState({ 
    profil: null, 
    aspirasiStats: null, 
    suratStats: null, 
    pendudukStats: null, 
    umkm: [], 
    apbdes: [], 
    realisasi: [] 
  });
  const [loading, setLoading] = useState(true);
  const { settings } = useWebsiteSettings();

  useEffect(() => {
    (async () => {
      try {
        // Di localhost: ambil data dari CSV langsung, lewati Base44 SDK
        if (IS_LOCALHOST) {
          // Ambil data penduduk dari CSV
          const pendudukRows = safeArray(await fetchEntitiesLocal('Penduduk'));
          const pendudukStats = {
            total: pendudukRows.length,
            lakiLaki: safeNum(pendudukRows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'laki-laki').length),
            perempuan: safeNum(pendudukRows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'perempuan').length),
            totalKK: safeNum(new Set(pendudukRows.map((r) => r.no_kk).filter((k) => k)).size),
            usiaProduktif: 0, // akan diisi jika perlu dari CSV
            gender: [],
            usia: [],
            pendidikan: [],
            pekerjaan: [],
            perkawinan: [],
            keluarga: [],
            agama: [],
            wilayah: [],
          };

          // Ambil UMKM dari CSV
          const umkmRows = safeArray(await fetchEntitiesLocal('UMKM'));
          const umkmData = umkmRows.filter((r) => (r.status || '').toLowerCase() === 'aktif');

          // Ambil APBDes dari CSV
          const apbdesRows = safeArray(await fetchEntitiesLocal('APBDes'));
          const apbdesFromCSV = apbdesRows.filter((r) => String(r.tahun_anggaran) === '2026');
          const totalPendapatan = apbdesFromCSV
            .filter((a) => a.jenis === 'Pendapatan')
            .reduce((s, a) => s + (a.anggaran || 0), 0);
          const totalBelanja = apbdesFromCSV
            .filter((a) => a.jenis === 'Belanja')
            .reduce((s, a) => s + (a.anggaran || 0), 0);

          // Ambil Realisasi dari CSV
          const realisasiRows = safeArray(await fetchEntitiesLocal('RealisasiPembangunan'));
          const withProgress = realisasiRows.map((r) => {
            const total = r.anggaran || 0;
            const realisasi = r.realisasi_anggaran || 0;
            const pct = r.persentase_progress ?? (total > 0 ? Math.round((realisasi / total) * 100) : 0);
            return { ...r, persentase_progress: pct };
          });
          const rataRata = withProgress.length
            ? withProgress.reduce((s, r) => s + (r.persentase_progress || 0), 0) / withProgress.length
            : 0;
          const totalAnggaran = withProgress.reduce((s, r) => s + (r.anggaran || 0), 0);
          const totalRealisasi = withProgress.reduce((s, r) => s + (r.realisasi_anggaran || 0), 0);

          // Ambil Aspirasi dari CSV
          const aspirasiRows = safeArray(await fetchEntitiesLocal('Aspirasi'));
          const countByStatus = {};
          aspirasiRows.forEach((r) => {
            const s = r.status || 'Tidak Diketahui';
            countByStatus[s] = (countByStatus[s] || 0) + 1;
          });
          const aspirasiStats = {
            total: aspirasiRows.length,
            status: countByStatus,
            baru: countByStatus['Baru'] || 0,
            diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Dijawab'] || 0),
            selesai: countByStatus['Selesai'] || 0,
            ditolak: countByStatus['Ditolak'] || 0,
            kategori: {},
          };

          // Ambil Surat dari CSV
          const suratRows = safeArray(await fetchEntitiesLocal('SuratKeterangan'));
          const countByStatus2 = {};
          suratRows.forEach((r) => {
            const s = r.status || 'Tidak Diketahui';
            countByStatus2[s] = (countByStatus2[s] || 0) + 1;
          });
          const suratStats = {
            total: suratRows.length,
            status: countByStatus2,
            diajukan: countByStatus2['Diajukan'] || 0,
            diproses: (countByStatus2['Diproses'] || 0) + (countByStatus2['Disetujui'] || 0),
            selesai: countByStatus2['Selesai'] || 0,
            ditolak: countByStatus2['Ditolak'] || 0,
          };

          // Ambil Profil dari CSV
          const profilRows = safeArray(await fetchEntitiesLocal('ProfilDesa'));
          const profil = profilRows.length > 0 ? profilRows[0] : null;

          setData({
            profil,
            aspirasiStats,
            suratStats,
            pendudukStats,
            umkm: safeArray(umkmData),
            apbdes: safeArray(apbdesFromCSV),
            realisasi: safeArray(withProgress),
          });
        } else {
          // Produksi: gunakan Base44 SDK (code asli)
          const [profil, aspirasiStats, suratStats, pendudukStats, umkm, apbdes, realisasi] = await Promise.all([
            safe(() => base44.entities.ProfilDesa.list({ sort: '-created_date', limit: 1 }), []),
            safe(() => base44.functions.invoke('getAspirasiStats').then((res) => res.data), null),
            safe(() => base44.functions.invoke('getSuratStats').then((res) => res.data), null),
            safe(() => fetchFunctionLocal('getPendudukStats'), null),
            safe(() => base44.entities.UMKM.filter({ status: 'Aktif' }), []),
            safe(() => base44.entities.APBDes.filter({ tahun_anggaran: 2026 }), []),
            safe(() => base44.entities.RealisasiPembangunan.list({ sort: '-created_date', limit: 50 }), []),
          ]);

          // Jika API gagal (null/empty), fallback ke CSV lokal
          const profilData = safeArray(listOf(profil))[0] || await safe(() => fetchEntitiesLocal('ProfilDesa'), null);
          const umkmData = safeArray(listOf(umkm)).length > 0 ? safeArray(umkm) : await safe(() => fetchEntitiesLocal('UMKM'), []);
          const apbdesFromAPI = safeArray(listOf(apbdes));
          const apbdesData = apbdesFromAPI.length > 0 ? apbdesFromAPI : safeArray(await safe(() => fetchEntitiesLocal('APBDes'), []));
          const realisasiFromAPI = safeArray(listOf(realisasi));
          const realisasiData = realisasiFromAPI.length > 0 ? realisasiFromAPI : safeArray(await safe(() => fetchEntitiesLocal('RealisasiPembangunan'), []));

          setData({
            profil: profilData,
            aspirasiStats: aspirasiStats || await safe(() => fetchFunctionLocal('getAspirasiStats'), null),
            suratStats: suratStats || await safe(() => fetchFunctionLocal('getSuratStats'), null),
            pendudukStats: pendudukStats || await safe(() => fetchFunctionLocal('getPendudukStats'), null),
            umkm: safeArray(umkmData),
            apbdes: safeArray(apbdesData),
            realisasi: safeArray(realisasiData),
          });
        }

        setLoading(false);
      } catch (e) { console.error(e); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-800 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const profil = data.profil;
  const totalPenduduk = data.pendudukStats?.total || 0;
  const lakiLaki = data.pendudukStats?.lakiLaki || 0;
  const perempuan = data.pendudukStats?.perempuan || 0;
  const totalKK = data.pendudukStats?.totalKK || 0;
  const apbdesItems = safeArray(data.apbdes);
  const umkmItems = safeArray(data.umkm);
  const realisasiItems = safeArray(data.realisasi);

  const totalPendapatan = apbdesItems.filter((a) => a.jenis === 'Pendapatan').reduce((s, a) => s + (a.anggaran || 0), 0);
  const totalBelanja = apbdesItems.filter((a) => a.jenis === 'Belanja').reduce((s, a) => s + (a.anggaran || 0), 0);

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const services = [
    { to: '/layanan-surat', icon: FileText, label: 'Layanan Surat', desc: 'Ajukan surat keterangan online' },
    { to: '/marketplace-umkm', icon: ShoppingBag, label: 'Marketplace UMKM', desc: 'Produk dari warga desa' },
    { to: '/rencana-pembangunan', icon: ClipboardList, label: 'Rencana Pembangunan', desc: 'Usulan & RKPDes tahunan' },
    { to: '/transparansi-apbdes', icon: Wallet, label: 'Transparansi APBDes', desc: 'Anggaran & realisasi desa' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[520px] flex items-center overflow-hidden bg-[#0A635D]">
        <div className="absolute inset-0 bg-[#0B6B64]/88" />
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80"
          alt="Pemandangan Desa"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#E59824] font-semibold text-sm uppercase tracking-wider mb-2">
              SELAMAT DATANG DI PORTAL LAYANAN DIGITAL
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-white">
              Desa Tagog Apu
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl mb-6 mx-auto">
              Mari Kita Sambut Era Baru Pelayanan Publik Pemerintah Desa Tagogapu
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/layanan-surat" className="inline-flex items-center gap-2 bg-[#E59824] text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#E59824]/90 transition-colors">
                <FileText className="w-4 h-4" /> Ajukan Surat Online
              </Link>
              <Link to="/daftar-umkm" className="inline-flex items-center gap-2 border border-white/30 bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors">
                <Store className="w-4 h-4" /> Daftar UMKM
              </Link>
              <Link to="/aspirasi" className="inline-flex items-center gap-2 border border-white/30 bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors">
                <MessagesSquare className="w-4 h-4" /> Aspirasi Warga
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Penduduk', value: totalPenduduk.toLocaleString('id-ID'), sub: `${lakiLaki}L / ${perempuan}P · ${totalKK} KK` },
            { icon: Store, label: 'UMKM Aktif', value: umkmItems.length, sub: 'Marketplace desa' },
            {
              icon: FileText,
              label: 'Layanan Surat',
              value: (data.suratStats?.total || 0).toLocaleString('id-ID'),
              sub: `${data.suratStats?.diproses || 0} diproses · ${data.suratStats?.selesai || 0} selesai`,
            },
            {
              icon: MessagesSquare,
              label: 'Aspirasi Warga',
              value: (data.aspirasiStats?.total || 0).toLocaleString('id-ID'),
              sub: `${data.aspirasiStats?.diproses || 0} diproses · ${data.aspirasiStats?.selesai || 0} selesai`,
            },
          ].map((s) => (
            <div key={s.label} className="bg-teal-50 rounded-2xl border border-border p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-sm font-medium text-slate-600">{s.label}</p>
              <p className="text-xs text-slate-600/70">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold text-center mb-2">Layanan Publik</h2>
        <p className="text-teal-300 text-center mb-8">Akses layanan desa secara online, cepat, dan transparan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group bg-card rounded-2xl border border-border p-6 hover:shadow-md hover:border-teal-600 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-[#E59824] flex items-center justify-center mb-4 group-hover:bg-teal-500 group-hover:text-[#E59824] transition-colors">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">{s.label}</h3>
              <p className="text-sm text-teal-300/70">{s.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm text-[#E59824] font-medium mt-3 group-hover:gap-2 transition-all">
                Pelajari <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Koleksi Produk UMKM */}
      <BerandaUmkm items={umkmItems} />

      {/* Data Kependudukan */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold">Data Kependudukan Desa</h2>
          <p className="text-teal-300 text-sm">Statistik warga berdasarkan Data Kartu Keluarga terbaru</p>
        </div>
        <div className="mb-6">
          <PendudukStatsGrid stats={data.pendudukStats} />
        </div>
        <PendudukCharts stats={data.pendudukStats} />
      </section>

      {/* APBDes */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-lg mb-1">APBDes 2026</h3>
          <p className="text-sm text-teal-300 mb-4">Ringkasan anggaran</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50">
              <div>
                <p className="text-sm text-teal-300">Total Pendapatan</p>
                <p className="text-xl font-extrabold text-emerald-700">{formatRupiah(totalPendapatan)}</p>
              </div>
              <Wallet className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50">
              <div>
                <p className="text-sm text-teal-300">Total Belanja</p>
                <p className="text-xl font-extrabold text-amber-700">{formatRupiah(totalBelanja)}</p>
              </div>
              <Wallet className="w-8 h-8 text-amber-600" />
            </div>
            <Link to="/transparansi-apbdes" className="block text-center text-sm text-[#E59824] font-medium hover:underline pt-2">
              Lihat rincian transparansi APBDes →
            </Link>
          </div>
        </div>
      </section>

      {/* Realisasi Pembangunan */}
      <BerandaRealisasi items={realisasiItems} />

      {/* Profile teaser */}
      {profil && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-teal-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-extrabold mb-3">Tentang Desa {profil.nama_desa}</h2>
              <div className="space-y-2 text-teal-200/80">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E59824]" /> {profil.kecamatan}, {profil.kabupaten}, {profil.provinsi}</p>
                <p>Luas Wilayah: {profil.luas_wilayah} km² · {profil.jumlah_rt} RT / {profil.jumlah_rw} RW</p>
                <p className="leading-relaxed mt-3">{profil.potensi_ekonomi || 'Desa dengan potensi ekonomi dan wisata yang berkembang.'}</p>
              </div>
              <Link to="/profil-desa" className="inline-flex items-center gap-2 bg-[#E59824] text-[#E59824-foreground] px-5 py-2.5 rounded-xl text-sm font-semibold mt-5 hover:bg-[#E59824]/90">
                Selengkapnya <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-200/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold">{profil.jumlah_penduduk || totalPenduduk}</p>
                <p className="text-xs text-teal-300/70">Penduduk</p>
              </div>
              <div className="bg-teal-200/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold">{profil.jumlah_rt || 0}</p>
                <p className="text-xs text-teal-300/70">RT</p>
              </div>
              <div className="bg-teal-200/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold">{profil.luas_wilayah || 0}</p>
                <p className="text-xs text-teal-300/70">km²</p>
              </div>
              <div className="bg-teal-200/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold">{umkmItems.length}</p>
                <p className="text-xs text-teal-300/70">UMKM</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const listOf = (result) => (Array.isArray(result) ? result : result?.items || []);