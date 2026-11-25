import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { Image } from '@/components/ui/image';

const PLACEHOLDER = {
  Kuliner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80',
  Kerajinan: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&q=80',
  Pertanian: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&q=80',
  Perdagangan: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80',
  Jasa: 'https://images.unsplash.com/photo-1556761175-5972dc5afbcd?w=500&q=80',
  Pariwisata: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d880?w=500&q=80',
  Lainnya: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80',
};

export default function BerandaUmkm({ items = [] }) {
  const products = items.slice(0, 8);

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-extrabold">Koleksi Produk UMKM</h2>
          <p className="text-muted-foreground text-xs">Produk unggulan warga Desa Tagog Apu</p>
        </div>
        <Link to="/marketplace-umkm" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
          Semua Produk <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Belum ada produk UMKM yang terdaftar.</p>
          <Link to="/daftar-umkm" className="inline-block mt-3 text-sm text-primary font-medium hover:underline">
            Daftarkan UMKM Anda →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {products.map((u) => (
            <Link
              key={u.id}
              to="/marketplace-umkm"
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={u.gambar_url || PLACEHOLDER[u.kategori] || PLACEHOLDER.Lainnya}
                  alt={u.nama_usaha}
                  className="w-full h-full group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full mb-1.5 w-fit">
                  <Tag className="w-2.5 h-2.5" /> {u.kategori}
                </span>
                <h3 className="font-semibold text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">{u.nama_usaha}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">oleh {u.nama_pemilik}</p>
                {u.harga_range && <p className="text-xs font-semibold text-primary mt-auto pt-1.5">{u.harga_range}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}