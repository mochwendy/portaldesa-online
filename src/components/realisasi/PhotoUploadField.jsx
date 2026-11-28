import React, { useState, useEffect } from 'react';
import { Loader2, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function PhotoUploadField({ label, fileUri, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (fileUri) {
      const { data } = supabase.storage.from('realisasi').getPublicUrl(fileUri);
      if (active) setPreviewUrl(data.publicUrl);
    } else {
      setPreviewUrl('');
    }
    return () => { active = false; };
  }, [fileUri]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    console.log('DEBUG: Starting upload for', file.name);
    try {
      const filePath = `foto-${Date.now()}-${file.name}`;
      console.log('DEBUG: Uploading to bucket "realisasi" path:', filePath);
      const { data, error } = await supabase.storage.from('realisasi').upload(filePath, file, { cacheControl: '3600' });
      if (error) {
        console.error('DEBUG: Upload error details:', error);
        throw error;
      }
      console.log('DEBUG: Upload success:', data);
      // Store full path including bucket name for consistency
      onChange(`realisasi/${data.path}`);
    } catch (err) {
      console.error('DEBUG: Upload catch error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {previewUrl ? (
        <div className="relative group">
          <img src={previewUrl} alt={label} className="w-full h-28 object-cover rounded-lg border border-border" />
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled}
            className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground mt-1.5">
            {uploading ? 'Mengunggah...' : 'Klik untuk upload foto'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={disabled || uploading}
          />
        </label>
      )}
    </div>
  );
}