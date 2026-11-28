import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function IdentitasTab({ form, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `logo/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('surat-pdf').upload(filePath, file, { cacheControl: '3600' });
      if (error) throw error;
      
      // Create signed URL (1 year expiry) for public access
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('surat-pdf')
        .createSignedUrl(data.path, 31536000);
      
      if (urlError) throw urlError;
      
      onChange('logo_url', signedUrlData?.signedUrl || `/data/files/${data.path}`);
      toast({ title: 'Logo berhasil diunggah' });
    } catch (err) {
      toast({ title: 'Gagal mengunggah logo', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Logo Pemerintah Desa</Label>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <div className="w-24 h-24 rounded-2xl border border-border bg-muted flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <Image src={form.logo_url} alt="Logo website" className="w-full h-full" fittingType="fit" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
          <div className="space-y-2">
            <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Mengunggah...' : 'Unggah Logo'}
              </Button>
              {form.logo_url && (
                <Button type="button" variant="ghost" className="text-destructive" onClick={() => onChange('logo_url', '')}>
                  <Trash2 className="w-4 h-4" /> Hapus
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Disarankan PNG berlatar transparan atau kotak. Logo tampil pada header dan footer portal smart desa.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <Label htmlFor="logo-url">Atau tempel tautan gambar logo</Label>
        <Input
          id="logo-url"
          className="mt-2"
          placeholder="https://..."
          value={form.logo_url || ''}
          onChange={(e) => onChange('logo_url', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-2">Kosongkan untuk memakai ikon bawaan.</p>
      </div>
    </div>
  );
}