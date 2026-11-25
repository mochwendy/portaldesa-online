import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Wallet, TrendingUp, TrendingDown, Filter, Plus, X, Pencil, Trash2
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatJt = (n) => `${(n / 1000000).toFixed(1)} jt`;

const emptyForm = {
  tahun_anggaran: 2026, jenis: 'Pendapatan', kategori: '', sub_kategori: '',
  anggaran: 0, realisasi: 0, sumber_dana: 'Dana Desa', keterangan: ''
};

const COLORS = ['hsl(160 58% 32%)', 'hsl(38 75% 50%)', 'hsl(200 55% 45%)', 'hsl(25 70% 55%)', 'hsl(280 50% 55%)'];

export default function TransparansiAPBDes() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.APBDes.filter({ tahun_anggaran: 2026 });
      setRecords(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterJenis === 'all' ? records : records.filter((r) => r.jenis === filterJenis);

  const totalPendapatan = records.filter((r) => r.jenis === 'Pendapatan').reduce((s, r) => s + (r.anggaran || 0), 0);
  const totalBelanja = records.filter((r) => r.jenis === 'Belanja').reduce((s, r) => s + (r.anggaran || 0), 0);
  const totalRealisasi = records.filter((r) => r.jenis === 'Belanja').reduce((s, r) => s + (r.realisasi || 0), 0);
  const persentase = totalBelanja > 0 ? Math.round((totalRealisasi / totalBelanja) * 100) : 0;

  const pendapatanByKategori = {};
  records.filter((r) => r.jenis === 'Pendapatan').forEach((r) => {
    if (!pendapatanByKategori[r.kategori]) pendapatanByKategori[r.kategori] = 0;
    pendapatanByKategori[r.kategori] += r.anggaran || 0;
  });
  const pendapatanChart = Object.entries(pendapatanByKategori).map(([name, value]) => ({ name, value }));

  const belanjaByKategori = {};
  records.filter((r) => r.jenis === 'Belanja').forEach((r) => {
    if (!belanjaByKategori[r.kategori]) belanjaByKategori[r.kategori] = { anggaran: 0, realisasi: 0 };
    belanjaByKategori[r.kategori].anggaran += r.anggaran || 0;
    belanjaByKategori[r.kategori].realisasi += r.realisasi || 0;
  });
  const belanjaChart = Object.entries(belanjaByKategori).map(([name, v]) => ({
    name, Anggaran: v.anggaran, Realisasi: v.realisasi
  }));

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm(r); setEditingId(r.id); setDialogOpen(true); };

  const save = async () => {
    if (editingId) {
      await base44.entities.APBDes.update(editingId, form);
    } else {
      await base44.entities.APBDes.create(form);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus item anggaran ini?')) return;
    await base44.entities.APBDes.delete(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Transparansi APBDes 2026" subtitle="Portal transparansi pengelolaan Anggaran Pendapatan dan Belanja Desa real-time">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Tambah Item
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Total Pendapatan" value={formatRupiah(totalPendapatan)} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingDown} label="Total Belanja" value={formatRupiah(totalBelanja)} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={Wallet} label="Realisasi" value={`${persentase}%`} sublabel={formatRupiah(totalRealisasi)} accent="bg-primary/10 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-lg mb-4">Sumber Pendapatan</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pendapatanChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {pendapatanChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatRupiah(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-lg mb-4">Anggaran vs Realisasi Belanja</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={belanjaChart} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatJt} fontSize={11} />
              <Tooltip formatter={(v) => formatRupiah(v)} />
              <Legend />
              <Bar dataKey="Anggaran" fill="hsl(160 58% 32%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realisasi" fill="hsl(38 75% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h3 className="font-bold">Rincian APBDes</h3>
          <Select value={filterJenis} onValueChange={setFilterJenis}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="Pendapatan">Pendapatan</SelectItem>
              <SelectItem value="Belanja">Belanja</SelectItem>
              <SelectItem value="Pembiayaan">Pembiayaan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Jenis</th>
                  <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Sumber Dana</th>
                  <th className="text-right px-4 py-3 font-semibold">Anggaran</th>
                  <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Realisasi</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        r.jenis === 'Pendapatan' ? 'bg-emerald-50 text-emerald-700' :
                        r.jenis === 'Belanja' ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{r.jenis}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.kategori}</p>
                      {r.sub_kategori && <p className="text-xs text-muted-foreground">{r.sub_kategori}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.sumber_dana}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatRupiah(r.anggaran || 0)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">{formatRupiah(r.realisasi || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Belum ada data anggaran</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item Anggaran' : 'Tambah Item Anggaran'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Anggaran</Label>
                <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendapatan">Pendapatan</SelectItem>
                    <SelectItem value="Belanja">Belanja</SelectItem>
                    <SelectItem value="Pembiayaan">Pembiayaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sumber Dana</Label>
                <Select value={form.sumber_dana} onValueChange={(v) => setForm({ ...form, sumber_dana: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Dana Desa', 'APBD', 'APBN', 'PADes', 'Lainnya'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="contoh: Dana Desa, Belanja Pegawai" />
            </div>
            <div>
              <Label>Sub Kategori</Label>
              <Input value={form.sub_kategori} onChange={(e) => setForm({ ...form, sub_kategori: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anggaran (Rp)</Label>
                <Input type="number" value={form.anggaran} onChange={(e) => setForm({ ...form, anggaran: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Realisasi (Rp)</Label>
                <Input type="number" value={form.realisasi} onChange={(e) => setForm({ ...form, realisasi: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Keterangan</Label>
              <Textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-primary hover:bg-primary/90">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}