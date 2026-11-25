import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Phone, Mail, User } from 'lucide-react';

export default function PerangkatDesaPublik() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.PerangkatDesa.list('urutan', 100);
        setRecords(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Perangkat Desa</h1>
          <p className="text-primary-foreground/70">Struktur organisasi dan perangkat pemerintahan Desa Tagog Apu</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada data perangkat desa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all">
                <div className="aspect-square overflow-hidden bg-muted">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <User className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-2">{p.jabatan}</span>
                  <h3 className="font-bold text-lg">{p.nama}</h3>
                  {p.bidang && <p className="text-sm text-muted-foreground mt-1">{p.bidang}</p>}
                  <div className="mt-3 space-y-1.5 text-sm">
                    {p.no_telepon && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-primary" /> {p.no_telepon}
                      </p>
                    )}
                    {p.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary" /> {p.email}
                      </p>
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