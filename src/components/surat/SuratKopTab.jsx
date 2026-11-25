import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FIELDS = [
  ['baris1', 'Baris 1 — PEMERINTAH ... (satu baris)'],
  ['baris2', 'Baris 2 — KECAMATAN ... (satu baris)'],
  ['baris3', 'Baris 3 — DESA ... (satu baris)'],
  ['alamat', 'Alamat, website, dan email'],
  ['footer', 'Teks footer surat'],
];

export default function SuratKopTab({ kop, setKop }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setKop({ ...kop, logo: file_url });
    } finally { setUploading(false); }
  };

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
          {kop.logo && <img src={kop.logo} alt="Logo" className="h-14 w-14 object-contain border border-border rounded" />}
          <Input type="file" accept="image/*" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </div>
    </div>
  );
}