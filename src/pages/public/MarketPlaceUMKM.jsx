import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Store, MapPin, MessageCircle, Tag, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { buildWhatsAppLink } from '@/lib/whatsapp';

const kategoriOpts = ['Semua', 'Kuliner', 'Kerajinan', 'Pertanian', 'Perdagangan', 'Jasa', 'Pariwisata', 'Lainnya'];

const placeholderImages = {
  Kuliner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  Kerajinan: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80',
  Pertanian: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80',
  Perdagangan: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
  Jasa: 'https://images.unsplash.com/photo-1556761175-5972dc5afbcd?w=400&q=80',
  Pariwisata: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d880?w=400&q=80',
  Lainnya: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
};

export default function MarketplaceUMKM() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Semua');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.UMKM.filter({ status: 'Aktif' }, '-created_date', 200);
        setRecords(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = records.filter((r) => {
    const matchSearch = !search ||
      r.nama_usaha?.toLowerCase().includes(search.toLowerCase()) ||
      r.nama_pemilik?.toLowerCase().includes(search.toLowerCase()) ||
      r.deskripsi?.toLowerCase().includes(search.toLowerCase());
    const matchKategori = kategori === 'Semua' || r.kategori === kategori;
    return matchSearch && matchKategori;
  });

  const openWhatsApp = (umkm) => {
    const message = `Halo, saya tertarik dengan produk ${umkm.nama_usaha} yang ada di marketplace Desa Tagog Apu. Apakah masih tersedia?`;
    window.open(buildWhatsAppLink(umkm.kontak, message), '_blank');
  };

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Marketplace UMKM Desa</h1>
            <p className="text-primary-foreground/70">Dukung produk warga Desa Tagog Apu — beli lokal, majukan desa</p>
          </div>
          <Link
            to="/daftar-umkm"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-accent text-accent-foreground px-4 py-2.5 rounded-lg hover:bg-accent/90 w-fit"
          >
            <Plus className="w-4 h-4" /> Daftar UMKM
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari produk atau UMKM..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={kategori} onValueChange={setKategori}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {kategoriOpts.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Memuat produk...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada produk UMKM tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((u) => (
              <div key={u.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={u.gambar_url || placeholderImages[u.kategori] || placeholderImages.Lainnya}
                    alt={u.nama_usaha}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full mb-2 w-fit">
                    <Tag className="w-3 h-3" /> {u.kategori}
                  </span>
                  <h3 className="font-bold text-base leading-snug">{u.nama_usaha}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">oleh {u.nama_pemilik}</p>
                  {u.deskripsi && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">{u.deskripsi}</p>}
                  {u.harga_range && <p className="text-sm font-semibold text-primary mt-2">{u.harga_range}</p>}
                  {u.alamat && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3" /> {u.alamat}
                    </p>
                  )}
                  {u.kontak && (
                    <button
                      onClick={() => openWhatsApp(u)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium py-2 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Hubungi via WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}