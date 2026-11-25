import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, User, Phone, Mail } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const jabatanOpts = [
  'Kepala Desa', 'Sekretaris Desa', 'Kaur Keuangan', 'Kaur Perencanaan',
  'Kasi Pemerintahan', 'Kasi Kesejahteraan', 'Kasi Pelayanan',
  'Kepala Dusun', 'Lainnya'
];

const emptyForm = {
  nama: '', jabatan: 'Kepala Desa', nip: '', foto_url: '',
  no_telepon: '', email: '', bidang: '', urutan: 0
};

export default function PerangkatDesaAdmin() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PerangkatDesa.list('urutan', 100);
      setRecords(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setDialogOpen(true); };

  const save = async () => {
    if (editId) {
      await base44.entities.PerangkatDesa.update(editId, form);
    } else {
      await base44.entities.PerangkatDesa.create(form);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus perangkat desa ini?')) return;
    await base44.entities.PerangkatDesa.delete(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Kelola Perangkat Desa" subtitle="CMS — kelola data perangkat pemerintahan desa untuk website publik">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Tambah Perangkat
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center text-muted-foreground py-16">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted relative">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="w-16 h-16 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-primary shadow-sm" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-red-600 shadow-sm" title="Hapus">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">{p.jabatan}</span>
                <h3 className="font-bold">{p.nama}</h3>
                {p.bidang && <p className="text-sm text-muted-foreground mt-1">{p.bidang}</p>}
                <div className="mt-3 space-y-1 text-sm">
                  {p.no_telepon && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {p.no_telepon}</p>}
                  {p.email && <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {p.email}</p>}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">Belum ada data perangkat desa.</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Lengkap</Label>
                <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div>
                <Label>Jabatan</Label>
                <Select value={form.jabatan} onValueChange={(v) => setForm({ ...form, jabatan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {jabatanOpts.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>URL Foto</Label>
              <Input value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Bidang Tugas</Label>
              <Input value={form.bidang} onChange={(e) => setForm({ ...form, bidang: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>NIP</Label>
                <Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
              </div>
              <div>
                <Label>Urutan Tampil</Label>
                <Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>No. Telepon</Label>
                <Input value={form.no_telepon} onChange={(e) => setForm({ ...form, no_telepon: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-primary hover:bg-primary/90">{editId ? 'Simpan' : 'Tambah'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}