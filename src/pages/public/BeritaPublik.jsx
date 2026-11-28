import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Newspaper, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const kategoriOpts = ['Semua', 'Berita', 'Pengumuman', 'Kegiatan', 'Agenda'];

export default function BeritaPublik() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Semua');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Berita.filter({ status: 'Dipublikasi' }, '-tanggal_publikasi', 100);
        setRecords(data?.items || data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = records.filter((r) => {
    const matchSearch = !search ||
      r.judul?.toLowerCase().includes(search.toLowerCase()) ||
      r.ringkasan?.toLowerCase().includes(search.toLowerCase());
    const matchKategori = kategori === 'Semua' || r.kategori === kategori;
    return matchSearch && matchKategori;
  });

  return (
    <div>
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Berita Desa</h1>
          <p className="text-primary-foreground/70">Informasi terkini seputar kegiatan dan pengumuman Desa Tagog Apu</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={kategori} onValueChange={setKategori}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kategoriOpts.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Memuat berita...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada berita yang dipublikasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => (
              <Link key={b.id} to={`/berita/${b.id}`} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all">
                <div className="aspect-video overflow-hidden bg-muted">
                  {b.gambar_url ? (
                    <img src={b.gambar_url} alt={b.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <Newspaper className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">{b.kategori}</span>
                  <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">{b.judul}</h3>
                  {b.ringkasan && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{b.ringkasan}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    {b.tanggal_publikasi ? new Date(b.tanggal_publikasi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                    {b.penulis && <span>· {b.penulis}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}