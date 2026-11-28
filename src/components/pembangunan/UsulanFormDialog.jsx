import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const KATEGORI_OPTIONS = ['Infrastruktur Jalan', 'Sarana Air Bersih', 'Irigasi', 'Pendidikan', 'Kesehatan', 'Sarana Umum', 'Ekonomi Produktif', 'Kebersihan', 'Penerangan', 'Lainnya'];
const PRIORITAS_OPTIONS = ['Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah'];

const emptyForm = {
  judul_usulan: '', pengusul: '', rw: '', dusun: '', kategori: 'Infrastruktur Jalan',
  deskripsi: '', lokasi: '', estimasi_anggaran: 0, prioritas: 'Sedang',
  tahun_anggaran: 2026, tanggal_usulan: new Date().toISOString().split('T')[0],
  catatan_verifikasi: '', terkait_apbdes: false, musdus_file_uri: '',
};

export default function UsulanFormDialog({ open, onClose, onSubmit, editing }) {
  const [form, setForm] = useState(emptyForm);
  const [musdusFile, setMusdusFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) { setForm({ ...emptyForm, ...editing }); setMusdusFile(null); }
    else { setForm(emptyForm); setMusdusFile(null); }
  }, [editing, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let musdus_file_uri = form.musdus_file_uri || '';
    if (musdusFile) {
      setUploading(true);
      try {
        const filePath = `usulan-${Date.now()}-${musdusFile.name}`;
        const { data, error } = await supabase.storage.from('surat-pdf').upload(filePath, musdusFile, { cacheControl: '3600' });
        if (error) throw error;
        musdus_file_uri = data.path;
      } catch (err) { console.error(err); setUploading(false); return; }
      finally { setUploading(false); }
    }
    onSubmit({ ...form, musdus_file_uri, estimasi_anggaran: Number(form.estimasi_anggaran), tahun_anggaran: Number(form.tahun_anggaran) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Usulan Pembangunan' : 'Tambah Usulan Pembangunan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Judul Usulan *</Label>
            <Input value={form.judul_usulan} onChange={e => setForm({ ...form, judul_usulan: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nama Pengusul *</Label>
              <Input value={form.pengusul} onChange={e => setForm({ ...form, pengusul: e.target.value })} required />
            </div>
            <div>
              <Label>Tanggal Usulan *</Label>
              <Input type="date" value={form.tanggal_usulan} onChange={e => setForm({ ...form, tanggal_usulan: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>RW</Label>
              <Input value={form.rw} onChange={e => setForm({ ...form, rw: e.target.value })} placeholder="cth: 01" />
            </div>
            <div>
              <Label>Dusun</Label>
              <Input value={form.dusun} onChange={e => setForm({ ...form, dusun: e.target.value })} placeholder="nama dusun" />
            </div>
            <div>
              <Label>Tahun Anggaran</Label>
              <Input type="number" value={form.tahun_anggaran} onChange={e => setForm({ ...form, tahun_anggaran: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kategori *</Label>
              <Select value={form.kategori} onValueChange={v => setForm({ ...form, kategori: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KATEGORI_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioritas</Label>
              <Select value={form.prioritas} onValueChange={v => setForm({ ...form, prioritas: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITAS_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Lokasi</Label>
            <Input value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} placeholder="Lokasi detail usulan" />
          </div>
          <div>
            <Label>Estimasi Anggaran (Rp)</Label>
            <Input type="number" value={form.estimasi_anggaran} onChange={e => setForm({ ...form, estimasi_anggaran: e.target.value })} />
          </div>
          <div>
            <Label>Deskripsi Usulan</Label>
            <Textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>Catatan Verifikasi</Label>
            <Textarea value={form.catatan_verifikasi} onChange={e => setForm({ ...form, catatan_verifikasi: e.target.value })} rows={2} placeholder="Catatan dari verifikator" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="apbdes" checked={form.terkait_apbdes} onCheckedChange={v => setForm({ ...form, terkait_apbdes: v })} />
            <Label htmlFor="apbdes">Selaras dengan APBDes tahun berjalan</Label>
          </div>
          <div>
            <Label>Dokumen Berita Acara MUSDUS</Label>
            {form.musdus_file_uri && !musdusFile ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground flex-1 truncate">Dokumen MUSDUS terlampir</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setForm({ ...form, musdus_file_uri: '' })}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setMusdusFile(e.target.files[0])} />
            )}
            <p className="text-xs text-muted-foreground mt-1">Upload berita acara musyawarah dusun (PDF/Doc/Gambar)</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>Batal</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Upload...
                </>
              ) : (editing ? 'Simpan Perubahan' : 'Tambah Usulan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}