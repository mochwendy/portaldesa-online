import React, { useState, useEffect } from 'react';
import { fetchPublicFileUrl } from '@/lib/publicFiles';
import { Loader2, ImageIcon } from 'lucide-react';

const PHOTO_DEFS = [
  { key: 'foto_0_uri', label: 'Kondisi Awal (0%)' },
  { key: 'foto_50_uri', label: 'Pelaksanaan (50%)' },
  { key: 'foto_100_uri', label: 'Selesai (100%)' },
];

export default function RealisasiPhotoGallery({ foto0, foto50, foto100 }) {
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const photos = [
      { ...PHOTO_DEFS[0], uri: foto0 },
      { ...PHOTO_DEFS[1], uri: foto50 },
      { ...PHOTO_DEFS[2], uri: foto100 },
    ];
    Promise.all(
      photos.map(async (p) => {
        if (p.uri) {
          try {
            const signedUrl = await fetchPublicFileUrl(p.uri);
            return { label: p.label, url: signedUrl };
          } catch (e) {
            return { label: p.label, url: '' };
          }
        }
        return { label: p.label, url: '' };
      })
    ).then((results) => {
      if (active) {
        setUrls({ results });
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [foto0, foto50, foto100]);

  const photos = urls.results || PHOTO_DEFS.map((p) => ({ label: p.label, url: '' }));

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((p, i) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="h-20 flex items-center justify-center bg-muted">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : p.url ? (
            <img src={p.url} alt={p.label} className="w-full h-20 object-cover" />
          ) : (
            <div className="h-20 flex flex-col items-center justify-center bg-muted text-muted-foreground">
              <ImageIcon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Belum ada</span>
            </div>
          )}
          <p className="text-[10px] text-center font-medium py-1 bg-muted/50 text-muted-foreground">{p.label}</p>
        </div>
      ))}
    </div>
  );
}