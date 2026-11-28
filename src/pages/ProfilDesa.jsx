import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Building2, MapPin, Users, Ruler, Home, Pencil, Plus, X,
  Briefcase, Camera, Eye, Target
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

const emptyForm = {
  nama_desa: '', kecamatan: '', kabupaten: '', provinsi: '', kode_desa: '',
  kepala_desa: '', sekretaris_desa: '', jumlah_penduduk: 0, luas_wilayah: 0,
  jumlah_rt: 0, jumlah_rw: 0, potensi_ekonomi: '', potensi_wisata: '', visi: '', misi: ''
};

export default function ProfilDesa() {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ProfilDesa.list('-created_date', 1);
      const items = data?.items || data;
      if (items.length > 0) {
        setProfil(items[0]);
      } else {
        setProfil(null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = () => {
    setForm(profil || emptyForm);
    setEditingId(profil?.id || null);
    setDialogOpen(true);
  };

  const save = async () => {
    if (editingId) {
      await base44.entities.ProfilDesa.update(editingId, form);
    } else {
      await base44.entities.ProfilDesa.create(form);
    }
    setDialogOpen(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const infoItems = [
    { icon: MapPin, label: 'Kecamatan', value: profil?.kecamatan },
    { icon: MapPin, label: 'Kabupaten', value: profil?.kabupaten },
    { icon: MapPin, label: 'Provinsi', value: profil?.provinsi },
    { icon: Building2, label: 'Kode Desa', value: profil?.kode_desa },
    { icon: Users, label: 'Kepala Desa', value: profil?.kepala_desa },
    { icon: Users, label: 'Sekretaris Desa', value: profil?.sekretaris_desa },
    { icon: Users, label: 'Jumlah Penduduk', value: profil?.jumlah_penduduk?.toLocaleString('id-ID') },
    { icon: Ruler, label: 'Luas Wilayah', value: profil?.luas_wilayah ? `${profil.luas_wilayah} km²` : null },
    { icon: Home, label: 'Jumlah RT', value: profil?.jumlah_rt },
    { icon: Home, label: 'Jumlah RW', value: profil?.jumlah_rw },
  ];

  return (
    <div>
      <PageHeader title="Profil Desa" subtitle="Informasi dasar dan potensi desa untuk publikasi dan integrasi sistem">
        <Button onClick={openEdit} className="bg-primary hover:bg-primary/90">
          {profil ? <><Pencil className="w-4 h-4 mr-1" /> Edit Profil</> : <><Plus className="w-4 h-4 mr-1" /> Buat Profil</>}
        </Button>
      </PageHeader>

      {!profil ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Profil desa belum dibuat. Klik "Buat Profil" untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative">
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <MapPin className="w-4 h-4" />
                {profil.kecamatan}, {profil.kabupaten}, {profil.provinsi}
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-2 tracking-tight">Desa {profil.nama_desa}</h2>
              {profil.kode_desa && (
                <p className="text-primary-foreground/60 text-sm mt-1 font-mono">Kode: {profil.kode_desa}</p>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {infoItems.map((item, i) => (
              item.value != null && item.value !== '' && (
                <div key={i} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  <p className="font-bold text-lg">{item.value}</p>
                </div>
              )
            ))}
          </div>

          {/* Visi Misi */}
          {(profil.visi || profil.misi) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {profil.visi && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Visi Desa</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{profil.visi}</p>
                </div>
              )}
              {profil.misi && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg">Misi Desa</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profil.misi}</p>
                </div>
              )}
            </div>
          )}

          {/* Potensi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {profil.potensi_ekonomi && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-lg">Potensi Ekonomi</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profil.potensi_ekonomi}</p>
              </div>
            )}
            {profil.potensi_wisata && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-lg">Potensi Wisata</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profil.potensi_wisata}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Profil Desa' : 'Buat Profil Desa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nama Desa</Label>
                <Input value={form.nama_desa} onChange={(e) => setForm({ ...form, nama_desa: e.target.value })} />
              </div>
              <div><Label>Kecamatan</Label><Input value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} /></div>
              <div><Label>Kabupaten</Label><Input value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} /></div>
              <div><Label>Provinsi</Label><Input value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value })} /></div>
              <div><Label>Kode Desa</Label><Input value={form.kode_desa} onChange={(e) => setForm({ ...form, kode_desa: e.target.value })} /></div>
              <div><Label>Kepala Desa</Label><Input value={form.kepala_desa} onChange={(e) => setForm({ ...form, kepala_desa: e.target.value })} /></div>
              <div><Label>Sekretaris Desa</Label><Input value={form.sekretaris_desa} onChange={(e) => setForm({ ...form, sekretaris_desa: e.target.value })} /></div>
              <div><Label>Jumlah Penduduk</Label><Input type="number" value={form.jumlah_penduduk} onChange={(e) => setForm({ ...form, jumlah_penduduk: Number(e.target.value) })} /></div>
              <div><Label>Luas Wilayah (km²)</Label><Input type="number" value={form.luas_wilayah} onChange={(e) => setForm({ ...form, luas_wilayah: Number(e.target.value) })} /></div>
              <div><Label>Jumlah RT</Label><Input type="number" value={form.jumlah_rt} onChange={(e) => setForm({ ...form, jumlah_rt: Number(e.target.value) })} /></div>
              <div><Label>Jumlah RW</Label><Input type="number" value={form.jumlah_rw} onChange={(e) => setForm({ ...form, jumlah_rw: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Visi Desa</Label><Textarea value={form.visi} onChange={(e) => setForm({ ...form, visi: e.target.value })} rows={2} /></div>
            <div><Label>Misi Desa</Label><Textarea value={form.misi} onChange={(e) => setForm({ ...form, misi: e.target.value })} rows={3} /></div>
            <div><Label>Potensi Ekonomi</Label><Textarea value={form.potensi_ekonomi} onChange={(e) => setForm({ ...form, potensi_ekonomi: e.target.value })} rows={3} /></div>
            <div><Label>Potensi Wisata</Label><Textarea value={form.potensi_wisata} onChange={(e) => setForm({ ...form, potensi_wisata: e.target.value })} rows={3} /></div>
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