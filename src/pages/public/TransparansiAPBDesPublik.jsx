import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
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
        setRecords(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const totalPendapatan = records.filter((a) => a.jenis === 'Pendapatan').reduce((s, a) => s + (a.anggaran || 0), 0);
  const totalBelanja = records.filter((a) => a.jenis === 'Belanja').reduce((s, a) => s + (a.anggaran || 0), 0);
  const totalRealisasi = records.filter((a) => a.jenis === 'Belanja').reduce((s, a) => s + (a.realisasi || 0), 0);
  const persentase = totalBelanja > 0 ? Math.round((totalRealisasi / totalBelanja) * 100) : 0;

  const belanjaByKategori = {};
  records.filter((a) => a.jenis === 'Belanja').forEach((a) => {
    if (!belanjaByKategori[a.kategori]) belanjaByKategori[a.kategori] = { anggaran: 0, realisasi: 0 };
    belanjaByKategori[a.kategori].anggaran += a.anggaran || 0;
    belanjaByKategori[a.kategori].realisasi += a.realisasi || 0;
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
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Transparansi APBDes 2026</h1>
          <p className="text-primary-foreground/70">Anggaran Pendapatan dan Belanja Desa tahun 2026 — transparan untuk publik</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Pendapatan</span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-700">{formatRupiah(totalPendapatan)}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Belanja</span>
            </div>
            <p className="text-2xl font-extrabold text-amber-700">{formatRupiah(totalBelanja)}</p>
          </div>
          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-8 h-8 text-primary" />
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{persentase}% terealisasi</span>
            </div>
            <p className="text-2xl font-extrabold text-primary">{formatRupiah(totalRealisasi)}</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-lg mb-1">Anggaran vs Realisasi per Kategori</h3>
            <p className="text-sm text-muted-foreground mb-4">Belanja APBDes 2026 (Rp)</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} fontSize={11} />
                <Tooltip formatter={(v) => formatRupiah(v)} />
                <Legend />
                <Bar dataKey="Anggaran" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realisasi" fill="hsl(38 75% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari kategori..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterJenis} onValueChange={setFilterJenis}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="Pendapatan">Pendapatan</SelectItem>
                <SelectItem value="Belanja">Belanja</SelectItem>
                <SelectItem value="Pembiayaan">Pembiayaan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Jenis</th>
                  <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Sub Kategori</th>
                  <th className="text-right px-4 py-3 font-semibold">Anggaran</th>
                  <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">Realisasi</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Sumber Dana</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.jenis === 'Pendapatan' ? 'bg-emerald-100 text-emerald-700' :
                        r.jenis === 'Belanja' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>{r.jenis}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.kategori}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.sub_kategori || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatRupiah(r.anggaran)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs hidden lg:table-cell">{formatRupiah(r.realisasi)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.sumber_dana}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">Tidak ada data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}