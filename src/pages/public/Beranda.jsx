import { FileText } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44, fetchEntitiesLocal, fetchFunctionLocal, toNumber } from '@/api/base44Client';
import {
  Users, Store, Wallet, ArrowRight,
  MapPin, MessagesSquare, ShoppingBag, ClipboardList,
  ChevronUp, ChevronDown
} from 'lucide-react';
import BerandaRealisasi from '@/components/public/BerandaRealisasi';
import BerandaUmkm from '@/components/public/BerandaUmkm';
import PendudukStatsGrid from '@/components/penduduk/PendudukStatsGrid';
import PendudukCharts from '@/components/penduduk/PendudukCharts';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';
import { IS_LOCALHOST } from '@/api/base44Client';

const safeArray = (val) => (Array.isArray(val) ? val : []);
const safeNum = (val) => (val != null ? val : 0);

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
  const [showDetailDemografi, setShowDetailDemografi] = useState(false);
  const { settings } = useWebsiteSettings();

  useEffect(() => {
    (async () => {
      try {
        if (IS_LOCALHOST) {
          const pendudukRows = safeArray(await fetchEntitiesLocal('Penduduk'));
          
          const genderCounts = {};
          pendudukRows.forEach((r) => {
            const g = r.jenis_kelamin || 'Tidak Diketahui';
            genderCounts[g] = (genderCounts[g] || 0) + 1;
          });
          const gender = Object.entries(genderCounts).map(([name, value]) => ({ name, value: Number(value) || 0 }));

          const usiaCounts = {};
          pendudukRows.forEach((r) => {
            const u = r.kelompok_usia || 'Tidak Diketahui';
            usiaCounts[u] = (usiaCounts[u] || 0) + 1;
          });
          const usia = Object.entries(usiaCounts).map(([name, value]) => ({ name, value: Number(value) || 0 }));

          const pendidikanCounts = {};
          pendudukRows.forEach((r) => {
            const p = r.pendidikan || 'Tidak Diketahui';
            pendidikanCounts[p] = (pendidikanCounts[p] || 0) + 1;
          });
          const pendidikan = Object.entries(pendidikanCounts).map(([name, value]) => ({ name, value: Number(value) || 0 }));

          const pekerjaanCounts = {};
          pendudukRows.forEach((r) => {
            const p = r.pekerjaan || 'Tidak Diketahui';
            pekerjaanCounts[p] = (pekerjaanCounts[p] || 0) + 1;
          });
          const pekerjaan = Object.entries(pekerjaanCounts).map(([name, value]) => ({ name, value: Number(value) || 0 })).slice(0, 10);

          const perkawinanCounts = {};
          pendudukRows.forEach((r) => {
            const p = r.status_perkawinan || 'Tidak Diketahui';
            perkawinanCounts[p] = (perkawinanCounts[p] || 0) + 1;
          });
          const perkawinan = Object.entries(perkawinanCounts).map(([name, value]) => ({ name, value: Number(value) || 0 }));

          const keluargaCounts = {};
          pendudukRows.forEach((r) => {
            const k = r.status_keluarga || 'Tidak Diketahui';
            keluargaCounts[k] = (keluargaCounts[k] || 0) + 1;
          });
          const keluarga = Object.entries(keluargaCounts).map(([name, value]) => ({ name, value: Number(value) || 0 }));

          const agamaCounts = {};
          pendudukRows.forEach((r) => {
            const a = r.agama || 'Tidak Diketahui';
            agamaCounts[a] = (agamaCounts[a] || 0) + 1;
          });
          const agama = Object.entries(agamaCounts).map(([name, value]) => ({ name, value: Number(value) || 0 }));

          const wilayahCounts = {};
          pendudukRows.forEach((r) => {
            const rw = r.rw || '';
            if (rw) wilayahCounts[rw] = (wilayahCounts[rw] || 0) + 1;
          });
          const wilayah = Object.entries(wilayahCounts).map(([name, value]) => ({ name: `RW ${name}`, value: Number(value) || 0 })).sort((a, b) => a.name.localeCompare(b.name));

          let usiaProduktif = 0;
          pendudukRows.forEach((r) => {
            const k = (r.kelompok_usia || '');
            const m = k.match(/(\d+)/);
            if (m && Number(m[1]) >= 15 && Number(m[1]) <= 64) usiaProduktif++;
          });

          const disabilitas = pendudukRows.filter((r) => (r.disabilitas || '') !== '').length;

          const pendudukStats = {
            total: pendudukRows.length,
            lakiLaki: safeNum(pendudukRows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'laki-laki').length),
            perempuan: safeNum(pendudukRows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'perempuan').length),
            totalKK: safeNum(new Set(pendudukRows.map((r) => r.no_kk).filter((k) => k)).size),
            usiaProduktif,
            disabilitas,
            gender,
            usia,
            pendidikan,
            pekerjaan,
            perkawinan,
            keluarga,
            agama,
            wilayah,
          };

          const umkmRows = safeArray(await fetchEntitiesLocal('UMKM'));
          const umkmData = umkmRows.filter((r) => (r.status || '').toLowerCase() === 'aktif');

          const apbdesRows = safeArray(await fetchEntitiesLocal('APBDes'));
          const apbdesFromCSV = apbdesRows.filter((r) => String(r.tahun_anggaran) === '2026');

          const realisasiRows = safeArray(await fetchEntitiesLocal('RealisasiPembangunan'));
          const withProgress = realisasiRows.map((r) => {
            const total = toNumber(r.anggaran);
            const realisasi = toNumber(r.realisasi_anggaran);
            const pct = r.persentase_progress ?? (total > 0 ? Math.round((realisasi / total) * 100) : 0);
            return { ...r, persentase_progress: pct };
          });

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
          const [profil, aspirasiStats, suratStats, pendudukStats, umkm, apbdes, realisasi] = await Promise.all([
            safe(() => base44.entities.ProfilDesa.list({ sort: '-created_date', limit: 1 }), []),
            safe(() => base44.functions.invoke('getAspirasiStats').then((res) => res.data), null),
            safe(() => base44.functions.invoke('getSuratStats').then((res) => res.data), null),
            safe(() => base44.functions.invoke('getPendudukStats').then((res) => res.data), null),
            safe(() => base44.entities.UMKM.filter({ status: 'Aktif' }), []),
            safe(() => base44.entities.APBDes.filter({ tahun_anggaran: 2026 }), []),
            safe(() => base44.entities.RealisasiPembangunan.list({ sort: '-created_date', limit: 50 }), []),
          ]);

          const profilData = safeArray(listOf(profil))[0] || await safe(() => fetchEntitiesLocal('ProfilDesa'), null);
          const umkmData = safeArray(listOf(umkm)).length > 0 ? safeArray(listOf(umkm)) : await safe(() => fetchEntitiesLocal('UMKM'), []);
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
        <div className="w-8 h-8 border-4 border-teal-600 border-t-amber-500 rounded-full animate-spin" />
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

  const totalPendapatan = apbdesItems.filter((a) => a.jenis === 'Pendapatan').reduce((s, a) => s + toNumber(a.anggaran), 0);
  const totalBelanja = apbdesItems.filter((a) => a.jenis === 'Belanja').reduce((s, a) => s + toNumber(a.anggaran), 0);

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const services = [
    { to: '/layanan-surat', icon: FileText, label: 'Layanan Surat', desc: 'Ajukan surat keterangan online' },
    { to: '/marketplace-umkm', icon: ShoppingBag, label: 'Marketplace UMKM', desc: 'Produk dari warga desa' },
    { to: '/rencana-pembangunan', icon: ClipboardList, label: 'Rencana Pembangunan', desc: 'Usulan & RKPDes tahunan' },
    { to: '/transparansi-apbdes', icon: Wallet, label: 'Transparansi APBDes', desc: 'Anggaran & realisasi desa' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="flex flex-col space-y-6 md:space-y-12">
        {/* Hero */}
        <section className="relative py-8 md:py-16 bg-gradient-to-br from-sky-50 via-teal-50/60 to-white overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
              PORTAL DIGITAL RESMI DESA
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
              Desa Tagog Apu
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base max-w-2xl mb-6 mx-auto leading-relaxed">
              Smart Society — Menghadirkan kemudahan pelayanan administrasi, transparansi anggaran, dan pemberdayaan ekonomi warga dalam satu genggaman.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/layanan-surat" className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/30 hover:bg-teal-700 transition-all">
                <FileText className="w-4 h-4" /> Ajukan Surat Online
              </Link>
              <Link to="/marketplace-umkm" className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all">
                <Store className="w-4 h-4 text-teal-600" /> Jelajahi UMKM
              </Link>
              <Link to="/aspirasi" className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all">
                <MessagesSquare className="w-4 h-4 text-teal-600" /> Aspirasi Warga
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
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
            <div key={s.label} className="rounded-2xl bg-white border border-slate-200/80 p-3 md:p-5 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-lg md:text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-sm font-semibold text-slate-700">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-teal-600 text-xs font-bold uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full">FITUR UTAMA</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">Layanan Publik Digital</h2>
          <p className="text-slate-600 text-sm mt-1">Akses berbagai layanan pemerintahan desa secara transparan dan efisien</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:border-teal-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{s.label}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm text-teal-600 font-semibold mt-4 group-hover:gap-1.5 transition-all">
                Akses Layanan <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Koleksi Produk UMKM */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <BerandaUmkm items={umkmItems} />
      </div>

      {/* Data Kependudukan */}
      <section className="w-full px-4 py-6" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
        <div className="mb-4" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
          <span className="text-teal-600 text-xs font-bold uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full">STATISTIK DESA</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">Data Kependudukan Desa</h2>
          <p className="text-slate-600 text-sm">Demografi warga berdasarkan basis data kependudukan terkini</p>
        </div>
        <div className="mb-6" style={{ width: '100%', maxWidth: '100%', display: 'block' }}>
          <PendudukStatsGrid stats={data.pendudukStats} />
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm w-full" style={{ width: '100%', maxWidth: 'none', display: 'block' }}>
          <div className="w-full" style={{ width: '100%', maxWidth: 'none', display: 'block' }}>
            <h3 className="font-bold text-lg mb-4">Grafik Demografi</h3>
            <button
              onClick={() => setShowDetailDemografi(!showDetailDemografi)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full"
              style={{ width: '100%' }}
            >
              {showDetailDemografi ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Sembunyikan Detail Grafik
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Lihat Detail Grafik Demografi
                </>
              )}
            </button>
          </div>
          
          {showDetailDemografi && (
            <PendudukCharts stats={data.pendudukStats} />
          )}
        </div>
      </section>

      {/* APBDes & Realisasi */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-teal-600 text-xs font-bold uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full">KEUANGAN DESA</span>
              <h3 className="font-extrabold text-xl text-slate-900 mt-2 mb-1">APBDes 2026</h3>
              <p className="text-sm text-slate-500 mb-4">Ringkasan anggaran pendapatan dan belanja desa</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/80 border border-emerald-100">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-emerald-800">Total Pendapatan</p>
                    <p className="text-sm sm:text-lg font-extrabold text-emerald-700 truncate">{formatRupiah(totalPendapatan)}</p>
                  </div>
                  <Wallet className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/80 border border-amber-100">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amber-800">Total Belanja</p>
                    <p className="text-sm sm:text-lg font-extrabold text-amber-700 truncate">{formatRupiah(totalBelanja)}</p>
                  </div>
                  <Wallet className="w-7 h-7 text-amber-600 flex-shrink-0" />
                </div>
              </div>
            </div>
            <Link to="/transparansi-apbdes" className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-50 text-teal-700 font-semibold text-sm hover:bg-teal-100 transition-colors">
              Lihat Rincian Transparansi APBDes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <BerandaRealisasi items={realisasiItems} />
          </div>
        </div>
      </section>

      {/* Profile teaser */}
      {profil && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 p-6 md:p-10 text-white shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="px-3 py-1 rounded-full bg-teal-600/60 text-teal-200 text-xs font-semibold uppercase tracking-wider">TENTANG KAMI</span>
              <h2 className="text-3xl font-extrabold mt-3 mb-3">Desa {profil.nama_desa}</h2>
              <div className="space-y-2 text-teal-100 text-sm">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-400" /> {profil.kecamatan}, {profil.kabupaten}, {profil.provinsi}</p>
                <p>Luas Wilayah: {profil.luas_wilayah} km² · {profil.jumlah_rt} RT / {profil.jumlah_rw} RW</p>
                <p className="leading-relaxed text-teal-50/90">{profil.potensi_ekonomi || 'Desa dengan potensi ekonomi, pertanian, dan pariwisata yang berkembang pesat.'}</p>
              </div>
              <Link to="/profil-desa" className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold mt-5 hover:bg-amber-400 transition-colors shadow-md">
                Profil Selengkapnya <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-3xl font-extrabold">{profil.jumlah_penduduk || totalPenduduk}</p>
                <p className="text-xs text-teal-200 mt-1">Penduduk</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-3xl font-extrabold">{profil.jumlah_rt || 0}</p>
                <p className="text-xs text-teal-200 mt-1">RT</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-3xl font-extrabold">{profil.luas_wilayah || 0}</p>
                <p className="text-xs text-teal-200 mt-1">km²</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-3xl font-extrabold">{umkmItems.length}</p>
                <p className="text-xs text-teal-200 mt-1">UMKM</p>
              </div>
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

const listOf = (result) => (Array.isArray(result) ? result : result?.items || []);