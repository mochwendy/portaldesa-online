import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Store, Plus, Search, Filter, X, Pencil, Trash2, MapPin, Phone, Tag
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Image } from '@/components/ui/image';
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

const kategoriList = ['Kuliner', 'Kerajinan', 'Pertanian', 'Perdagangan', 'Jasa', 'Pariwisata', 'Lainnya'];

const emptyForm = {
  nama_usaha: '', nama_pemilik: '', kategori: 'Kuliner', deskripsi: '',
  alamat: '', kontak: '', harga_range: '', gambar_url: '', status: 'Aktif'
};

const placeholderImages = {
  Kuliner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  Kerajinan: 'https://images.unsplash.com/photo-1606760228807-4b1c5b0a0f0a?w=600&q=80',
  Pertanian: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80',
  Perdagangan: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=80',
  Jasa: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80',
  Pariwisata: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
  Lainnya: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
};

export default function UMKM() {
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
      const data = await base44.entities.UMKM.list('-created_date', 200);
      setRecords(data?.items || data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const matchSearch = !search ||
      r.nama_usaha?.toLowerCase().includes(search.toLowerCase()) ||
      r.nama_pemilik?.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === 'all' || r.kategori === filterKategori;
    return matchSearch && matchKategori && r.status === 'Aktif';
  });

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm(r); setEditingId(r.id); setDialogOpen(true); };

  const save = async () => {
    const data = { ...form, gambar_url: form.gambar_url || placeholderImages[form.kategori] };
    if (editingId) {
      await base44.entities.UMKM.update(editingId, data);
    } else {
      await base44.entities.UMKM.create(data);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus UMKM ini?')) return;
    await base44.entities.UMKM.delete(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Marketplace UMKM & BUMDes" subtitle="Platform pemasaran online produk UMKM, BUMDes, dan KDKM Desa">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Daftar UMKM
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Store} label="Total UMKM" value={records.length} accent="bg-primary/10 text-primary" />
        {kategoriList.slice(0, 3).map((k) => (
          <StatCard
            key={k}
            icon={Tag}
            label={k}
            value={records.filter((r) => r.kategori === k && r.status === 'Aktif').length}
            accent="bg-amber-50 text-amber-600"
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama usaha atau pemilik..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
          Belum ada UMKM terdaftar
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                <Image
                  src={r.gambar_url || placeholderImages[r.kategori]}
                  alt={r.nama_usaha}
                  className="w-full h-full"
                  fittingType="fill"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-primary backdrop-blur-sm">
                    {r.kategori}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg leading-tight">{r.nama_usaha}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Pemilik: {r.nama_pemilik}</p>
                <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">{r.deskripsi}</p>
                {r.harga_range && (
                  <p className="text-sm font-semibold text-primary mt-2">{r.harga_range}</p>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  {r.alamat && (
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{r.alamat}</span>
                    </span>
                  )}
                </div>
                {r.kontak && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" /> {r.kontak}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(r)} className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 text-xs font-medium flex items-center justify-center gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => remove(r.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium">
                    <Trash2 className="w-3.5 h-3.5" />
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
            <DialogTitle>{editingId ? 'Edit UMKM' : 'Daftar UMKM Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Usaha</Label>
                <Input value={form.nama_usaha} onChange={(e) => setForm({ ...form, nama_usaha: e.target.value })} />
              </div>
              <div>
                <Label>Nama Pemilik</Label>
                <Input value={form.nama_pemilik} onChange={(e) => setForm({ ...form, nama_pemilik: e.target.value })} />
              </div>
            </div>
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
              <Label>Deskripsi Produk</Label>
              <Textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Alamat Usaha</Label>
              <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kontak (WA/Telp)</Label>
                <Input value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} />
              </div>
              <div>
                <Label>Kisaran Harga</Label>
                <Input value={form.harga_range} onChange={(e) => setForm({ ...form, harga_range: e.target.value })} placeholder="Rp 10.000 - 50.000" />
              </div>
            </div>
            <div>
              <Label>URL Gambar Produk (opsional)</Label>
              <Input value={form.gambar_url} onChange={(e) => setForm({ ...form, gambar_url: e.target.value })} placeholder="https://..." />
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