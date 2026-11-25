import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Calendar, User, Newspaper } from 'lucide-react';

export default function BeritaDetail() {
  const { id } = useParams();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Berita.get(id);
        setBerita(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!berita) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Berita tidak ditemukan.</p>
        <Link to="/berita" className="inline-flex items-center gap-2 text-primary font-medium mt-4 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Berita
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero image */}
      {berita.gambar_url && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={berita.gambar_url} alt={berita.judul} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/berita" className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Berita
        </Link>

        <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-4">{berita.kategori}</span>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">{berita.judul}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
          {berita.tanggal_publikasi && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          )}
          {berita.penulis && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {berita.penulis}
            </span>
          )}
        </div>

        {berita.ringkasan && (
          <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-6 italic border-l-4 border-accent pl-4">
            {berita.ringkasan}
          </p>
        )}

        <div className="prose prose-sm md:prose-base max-w-none">
          {berita.isi?.split('\n').map((para, i) => (
            para.trim() ? <p key={i} className="text-foreground/80 leading-relaxed mb-4">{para}</p> : <br key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}