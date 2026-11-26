import React, { useState, useEffect } from 'react';
import { base44, toNumber } from '@/api/base44Client';
import { Wallet, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function TransparansiAPBDesPublik() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.APBDes.filter({ tahun_anggaran: 2026 });
        setRecords(Array.isArray(data) ? data : data?.items || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const totalPendapatan = records.filter((a) => a.jenis === 'Pendapatan').reduce((s, a) => s + toNumber(a.anggaran), 0);
  const totalBelanja = records.filter((a) => a.jenis === 'Belanja').reduce((s, a) => s + toNumber(a.anggaran), 0);
  const totalRealisasi = records.filter((a) => a.jenis === 'Belanja').reduce((s, a) => s + toNumber(a.realisasi), 0);
  const persentase = totalBelanja > 0 ? Math.round((totalRealisasi / totalBelanja) * 100) : 0;

  const belanjaByKategori = {};
  records.filter((a) => a.jenis === 'Belanja').forEach((a) => {
    if (!belanjaByKategori[a.kategori]) belanjaByKategori[a.kategori] = { anggaran: 0, realisasi: 0 };
    belanjaByKategori[a.kategori].anggaran += toNumber(a.anggaran);
    belanjaByKategori[a.kategori].realisasi += toNumber(a.realisasi);
  });
  const chartData = Object.entries(belanjaByKategori).map(([name, v]) => ({ name, Anggaran: v.anggaran, Realisasi: v.realisasi }));

  const filtered = records.filter((r) => {
    const matchJenis = filterJenis === 'all' || r.jenis === filterJenis;
    const matchSearch = !search || r.kategori?.toLowerCase().includes(search.toLowerCase()) || r.sub_kategori?.toLowerCase().includes(search.toLowerCase());
    return matchJenis && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="py-16 bg-gradient-to-br from-sky-50 via-teal-50/60 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            AKUNTABILITAS PUBLIK
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Transparansi APBDes 2026</h1>
          <p className="text-slate-600 text-base max-w-2xl">Anggaran Pendapatan dan Belanja Desa tahun 2026 — transparan, akuntabel, dan dapat diakses publik.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Pendapatan</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalPendapatan)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Belanja</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalBelanja)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">{persentase}% terealisasi</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalRealisasi)}</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">Anggaran vs Realisasi per Kategori</h3>
            <p className="text-sm text-slate-500 mb-6">Belanja APBDes 2026 (dalam Rupiah)</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={70} stroke="#64748b" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} fontSize={11} stroke="#64748b" />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="Anggaran" fill="#0d9488" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Realisasi" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table & Pill Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-200 bg-slate-50/50">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Cari kategori anggaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white rounded-xl border-slate-200" />
            </div>

            {/* Pill Filters */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'Semua Jenis' },
                { id: 'Pendapatan', label: 'Pendapatan' },
                { id: 'Belanja', label: 'Belanja' },
                { id: 'Pembiayaan', label: 'Pembiayaan' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterJenis(pill.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filterJenis === pill.id
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">Jenis</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Kategori</th>
                  <th className="text-left px-5 py-3.5 font-semibold hidden md:table-cell">Sub Kategori</th>
                  <th className="text-right px-5 py-3.5 font-semibold">Anggaran</th>
                  <th className="text-right px-5 py-3.5 font-semibold hidden lg:table-cell">Realisasi</th>
                  <th className="text-left px-5 py-3.5 font-semibold hidden md:table-cell">Sumber Dana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.jenis === 'Pendapatan' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        r.jenis === 'Belanja' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>{r.jenis}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{r.kategori}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-500">{r.sub_kategori || '-'}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-slate-900">{formatRupiah(r.anggaran)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-600 hidden lg:table-cell">{formatRupiah(r.realisasi)}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-500">{r.sumber_dana}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-slate-500 py-12">Tidak ada data ditemukan.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
