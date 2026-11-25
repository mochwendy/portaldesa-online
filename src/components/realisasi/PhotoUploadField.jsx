import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, X, ImageIcon } from 'lucide-react';

export default function PhotoUploadField({ label, fileUri, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (fileUri) {
      base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri })
        .then(({ signed_url }) => { if (active) setPreviewUrl(signed_url); })
        .catch(() => { if (active) setPreviewUrl(''); });
    } else {
      setPreviewUrl('');
    }
    return () => { active = false; };
  }, [fileUri]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      onChange(file_uri);
    } catch (err) {
      console.error(err);
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