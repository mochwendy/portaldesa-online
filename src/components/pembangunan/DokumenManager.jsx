import React, { useState } from 'react';
import { Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const JENIS_OPTIONS = ['Juklak', 'Juknis', 'RKPDes', 'RPJMDes', 'Peraturan Desa', 'Lainnya'];

export default function DokumenManager({ dokumen, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nama_dokumen: '', jenis_dokumen: 'Juklak', tahun: 2026,
    deskripsi: '', tanggal_upload: new Date().toISOString().split('T')[0],
  });
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `dokumen-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('surat-pdf').upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const fileUri = data.path;
      await base44.entities.DokumenPembangunan.create({ ...form, tahun: Number(form.tahun), file_uri: fileUri });
      setForm({ nama_dokumen: '', jenis_dokumen: 'Juklak', tahun: 2026, deskripsi: '', tanggal_upload: new Date().toISOString().split('T')[0] });
      setFile(null);
      e.target.reset();
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleDownload = async (doc) => {
    try {
      const filePath = doc.file_uri;
      const { signed_url } = await supabase.storage.from('surat-pdf').createSignedUrl(filePath, 3600);
      window.open(signed_url, '_blank');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Hapus dokumen "${doc.nama_dokumen}"?`)) return;
    await base44.entities.DokumenPembangunan.delete(doc.id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-bold text-sm mb-3">Upload Dokumen Juklak / Juknis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Nama Dokumen *</Label>
            <Input value={form.nama_dokumen} onChange={e => setForm({ ...form, nama_dokumen: e.target.value })} required placeholder="cth: Juklak PNPM 2026" />
          </div>
          <div>
            <Label>Jenis Dokumen</Label>
            <Select value={form.jenis_dokumen} onValueChange={v => setForm({ ...form, jenis_dokumen: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{JENIS_OPTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tahun</Label>
            <Input type="number" value={form.tahun} onChange={e => setForm({ ...form, tahun: e.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <Label>Deskripsi</Label>
          <Input value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Ringkasan isi dokumen" />
        </div>
        <div className="mt-3 flex items-end gap-3">
          <div className="flex-1">
            <Label>File (PDF/Doc) *</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} required />
          </div>
          <Button type="submit" disabled={uploading || !file} className="min-w-[120px]">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">File disimpan secara privat. Masyarakat dapat mengunduh melalui halaman publik Rencana Pembangunan.</p>
      </form>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-sm">Dokumen Tersedia ({dokumen.length})</h3>
        </div>
        {dokumen.length === 0 ? (
          <p className="text-center text-muted-foreground p-8 text-sm">Belum ada dokumen diupload.</p>
        ) : (
          <div className="divide-y divide-border">
            {dokumen.map(d => (
              <div key={d.id} className="p-4 flex items-center gap-3 hover:bg-muted/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.nama_dokumen}</p>
                  <p className="text-xs text-muted-foreground">{d.jenis_dokumen} · Tahun {d.tahun}{d.deskripsi ? ` · ${d.deskripsi}` : ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(d)}><Download className="w-3.5 h-3.5" /> Unduh</Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(d)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}