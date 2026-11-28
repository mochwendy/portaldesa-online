import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Megaphone, Plus, Search, Filter, X, Pencil, Trash2, Calendar, User
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
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

const kategoriList = ['Pengumuman', 'Berita', 'Kegiatan', 'Undangan', 'Peringatan'];
const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  judul: '', isi: '', kategori: 'Pengumuman',
  tanggal_publikasi: today, penulis: '', status: 'Dipublikasi'
};

const kategoriStyle = {
  Pengumuman: 'bg-primary/10 text-primary',
  Berita: 'bg-blue-50 text-blue-600',
  Kegiatan: 'bg-emerald-50 text-emerald-600',
  Undangan: 'bg-amber-50 text-amber-600',
  Peringatan: 'bg-red-50 text-red-600',
};

export default function Pengumuman() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Pengumuman.list('-tanggal_publikasi', 200);
      setRecords(data?.items || data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const matchSearch = !search || r.judul?.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === 'all' || r.kategori === filterKategori;
    return matchSearch && matchKategori && r.status === 'Dipublikasi';
  });

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm(r); setEditingId(r.id); setDialogOpen(true); };

  const save = async () => {
    if (editingId) {
      await base44.entities.Pengumuman.update(editingId, form);
    } else {
      await base44.entities.Pengumuman.create(form);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    await base44.entities.Pengumuman.delete(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Pengumuman & Informasi Publik" subtitle="Portal publikasi informasi, berita, dan kegiatan desa untuk masyarakat">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Buat Pengumuman
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {kategoriList.map((k) => (
          <StatCard
            key={k}
            icon={Megaphone}
            label={k}
            value={records.filter((r) => r.kategori === k && r.status === 'Dipublikasi').length}
            accent={kategoriStyle[k]}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari pengumuman..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterKategori} onValueChange={setFilterKategori}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriList.map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          Belum ada pengumuman
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${kategoriStyle[r.kategori]}`}>
                      {r.kategori}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {r.tanggal_publikasi ? new Date(r.tanggal_publikasi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                    {r.penulis && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5" /> {r.penulis}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg leading-tight">{r.judul}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{r.isi}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pengumuman' : 'Buat Pengumuman'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Judul</Label>
              <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kategoriList.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tanggal Publikasi</Label>
                <Input type="date" value={form.tanggal_publikasi} onChange={(e) => setForm({ ...form, tanggal_publikasi: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Penulis</Label>
              <Input value={form.penulis} onChange={(e) => setForm({ ...form, penulis: e.target.value })} placeholder="Nama penulis / perangkat desa" />
            </div>
            <div>
              <Label>Isi Pengumuman</Label>
              <Textarea value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-primary hover:bg-primary/90">Publikasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}