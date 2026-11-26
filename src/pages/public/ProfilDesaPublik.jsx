import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const ProfilDesaPublik = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await base44.entities.ProfilDesa.list();
        setData(rows[0] || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Data profil desa tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-6">
            Profil Desa {data.nama_desa}
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kecamatan</p>
                <p className="text-lg font-medium text-foreground">{data.kecamatan}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kabupaten</p>
                <p className="text-lg font-medium text-foreground">{data.kabupaten}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Provinsi</p>
                <p className="text-lg font-medium text-foreground">{data.provinsi}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kode Desa</p>
                <p className="text-lg font-medium text-foreground">{data.kode_desa}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kepala Desa</p>
                <p className="text-lg font-medium text-foreground">{data.kepala_desa}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sekretaris Desa</p>
                <p className="text-lg font-medium text-foreground">{data.sekretaris_desa}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Jumlah Penduduk</p>
                <p className="text-lg font-medium text-foreground">{data.jumlah_penduduk} jiwa</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Luas Wilayah</p>
                <p className="text-lg font-medium text-foreground">{data.luas_wilayah} km²</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="border-t border-border pt-6">
              <h2 className="font-semibold text-xl mb-4">Potensi Ekonomi</h2>
              <p className="text-muted-foreground">{data.potensi_ekonomi}</p>
            </div>
            
            <div className="border-t border-border pt-6">
              <h2 className="font-semibold text-xl mb-4">Potensi Wisata</h2>
              <p className="text-muted-foreground">{data.potensi_wisata}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="border-t border-border pt-6">
              <h2 className="font-semibold text-xl mb-4">Visi</h2>
              <p className="text-muted-foreground">{data.visi}</p>
            </div>
            
            <div className="border-t border-border pt-6">
              <h2 className="font-semibold text-xl mb-4">Misi</h2>
              <p className="text-muted-foreground">{data.misi}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilDesaPublik;
