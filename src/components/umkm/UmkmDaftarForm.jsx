import React, { useState } from 'react';
import { createSupabaseEntity } from '@/api/supabaseAdapter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Image } from '@/components/ui/image';
import { Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const KATEGORI = ['Kuliner', 'Kerajinan', 'Pertanian', 'Perdagangan', 'Jasa', 'Pariwisata', 'Lainnya'];

const initialForm = {
  nama_usaha: '',
  nama_pemilik: '',
  kategori: 'Kuliner',
  deskripsi: '',
  alamat: '',
  kontak: '',
  harga_range: '',
  gambar_url: '',
};

export default function UmkmDaftarForm({ onSubmitted }) {
  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const filePath = `umkm-${Date.now()}-${file.name}`;
      const { data, error: uploadErr } = await supabase.storage.from('surat-pdf').upload(filePath, file, { cacheControl: '3600' });
      if (uploadErr) throw uploadErr;
      const file_url = data.path;
      setForm((f) => ({ ...f, gambar_url: file_url }));
    } catch (err) {
      setError(err?.message || 'Gagal mengunggah foto produk');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nama_usaha.trim() || !form.nama_pemilik.trim() || !form.kontak.trim()) {
      setError('Nama usaha, nama pemilik, dan kontak wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const entity = createSupabaseEntity('UMKM');
      const created = await entity.create({ ...form, status: 'Aktif' });
      onSubmitted?.(created);
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan data UMKM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nama_usaha">Nama Usaha *</Label>
          <Input id="nama_usaha" placeholder="Contoh: Kopi Robusta Tagog" value={form.nama_usaha} onChange={set('nama_usaha')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nama_pemilik">Nama Pemilik *</Label>
          <Input id="nama_pemilik" placeholder="Nama warga pemilik usaha" value={form.nama_pemilik} onChange={set('nama_pemilik')} />
        </div>
        <div className="space-y-2">
          <Label>Kategori *</Label>
          <Select value={form.kategori} onValueChange={(v) => setForm((f) => ({ ...f, kategori: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {KATEGORI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kontak">Nomor WhatsApp *</Label>
          <Input id="kontak" placeholder="08xxxxxxxxxx" value={form.kontak} onChange={set('kontak')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alamat">Alamat Usaha</Label>
          <Input id="alamat" placeholder="RT / RW / Dusun" value={form.alamat} onChange={set('alamat')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="harga_range">Kisaran Harga</Label>
          <Input id="harga_range" placeholder="Contoh: Rp 10.000 - Rp 50.000" value={form.harga_range} onChange={set('harga_range')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi">Deskripsi Produk</Label>
        <Textarea id="deskripsi" rows={3} placeholder="Ceritakan produk atau jasa yang Anda tawarkan" value={form.deskripsi} onChange={set('deskripsi')} />
      </div>

      <div className="space-y-2">
        <Label>Foto Produk</Label>
        {form.gambar_url ? (
          <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-border">
            <Image src={form.gambar_url} alt="Foto produk" className="w-full h-full" />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, gambar_url: '' }))}
              className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              aria-label="Hapus foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl py-8 cursor-pointer text-muted-foreground hover:border-primary/40">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            <span className="text-xs">{uploading ? 'Mengunggah...' : 'Unggah foto produk (JPG/PNG)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || uploading} className="w-full sm:w-auto">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />} Daftarkan UMKM Saya
      </Button>
    </form>
  );
}