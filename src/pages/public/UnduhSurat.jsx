import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { FileDown, Loader2, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { transformRow } from '@/api/supabaseAdapter';

// Halaman publik: warga membuka tautan unduh surat dari WhatsApp,
// lalu menerima tautan PDF yang baru ditandatangani (berlaku 1 jam).
export default function UnduhSurat() {
  const kode = (new URLSearchParams(window.location.search).get('kode') || '').trim().toUpperCase();
  const [url, setUrl] = useState('');
  const [surat, setSurat] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const siapkan = async () => {
      if (!kode) {
        setErr('Kode verifikasi tidak ditemukan pada tautan ini.');
        setLoading(false);
        return;
      }
      try {
        if (!isSupabaseConfigured()) {
          setErr('Supabase tidak dikonfigurasi. Silakan hubungi administrator.');
          setLoading(false);
          return;
        }

        // Fetch surat by kode_verifikasi
        const { data, error: dbError } = await supabase
          .from('SuratKeterangan')
          .select('*')
          .eq('data->>kode_verifikasi', kode)
          .single();
        
        if (dbError || !data) {
          setErr('Surat dengan kode verifikasi tersebut tidak ditemukan.');
          setLoading(false);
          return;
        }
        
        const suratData = transformRow(data);
        
        // Check if PDF file URI exists
        if (!suratData.pdf_file_uri) {
          setErr('Berkas PDF surat belum tersedia. Silakan hubungi petugas desa.');
          setLoading(false);
          return;
        }
        
        // Create signed URL for the PDF file
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from('surat-pdf')
          .createSignedUrl(suratData.pdf_file_uri, 3600); // 1 hour expiry
        
        if (signError || !signedUrlData?.signedUrl) {
          console.error('Error creating signed URL:', signError);
          setErr('Gagal menyiapkan tautan unduh. Silakan coba beberapa saat lagi.');
          setLoading(false);
          return;
        }
        
        setUrl(signedUrlData.signedUrl);
        setSurat({ nomor: suratData.nomor_surat, jenis: suratData.jenis_surat });
      } catch (e) {
        console.error('Error in UnduhSurat:', e);
        setErr(e?.message || 'Gagal menyiapkan berkas surat.');
      } finally {
        setLoading(false);
      }
    };
    siapkan();
  }, [kode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground">Unduh Surat Desa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Surat keterangan yang telah ditandatangani secara elektronik (QR).
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan berkas...
          </div>
        )}

        {!loading && err && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left flex gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{err}</p>
          </div>
        )}

        {!loading && url && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-muted/60 p-4 text-left text-sm space-y-1">
              {surat?.nomor && (
                <p className="text-muted-foreground">
                  Nomor: <span className="font-mono text-foreground">{surat.nomor}</span>
                </p>
              )}
              {surat?.jenis && (
                <p className="text-muted-foreground">
                  Jenis: <span className="text-foreground font-medium">{surat.jenis}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-1">Kode: {kode}</p>
            </div>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <a href={url} target="_blank" rel="noreferrer">
                <FileDown className="w-4 h-4 mr-1" /> Buka / Unduh PDF Surat
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Tautan berkas berlaku 1 jam. Buka kembali tautan ini kapan saja untuk mengunduh ulang.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}