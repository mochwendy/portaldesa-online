import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Trash2, Newspaper, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
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

const kategoriOpts = ['Berita', 'Pengumuman', 'Kegiatan', 'Agenda'];
const statusOpts = ['Draft', 'Dipublikasi', 'Arsip'];
const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  judul: '', ringkasan: '', isi: '', gambar_url: '',
  kategori: 'Berita', penulis: '', tanggal_publikasi: today, status: 'Dipublikasi'
};

export default function BeritaAdmin() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Berita.list('-tanggal_publikasi', 200);
      setRecords(data?.items || data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) =>
    !search || r.judul?.toLowerCase().includes(search.toLowerCase()) || r.kategori?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (r) => {
    setForm({ ...r });
    setEditId(r.id);
    setDialogOpen(true);
  };

  const save = async () => {
    if (editId) {
      await base44.entities.Berita.update(editId, form);
    } else {
      await base44.entities.Berita.create(form);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus berita ini?')) return;
    await base44.entities.Berita.delete(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Kelola Berita Desa" subtitle="CMS — kelola konten berita dan pengumuman untuk website publik">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Tulis Berita
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Penulis</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.gambar_url ? (
                          <img src={r.gambar_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Newspaper className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <p className="font-medium line-clamp-1">{r.judul}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.kategori}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {r.tanggal_publikasi ? new Date(r.tanggal_publikasi).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{r.penulis || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">Belum ada berita.</p>}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Berita' : 'Tulis Berita Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Judul</Label>
              <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
            </div>
            <div>
              <Label>Ringkasan</Label>
              <Textarea value={form.ringkasan} onChange={(e) => setForm({ ...form, ringkasan: e.target.value })} rows={2} placeholder="Ringkasan singkat untuk tampilan daftar" />
            </div>
            <div>
              <Label>Isi Berita</Label>
              <Textarea value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} rows={6} />
            </div>
            <div>
              <Label>URL Gambar</Label>
              <Input value={form.gambar_url} onChange={(e) => setForm({ ...form, gambar_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kategoriOpts.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOpts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Penulis</Label>
                <Input value={form.penulis} onChange={(e) => setForm({ ...form, penulis: e.target.value })} />
              </div>
              <div>
                <Label>Tanggal Publikasi</Label>
                <Input type="date" value={form.tanggal_publikasi} onChange={(e) => setForm({ ...form, tanggal_publikasi: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-primary hover:bg-primary/90">{editId ? 'Simpan' : 'Publikasi'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}