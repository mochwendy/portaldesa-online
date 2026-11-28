import React, { useState, useEffect } from 'react';
import { resolveRealisasiPhotoUrl } from '@/lib/realisasiUtils';
import { Loader2, ImageIcon, Maximize2 } from 'lucide-react';

const PHOTO_DEFS = [
  { key: 'foto_0_uri', label: 'Kondisi Awal (0%)' },
  { key: 'foto_50_uri', label: 'Pelaksanaan (50%)' },
  { key: 'foto_100_uri', label: 'Selesai (100%)' },
];

export default function RealisasiPhotoGallery({ foto0, foto50, foto100 }) {
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

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
            const resolvedUrl = resolveRealisasiPhotoUrl(p.uri);
            return { label: p.label, url: resolvedUrl };
          } catch (e) {
            return { label: p.label, url: '' };
          }
        }
        return { label: p.label, url: '' };
      })
    ).then((results) => {
      if (active) {
        const urlMap = {};
        results.forEach(r => { urlMap[r.label] = r.url; });
        setUrls(urlMap);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [foto0, foto50, foto100]);

  const photos = PHOTO_DEFS.map((p) => ({
    label: p.label,
    url: urls[p.label] || ''
  }));

  const openPreview = (url, label) => {
    if (url) setPreviewImage({ url, label });
  };

  const closePreview = () => setPreviewImage(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="border border-border rounded-lg overflow-hidden relative group">
            {loading ? (
              <div className="h-20 flex items-center justify-center bg-muted">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : p.url ? (
              <img
                src={p.url}
                alt={p.label}
                className="w-full h-20 object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-105"
                onClick={() => openPreview(p.url, p.label)}
              />
            ) : (
              <div className="h-20 flex flex-col items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Belum ada</span>
              </div>
            )}
            {p.url && !loading && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openPreview(p.url, p.label); }}
                  className="p-1 bg-black/50 text-white rounded hover:bg-black/70"
                  aria-label={`Pratinjau ${p.label}`}
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <p className="text-[10px] text-center font-medium py-1 bg-muted/50 text-muted-foreground">{p.label}</p>
          </div>
        ))}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.label}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            onClick={closePreview}
            aria-label="Tutup pratinjau"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img
            src={previewImage.url}
            alt={previewImage.label}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">{previewImage.label}</p>
        </div>
      )}
    </>
  );
}