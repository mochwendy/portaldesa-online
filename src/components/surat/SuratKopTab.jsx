import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { createSupabaseEntity } from '@/api/supabaseAdapter';

const FIELDS = [
  ['baris1', 'Baris 1 — PEMERINTAH ... (satu baris)'],
  ['baris2', 'Baris 2 — KECAMATAN ... (satu baris)'],
  ['baris3', 'Baris 3 — DESA ... (satu baris)'],
  ['alamat', 'Alamat, website, dan email'],
  ['footer', 'Teks footer surat'],
];

export default function SuratKopTab({ kop, setKop }) {
  const [uploading, setUploading] = useState(false);
  const [profil, setProfil] = useState(null);
  const [websiteSetting, setWebsiteSetting] = useState(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const profilEntity = createSupabaseEntity('ProfilDesa');
      const websiteEntity = createSupabaseEntity('WebsiteSetting');
      
      Promise.all([
        profilEntity.list('-created_date', 1),
        websiteEntity.list('-created_date', 1)
      ]).then(([profilResult, websiteResult]) => {
        const profilRows = profilResult.items || [];
        const websiteRows = websiteResult.items || [];
        if (profilRows.length > 0) setProfil(profilRows[0]);
        if (websiteRows.length > 0) setWebsiteSetting(websiteRows[0]);
      });
    }
  }, []);

  const getDefaultLogo = () => {
    return `/logos/desa-default.svg`; // Default logo path - will be handled by public folder or Supabase
  };

  const upload = async (file) => {
    setUploading(true);
    try {
      if (!isSupabaseConfigured()) {
        // Fallback to localStorage for development
        const reader = new FileReader();
        reader.onload = (e) => {
          setKop({ ...kop, logo: e.target.result });
        };
        reader.readAsDataURL(file);
        return;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      const filePath = `logo/desa-logo-${Date.now()}.${ext}`;
      console.log('[SuratKopTab] Uploading logo to:', filePath);
      
      const { data, error } = await supabase.storage
        .from('surat-pdf')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      
      if (error) {
        console.error('[SuratKopTab] Upload error:', error);
        throw error;
      }
      
      console.log('[SuratKopTab] Upload success:', data.path);
      
      // Create signed URL (1 year expiry) for persistent access
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('surat-pdf')
        .createSignedUrl(data.path, 31536000);
      
      if (urlError) {
        console.error('[SuratKopTab] Signed URL error:', urlError);
        throw urlError;
      }
      
      console.log('[SuratKopTab] Signed URL created:', signedUrlData?.signedUrl);
      
      const finalLogoUrl = signedUrlData?.signedUrl || `/data/files/${data.path}`;
      setKop({ ...kop, logo: finalLogoUrl });
      console.log('[SuratKopTab] State updated with logo:', finalLogoUrl);
    } catch (err) {
      console.error('[SuratKopTab] Logo upload error:', err);
    } finally { setUploading(false); }
  };

  const displayLogo = kop.logo || (websiteSetting?.data?.logo_url || profil?.logo_url) || '/logos/desa-default.svg';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Kop dan footer dipakai untuk semua surat dan tersimpan di perangkat ini.</p>
      {FIELDS.map(([k, label]) => (
        <div key={k}>
          <Label>{label}</Label>
          <Input value={kop[k] || ''} onChange={(e) => setKop({ ...kop, [k]: e.target.value })} />
        </div>
      ))}
      <div>
        <Label>Logo Desa</Label>
        <div className="flex items-center gap-3">
          <img src={displayLogo} alt="Logo" className="h-14 w-14 object-contain border border-border rounded" />
          <Input type="file" accept="image/*" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {kop.logo ? 'Logo tersimpan di Supabase Storage (signed URL 1 tahun)' : websiteSetting?.data?.logo_url ? 'Menggunakan logo dari Pengaturan Website' : profil?.logo_url ? 'Menggunakan logo dari Profil Desa' : 'Logo default (tambahkan logo di Profil Desa atau upload di sini)'}
        </p>
      </div>
    </div>
  );
}