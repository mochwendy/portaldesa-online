import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Phone, MessageCircle, Search, X, ShieldAlert } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

const kategoriOpts = ['Kesehatan', 'Keamanan', 'Kebencanaan', 'Layanan Desa'];

const emptyForm = {
  nama_layanan: '',
  nama_petugas: '',
  jabatan: '',
  kategori: 'Kesehatan',
  no_telepon: '',
  no_whatsapp: '',
  aktif: true,
  urutan: 0
};

export default function KontakDaruratAdmin() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.KontakDarurat.list('urutan', 100);
      setRecords(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredRecords = records.filter(r =>
    r.nama_layanan?.toLowerCase().includes(search.toLowerCase()) ||
    r.nama_petugas?.toLowerCase().includes(search.toLowerCase()) ||
    r.kategori?.toLowerCase().includes(search.toLowerCase()) ||
    r.no_telepon?.includes(search) ||
    r.no_whatsapp?.includes(search)
  );

  const openAdd = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id); setDialogOpen(true); };

  const save = async () => {
    if (editId) {
      await base44.entities.KontakDarurat.update(editId, form);
    } else {
      await base44.entities.KontakDarurat.create(form);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus nomor darurat ini?')) return;
    await base44.entities.KontakDarurat.delete(id);
    load();
  };

  const toggleAktif = async (r) => {
    await base44.entities.KontakDarurat.update(r.id, { aktif: !r.aktif });
    load();
  };

  return (
    <div>
      <PageHeader title="Kelola Nomor Darurat Desa" subtitle="CMS — kelola daftar nomor darurat (Ambulans, Bhabinkamtibmas, Babinsa, Bidan, Damkar, dll.) untuk website publik">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Tambah Kontak Darurat
        </Button>
      </PageHeader>

      <div className="bg-card border border-border rounded-2xl mb-6">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama layanan, petugas, kategori, atau nomor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && (
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Memuat data...</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredRecords.map((r) => (
              <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg">{r.nama_layanan}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {r.kategori}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {r.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.nama_petugas} — {r.jabatan}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {r.no_telepon}
                    </span>
                    {r.no_whatsapp && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {r.no_whatsapp}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Urutan: {r.urutan}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAktif(r)}
                    className={r.aktif ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}
                  >
                    {r.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="text-primary hover:bg-primary/10" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-red-600 hover:bg-red-50" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                {search ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data nomor darurat.'}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Kontak Darurat' : 'Tambah Kontak Darurat'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Layanan</Label>
                <Input value={form.nama_layanan} onChange={(e) => setForm({ ...form, nama_layanan: e.target.value })} placeholder="Contoh: Ambulans Siaga Desa" />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kategoriOpts.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Petugas</Label>
                <Input value={form.nama_petugas} onChange={(e) => setForm({ ...form, nama_petugas: e.target.value })} placeholder="Contoh: Dr. Siti Rahayu" />
              </div>
              <div>
                <Label>Jabatan</Label>
                <Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} placeholder="Contoh: Koordinator Ambulans" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>No. Telepon</Label>
                <Input value={form.no_telepon} onChange={(e) => setForm({ ...form, no_telepon: e.target.value })} placeholder="Contoh: 0811-2345-678" />
              </div>
              <div>
                <Label>No. WhatsApp (format 62xxx)</Label>
                <Input value={form.no_whatsapp} onChange={(e) => setForm({ ...form, no_whatsapp: e.target.value })} placeholder="Contoh: 628112345678" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Urutan Tampil</Label>
                <Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} min="0" />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <Switch
                    checked={form.aktif}
                    onCheckedChange={(checked) => setForm({ ...form, aktif: checked })}
                  />
                  <Label className="mb-0 cursor-pointer">Aktif</Label>
                </div>
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