import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Store, MapPin, MessageCircle, Tag, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    <div className="bg-slate-50 min-h-screen">
      <section className="py-16 bg-gradient-to-br from-sky-50 via-teal-50/60 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
              EKONOMI KREATIF WARGA
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Marketplace UMKM Desa</h1>
            <p className="text-slate-600 text-base max-w-2xl">Dukung produk unggulan warga Desa Tagog Apu — beli lokal, majukan ekonomi desa.</p>
          </div>
          <Link
            to="/daftar-umkm"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-amber-500 text-slate-900 px-5 py-3 rounded-full hover:bg-amber-400 shadow-md transition-all w-fit"
          >
            <Plus className="w-4 h-4" /> Daftar UMKM Baru
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Search & Pill Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Cari nama produk, UMKM, atau deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-50/50 rounded-xl border-slate-200" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {kategoriOpts.map((k) => (
              <button
                key={k}
                onClick={() => setKategori(k)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  kategori === k
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-16">Memuat produk UMKM...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Belum ada produk UMKM tersedia dalam kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-teal-500 transition-all flex flex-col group">
                <div className="aspect-square overflow-hidden bg-slate-100 relative">
                  <img
                    src={u.gambar_url || placeholderImages[u.kategori] || placeholderImages.Lainnya}
                    alt={u.nama_usaha}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                      <Tag className="w-3 h-3 text-teal-600" /> {u.kategori}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{u.nama_usaha}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pemilik: {u.nama_pemilik}</p>
                    {u.deskripsi && <p className="text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">{u.deskripsi}</p>}
                    {u.harga_range && <p className="text-sm font-bold text-teal-700 mt-3">{u.harga_range}</p>}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {u.alamat && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {u.alamat}
                      </p>
                    )}
                    {u.kontak && (
                      <button
                        onClick={() => openWhatsApp(u)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-emerald-200/60"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" /> Pesan via WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
